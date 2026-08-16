"""
firebase_utils.py — จัดการข้อมูลเมนูอาหารและการบันทึกสถิติด้วย Firebase
================================================================================
"""

import os
import random
import firebase_admin
from firebase_admin import credentials, db

# -------------------------------------------------------------
# 1. การเชื่อมต่อ Firebase
# -------------------------------------------------------------
# ลำดับการหา credential (จากสำคัญสุดไปน้อยสุด):
#   1) FIREBASE_KEY_PATH env var — ใช้ตอน deploy จริง (Cloud Run mount Secret Manager
#      มาเป็นไฟล์ที่ path นี้ เช่น /secrets/firebase_key.json)
#   2) ไฟล์ firebase_key.json / serviceAccountKey.json ในโฟลเดอร์เดียวกับไฟล์นี้หรือโฟลเดอร์แม่
#      — ใช้ตอนพัฒนาในเครื่องตัวเอง (dev)
# ตัด path แบบ Windows ตายตัว (เช่น "D:/Final Project/...") ออก เพราะใช้ไม่ได้เลยตอน
# deploy จริงบนเซิร์ฟเวอร์ (ไม่มี D: drive) และทำให้โค้ดพกพาไปเครื่อง/เซิร์ฟเวอร์อื่นไม่ได้
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

key_candidates = ["firebase_key.json", "serviceAccountKey.json"]
possible_dirs = [
    CURRENT_DIR,
    os.path.abspath(os.path.join(CURRENT_DIR, "..")),
    os.path.abspath(os.path.join(CURRENT_DIR, "..", "..")),
]

firebase_key_path = os.environ.get("FIREBASE_KEY_PATH")

if not firebase_key_path:
    for d in possible_dirs:
        for name in key_candidates:
            candidate = os.path.join(d, name)
            if os.path.exists(candidate):
                firebase_key_path = candidate
                break
        if firebase_key_path:
            break

if not firebase_admin._apps:
    try:
        if firebase_key_path and os.path.exists(firebase_key_path):
            cred = credentials.Certificate(firebase_key_path)
            auth_source = firebase_key_path
        else:
            cred = credentials.ApplicationDefault()
            auth_source = "Application Default Credentials"
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://mood-food-561f6-default-rtdb.asia-southeast1.firebasedatabase.app/'
        })
        print(f"Firebase initialized via: {auth_source}")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")

# -------------------------------------------------------------
# 2. Config ค่าหมวดหมู่และ Mapping อารมณ์
# -------------------------------------------------------------
CATEGORY_LABELS_TH = {
    "dish": "อาหารจานหลัก",
    "drink": "เครื่องดื่ม",
    "ingredient": "วัตถุดิบ",
    "fruit": "ผลไม้"
}

EMOTION_MAP_DB = {
    "Happiness": ["Happiness", "happy", "Happy"],
    "Sadness": ["Sadness", "sad", "Sad"],
    "Anger": ["Anger", "angry", "Angry"],
    "Neutral": ["Neutral", "neutral", "Neutral"]
}

# -------------------------------------------------------------
# 3. ฟังก์ชันดึงรายการอาหารแบบสุ่ม (get_random_menu)
# -------------------------------------------------------------
def get_random_menu(emotion):
    ref = db.reference('food_db')
    snapshot = ref.get()

    if not snapshot:
        raise Exception("ไม่สามารถดึงข้อมูลจาก Firebase ได้ หรือไม่มี Node 'food_db'")

    target_data = None
    possible_keys = EMOTION_MAP_DB.get(emotion, [emotion])

    for key in possible_keys:
        if key in snapshot:
            target_data = snapshot[key]
            break

    if not target_data:
        raise Exception(f"ไม่พบข้อมูลเมนูสำหรับอารมณ์ '{emotion}' ใน Firebase")

    selected_menu = {}

    if isinstance(target_data, dict):
        for cat_key in CATEGORY_LABELS_TH.keys():
            items = target_data.get(cat_key, [])
            if isinstance(items, dict):
                items = list(items.values())
            
            if items:
                items_copy = list(items)
                random.shuffle(items_copy)
                selected_menu[cat_key] = items_copy  # ส่งทั้งหมด ไม่ตัดเหลือ 5 — frontend จัดการสุ่มแสดง/เก็บที่เหลือเอง
            else:
                selected_menu[cat_key] = []

    return selected_menu

# -------------------------------------------------------------
# 4. ฟังก์ชันบันทึกสถิติการใช้งาน
# -------------------------------------------------------------
def log_usage_stat(emotion):
    try:
        ref = db.reference('usage_stats')
        ref.push({
            'emotion': emotion,
            'timestamp': {".sv": "timestamp"}
        })
    except Exception as e:
        print(f"⚠️ บันทึกสถิติลง Firebase ไม่สำเร็จ: {e}")