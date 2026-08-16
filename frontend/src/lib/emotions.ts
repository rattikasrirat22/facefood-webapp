// ============================================================================
// FaceFood — ข้อมูลอธิบายอารมณ์ทั้ง 4 (EM01–EM04) สำหรับแสดงผลที่หน้า /results
//
// ข้อความและสีอ้างอิงจาก backend/app.py (EMOTION_META) และ
// backend/static/style.css (ตัวแปรสี --anger/--happiness/--neutral/--sadness)
// เพื่อให้ธีมตรงกับระบบเดิม — ไม่ได้มาจาก API เพราะ EmotionResult ไม่มีฟิลด์นี้
// ============================================================================

import type { EmotionId } from '@/types';

interface EmotionMeta {
  labelTh: string;
  labelEn: string;
  description: string;
  color: string;
}

export const EMOTION_META: Record<EmotionId, EmotionMeta> = {
  EM01: {
    labelTh: 'โกรธ',
    labelEn: 'Angry',
    color: '#c1502e',
    description:
      'ตอนนี้คุณอาจกำลังมีความเครียดหรือหงุดหงิด เรามีเมนูที่อุดมด้วยแมกนีเซียมและโอเมก้า-3 ช่วยคลายกล้ามเนื้อและผ่อนคลายระบบประสาท',
  },
  EM02: {
    labelTh: 'มีความสุข',
    labelEn: 'Happy',
    color: '#e0a12e',
    description:
      'คุณดูสดใสและมีความสุขในตอนนี้ เรามีเมนูที่ช่วยส่งเสริมการสร้าง Serotonin และ Dopamine ให้คุณสดชื่นต่อเนื่อง',
  },
  EM03: {
    labelTh: 'ปกติ',
    labelEn: 'Neutral',
    color: '#6e8b7a',
    description:
      'อารมณ์ของคุณอยู่ในโทนสงบเป็นปกติดี เรามีเมนูโภชนาการสมดุลที่เหมาะสำหรับเติมพลังงานในวันสบายๆ',
  },
  EM04: {
    labelTh: 'เศร้า',
    labelEn: 'Sad',
    color: '#3e6e8e',
    description:
      'ดูเหมือนคุณจะรู้สึกหม่นๆ อยู่บ้าง เรามีเมนูอุ่นๆ และสารอาหารต้านความเครียดที่ช่วยปลอบประโลมและเติมพลังใจ',
  },
};
