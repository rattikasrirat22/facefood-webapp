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
// Wire types — Backend → Frontend
// ---------------------------------------------------------------------------

/** หนึ่งแถวจากตารางเมนูของ Backend */
export interface ApiMenuItem {
  item_id: string;
  menu_name: string;
  category: string;
  emotion_id: string;
  nutritional_value?: string | null;
  recommendation_reason?: string | null;
  image_url?: string | null;
}

/** Response ของการวิเคราะห์อารมณ์ */
export interface ApiAnalyzeResponse {
  emotion_id: string;
  emotion?: string | null;
  confidence: number;
  /** softmax 4 คลาส — key เป็น EM01–EM04 ไม่ใช่ index */
  probabilities?: Record<string, number> | null;
  /** array แบน หน้าบ้านจัดกลุ่มตาม category เอง */
  recommendations?: ApiMenuItem[] | null;
}

/** Response ตอน Backend ตอบ error */
export interface ApiErrorResponse {
  error?: {
    code?: string | null;
    message?: string | null;
  } | null;
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
