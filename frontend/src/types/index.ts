// ============================================================================
// FaceFood — Type contract
//
// แบ่งเป็น 2 กลุ่ม:
//   1. Wire types  — ตรงกับ JSON ที่ Backend ส่งมาเป๊ะ ๆ (snake_case ตาม schema DB)
//   2. Domain types — ที่ component ใช้จริง (camelCase ตามธรรมเนียม TS)
//
// การแปลงระหว่างสองกลุ่มเกิดขึ้นที่เดียวคือ src/lib/api.ts
// component ห้ามใช้ wire type โดยตรง
// ============================================================================

// ---------------------------------------------------------------------------
// Emotion
// ---------------------------------------------------------------------------

/**
 * รหัสอารมณ์ตาม DB ของ Backend — เป็น key หลักที่ใช้ผูกข้อมูลทั้งระบบ
 * ปลอดภัยกว่าการใช้ index ของโมเดล เพราะไม่ผูกกับลำดับคลาส
 * ถ้าเทรนโมเดลใหม่แล้วลำดับขยับ รหัสเหล่านี้ยังหมายถึงอารมณ์เดิม
 */
export type EmotionId = 'EM01' | 'EM02' | 'EM03' | 'EM04';

/** ชื่ออารมณ์แบบอ่านออก ตรงกับชื่อคลาสของโมเดล ResNet18-Attention */
export type EmotionKey = 'anger' | 'happiness' | 'neutral' | 'sadness';

/** หมวดของรายการแนะนำ — สะกดตรงกับคอลัมน์ category ใน DB (เอกพจน์) */
export type Category = 'food' | 'drink' | 'fruit' | 'ingredient';

export const EMOTION_IDS: readonly EmotionId[] = ['EM01', 'EM02', 'EM03', 'EM04'];
export const CATEGORIES: readonly Category[] = ['food', 'drink', 'fruit', 'ingredient'];

// ---------------------------------------------------------------------------
// Wire types — Backend → Frontend (ตรงกับ backend/app.py จริง)
//
// backend ส่งชื่ออารมณ์เต็ม ("Anger"/"Happiness"/"Neutral"/"Sadness") ไม่ใช่รหัส
// EM01-04 และจัดกลุ่มเมนูมาให้แล้วตามหมวด "dish"/"drink"/"ingredient"/"fruit"
// (object ไม่ใช่ array แบน) — src/lib/api.ts เป็นจุดเดียวที่แปลงเป็น domain type
// ---------------------------------------------------------------------------

/** ชื่อคลาสอารมณ์ตามที่โมเดล/backend ใช้จริง (backend/classes.json) */
export type BackendEmotionKey = 'Anger' | 'Happiness' | 'Neutral' | 'Sadness';

/** ชื่อหมวดอาหารตามที่ backend ใช้จริง (backend/firebase_utils.py: CATEGORY_LABELS_TH) */
export type BackendCategory = 'dish' | 'drink' | 'ingredient' | 'fruit';

/**
 * หนึ่งแถวเมนูจาก Firebase แบบ object เต็ม (ถ้า node นั้นถูกกรอกข้อมูลไว้ครบ)
 * ยืนยันจากการทดสอบจริงกับ Firebase ว่าปัจจุบัน food_db เก็บเป็น string ล้วน (ดู ApiMenuItem)
 * แต่คง shape นี้ไว้เผื่อ node อื่นในอนาคตเก็บเป็น object — backend/static/result.js (legacy)
 * ก็รองรับทั้งสองแบบอยู่แล้วเช่นกัน
 */
export interface ApiMenuItemObject {
  item_id?: string | null;
  menu_name?: string | null;
  name?: string | null;
  title?: string | null;
  nutritional_value?: string | null;
  recommendation_reason?: string | null;
  image_url?: string | null;
}

/** หนึ่งแถวเมนูจาก Firebase ตามที่ backend/app.py ส่งจริง — เป็น string ชื่อเมนูล้วน หรือ object ก็ได้ */
export type ApiMenuItem = string | ApiMenuItemObject;

/** Response สำเร็จของ POST /api/analyze (backend/app.py: api_analyze) */
export interface ApiAnalyzeResponse {
  success: true;
  emotion: {
    key: BackendEmotionKey;
    th: string;
    en: string;
    emoji: string;
    desc: string;
    /** 0–100 (เปอร์เซ็นต์) — สเกลเดียวกับ probs ห้ามคูณ/หารซ้ำฝั่งไหนอีก */
    confidence: number;
    /** 0–100 (เปอร์เซ็นต์) ต่อคลาส */
    probs: Record<string, number>;
  };
  food_items: Partial<Record<BackendCategory, ApiMenuItem[]>>;
  category_labels: Record<BackendCategory, string>;
  category_icons: Record<BackendCategory, string>;
}

/** รหัส error มาตรฐานที่ backend/app.py (ฟังก์ชัน _api_error) ส่งจริง */
export type BackendErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_IMAGE'
  | 'NO_FACE_DETECTED'
  | 'MODEL_ERROR'
  | 'INVALID_EMOTION'
  | 'DATABASE_ERROR';

/** Response ตอน backend ตอบ error — โครงสร้างเดียวกันทั้ง /api/analyze และ /api/recommendations */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: BackendErrorCode;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Domain types — ที่ component ใช้
// ---------------------------------------------------------------------------

export interface MenuItem {
  /** unique ทั้งระบบ เช่น FD001, DR001, FR001, IG001 */
  itemId: string;
  menuName: string;
  category: Category;
  emotionId: EmotionId;
  /** สารอาหารสำคัญ — อาจว่างถ้า DB ยังไม่ได้กรอก */
  nutritionalValue: string;
  /** เหตุผลทางโภชนาการที่แนะนำ — ใช้เป็นคำอธิบายบนการ์ด */
  recommendationReason: string;
  /** URL รูปเมนู — ถ้าไม่มีการ์ดจะแสดงไอคอน placeholder แทน */
  imageUrl?: string;
}

export interface EmotionResult {
  emotionId: EmotionId;
  emotion: EmotionKey;
  /** 0–1 */
  confidence: number;
  /**
   * 0–1 ครบทั้ง 4 อารมณ์ รวมได้ประมาณ 1
   *
   * เป็น null ถ้า Backend ไม่ได้ส่งมา — กรณีนั้น UI จะซ่อนแถบเปรียบเทียบไปเลย
   * ห้ามคำนวณตัวเลขนี้ขึ้นมาเองเด็ดขาด เพราะจะกลายเป็นการแสดงผลวิเคราะห์ปลอม
   */
  probabilities: Record<EmotionId, number> | null;
}

export interface AnalysisResult {
  emotion: EmotionResult;
  /** array แบน — จัดกลุ่มด้วย groupByCategory() ใน src/lib/menu.ts */
  items: MenuItem[];
}

/** รายการที่จัดกลุ่มตามหมวดแล้ว พร้อมส่งให้ UI */
export type GroupedItems = Record<Category, MenuItem[]>;

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

/**
 * รหัสข้อผิดพลาดที่หน้า /error-screen รองรับ
 * ค่าเหล่านี้ถูกใช้เป็น query param: /error-screen?reason=<code>
 */
export type ErrorReason =
  | 'camera-denied'
  | 'no-camera'
  | 'no-face'
  | 'multiple-faces'
  | 'low-light'
  | 'distance'
  | 'network'
  | 'timeout'
  | 'unknown';

export const ERROR_REASONS: readonly ErrorReason[] = [
  'camera-denied',
  'no-camera',
  'no-face',
  'multiple-faces',
  'low-light',
  'distance',
  'network',
  'timeout',
  'unknown',
];
