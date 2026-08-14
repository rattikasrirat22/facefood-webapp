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

import sys

# Windows console ใช้ cp1252 เป็นค่าเริ่มต้น พิมพ์ข้อความไทย/emoji (เช่น "✅ เชื่อมต่อ Firebase")
# จะทำให้ process crash ด้วย UnicodeEncodeError ทันทีตอน import — บังคับ UTF-8 ก่อน import อื่นใด
# (no-op บน Linux/gunicorn ที่ locale เป็น UTF-8 อยู่แล้ว)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

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

# เปิดใช้งาน CORS เฉพาะ origin ที่ระบุไว้เท่านั้น (ค่าเริ่มต้น = Next.js dev server)
# deploy จริงให้ตั้ง env var ALLOWED_ORIGINS เป็น comma-separated list เพิ่มโดเมน production
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)

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

# รหัส error มาตรฐานของ REST API ตัวนี้ — ให้ Frontend map เป็นข้อความ/หน้าจอได้แน่นอน
# โดยไม่ต้อง parse ข้อความภาษาไทยอิสระ หรือเดาความหมาย
def _api_error(code, message, status=400):
    return jsonify({"success": False, "error": {"code": code, "message": message}}), status


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
        return _api_error("INVALID_REQUEST", "ไม่พบข้อมูลภาพ (image) ใน request")

    try:
        frame = _decode_base64_image(payload["image"])
    except Exception:
        return _api_error("INVALID_IMAGE", "แปลงข้อมูลภาพไม่สำเร็จ")

    if frame is None:
        return _api_error("INVALID_IMAGE", "ถอดรหัสภาพไม่สำเร็จ")

    # 1. ทำนายอารมณ์จาก AI — detect_and_predict() คืนคีย์ face_found ไม่ใช่ success
    #    (ห่อ try/except เพราะ inference ของ PyTorch ไม่มีการดักข้อผิดพลาดภายในให้เอง)
    try:
        prediction = model_utils.predict_emotion_from_bgr(frame)
    except Exception as e:
        print(f"⚠️ Model inference error: {e}")
        return _api_error("MODEL_ERROR", "ประมวลผลโมเดล AI ไม่สำเร็จ", status=500)

    if not prediction.get("face_found"):
        return _api_error("NO_FACE_DETECTED", "ไม่พบใบหน้าในภาพ")

    top_emotion = prediction.get("top_emotion", "Neutral")
    probs = prediction.get("probs") or {}
    # probs จาก model_utils เป็นสเกล 0-100 (เปอร์เซ็นต์) อยู่แล้ว — ห้ามคูณ 100 ซ้ำ
    confidence = probs.get(top_emotion, 0)

    # 2. บันทึก Log การใช้งานลง Firebase (ไม่ critical ต่อผลลัพธ์หลัก จึงไม่ทำให้ request ล้มเหลว)
    try:
        firebase_utils.log_usage_stat(top_emotion)
    except Exception as e:
        print(f"⚠️ บันทึก Stat ไม่สำเร็จ: {e}")

    # 3. ดึงเมนูอาหารสุ่มตามอารมณ์ — Firebase ใช้ไม่ได้ให้ error ตรง ๆ แทนคืนเมนูว่างเงียบ ๆ
    try:
        food_items = firebase_utils.get_random_menu(top_emotion)
    except Exception as e:
        print(f"⚠️ ดึงข้อมูลเมนูไม่สำเร็จ: {e}")
        return _api_error("DATABASE_ERROR", "ดึงข้อมูลเมนูจาก Firebase ไม่สำเร็จ", status=502)

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
            "confidence": confidence,  # 0-100 (เปอร์เซ็นต์) สเกลเดียวกับ probs
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
        return _api_error("INVALID_EMOTION", f"ค่าอารมณ์ไม่ถูกต้อง: {emotion}")

    try:
        food_items = firebase_utils.get_random_menu(emotion)
    except Exception as e:
        print(f"⚠️ ดึงข้อมูลเมนูไม่สำเร็จ: {e}")
        return _api_error("DATABASE_ERROR", "ดึงข้อมูลเมนูจาก Firebase ไม่สำเร็จ", status=502)

    return jsonify({"success": True, "food_items": food_items})


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