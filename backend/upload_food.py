"""
upload_food.py
================================================================================
สคริปต์อัปโหลดข้อมูลรายการอาหารโภชนบำบัดจาก food_db.xlsx ขึ้น Firebase Realtime Database
โดยจัดโครงสร้างรองรับคุณค่าทางโภชนาการ (nutritional_value),
เหตุผลเชิงโภชนบำบัด (recommendation_reason) และรหัสอ้างอิงวิจัย (ref_id)

หมายเหตุ (คัดลอกมาจาก D:\\Final Project\\EmotionFoodAI\\src\\ui\\upload_food.py แล้วแก้ไข):
- เปลี่ยนจากอ่าน food_db.csv → food_db.xlsx (pd.read_excel) ตามไฟล์ต้นทางจริงที่มี
- แก้ category key "food" → "dish" ให้ตรงกับ CATEGORY_LABELS_TH ใน firebase_utils.py
  (ต้นฉบับเดิมเขียน "food" ซึ่งไม่ตรงกับที่ get_random_menu() อ่าน "dish" — อัปโหลดสำเร็จ
  แต่ข้อมูลจะไม่ถูกใช้งานเลยถ้าไม่แก้จุดนี้)
- เขียนขึ้น Firebase ด้วย .update() เฉพาะอารมณ์ที่มีข้อมูลจริงในไฟล์ต้นทาง ไม่ใช่ .set() ทับทั้ง
  node food_db เหมือนเดิม — ต้นฉบับเดิมจะลบข้อมูล Neutral/Sadness ที่ deploy อยู่จริงทิ้งทันที
  เพราะไฟล์ข้อมูลตอนนี้มีแค่ Anger/Happiness
"""

import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import os
import pandas as pd
import firebase_admin
from firebase_admin import credentials, db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. ค้นหาไฟล์ Credentials อัตโนมัติ
key_candidates = ["firebase_key.json", "serviceAccountKey.json"]
key_path = None

for candidate in key_candidates:
    path = os.path.join(BASE_DIR, candidate)
    if os.path.exists(path):
        key_path = path
        break

if not key_path:
    raise FileNotFoundError("❌ ไม่พบไฟล์ firebase_key.json หรือ serviceAccountKey.json ในโฟลเดอร์โปรเจกต์")

# 2. เริ่มต้นเชื่อมต่อ Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://mood-food-561f6-default-rtdb.asia-southeast1.firebasedatabase.app/'
    })

# 3. อ่านข้อมูลจาก Excel
xlsx_path = os.path.join(BASE_DIR, "food_db.xlsx")
if not os.path.exists(xlsx_path):
    raise FileNotFoundError(f"❌ ไม่พบไฟล์ {xlsx_path}")

df = pd.read_excel(xlsx_path, sheet_name=0)

required_cols = ["item_id", "menu_name", "category", "nutritional_value", "recommendation_reason", "emotion_id"]
before = len(df)
df = df.dropna(subset=required_cols)
skipped = before - len(df)
if skipped:
    print(f"⚠️  ข้าม {skipped} แถวที่ข้อมูลไม่ครบ (เช่น แถวว่างคั่นระหว่างบล็อกอารมณ์ใน sheet)")

# แมป emotion_id ไปยัง คลาสอารมณ์
emotion_map = {
    "EM01": "Anger",
    "EM02": "Happiness",
    "EM03": "Neutral",
    "EM04": "Sadness"
}

# แมป category ในไฟล์ต้นทาง → ชื่อ key ที่ firebase_utils.py (CATEGORY_LABELS_TH) อ่านจริง
category_map = {
    "food": "dish",
    "dish": "dish",
    "drink": "drink",
    "ingredient": "ingredient",
    "fruit": "fruit",
}

# สร้างโครงสร้างข้อมูล — เฉพาะอารมณ์ที่พบในไฟล์ต้นทางเท่านั้น (ไม่ preset ครบ 4 อารมณ์)
# เพื่อไม่ให้ .update() ไปแตะอารมณ์ที่ไฟล์นี้ไม่มีข้อมูล
food_db_structure = {}
skipped_unknown_category = 0

for _, row in df.iterrows():
    emotion_name = emotion_map.get(str(row["emotion_id"]).strip())
    category = category_map.get(str(row["category"]).strip().lower())

    if not emotion_name or not category:
        skipped_unknown_category += 1
        continue

    item_data = {
        "item_id": str(row["item_id"]),
        "menu_name": str(row["menu_name"]),
        "nutritional_value": str(row["nutritional_value"]),
        "recommendation_reason": str(row["recommendation_reason"]),
        "ref_id": str(row["ref_id"]) if "ref_id" in row and pd.notna(row["ref_id"]) else "",
    }

    food_db_structure.setdefault(
        emotion_name, {"dish": [], "drink": [], "ingredient": [], "fruit": []}
    )[category].append(item_data)

if skipped_unknown_category:
    print(f"⚠️  ข้าม {skipped_unknown_category} แถวที่ emotion_id/category ไม่รู้จัก")

if not food_db_structure:
    raise RuntimeError("❌ ไม่มีข้อมูลที่อัปโหลดได้เลยหลังกรอง — ตรวจสอบไฟล์ food_db.xlsx")

# 4. ส่งขึ้น Firebase — update เฉพาะอารมณ์ที่มีข้อมูล ไม่แตะอารมณ์อื่นที่ deploy อยู่แล้ว
ref = db.reference("food_db")
ref.update(food_db_structure)

emotions_uploaded = ", ".join(food_db_structure.keys())
item_counts = {
    emo: sum(len(items) for items in cats.values())
    for emo, cats in food_db_structure.items()
}
print(f"🚀 ใช้คีย์จาก: {key_path}")
print(f"✅ อัปโหลดข้อมูลจาก food_db.xlsx ขึ้น Firebase (node: food_db) สำเร็จ")
print(f"   อารมณ์ที่อัปเดต: {emotions_uploaded}")
for emo, count in item_counts.items():
    print(f"   - {emo}: {count} รายการ")
