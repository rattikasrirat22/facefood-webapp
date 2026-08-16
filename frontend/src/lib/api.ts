// ============================================================================
// FaceFood — จุดเดียวที่คุยกับ Backend จริง (backend/app.py, POST /api/analyze)
//
// แปลง wire type ใน @/types (ตรงกับ backend/app.py เป๊ะ ๆ) → domain type
// (component ห้ามใช้ wire type โดยตรง)
//
// backend ส่ง key อารมณ์เป็นชื่อเต็ม ("Happiness") และจัดกลุ่มเมนูมาตามหมวด "dish"
// ส่วน frontend ใช้รหัส EM01-04 และหมวด "food" — ต่างกันแค่ 2 จุดนี้ ที่เหลือ
// (confidence, error contract) ตรงกันแล้วเพราะแก้ backend ให้ตรงกับ frontend แล้ว
// ============================================================================

import type {
  AnalysisResult,
  ApiAnalyzeResponse,
  ApiErrorResponse,
  BackendCategory,
  BackendEmotionKey,
  BackendErrorCode,
  Category,
  EmotionId,
  EmotionKey,
  ErrorReason,
  MenuItem,
} from '@/types';
import { EMOTION_IDS } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS) || 30000;

const EMOTION_KEY_TO_ID: Record<BackendEmotionKey, EmotionId> = {
  Anger: 'EM01',
  Happiness: 'EM02',
  Neutral: 'EM03',
  Sadness: 'EM04',
};

const EMOTION_ID_TO_KEY: Record<EmotionId, EmotionKey> = {
  EM01: 'anger',
  EM02: 'happiness',
  EM03: 'neutral',
  EM04: 'sadness',
};

/** backend ใช้ "dish" ส่วน frontend ใช้ "food" — หมวดอื่นสะกดตรงกันอยู่แล้ว */
const CATEGORY_FROM_BACKEND: Record<BackendCategory, Category> = {
  dish: 'food',
  drink: 'drink',
  ingredient: 'ingredient',
  fruit: 'fruit',
};

/**
 * รหัส error จาก backend → เหตุผลที่หน้า /error-screen รองรับ
 *
 * มีแค่ NO_FACE_DETECTED ที่แม็ปตรงกับ reason เฉพาะทาง ('no-face') ที่เหลือ
 * backend ไม่มี logic แยกแยะละเอียดกว่านี้ (ไม่ตรวจแสง/ระยะ/หลายใบหน้า) จึงแม็ปเป็น
 * 'unknown' อย่างตรงไปตรงมา — ไม่เดาเป็น 'low-light'/'distance' ที่ backend ไม่ได้ส่งจริง
 */
const ERROR_CODE_TO_REASON: Record<BackendErrorCode, ErrorReason> = {
  INVALID_REQUEST: 'unknown',
  INVALID_IMAGE: 'unknown',
  NO_FACE_DETECTED: 'no-face',
  MODEL_ERROR: 'unknown',
  INVALID_EMOTION: 'unknown',
  DATABASE_ERROR: 'unknown',
};

export class ApiError extends Error {
  reason: ErrorReason;

  constructor(reason: ErrorReason, message: string) {
    super(message);
    this.name = 'ApiError';
    this.reason = reason;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('อ่านไฟล์ภาพไม่สำเร็จ'));
    reader.readAsDataURL(blob);
  });
}

/** ทำให้ชื่อเมนูใช้เป็นส่วนหนึ่งของ id ที่อ่านออกได้ปลอดภัย (ไม่จำเป็นต้อง unique เอง — ผสมกับ index อยู่แล้ว) */
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .slice(0, 40);
}

/**
 * แถวเมนูจาก Firebase เป็น string ล้วน หรือ object ก็ได้ (ดูหมายเหตุที่ ApiMenuItem ใน @/types)
 * ยืนยันจากการทดสอบจริง: food_db ปัจจุบันเก็บเป็น string ล้วน จึงไม่มี item_id ให้ใช้ตรง ๆ
 * ต้องสร้าง itemId แบบ deterministic เองจาก category+index+ชื่อ
 */
function mapFoodItems(
  foodItems: ApiAnalyzeResponse['food_items'],
  emotionId: EmotionId,
): MenuItem[] {
  const items: MenuItem[] = [];

  for (const [backendCategory, list] of Object.entries(foodItems)) {
    const category = CATEGORY_FROM_BACKEND[backendCategory as BackendCategory];
    if (!category || !list) continue;

    list.forEach((raw, index) => {
      const menuName =
        typeof raw === 'string' ? raw : (raw.menu_name ?? raw.name ?? raw.title ?? '');
      const itemId =
        typeof raw === 'string' || !raw.item_id
          ? `${category}-${index}-${slugify(menuName || String(index))}`
          : raw.item_id;

      items.push({
        itemId,
        menuName,
        category,
        emotionId,
        nutritionalValue: (typeof raw === 'object' && raw.nutritional_value) || '',
        recommendationReason: (typeof raw === 'object' && raw.recommendation_reason) || '',
      });
    });
  }

  return items;
}

function toAnalysisResult(data: ApiAnalyzeResponse): AnalysisResult {
  const emotionId = EMOTION_KEY_TO_ID[data.emotion.key] ?? 'EM03';
  const emotion = EMOTION_ID_TO_KEY[emotionId];

  const probabilities = EMOTION_IDS.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {} as Record<EmotionId, number>);

  for (const [key, percent] of Object.entries(data.emotion.probs)) {
    const id = EMOTION_KEY_TO_ID[key as BackendEmotionKey];
    if (id) probabilities[id] = percent / 100;
  }

  // backend ส่ง confidence เป็นเปอร์เซ็นต์ 0-100 สเกลเดียวกับ probs เสมอ (แก้ที่ backend แล้ว)
  // ใช้ค่านี้ตรง ๆ ไม่ต้องเดาสเกลหรือคำนวณเองจาก probs อีก
  const confidence = data.emotion.confidence / 100;

  return {
    emotion: { emotionId, emotion, confidence, probabilities },
    items: mapFoodItems(data.food_items, emotionId),
  };
}

/** รวม signal จากผู้เรียกกับ timeout ภายในของเราเอง ให้ยกเลิกได้ทั้งสองทาง */
function createRequestController(externalSignal?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;

  if (externalSignal?.aborted) controller.abort();
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_TIMEOUT_MS);

  const cleanup = () => {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  };

  return { signal: controller.signal, cleanup, didTimeOut: () => timedOut };
}

/** ส่งภาพไปวิเคราะห์อารมณ์ที่ backend แล้วแปลงผลลัพธ์เป็น domain type */
export async function analyzeEmotion(
  image: Blob,
  options: { signal?: AbortSignal } = {},
): Promise<AnalysisResult> {
  const dataUrl = await blobToDataUrl(image);
  const request = createRequestController(options.signal);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
      signal: request.signal,
    });
  } catch (error) {
    if (request.didTimeOut()) {
      throw new ApiError('timeout', 'วิเคราะห์อารมณ์ใช้เวลานานเกินไป');
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error; // ผู้ใช้ยกเลิกเอง — ให้ผู้เรียก (analyze/page.tsx) จัดการ ไม่แปลงเป็น ApiError
    }
    throw new ApiError('network', 'เชื่อมต่อเซิร์ฟเวอร์วิเคราะห์อารมณ์ไม่ได้');
  } finally {
    request.cleanup();
  }

  let data: ApiAnalyzeResponse | ApiErrorResponse;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('unknown', 'เซิร์ฟเวอร์ตอบกลับข้อมูลที่อ่านไม่ได้');
  }

  if (!data.success) {
    throw new ApiError(ERROR_CODE_TO_REASON[data.error.code] ?? 'unknown', data.error.message);
  }
  if (!response.ok) {
    // ไม่ควรเกิด (success:true ต้องมากับ HTTP 2xx เสมอ) — กันไว้เผื่อ backend เพี้ยน
    throw new ApiError('unknown', `เซิร์ฟเวอร์ตอบกลับผิดพลาด (HTTP ${response.status})`);
  }

  return toAnalysisResult(data);
}

/** แปลง error ที่โยนออกมาจาก analyzeEmotion ให้เป็นรหัสที่หน้า /error-screen รองรับ */
export function toErrorReason(error: unknown): ErrorReason {
  if (error instanceof ApiError) return error.reason;
  if (error instanceof DOMException && error.name === 'AbortError') return 'timeout';
  if (error instanceof TypeError) return 'network';
  return 'unknown';
}
