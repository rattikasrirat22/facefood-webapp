/**
 * analyze.js — Real-time Facial Emotion Analysis with EMA Smoothing
 * ควบคุมกล้อง WebCam + วาด Bounding Box + เกลี่ยค่าอารมณ์แบบ Real-time
 */

document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("webcam");
    const canvas = document.getElementById("overlay");
    const ctx = canvas ? canvas.getContext("2d") : null;

    // UI Elements
    const emotionText = document.getElementById("detected-emotion");
    const progressContainer = document.getElementById("progress-bars");

    // Config Parameters
    const PREDICT_INTERVAL_MS = 350;    // ความถี่ในการส่งภาพไปประมวลผล (350ms)
    const ANALYSIS_DURATION_MS = 4000;  // ระยะเวลาวิเคราะห์สะสมทั้งหมดก่อนสรุปผล (4 วินาที)
    const ALPHA = 0.35;                 // Smooth Factor (0.35 ให้ความตอบสนองสมดุล ไม่แกว่งเร็วเกินไป)

    let isAnalyzing = false;
    let predictTimer = null;
    let startTime = null;

    // EMA Smoothed Probabilities
    let smoothedProbs = null;

    // การแปลภาษาไทย
    const EMOTION_TH = {
        "Anger": "โกรธ 😠",
        "Happiness": "มีความสุข 😊",
        "Neutral": "ปกติ 🙂",
        "Sadness": "เศร้า 😔"
    };

    // 1. เริ่มต้นการทำงานของกล้อง
    async function initCamera() {
        try {
            if (!video) {
                console.error("ไม่พบแท็ก <video id='webcam'>");
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                audio: false
            });

            video.srcObject = stream;

            // บังคับ play() ป้องกันกล้องค้างบนบางเบราว์เซอร์
            await video.play();

            // ปรับขนาด Canvas ให้เท่าขนาดวิดีโอ
            if (canvas) {
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
            }

            if (emotionText) emotionText.innerText = "กำลังวิเคราะห์ใบหน้า...";

            // เริ่มการประมวลผล
            startAnalysis();

        } catch (err) {
            console.error("Camera Access Error:", err);
            if (emotionText) emotionText.innerText = "ไม่สามารถเปิดกล้องได้ ❌";
            alert("ไม่สามารถเปิดกล้องได้: " + err.message + "\nกรุณาตรวจสอบว่าได้กด อนุญาต (Allow) การใช้งานกล้องแล้วหรือยัง");
        }
    }

    // 2. คำนวณ Exponential Moving Average (EMA) เพื่อเกลี่ยค่า %
    function applyEMA(newProbs) {
        if (!smoothedProbs) {
            smoothedProbs = { ...newProbs };
        } else {
            for (let key in newProbs) {
                const currentVal = smoothedProbs[key] || 0;
                smoothedProbs[key] = (ALPHA * newProbs[key]) + ((1 - ALPHA) * currentVal);
            }
        }
        return smoothedProbs;
    }

    // 3. แปลงเฟรมวิดีโอเป็น Base64
    function captureFrameBase64() {
        if (!video.videoWidth || !video.videoHeight) return null;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        return tempCanvas.toDataURL("image/jpeg", 0.8);
    }

    // 4. วาดกรอบสี่เหลี่ยมรอบใบหน้า
    function drawBoundingBox(box) {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!box) return;

        const [x1, y1, x2, y2] = box;
        ctx.strokeStyle = "#10B981"; // สีเขียว
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    // 5. อัปเดตข้อมูลบนหน้าจอ
    function updateUI(probs) {
        if (!probs) return;

        let topEmotion = "Neutral";
        let maxProb = -1;

        for (let [emo, prob] of Object.entries(probs)) {
            if (prob > maxProb) {
                maxProb = prob;
                topEmotion = emo;
            }
        }

        if (emotionText) {
            emotionText.innerText = EMOTION_TH[topEmotion] || topEmotion;
        }

        // อัปเดต Progress Bar
        for (let [emo, prob] of Object.entries(probs)) {
            const bar = document.getElementById(`bar-${emo.toLowerCase()}`);
            const label = document.getElementById(`val-${emo.toLowerCase()}`);
            if (bar) bar.style.width = `${Math.min(100, Math.max(0, prob)).toFixed(1)}%`;
            if (label) label.innerText = `${Math.min(100, Math.max(0, prob)).toFixed(1)}%`;
        }

        return topEmotion;
    }

    // 6. Loop ส่งเฟรมไปวิเคราะห์ Real-time
    async function processFrame() {
        if (!isAnalyzing) return;

        const frameData = captureFrameBase64();
        if (!frameData) {
            predictTimer = setTimeout(processFrame, PREDICT_INTERVAL_MS);
            return;
        }

        try {
            const response = await fetch("/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frame: frameData })
            });

            if (response.ok) {
                const result = await response.json();

                if (result.face_found && result.probs) {
                    drawBoundingBox(result.box);
                    const smoothed = applyEMA(result.probs);
                    updateUI(smoothed);
                } else {
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                    if (emotionText) emotionText.innerText = "กรุณาหันหน้าเข้าหากล้อง 🔍";
                }
            }
        } catch (err) {
            console.error("Predict Request Failed:", err);
        }

        // ตรวจสอบเวลาวิเคราะห์สะสม
        const elapsed = Date.now() - startTime;
        if (elapsed >= ANALYSIS_DURATION_MS) {
            finishAnalysis();
        } else {
            predictTimer = setTimeout(processFrame, PREDICT_INTERVAL_MS);
        }
    }

    // 7. เริ่มกระบวนการวิเคราะห์
    function startAnalysis() {
        isAnalyzing = true;
        startTime = Date.now();
        smoothedProbs = null;
        processFrame();
    }

    // 8. สรุปผลลัพธ์และส่งต่อไปยัง backend
    async function finishAnalysis() {
        isAnalyzing = false;
        if (predictTimer) clearTimeout(predictTimer);

        if (!smoothedProbs) {
            alert("ไม่พบใบหน้าอย่างต่อเนื่อง กรุณาลองใหม่อีกครั้ง");
            window.location.reload();
            return;
        }

        let finalEmotion = "Neutral";
        let maxProb = -1;
        for (let [emo, prob] of Object.entries(smoothedProbs)) {
            if (prob > maxProb) {
                maxProb = prob;
                finalEmotion = emo;
            }
        }

        try {
            const resp = await fetch("/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emotion: finalEmotion,
                    probs: smoothedProbs
                })
            });

            const data = await resp.json();
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } catch (err) {
            console.error("Capture Redirect Error:", err);
        }
    }

    // เริ่มเปิดกล้องเมื่อไฟล์สคริปต์โหลดเสร็จสมบูรณ์
    initCamera();
});