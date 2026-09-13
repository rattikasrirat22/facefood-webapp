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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      <div className="max-w-xl mx-auto bg-snow border border-clay/25 rounded-2xl p-5 sm:p-8 md:p-10 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blush rounded-full flex items-center justify-center mx-auto">
          <IconAlertTriangle size={40} stroke={1.6} className="text-rosewood" />
        </div>

        <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          An error occurred while rendering this page. You can try again.
        </p>

        {error.digest && (
          <p className="mt-4 text-xs text-gray-400 font-mono">
            Reference code: {error.digest}
          </p>
        )}

        {/* มือถือใช้ flex-col-reverse ให้ Try again (primary) อยู่บน โดยไม่ต้องสลับ DOM */}
        <div className="mt-8 flex flex-col-reverse gap-3 md:flex-row md:flex-wrap md:justify-center md:gap-4">
          <Link
            href="/"
            className="inline-flex w-full md:w-auto items-center justify-center border border-clay/40 text-gray-800 font-medium px-8 py-3 rounded-full hover:bg-blush/50 transition-colors"
          >
            Back to home
          </Link>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex w-full md:w-auto items-center justify-center bg-clay text-mocha font-semibold px-8 py-3 rounded-full hover:bg-clay-dark transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </section>
  );
}
