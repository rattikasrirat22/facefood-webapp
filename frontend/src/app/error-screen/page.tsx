'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  IconCameraOff,
  IconCameraQuestion,
  IconUsers,
  IconFaceIdError,
  IconBulbOff,
  IconRulerMeasure,
  IconAlertTriangle,
  IconCircleCheck,
  IconPlugConnectedX,
  IconClockExclamation,
} from '@tabler/icons-react';

type ErrorInfo = {
  icon: typeof IconCameraOff;
  title: string;
  description: string;
  tips: string[];
};

const errors: Record<string, ErrorInfo> = {
  'camera-denied': {
    icon: IconCameraOff,
    title: 'ไม่สามารถเข้าถึงกล้องได้',
    description: 'คุณยังไม่ได้อนุญาตให้เว็บไซต์ใช้กล้อง จึงไม่สามารถเริ่มวิเคราะห์อารมณ์ได้',
    tips: [
      'กดไอคอนรูปกุญแจหรือกล้องตรงแถบที่อยู่ของเบราว์เซอร์ แล้วเปลี่ยนสิทธิ์กล้องเป็น "อนุญาต"',
      'บนมือถือ ไปที่ ตั้งค่า → แอปเบราว์เซอร์ → สิทธิ์ → เปิดสิทธิ์กล้อง',
      'รีเฟรชหน้าเว็บ แล้วกดเริ่มวิเคราะห์ใหม่อีกครั้ง',
    ],
  },
  'no-camera': {
    icon: IconCameraQuestion,
    title: 'ไม่พบกล้องในอุปกรณ์',
    description: 'ระบบหากล้องในเครื่องของคุณไม่เจอ หรือกล้องกำลังถูกใช้งานโดยโปรแกรมอื่น',
    tips: [
      'ตรวจสอบว่ากล้องเชื่อมต่ออยู่ และไม่ได้ถูกปิดด้วยสวิตช์/ฝาปิดกล้อง',
      'ปิดโปรแกรมอื่นที่อาจกำลังใช้กล้องอยู่ เช่น Zoom หรือ Teams',
      'ลองใช้อุปกรณ์อื่นที่มีกล้อง เช่น โทรศัพท์มือถือ',
    ],
  },
  'multiple-faces': {
    icon: IconUsers,
    title: 'ตรวจพบหลายใบหน้า',
    description: 'ระบบวิเคราะห์อารมณ์ได้ครั้งละ 1 คนเท่านั้น',
    tips: [
      'ให้อยู่ในกรอบกล้องเพียงคนเดียวขณะสแกน',
      'ตรวจสอบว่าฉากหลังไม่มีรูปภาพหรือโปสเตอร์ที่มีใบหน้าคน',
      'เมื่อพร้อมแล้ว กดลองอีกครั้ง',
    ],
  },
  'no-face': {
    icon: IconFaceIdError,
    title: 'ไม่พบใบหน้า',
    description: 'ระบบมองไม่เห็นใบหน้าของคุณในกล้อง จึงไม่สามารถวิเคราะห์อารมณ์ได้',
    tips: [
      'หันหน้าตรงเข้ากล้อง และวางใบหน้าให้อยู่กลางกรอบ',
      'เอาสิ่งที่บังใบหน้าออก เช่น หน้ากาก แว่นกันแดด หรือผมที่ปิดหน้า',
      'ขยับเข้าใกล้กล้องขึ้นอีกเล็กน้อย แล้วลองใหม่',
    ],
  },
  'low-light': {
    icon: IconBulbOff,
    title: 'แสงสว่างไม่เพียงพอ',
    description: 'ภาพจากกล้องมืดเกินไป ทำให้ระบบมองเห็นใบหน้าไม่ชัดเจน',
    tips: [
      'ย้ายไปในที่ที่มีแสงสว่างมากขึ้น หรือเปิดไฟเพิ่ม',
      'หันหน้าเข้าหาแหล่งแสง อย่านั่งย้อนแสงหรือมีหน้าต่างสว่างอยู่ด้านหลัง',
      'หลีกเลี่ยงแสงจ้าที่ส่องเข้ากล้องโดยตรง',
    ],
  },
  distance: {
    icon: IconRulerMeasure,
    title: 'ระยะห่างจากกล้องไม่เหมาะสม',
    description: 'ใบหน้าของคุณอยู่ใกล้หรือไกลจากกล้องเกินไป',
    tips: [
      'อยู่ห่างจากกล้องประมาณ 0.5–1.5 เมตร',
      'ปรับตำแหน่งให้ใบหน้าอยู่ในกรอบพอดี ไม่ใหญ่หรือเล็กจนเกินไป',
      'จัดกล้องให้อยู่ระดับสายตา แล้วลองใหม่อีกครั้ง',
    ],
  },
  network: {
    icon: IconPlugConnectedX,
    title: 'เชื่อมต่อระบบวิเคราะห์ไม่ได้',
    description: 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ที่ใช้วิเคราะห์อารมณ์ได้ในขณะนี้',
    tips: [
      'ตรวจสอบว่าอุปกรณ์ของคุณเชื่อมต่ออินเทอร์เน็ตอยู่',
      'รอสักครู่แล้วกดลองอีกครั้ง ระบบอาจกำลังปิดปรับปรุง',
      'ถ้ายังไม่หาย ลองเปลี่ยนเครือข่าย เช่น สลับระหว่าง Wi-Fi กับเน็ตมือถือ',
    ],
  },
  timeout: {
    icon: IconClockExclamation,
    title: 'ใช้เวลาวิเคราะห์นานเกินไป',
    description: 'ระบบใช้เวลาประมวลผลนานกว่าปกติ จึงหยุดรอไว้ก่อน',
    tips: [
      'กดลองอีกครั้ง ส่วนใหญ่ครั้งถัดไปจะเร็วขึ้น',
      'ตรวจสอบว่าสัญญาณอินเทอร์เน็ตของคุณเสถียร',
      'ถ้าเกิดซ้ำหลายครั้ง แจ้งผู้ดูแลระบบเพื่อตรวจสอบเซิร์ฟเวอร์',
    ],
  },
  unknown: {
    icon: IconAlertTriangle,
    title: 'เกิดข้อผิดพลาด',
    description: 'มีบางอย่างผิดพลาดระหว่างการวิเคราะห์อารมณ์',
    tips: [
      'กดลองอีกครั้งเพื่อเริ่มวิเคราะห์ใหม่',
      'รีเฟรชหน้าเว็บ หรือปิดแล้วเปิดเบราว์เซอร์ใหม่',
      'ถ้ายังไม่หาย ลองเปลี่ยนเบราว์เซอร์ เช่น Chrome หรือ Edge',
    ],
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') ?? 'unknown';
  const info = errors[reason] ?? errors.unknown;
  const Icon = info.icon;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="max-w-xl mx-auto bg-snow border border-clay/25 rounded-2xl p-8 md:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blush rounded-full flex items-center justify-center">
            <Icon size={40} stroke={1.6} className="text-rosewood" />
          </div>
          <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900">
            {info.title}
          </h1>
          <p className="mt-3 text-gray-600 leading-relaxed">{info.description}</p>
        </div>

        <div className="mt-8 bg-blush/40 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900">วิธีแก้ไข</h2>
          <ul className="mt-4 space-y-3">
            {info.tips.map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-gray-700">
                <IconCircleCheck
                  size={20}
                  stroke={1.8}
                  className="text-rosewood shrink-0 mt-0.5"
                />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

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
            ลองอีกครั้ง
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ErrorScreenPage() {
  return (
    <Suspense fallback={null}>
      <ErrorContent />
    </Suspense>
  );
}
