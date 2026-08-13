# Deploy Checklist — อ่านก่อน Deploy ทุกครั้ง

## 🔴 ต้องทำก่อน Deploy เสมอ
- [ ] ไฟล์โมเดล `.pth` (48MB) ไม่ได้อยู่ใน Git — ต้องอัปโหลดแยกไปที่ Google Cloud Storage
      แล้วแก้ `model_utils.py` ให้โหลดจาก URL ตอนเริ่มเซิร์ฟเวอร์ (หรือวางไฟล์นอก .gcloudignore
      เฉพาะตอนรันคำสั่ง deploy) — ห้ามลืมจุดนี้ ไม่งั้น deploy สำเร็จแต่โมเดลใช้งานไม่ได้
- [ ] `app.secret_key` ต้องย้ายจาก hardcode ไป environment variable
- [ ] `FIREBASE_KEY_PATH` ต้องชี้ไป Secret Manager ไม่ใช่ไฟล์ local
- [ ] `ALLOWED_ORIGINS` ต้องตั้งเป็นโดเมน production จริง ไม่ใช่ localhost
- [ ] `FLASK_DEBUG` ต้องเป็น false บน production
