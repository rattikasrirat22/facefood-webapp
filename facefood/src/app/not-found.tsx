import Link from 'next/link';
import { IconMapSearch } from '@tabler/icons-react';

export default function NotFound() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="max-w-xl mx-auto bg-snow border border-clay/25 rounded-2xl p-8 md:p-10 text-center">
        <div className="w-20 h-20 bg-blush rounded-full flex items-center justify-center mx-auto">
          <IconMapSearch size={40} stroke={1.6} className="text-rosewood" />
        </div>

        <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900">ไม่พบหน้าที่คุณกำลังหา</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          ลิงก์อาจพิมพ์ผิด หรือหน้านี้ถูกย้ายไปแล้ว
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center border border-clay/40 text-gray-800 font-medium px-8 py-3 rounded-full hover:bg-blush/50 transition-colors"
          >
            กลับหน้าแรก
          </Link>
          <Link
            href="/analyze"
            className="inline-flex items-center bg-clay text-mocha font-semibold px-8 py-3 rounded-full hover:bg-clay-dark transition-colors"
          >
            เริ่มวิเคราะห์อารมณ์
          </Link>
        </div>
      </div>
    </section>
  );
}
