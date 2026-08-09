"""
app.py — FaceFood: Emotion-based Food Recommendation Web App
================================================================================
Flow การทำงาน:
  [ระบบเดิม - Traditional Web Application]
  1) / (home.html)      — หน้า Landing แนะนำระบบ
  2) /analyze (analyze.html) — เปิดกล้อง สแกนวิเคราะห์อารมณ์ใบหน้า
  3) /capture           — รับค่าอารมณ์ที่วิเคราะห์ได้บันทึกลง Session
  4) /menu (result.html) — ดึงโภชนาการเมนูอาหารจาก Firebase แสดงตามอารมณ์

  [ระบบใหม่ - REST API สำหรับ Next.js / React]
  5) /api/analyze       — รับภาพ Base64 -> ประมวลผล AI -> ดึง Firebase -> ส่งคืน JSON
  6) /api/recommendations — สุ่มรายการเมนูอาหารใหม่ตามอารมณ์ -> ส่งคืน JSON
"""

import os
import base64
import numpy as np
import cv2
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS

import model_utils
import firebase_utils
    
app = Flask(__name__)
app.secret_key = "facefood_secret_key_emotion_ai"

# เปิดใช้งาน CORS อนุญาตให้ทุก Domain/Port (เช่น Next.js Port 3000) ยิง API มาหา Backend ได้
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ลำดับคลาสอารมณ์หลัก
EMOTION_ORDER = ["Anger", "Happiness", "Neutral", "Sadness"]

EMOTION_META = {
    "Happiness": {
        "th": "มีความสุข", "en": "Happy", "emoji": "😊",
        "desc": "คุณดูสดใสและมีความสุขในตอนนี้ เรามีเมนูที่ช่วยส่งเสริมการสร้าง Serotonin และ Dopamine ให้คุณสดชื่นต่อเนื่อง",
    },
    "Sadness": {
        "th": "เศร้า", "en": "Sad", "emoji": "😔",
        "desc": "ดูเหมือนคุณจะรู้สึกหม่นๆ อยู่บ้าง เรามีเมนูอุ่นๆ และสารอาหารต้านความเครียดที่ช่วยปลอบประโลมและเติมพลังใจ",
    },
    "Anger": {
        "th": "โกรธ", "en": "Angry", "emoji": "😠",
        "desc": "ตอนนี้คุณอาจกำลังมีความเครียดหรือหงุดหงิด เรามีเมนูที่อุดมด้วยแมกนีเซียมและโอเมก้า-3 ช่วยคลายกล้ามเนื้อและผ่อนคลายระบบประสาท",
    },
    "Neutral": {
        "th": "ปกติ", "en": "Neutral", "emoji": "🙂",
        "desc": "อารมณ์ของคุณอยู่ในโทนสงบเป็นปกติดี เรามีเมนูโภชนาการสมดุลที่เหมาะสำหรับเติมพลังงานในวันสบายๆ",
    },
}

CATEGORY_ICONS = {
    "dish": "🍽️",
    "drink": "🥤",
    "ingredient": "🧂",
    "fruit": "🍎",
}


def _decode_base64_image(data_url):
    """แปลงภาพ Base64 จาก Web Camera ให้เป็น OpenCV BGR Frame"""
    if "," in data_url:
        _, encoded = data_url.split(",", 1)
    else:
        encoded = data_url
    img_bytes = base64.b64decode(encoded)
    np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return frame


# ==============================================================================
# 1. Traditional Web Routes (ใช้ Jinja2 Template เดิมของคุณ)
# ==============================================================================

@app.route("/")
def home():
    return render_template("home.html")


@app.route("/analyze")
def analyze():
    return render_template("analyze.html")


@app.route("/predict", methods=["POST"])
def predict():
    """รับเฟรมภาพจากกล้อง -> ตรวจจับใบหน้า -> ทำนายความน่าจะเป็นของอารมณ์"""
    payload = request.get_json(silent=True)
    if not payload or "frame" not in payload:
        return jsonify({"error": "ไม่พบข้อมูลภาพ (frame) ใน request"}), 400

    try:
        frame = _decode_base64_image(payload["frame"])
    except Exception:
        return jsonify({"error": "แปลงข้อมูลภาพไม่สำเร็จ"}), 400

    if frame is None:
        return jsonify({"error": "ถอดรหัสภาพไม่สำเร็จ"}), 400

    result = model_utils.predict_emotion_from_bgr(frame)
    return jsonify(result)


@app.route("/capture", methods=["POST"])
def capture():
    """รับผลสรุปอารมณ์จากการประมวลผลฝั่ง Client เก็บลง Session และลง Log ใน Firebase"""
    payload = request.get_json(silent=True)
    emotion = payload.get("emotion") if payload else None
    probs = payload.get("probs") if payload else None

    if emotion not in EMOTION_META:
        return jsonify({"error": f"ค่าอารมณ์ไม่ถูกต้อง: {emotion}"}), 400

    session["emotion"] = emotion
    session["probs"] = probs or {}

    # บันทึกสถิติการใช้งานลง Firebase
    firebase_utils.log_usage_stat(emotion)

    return jsonify({"redirect": url_for("menu")})


@app.route("/menu")
def menu():
    """หน้าแสดงผลเมนูอาหารโภชนาการตามอารมณ์"""
    emotion = session.get("emotion")
    probs = session.get("probs", {})

    if not emotion:
        return redirect(url_for("analyze"))

    meta = EMOTION_META.get(emotion, EMOTION_META["Neutral"])

    try:
        food_items = firebase_utils.get_random_menu(emotion)
    except Exception as e:
        return render_template(
            "result.html", 
            error=str(e), 
            emotion=emotion,
            categories=firebase_utils.CATEGORY_LABELS_TH,
        )

    return render_template(
        "result.html",
        error=None,
        emotion=emotion,
        emotion_th=meta["th"],
        emotion_en=meta["en"],
        emotion_emoji=meta["emoji"],
        emotion_desc=meta["desc"],
        emotion_order=EMOTION_ORDER,
        labels={k: EMOTION_META[k]["th"] for k in EMOTION_ORDER if k in EMOTION_META},
        probs=probs,
        food_items=food_items,
        categories=firebase_utils.CATEGORY_LABELS_TH,
        category_icons=CATEGORY_ICONS,
    )


@app.route("/remenu", methods=["POST"])
def remenu():
    """AJAX endpoint สำหรับสุ่มเมนูอาหารใหม่"""
    payload = request.get_json(silent=True)
    emotion = payload.get("emotion") if payload else None

    if emotion not in EMOTION_META:
        return jsonify({"error": "ค่าอารมณ์ไม่ถูกต้อง"}), 400

    try:
        food_items = firebase_utils.get_random_menu(emotion)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"food_items": food_items})


# ==============================================================================
# 2. REST API Routes (เพิ่มใหม่สำหรับรองรับ Next.js / React ของคุณมัต)
# ==============================================================================

@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    """
    API หลักสำหรับ Next.js:
    - รับภาพ Base64 มาวิเคราะห์อารมณ์ด้วย AI
    - บันทึกสถิติการใช้งานลง Firebase
    - ดึงรายการอาหารตามอารมณ์ และส่งผลลัพธ์ทั้งหมดกลับเป็น JSON
    """
    payload = request.get_json(silent=True)
    if not payload or "image" not in payload:
        return jsonify({"success": False, "error": "ไม่พบข้อมูลภาพ (image) ใน request"}), 400

    try:
        frame = _decode_base64_image(payload["image"])
    except Exception:
        return jsonify({"success": False, "error": "แปลงข้อมูลภาพไม่สำเร็จ"}), 400

    if frame is None:
        return jsonify({"success": False, "error": "ถอดรหัสภาพไม่สำเร็จ"}), 400

    # 1. ทำนายอารมณ์จาก AI
    prediction = model_utils.predict_emotion_from_bgr(frame)
    if not prediction.get("success", False):
        return jsonify({"success": False, "error": prediction.get("error", "วิเคราะห์ใบหน้าไม่สำเร็จ")}), 400

    top_emotion = prediction.get("top_emotion", "Neutral")
    probs = prediction.get("probs", {})
    confidence = int(probs.get(top_emotion, 0) * 100) if probs else 0

    # 2. บันทึก Log การใช้งานลง Firebase
    try:
        firebase_utils.log_usage_stat(top_emotion)
    except Exception as e:
        print(f"⚠️ บันทึก Stat ไม่สำเร็จ: {e}")

    # 3. ดึงเมนูอาหารสุ่มตามอารมณ์
    try:
        food_items = firebase_utils.get_random_menu(top_emotion)
    except Exception as e:
        food_items = {}
        print(f"⚠️ ดึงข้อมูลเมนูไม่สำเร็จ: {e}")

    meta = EMOTION_META.get(top_emotion, EMOTION_META["Neutral"])

    # 4. ส่งคำตอบกลับเป็น JSON ครบจบใน Request เดียว
    return jsonify({
        "success": True,
        "emotion": {
            "key": top_emotion,
            "th": meta["th"],
            "en": meta["en"],
            "emoji": meta["emoji"],
            "desc": meta["desc"],
            "confidence": confidence,
            "probs": probs
        },
        "food_items": food_items,
        "category_labels": firebase_utils.CATEGORY_LABELS_TH,
        "category_icons": CATEGORY_ICONS
    })


@app.route("/api/recommendations", methods=["POST"])
def api_recommendations():
    """API สำหรับขอสุ่มเมนูอาหารใหม่ตามอารมณ์เดิมที่ระบุ"""
    payload = request.get_json(silent=True)
    emotion = payload.get("emotion") if payload else None

    if emotion not in EMOTION_META:
        return jsonify({"success": False, "error": "ค่าอารมณ์ไม่ถูกต้อง"}), 400

    try:
        food_items = firebase_utils.get_random_menu(emotion)
        return jsonify({"success": True, "food_items": food_items})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==============================================================================
# Initialization & Server Run
# ==============================================================================

model_utils.load_resources()
print("🚀 โหลดโมเดลและทรัพยากรพร้อมใช้งานแล้ว")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    print(f"🚀 สตาร์ทระบบ FaceFood Web Server (debug={debug_mode}, port={port})...")
    app.run(debug=debug_mode, host="0.0.0.0", port=port)