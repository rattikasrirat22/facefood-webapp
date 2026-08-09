'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { IconAlertTriangle } from '@tabler/icons-react';

/**
 * Error boundary ของทั้งแอป — รับ error ที่เกิดตอน render ซึ่ง try/catch ธรรมดาจับไม่ได้
 *
 * ก่อนหน้านี้ไม่มีไฟล์นี้ ทำให้ทุกครั้งที่ render พังผู้ใช้จะเห็นหน้า error ดิบของ Next
 * ที่หลุดออกจาก design ของ FaceFood ทั้งหมด
 */
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('[facefood] เกิดข้อผิดพลาดที่ไม่ได้ดักไว้', error);
  }, [error]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="max-w-xl mx-auto bg-snow border border-clay/25 rounded-2xl p-8 md:p-10 text-center">
        <div className="w-20 h-20 bg-blush rounded-full flex items-center justify-center mx-auto">
          <IconAlertTriangle size={40} stroke={1.6} className="text-rosewood" />
        </div>

        <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900">เกิดข้อผิดพลาด</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          มีบางอย่างผิดพลาดระหว่างแสดงผลหน้านี้ ลองใหม่อีกครั้งได้เลย
        </p>

        {error.digest && (
          <p className="mt-4 text-xs text-gray-400 font-mono">รหัสอ้างอิง: {error.digest}</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center border border-clay/40 text-gray-800 font-medium px-8 py-3 rounded-full hover:bg-blush/50 transition-colors"
          >
            กลับหน้าแรก
          </Link>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex items-center bg-clay text-mocha font-semibold px-8 py-3 rounded-full hover:bg-clay-dark transition-colors"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    </section>
  );
}
