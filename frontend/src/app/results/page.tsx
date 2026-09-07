'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconMoodSmile,
  IconMoodSad,
  IconMoodAngry,
  IconMoodNeutral,
  IconToolsKitchen2,
  IconLeaf,
  IconCup,
  IconApple,
  IconChevronDown,
  IconDice5,
  IconRefresh,
  IconArrowLeft,
} from '@tabler/icons-react';
import { EMOTION_IDS, type Category, type EmotionId } from '@/types';
import { EMOTION_META } from '@/lib/emotions';
import { groupByCategory, hasMoreThanShown, pickForDisplay } from '@/lib/menu';
import { RESULT_STORAGE_KEY, readAnalysisResult } from '@/lib/session';
import MenuCard from '@/components/MenuCard';

const moodIcons: Record<EmotionId, typeof IconMoodSmile> = {
  EM01: IconMoodAngry,
  EM02: IconMoodSmile,
  EM03: IconMoodNeutral,
  EM04: IconMoodSad,
};

const categories: { key: Category; label: string; icon: typeof IconToolsKitchen2 }[] = [
  // key ต้องตรงกับ Category ที่ผูกกับ backend (dish→food) — เปลี่ยนได้เฉพาะ label
  { key: 'food', label: 'Food', icon: IconToolsKitchen2 },
  { key: 'ingredient', label: 'Ingredients', icon: IconLeaf },
  { key: 'drink', label: 'Drinks', icon: IconCup },
  { key: 'fruit', label: 'Fruits', icon: IconApple },
];

// ---------------------------------------------------------------------------
// อ่านผลวิเคราะห์จาก sessionStorage ผ่าน useSyncExternalStore
// เป็นวิธีที่ React แนะนำสำหรับข้อมูลนอก React และไม่ต้อง setState ใน effect
// ---------------------------------------------------------------------------

/** ค่าใน sessionStorage ไม่เปลี่ยนระหว่างที่อยู่หน้านี้ จึงไม่ต้อง subscribe จริง */
const subscribe = () => () => {};
const getSnapshot = () => window.sessionStorage.getItem(RESULT_STORAGE_KEY);
const getServerSnapshot = () => null;

export default function ResultsPage() {
  const router = useRouter();
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const result = useMemo(() => (raw === null ? null : readAnalysisResult()), [raw]);

  const groups = useMemo(() => groupByCategory(result?.items ?? []), [result]);

  const [category, setCategory] = useState<Category>('food');
  const [showDetail, setShowDetail] = useState(false);
  const [shuffleCount, setShuffleCount] = useState(0);

  // สุ่มหยิบมาแสดงหมวดละ 5 รายการ — เปลี่ยน shuffleCount แล้วจะได้ชุดใหม่
  const displayed = useMemo(
    () => pickForDisplay(groups),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shuffleCount เป็นตัวสั่งให้สุ่มใหม่โดยตั้งใจ
    [groups, shuffleCount],
  );

  // ไม่มีผลวิเคราะห์ให้แสดง (เปิด URL ตรง ๆ หรือข้อมูลเสีย) — กลับไปเริ่มใหม่
  useEffect(() => {
    if (result) return;
    // snapshot ฝั่ง server เป็น null เสมอ อ่านซ้ำจากของจริงก่อนตัดสินใจ redirect
    if (readAnalysisResult()) return;
    router.replace('/analyze');
  }, [result, router]);

  if (!result) return <ResultsSkeleton />;

  const { emotion } = result;
  const meta = EMOTION_META[emotion.emotionId];
  const MoodIcon = moodIcons[emotion.emotionId];
  const confidencePercent = Math.round(emotion.confidence * 100);
  const canReshuffle = hasMoreThanShown(groups, category);
  const items = displayed[category];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* ต่ำกว่า md ปุ่มย้อนกลับอยู่บน toolbar ของ Header แล้ว จึงซ่อนลิงก์นี้กันซ้ำ
          ปลายทางยังเป็น "/" เหมือนเดิม ไม่ได้เปลี่ยน navigation */}
      <Link
        href="/"
        className="hidden md:inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-rosewood transition-colors"
      >
        <IconArrowLeft size={18} />
        Back to home
      </Link>

      <h1 className="sr-only">Expression result and recommended items</h1>

      {/* Emotion result card */}
      <div className="mt-0 md:mt-6 bg-snow border border-clay/25 rounded-2xl p-6 md:p-8">
        {/* ต่ำกว่า sm เรียงสองแถว เพราะที่ 320px แถวเดียวต้องใช้ ~302px แต่มีพื้นที่จริง 240px
            ตั้งแต่ sm (640px) ขึ้นไปพื้นที่ในการ์ดมี 544px แถวเดียวจึงพอสบายทุกอารมณ์ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${meta.color}26`, color: meta.color }}
            >
              <MoodIcon size={36} stroke={1.6} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Detected expression</p>
              <p className="mt-0.5 text-2xl md:text-3xl font-bold text-gray-900">
                {meta.label}
              </p>
            </div>
          </div>
          {/* จอแคบวาง % กับคำว่า Confidence บนเส้นฐานเดียวกัน ให้ยังอ่านคู่กับอารมณ์ด้านบนได้ */}
          <div className="flex items-baseline gap-2 shrink-0 sm:block sm:text-right">
            <p className="text-4xl md:text-5xl font-bold text-rosewood tabular-nums">
              {confidencePercent}%
            </p>
            <p className="text-xs text-gray-500 sm:mt-1">Confidence</p>
          </div>
        </div>

        {/* min-h-11 = 44px ทุกขนาดจอรวม desktop เพื่อให้พื้นที่กดผ่านเกณฑ์
            ลด mt จาก 5 เหลือ 2 ชดเชยความสูงที่เพิ่ม ตัวอักษรจึงอยู่ตำแหน่งเดิมโดยประมาณ */}
        <button
          type="button"
          onClick={() => setShowDetail((show) => !show)}
          aria-expanded={showDetail}
          className="mt-2 min-h-11 flex items-center gap-1 text-sm text-rosewood hover:text-mocha transition-colors"
        >
          View confidence breakdown
          <IconChevronDown
            size={16}
            className={`transition-transform ${showDetail ? 'rotate-180' : ''}`}
          />
        </button>

        {showDetail && (
          <div className="mt-4 pt-4 border-t border-clay/20 space-y-3">
            <p className="text-sm text-gray-600">{meta.description}</p>

            {emotion.probabilities ? (
              EMOTION_IDS.map((id) => {
                const percent = Math.round((emotion.probabilities?.[id] ?? 0) * 100);
                return (
                  <div key={id} className="flex items-center gap-3">
                    <span className="w-20 md:w-24 text-sm text-gray-700 shrink-0">
                      {EMOTION_META[id].label}
                    </span>
                    <div className="flex-1 h-2.5 bg-blush rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: EMOTION_META[id].color }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm text-gray-600 shrink-0 tabular-nums">
                      {percent}%
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">
                A per-category breakdown was not returned for this analysis.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <IconToolsKitchen2 size={22} className="text-mocha" />
          Recommended for you
        </h2>

        {/* Category tabs — ต่ำกว่า md เป็น grid 2×2 ปุ่มกว้างเท่ากัน สูง 44px
            ตั้งแต่ md ขึ้นไปกลับเป็น flex-wrap แบบเดิม */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:flex md:flex-wrap">
          {categories.map((item) => {
            const isActive = category === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setCategory(item.key)}
                aria-pressed={isActive}
                className={`flex items-center justify-center md:justify-start gap-2 text-sm font-medium px-3 py-3 md:px-5 md:py-2 rounded-full border transition-colors ${
                  isActive
                    ? 'bg-clay border-clay text-mocha'
                    : 'bg-transparent border-clay/40 text-gray-700 hover:bg-blush/50'
                }`}
              >
                <item.icon size={18} stroke={1.8} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Menu cards */}
        {items.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <MenuCard key={item.itemId} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-6 bg-blush/40 border border-clay/25 rounded-2xl p-6 md:p-10 text-center">
            <p className="text-gray-700">No items in this category yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Try another category, or analyze again.
            </p>
          </div>
        )}

        {/* Actions — ต่ำกว่า md เรียงแนวตั้งเต็มความกว้าง ตั้งแต่ md ขึ้นไปกลับเป็นแถวกลางจอแบบเดิม */}
        <div className="mt-10 flex flex-col gap-3 md:flex-row md:flex-wrap md:justify-center md:gap-4">
          {canReshuffle && (
            <button
              type="button"
              onClick={() => setShuffleCount((count) => count + 1)}
              className="w-full md:w-auto flex items-center justify-center gap-2 border border-clay/40 text-gray-800 font-medium px-8 py-3 rounded-full hover:bg-blush/50 transition-colors"
            >
              <IconDice5 size={20} stroke={1.8} />
              Shuffle suggestions
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/analyze')}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-clay text-mocha font-semibold px-8 py-3 rounded-full hover:bg-clay-dark transition-colors"
          >
            <IconRefresh size={20} stroke={1.8} />
            Analyze again
          </button>
        </div>
      </div>
    </section>
  );
}

/** โครงหน้าระหว่างรออ่านผลจาก sessionStorage — รูปร่างเดียวกับของจริงเพื่อไม่ให้จอกระตุก */
function ResultsSkeleton() {
  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10"
      aria-busy="true"
      aria-label="Loading analysis result"
    >
      {/* บล็อกสีเทาทั้งหมดเป็นภาพตกแต่งล้วน ซ่อนจาก screen reader ไว้
          แล้วประกาศสถานะด้วยข้อความเดียวด้านล่างแทน จะได้ไม่อ่านซ้ำซ้อน

          ทุก class ตรงกับของจริงชิ้นต่อชิ้นทุก breakpoint (การ์ดอารมณ์สองแถวแล้วเป็นแถวเดียวที่ sm,
          ปุ่มหมวด grid 2×2 จนถึง md, การ์ดเมนู 1 คอลัมน์รูปซ้าย → 2 คอลัมน์รูปบนที่ sm)
          เพื่อให้ตอนสลับมาเป็นเนื้อหาจริงแล้วตำแหน่งไม่ขยับ */}
      <div aria-hidden="true" className="animate-pulse">
        <div className="hidden md:block h-5 w-28 bg-blush rounded-full" />

        <div className="mt-0 md:mt-6 bg-snow border border-clay/25 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blush shrink-0" />
              <div className="space-y-2">
                <div className="h-3 w-24 bg-blush rounded-full" />
                <div className="h-7 w-40 bg-blush rounded-full" />
              </div>
            </div>
            <div className="h-10 w-28 bg-blush rounded-xl shrink-0 sm:h-12 sm:w-24" />
          </div>
          {/* กล่องสูง 44px เท่าปุ่มจริง แล้วค่อยวางแถบสีข้างในให้ตรงกับตัวอักษร */}
          <div className="mt-2 h-11 flex items-center">
            <div className="h-5 w-52 bg-blush rounded-full" />
          </div>
        </div>

        <div className="mt-10 space-y-5">
          <div className="h-6 w-48 bg-blush rounded-full" />
          <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap">
            {categories.map((item) => (
              <div key={item.key} className="h-11 md:h-9 md:w-32 bg-blush rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="border border-clay/20 rounded-xl overflow-hidden flex flex-row sm:flex-col"
              >
                <div className="w-28 min-h-28 shrink-0 bg-blush sm:w-full sm:min-h-0 sm:aspect-[4/3]" />
                <div className="p-3 sm:p-4 space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-blush rounded-full" />
                  <div className="h-3 w-full bg-blush rounded-full" />
                  <div className="h-3 w-5/6 bg-blush rounded-full sm:hidden" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-8 text-center text-sm text-gray-500"
      >
        Loading your recommendations…
      </p>
    </section>
  );
}
