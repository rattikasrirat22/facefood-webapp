// ============================================================================
// FaceFood — ข้อมูลอธิบายอารมณ์ทั้ง 4 (EM01–EM04) สำหรับแสดงผลที่หน้า /results
//
// สีอ้างอิงจาก backend/static/style.css (ตัวแปร --anger/--happiness/--neutral/--sadness)
// เพื่อให้ธีมตรงกับระบบเดิม — ไม่ได้มาจาก API เพราะ EmotionResult ไม่มีฟิลด์นี้
//
// ส่วนคำอธิบายเขียนขึ้นใหม่เป็นภาษาอังกฤษ ไม่ได้แปลตรงจาก backend/app.py (EMOTION_META)
// โดยอธิบายว่าชุดคำแนะนำเน้นสารอาหารอะไร ไม่กล่าวอ้างผลต่อร่างกายหรือจิตใจของผู้ใช้
// ============================================================================

import type { EmotionId } from '@/types';

interface EmotionMeta {
  /**
   * ชื่อหมวดที่แสดงบนหน้าจอ — ใช้ชื่อเดียวกับคลาสของโมเดล (Anger/Happiness/Neutral/Sadness)
   * เดิมแยกเป็น labelTh + labelEn แล้วแสดงคู่กัน พอ UI เป็นอังกฤษล้วนจึงเหลือชุดเดียว
   */
  label: string;
  description: string;
  color: string;
}

export const EMOTION_META: Record<EmotionId, EmotionMeta> = {
  EM01: {
    label: 'Anger',
    color: '#c1502e',
    description:
      'Your expression was classified as anger. These suggestions focus on ingredients rich in magnesium and omega-3.',
  },
  EM02: {
    label: 'Happiness',
    color: '#e0a12e',
    description:
      'Your expression was classified as happiness. These suggestions focus on ingredients associated with serotonin and dopamine.',
  },
  EM03: {
    label: 'Neutral',
    color: '#6e8b7a',
    description:
      'Your expression was classified as neutral. These suggestions focus on nutritionally balanced everyday meals.',
  },
  EM04: {
    label: 'Sadness',
    color: '#3e6e8e',
    description:
      'Your expression was classified as sadness. These suggestions focus on warm dishes and comforting ingredients.',
  },
};
