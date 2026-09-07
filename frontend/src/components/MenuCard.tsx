'use client';

import { useState } from 'react';
import Image from 'next/image';
import { IconPhoto } from '@tabler/icons-react';
import type { MenuItem } from '@/types';

/**
 * การ์ดรายการแนะนำหนึ่งใบ
 *
 * ถ้า Backend ไม่ได้ส่ง image_url มา หรือรูปโหลดไม่ขึ้น (เช่นยังไม่ได้ตั้ง
 * images.remotePatterns ใน next.config.ts) จะแสดงไอคอน placeholder แทน
 * เพื่อไม่ให้การ์ดพังทั้งใบ
 */
export default function MenuCard({ item }: { item: MenuItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.imageUrl) && !imageFailed;

  return (
    <article className="bg-snow border border-clay/20 rounded-xl overflow-hidden flex flex-row sm:flex-col">
      {/* ต่ำกว่า sm (จอเดี่ยวคอลัมน์เดียว) รูปอยู่ซ้ายเป็นคอลัมน์กว้างคงที่ สูงตามการ์ด
          min-h เป็นความสูงขั้นต่ำกันไม่ให้แบนเกินไปเมื่อข้อความสั้น ไม่ใช่ความสูงตายตัว
          ตั้งแต่ sm ขึ้นไป (กริด 2 คอลัมน์เป็นต้นไป) กลับเป็นรูปด้านบนสัดส่วน 4/3 แบบเดิม */}
      <div className="relative w-28 min-h-28 shrink-0 self-stretch bg-blush flex items-center justify-center sm:w-full sm:min-h-0 sm:self-auto sm:aspect-[4/3]">
        {showImage ? (
          <Image
            src={item.imageUrl as string}
            alt={item.menuName}
            fill
            /* ตรงกับความกว้างจริงของกริดแต่ละช่วง: <640 รูปกว้างคงที่ 112px,
               640–767 สองคอลัมน์, 768–1023 สามคอลัมน์, ≥1024 ห้าคอลัมน์ */
            sizes="(max-width: 639px) 112px, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 20vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <IconPhoto size={32} stroke={1.5} className="text-clay" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1 p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-1">
        <h3 className="font-medium text-gray-900 leading-snug break-words">
          {item.menuName}
        </h3>

        {/* ต่ำกว่า sm แสดงเป็น chip ที่ตัดบรรทัดได้เอง ตั้งแต่ sm ขึ้นไปเป็นข้อความ
            บรรทัดเดียวแบบเดิม (ค่าจาก Backend ยาวไม่แน่นอน จึงห้ามล็อกความกว้าง) */}
        {item.nutritionalValue && (
          <p
            className="self-start max-w-full rounded-full bg-blush px-2 py-0.5 text-xs text-rosewood break-words sm:self-auto sm:max-w-none sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:line-clamp-1"
            title={item.nutritionalValue}
          >
            {item.nutritionalValue}
          </p>
        )}

        {/* ต่ำกว่า sm ไม่ตัดข้อความ เพราะหนึ่งคอลัมน์มีที่พอให้อ่านครบ
            ตั้งแต่ sm ขึ้นไปคง line-clamp-2 เดิมเพื่อให้การ์ดในกริดสูงใกล้เคียงกัน */}
        {item.recommendationReason && (
          <p className="text-xs text-gray-500 leading-relaxed break-words sm:line-clamp-2">
            {item.recommendationReason}
          </p>
        )}
      </div>
    </article>
  );
}
