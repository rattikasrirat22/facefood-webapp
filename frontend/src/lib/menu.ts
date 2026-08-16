// ============================================================================
// FaceFood — จัดกลุ่มรายการแนะนำตามหมวด และสุ่มหยิบมาแสดงหมวดละไม่กี่รายการ
// ============================================================================

import type { Category, GroupedItems, MenuItem } from '@/types';
import { CATEGORIES } from '@/types';

/** จำนวนรายการที่แสดงต่อหมวดในหน้า /results */
const DISPLAY_COUNT = 5;

function emptyGroups(): GroupedItems {
  return Object.fromEntries(
    CATEGORIES.map((category): [Category, MenuItem[]] => [category, []]),
  ) as GroupedItems;
}

export function groupByCategory(items: MenuItem[]): GroupedItems {
  const groups = emptyGroups();
  for (const item of items) {
    groups[item.category]?.push(item);
  }
  return groups;
}

function pickRandom(items: MenuItem[], count: number): MenuItem[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** สุ่มหยิบมาแสดงหมวดละ DISPLAY_COUNT รายการ — เรียกใหม่แล้วได้ชุดสุ่มใหม่ */
export function pickForDisplay(groups: GroupedItems): GroupedItems {
  return Object.fromEntries(
    CATEGORIES.map((category) => [category, pickRandom(groups[category], DISPLAY_COUNT)]),
  ) as GroupedItems;
}

/** หมวดนี้มีรายการเหลือมากกว่าที่แสดงอยู่ไหม — ใช้ตัดสินใจว่าจะโชว์ปุ่ม "สุ่มเมนูใหม่" หรือไม่ */
export function hasMoreThanShown(groups: GroupedItems, category: Category): boolean {
  return groups[category].length > DISPLAY_COUNT;
}
