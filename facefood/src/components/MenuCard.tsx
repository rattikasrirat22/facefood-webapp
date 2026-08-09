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
    <article className="bg-snow border border-clay/20 rounded-xl overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-blush flex items-center justify-center">
        {showImage ? (
          <Image
            src={item.imageUrl as string}
            alt={item.menuName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <IconPhoto size={32} stroke={1.5} className="text-clay" aria-hidden />
        )}
      </div>

      <div className="p-4 flex flex-col gap-1">
        <h3 className="font-medium text-gray-900 leading-snug">{item.menuName}</h3>

        {item.nutritionalValue && (
          <p className="text-xs text-rosewood line-clamp-1" title={item.nutritionalValue}>
            {item.nutritionalValue}
          </p>
        )}

        {item.recommendationReason && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {item.recommendationReason}
          </p>
        )}
      </div>
    </article>
  );
}
