# FaceFood

Web application ที่วิเคราะห์อารมณ์จากใบหน้าผ่านกล้อง แล้วแนะนำอาหาร วัตถุดิบ เครื่องดื่ม และผลไม้ที่เหมาะกับความรู้สึกในตอนนั้น

ระบบไม่มีการสมัครสมาชิก ไม่บันทึกภาพใบหน้า และประมวลผลภาพแบบชั่วคราวเท่านั้น

---

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env.local
npm run dev
```

เปิด <http://localhost:3000>

**ยังไม่มี Backend ก็รันได้** — ถ้าเว้น `NEXT_PUBLIC_API_BASE_URL` ว่างไว้ ระบบจะใช้ข้อมูลจำลองใน `src/lib/mockData.ts` อัตโนมัติ

### Environment variables

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | URL ของ Backend — **เว้นว่าง = ใช้ข้อมูลจำลอง** |
| `NEXT_PUBLIC_USE_MOCK` | `false` | บังคับใช้ข้อมูลจำลองแม้ตั้ง base URL แล้ว |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | `30000` | หยุดรอผลวิเคราะห์หลังกี่มิลลิวินาที |

ดูรายละเอียดใน [`.env.example`](.env.example)

### คำสั่งอื่น

```bash
npm run build   # production build
npm run lint    # ESLint
npx tsc --noEmit  # typecheck
```

---

## Routes

| หน้า | URL | ไฟล์ |
| --- | --- | --- |
| Home | `/` | `src/app/page.tsx` |
| Analyze | `/analyze` | `src/app/analyze/page.tsx` |
| Results | `/results` | `src/app/results/page.tsx` |
| Error | `/error-screen?reason=<code>` | `src/app/error-screen/page.tsx` |
| 404 | ทุก path ที่ไม่ตรง | `src/app/not-found.tsx` |

Flow หลัก: `/` → `/analyze` → `/results` โดยผลวิเคราะห์ส่งผ่าน `sessionStorage`
ถ้าเกิดข้อผิดพลาดระหว่างทางจะถูกพาไป `/error-screen` พร้อม `reason` ที่อธิบายสาเหตุ

---

## โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── layout.tsx           root layout · font Prompt (ไทย+อังกฤษ) · Header
│   ├── page.tsx             หน้าแรก (Server Component)
│   ├── analyze/page.tsx     เปิดกล้อง → ตรวจใบหน้า → capture → ส่งวิเคราะห์
│   ├── results/page.tsx     แสดงอารมณ์ + เมนูแนะนำ 4 หมวด
│   ├── error-screen/page.tsx  หน้าอธิบายข้อผิดพลาดพร้อมวิธีแก้
│   ├── error.tsx            error boundary ของทั้งแอป
│   ├── not-found.tsx        หน้า 404
│   └── globals.css          Tailwind v4 · palette ของ FaceFood
├── components/
│   ├── Header.tsx           navbar แบบ sticky
│   ├── Footer.tsx
│   └── MenuCard.tsx         การ์ดรายการแนะนำ (รองรับรูปจาก Backend)
├── lib/
│   ├── api.ts               ⭐ จุดเดียวที่คุยกับ Backend
│   ├── emotions.ts          EM01–EM04 → ชื่อไทย สี และตัวแปลงชื่ออารมณ์
│   ├── menu.ts              จัดกลุ่มตามหมวด + สุ่มหยิบ 5 รายการ
│   ├── session.ts           ส่งผลวิเคราะห์ระหว่างหน้า + ตรวจรูปร่างข้อมูล
│   └── mockData.ts          ข้อมูลจำลอง (จะถูกลบตอนต่อ Backend จริง)
└── types/index.ts           type ทั้งหมด แยก wire type / domain type
```

---

## ต่อกับ Backend

**โมเดล:** ResNet18-Attention · 4 คลาส · Accuracy 90% (Weighted F1 91%)

ทุกการเรียก API อยู่ใน [`src/lib/api.ts`](src/lib/api.ts) ไฟล์เดียว
ค้นคำว่า `TODO(integration)` จะเจอ 2 จุดที่ต้องใส่ path จริง จากนั้นใส่ URL ใน `.env.local` ก็จบ — **ไม่ต้องแก้ไฟล์อื่น**

### รหัสอารมณ์

ให้ Backend แปลง index ของโมเดลเป็นรหัสก่อนส่ง **อย่าส่ง `0,1,2,3` ดิบ ๆ มา**
(ถ้าวันหลังเทรนใหม่จนลำดับคลาสขยับ หน้าเว็บจะแสดงอารมณ์ผิดโดยไม่มี error ให้เห็น)

| index โมเดล | ส่งมาเป็น | อารมณ์ |
| --- | --- | --- |
| 0 | `EM01` | Anger — ความโกรธ |
| 1 | `EM02` | Happiness — ความสุข |
| 2 | `EM03` | Neutral — ปกติ |
| 3 | `EM04` | Sadness — ความเศร้า |

### รูปแบบข้อมูล

**ส่งไป:** `multipart/form-data` field ชื่อ `image` — JPEG ย่อด้านยาวไม่เกิน 720px ไม่กลับด้าน

**ตอบกลับ:**

```jsonc
{
  "emotion_id": "EM02",
  "confidence": 0.92,
  "probabilities": { "EM01": 0.02, "EM02": 0.92, "EM03": 0.03, "EM04": 0.03 },
  "recommendations": [
    {
      "item_id": "FD001",
      "menu_name": "ข้าวผัดผักรวมไข่",
      "category": "food",          // food | drink | fruit | ingredient (เอกพจน์)
      "emotion_id": "EM02",
      "nutritional_value": "วิตามินเอ ใยอาหาร โปรตีน",
      "recommendation_reason": "ผักหลากสีให้สารต้านอนุมูลอิสระ...",
      "image_url": null            // ยังไม่มีรูปส่ง null ได้ การ์ดจะแสดงไอคอนแทน
    }
  ]
}
```

- `recommendations` เป็น **array แบน ส่งทุกแถวของอารมณ์นั้นมาเลย** ไม่ต้องแยกหมวดและไม่ต้องสุ่ม
  หน้าเว็บจะจัดกลุ่มเองแล้วสุ่มหยิบ **หมวดละ 5 = 20 รายการต่อการประมวลผล 1 ครั้ง**
  ที่เหลือเก็บไว้ให้ปุ่ม "สุ่มเมนูใหม่" (ถ้าหมวดไหนส่งมา ≤ 5 ปุ่มจะซ่อนตัวเอง)
- ไม่ส่ง `probabilities` ก็ได้ หน้าเว็บจะซ่อนแถบเปรียบเทียบไปเลย ไม่คำนวณตัวเลขขึ้นมาเอง
- ตอน error ส่ง `{"error": {"code": "no-face"}}` มาพอ ข้อความไทยหน้าเว็บมีให้แล้ว
  รหัสที่รองรับ: `no-face` · `multiple-faces` · `low-light` · `distance`
- Backend ต้องเปิด **CORS** ให้ `http://localhost:3000` เพราะเบราว์เซอร์ยิงตรงไม่ผ่าน proxy

---

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Tabler Icons

## ข้อกำหนดเบราว์เซอร์

ต้องรองรับ `getUserMedia` และเปิดผ่าน **HTTPS หรือ localhost** เท่านั้น (ข้อจำกัดด้านความปลอดภัยของเบราว์เซอร์ — กล้องจะไม่ทำงานถ้าเปิดผ่าน `http://` ที่ไม่ใช่ localhost เช่นเปิดด้วย IP ในวง LAN)

การตรวจจับใบหน้าฝั่ง client ใช้ `FaceDetector` API ซึ่งมีเฉพาะบน Chromium บางเวอร์ชัน — เบราว์เซอร์อื่นจะข้ามขั้นตอนนี้และให้ Backend เป็นผู้ตรวจแทน
