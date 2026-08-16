// ============================================================================
// FaceFood — เก็บ/อ่านผลวิเคราะห์อารมณ์ระหว่างหน้า /analyze → /results
//
// ใช้ sessionStorage แทน state/query string เพราะผลลัพธ์มีทั้งภาพความน่าจะเป็น
// และรายการเมนู ส่งผ่าน URL ไม่เหมาะ และไม่ควรอยู่ยาวข้าม tab เหมือน localStorage
// ============================================================================

import type { AnalysisResult, Category, EmotionId, MenuItem } from '@/types';
import { CATEGORIES, EMOTION_IDS } from '@/types';

export const RESULT_STORAGE_KEY = 'facefood:last-analysis';

function isMenuItem(value: unknown): value is MenuItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<MenuItem>;
  return (
    typeof item.itemId === 'string' &&
    typeof item.menuName === 'string' &&
    typeof item.category === 'string' &&
    CATEGORIES.includes(item.category as Category) &&
    typeof item.emotionId === 'string' &&
    EMOTION_IDS.includes(item.emotionId as EmotionId) &&
    typeof item.nutritionalValue === 'string' &&
    typeof item.recommendationReason === 'string'
  );
}

function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<AnalysisResult>;
  const emotion = result.emotion;
  if (!emotion || typeof emotion !== 'object') return false;
  if (!EMOTION_IDS.includes(emotion.emotionId as EmotionId)) return false;
  if (typeof emotion.confidence !== 'number') return false;
  if (!Array.isArray(result.items)) return false;
  return result.items.every(isMenuItem);
}

/** อ่านผลวิเคราะห์ล่าสุดจาก sessionStorage — คืน null ถ้าไม่มี หรือรูปร่างข้อมูลเสีย */
export function readAnalysisResult(): AnalysisResult | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(RESULT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isAnalysisResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
