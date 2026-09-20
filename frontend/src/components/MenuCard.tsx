'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import { IconPhoto } from '@tabler/icons-react';
import type { MenuItem } from '@/types';

/**
 * การ์ดรายการแนะนำหนึ่งใบ
 *
 * ถ้า Backend ไม่ได้ส่ง image_url มา หรือรูปโหลดไม่ขึ้น (เช่นยังไม่ได้ตั้ง
 * images.remotePatterns ใน next.config.ts) จะแสดงไอคอน placeholder แทน
 * เพื่อไม่ให้การ์ดพังทั้งใบ
 *
 * สถานะ "เปิดรายละเอียด" เป็น state ในการ์ดใบนั้น ๆ แต่ละใบจึงเปิด/ปิดอิสระกัน
 * และไม่ต้องยกไปไว้ที่หน้า Results — เมื่อเปลี่ยนหมวดหรือกด Shuffle แล้วรายการเปลี่ยน
 * key ของ React (item.itemId ในหน้า Results) จะเปลี่ยนตาม การ์ดจึงถูก mount ใหม่
 * และสถานะเปิดจะไม่ติดไปกับรายการอื่น
 */
export default function MenuCard({ item }: { item: MenuItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  /** id ของกล่องเหตุผล ใช้ผูกกับ aria-controls ของปุ่มในการ์ดใบเดียวกัน */
  const detailsId = useId();
  const showImage = Boolean(item.imageUrl) && !imageFailed;

  return (
    <article className="h-full bg-snow border border-clay/20 rounded-xl overflow-hidden flex flex-row sm:flex-col">
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

        {/* สารอาหารสำคัญต้องอ่านได้ครบ จึงไม่ตัดบรรทัดที่ขนาดจอไหนเลย
            (เดิม sm:line-clamp-1 ตัดค่าที่ยาวกว่าหนึ่งบรรทัดทิ้งเป็น …)
            ต่ำกว่า sm ยังเป็น chip ตั้งแต่ sm ขึ้นไปเป็นข้อความธรรมดาเหมือนเดิม */}
        {item.nutritionalValue && (
          <p className="self-start max-w-full rounded-full bg-blush px-2 py-0.5 text-xs text-rosewood break-words sm:self-auto sm:max-w-none sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0">
            {item.nutritionalValue}
          </p>
        )}

        {/* เหตุผลแนะนำ: ปิดอยู่ = พรีวิว 3 บรรทัด เปิด = ข้อความเต็มไม่มีการตัด
            ไม่ล็อกความสูงและไม่มี scrollbar ในการ์ด การ์ดจึงยืดตามเนื้อหาจริง */}
        {item.recommendationReason && (
          <>
            <p
              id={detailsId}
              className={`text-xs text-gray-500 leading-relaxed whitespace-normal break-words ${
                showDetails ? '' : 'line-clamp-3'
              }`}
            >
              {item.recommendationReason}
            </p>

            {/* mt-auto ดันปุ่มไปอยู่ล่างสุดของเนื้อหาเสมอ ตำแหน่งจึงตรงกันทุกใบในแถวเดียวกัน
                min-h-11 = 44px ให้พื้นที่กดผ่านเกณฑ์โดยไม่ต้องเพิ่มขนาดตัวอักษร */}
            <button
              type="button"
              onClick={() => setShowDetails((open) => !open)}
              aria-expanded={showDetails}
              aria-controls={detailsId}
              className="mt-auto self-start inline-flex min-h-11 items-center text-xs font-medium text-rosewood hover:text-mocha transition-colors"
            >
              {showDetails ? 'Show less' : 'View details'}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
