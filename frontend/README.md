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

**ต้องมี Backend รันอยู่จริงถึงจะวิเคราะห์อารมณ์ได้** (ยังไม่มี mock data ในโปรเจกต์นี้) รัน Flask backend
ที่ `backend/app.py` แยกอีกเทอร์มินัลหนึ่ง (`python app.py`, default port 5000) แล้วตั้ง
`NEXT_PUBLIC_API_BASE_URL` ให้ชี้ไปที่ URL ของมันใน `.env.local`

### Environment variables

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5000` | URL ของ Flask backend (`python app.py` รันที่ port 5000 โดย default) |
| `NEXT_PUBLIC_USE_MOCK` | `false` | **ยังไม่ได้ implement** — ตั้งค่าไว้เผื่ออนาคต ตอนนี้ไม่มีผลต่อพฤติกรรมจริง |
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
│   ├── api.ts               ⭐ จุดเดียวที่คุยกับ Backend — เป็น adapter แปลง wire → domain type
│   ├── emotions.ts          EM01–EM04 → ชื่อไทย สี และคำอธิบาย
│   ├── menu.ts              จัดกลุ่มตามหมวด + สุ่มหยิบ 5 รายการ
│   └── session.ts           ส่งผลวิเคราะห์ระหว่างหน้า + ตรวจรูปร่างข้อมูล
└── types/index.ts           type ทั้งหมด แยก wire type (ตรงกับ backend จริง) / domain type
```

---

## ต่อกับ Backend

**โมเดล:** ResNet18-Attention · 4 คลาส · Accuracy 90% (Weighted F1 91%)

ทุกการเรียก API อยู่ใน [`src/lib/api.ts`](src/lib/api.ts) ไฟล์เดียว — เป็น **adapter** ที่แปลง response
จริงของ `backend/app.py` (`POST /api/analyze`, `POST /api/recommendations`) ให้เป็น domain type ใน
[`src/types/index.ts`](src/types/index.ts) contract ด้านล่างนี้คือของจริงที่ทดสอบแล้ว ไม่ใช่สเปกที่วางแผนไว้

### รหัสอารมณ์

Backend ส่ง**ชื่อคลาสเต็มเป็นภาษาอังกฤษ** (`"Anger"` / `"Happiness"` / `"Neutral"` / `"Sadness"` — ตรงกับ
`backend/classes.json`) **ไม่ใช่รหัส** `EM01-04` ดิบ ๆ — `src/lib/api.ts` เป็นตัวแปลงเป็นรหัส `EM01-04`
เองฝั่ง frontend สำหรับใช้เป็น key ภายในเท่านั้น ถ้าเทรนโมเดลใหม่ **ต้องคงชื่อคลาสสะกดตรงกับเดิมทั้ง 4 ตัว**
ไม่งั้น `src/lib/api.ts` จะ map ไม่เจอและ fallback เป็น Neutral เงียบ ๆ โดยไม่มี error ให้เห็น

| ชื่อคลาสจาก Backend | รหัสภายใน Frontend | อารมณ์ |
| --- | --- | --- |
| `Anger` | `EM01` | ความโกรธ |
| `Happiness` | `EM02` | ความสุข |
| `Neutral` | `EM03` | ปกติ |
| `Sadness` | `EM04` | ความเศร้า |

### รูปแบบข้อมูล

**ส่งไป:** JSON body `{"image": "data:image/jpeg;base64,..."}` — **ไม่ใช่** `multipart/form-data`

**ตอบกลับสำเร็จ:**

```jsonc
{
  "success": true,
  "emotion": {
    "key": "Happiness", "th": "มีความสุข", "en": "Happy", "emoji": "😊",
    "desc": "...",
    "confidence": 91.25,                    // 0-100 (%) — ห้ามคูณ/หารสเกลซ้ำฝั่งไหนอีก
    "probs": { "Anger": 2.5, "Happiness": 91.25, "Neutral": 4.0, "Sadness": 2.25 }
  },
  "food_items": {
    "dish": ["Chicken Tikka Masala", "..."],   // ปัจจุบัน Firebase เก็บเป็น string ล้วน (ดูด้านล่าง)
    "drink": ["..."], "ingredient": ["..."], "fruit": ["..."]
  },
  "category_labels": { "dish": "อาหารจานหลัก", "drink": "เครื่องดื่ม", "ingredient": "วัตถุดิบ", "fruit": "ผลไม้" },
  "category_icons": { "dish": "🍽️", "drink": "🥤", "ingredient": "🧂", "fruit": "🍎" }
}
```

**ตอบกลับ error:**

```jsonc
{ "success": false, "error": { "code": "NO_FACE_DETECTED", "message": "ไม่พบใบหน้าในภาพ" } }
```

รหัสที่ backend ส่งจริง: `INVALID_REQUEST` · `INVALID_IMAGE` · `NO_FACE_DETECTED` · `MODEL_ERROR` ·
`INVALID_EMOTION` · `DATABASE_ERROR` — `src/lib/api.ts` map เป็น `ErrorReason` ของหน้า `/error-screen` ให้
เอง มีแค่ `NO_FACE_DETECTED` ที่แม็ปตรงกับ reason เฉพาะทาง (`no-face`) ที่เหลือ backend ยังไม่มี logic
แยกแยะละเอียดกว่านี้ จึงแม็ปเป็น `unknown` ทั้งหมด

- `multiple-faces` เป็น reason ที่ตรวจจับฝั่ง **client เอง** (browser `FaceDetector` API ใน
  `analyze/page.tsx`) ไม่ได้มาจาก backend
- `low-light` / `distance` มี UI รองรับอยู่แล้วในหน้า `/error-screen` แต่**ยังไม่มี logic ทั้งฝั่ง backend
  และ client ที่ trigger ได้จริง** — เป็นสถานะที่เตรียมไว้เฉย ๆ ยังไม่ได้ต่อ
- รายการใน `food_items[category]` แต่ละชิ้นอาจเป็น **string ล้วน** (ชื่อเมนู) หรือ **object** ที่มี
  `item_id`/`menu_name`/`nutritional_value`/`recommendation_reason` ก็ได้ ขึ้นกับข้อมูลจริงใน Firebase
  node นั้น ๆ — `src/lib/api.ts` รองรับทั้งสองแบบ ถ้าเป็น string จะไม่มีข้อมูลโภชนาการ/เหตุผลแนะนำให้แสดง
  (การ์ดซ่อนส่วนนั้นไปเองถ้าว่าง ไม่ crash)
- Backend เปิด **CORS แบบ whitelist** เฉพาะ origin ที่ตั้งไว้ (env var `ALLOWED_ORIGINS`, default =
  `http://localhost:3000`) ไม่ใช่ wildcard แล้ว — เพิ่มโดเมน production ผ่าน env var นี้ตอน deploy

---

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Tabler Icons

## ข้อกำหนดเบราว์เซอร์

ต้องรองรับ `getUserMedia` และเปิดผ่าน **HTTPS หรือ localhost** เท่านั้น (ข้อจำกัดด้านความปลอดภัยของเบราว์เซอร์ — กล้องจะไม่ทำงานถ้าเปิดผ่าน `http://` ที่ไม่ใช่ localhost เช่นเปิดด้วย IP ในวง LAN)

การตรวจจับใบหน้าฝั่ง client ใช้ `FaceDetector` API ซึ่งมีเฉพาะบน Chromium บางเวอร์ชัน — เบราว์เซอร์อื่นจะข้ามขั้นตอนนี้และให้ Backend เป็นผู้ตรวจแทน
