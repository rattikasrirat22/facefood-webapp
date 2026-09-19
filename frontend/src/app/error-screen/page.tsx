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

// key ของแต่ละรายการคือค่าที่ส่งมาทาง /error-screen?reason=<key> และแม็ปมาจาก
// ERROR_CODE_TO_REASON ใน src/lib/api.ts — เปลี่ยนได้เฉพาะ title/description/tips
const errors: Record<string, ErrorInfo> = {
  'camera-denied': {
    icon: IconCameraOff,
    title: 'Camera access blocked',
    description:
      'This site has not been allowed to use your camera, so the analysis cannot start.',
    tips: [
      'Select the lock or camera icon in the browser address bar, then set the camera permission to "Allow".',
      'On mobile, go to Settings → your browser app → Permissions → enable Camera.',
      'Refresh the page, then start the analysis again.',
    ],
  },
  'no-camera': {
    icon: IconCameraQuestion,
    title: 'No camera found',
    description:
      'We could not find a camera on your device, or another app is currently using it.',
    tips: [
      'Check that the camera is connected and not switched off or covered.',
      'Close other apps that may be using the camera, such as Zoom or Teams.',
      'Try a device that has a camera, such as your phone.',
    ],
  },
  'multiple-faces': {
    icon: IconUsers,
    title: 'Multiple faces detected',
    description: 'The analysis works with one person at a time.',
    tips: [
      'Make sure only one person is in the frame while scanning.',
      'Check that no photos or posters showing faces are visible behind you.',
      'When you are ready, try again.',
    ],
  },
  'no-face': {
    icon: IconFaceIdError,
    title: 'No face detected',
    description:
      'We could not see your face in the camera, so the analysis cannot run.',
    tips: [
      'Face the camera directly and center your face in the frame.',
      'Remove anything covering your face, such as a mask, sunglasses, or hair.',
      'Move a little closer to the camera, then try again.',
    ],
  },
  'low-light': {
    icon: IconBulbOff,
    title: 'Not enough light',
    description: 'The camera image is too dark to see your face clearly.',
    tips: [
      'Move somewhere brighter, or turn on more lights.',
      'Face the light source, and avoid sitting with a bright window behind you.',
      'Avoid shining a strong light directly into the camera.',
    ],
  },
  distance: {
    icon: IconRulerMeasure,
    title: 'Camera distance is off',
    description: 'Your face is either too close to the camera or too far away.',
    tips: [
      'Stay about 0.5–1.5 metres from the camera.',
      'Adjust until your face fits the frame, neither too large nor too small.',
      'Position the camera at eye level, then try again.',
    ],
  },
  network: {
    icon: IconPlugConnectedX,
    title: 'Cannot reach the analysis service',
    description:
      'We could not connect to the server that runs the analysis right now.',
    tips: [
      'Check that your device is connected to the internet.',
      'Wait a moment and try again, as the service may be under maintenance.',
      'If the problem continues, switch networks, for example between Wi-Fi and mobile data.',
    ],
  },
  timeout: {
    icon: IconClockExclamation,
    title: 'Analysis took too long',
    description: 'The server took longer than expected, so we stopped waiting.',
    tips: [
      'Try again, as the next attempt is usually faster.',
      'Check that your internet connection is stable.',
      'If it keeps happening, let the site administrator know so they can check the server.',
    ],
  },
  unknown: {
    icon: IconAlertTriangle,
    title: 'Something went wrong',
    description: 'An error occurred during the analysis.',
    tips: [
      'Try again to restart the analysis.',
      'Refresh the page, or close and reopen your browser.',
      'If the problem continues, try another browser such as Chrome or Edge.',
    ],
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') ?? 'unknown';
  const info = errors[reason] ?? errors.unknown;
  const Icon = info.icon;

  // มือถือ (<sm) เว้นขอบล่างอย่างน้อย 34px และเผื่อ safe area ของเครื่องที่มี home indicator
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-[max(34px,env(safe-area-inset-bottom))] sm:py-8 md:py-16">
      <div className="max-w-xl mx-auto bg-snow border border-clay/25 rounded-2xl p-5 sm:p-8 md:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blush rounded-full flex items-center justify-center shrink-0">
            <Icon size={40} stroke={1.6} className="text-rosewood" />
          </div>
          <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900">
            {info.title}
          </h1>
          <p className="mt-3 text-gray-600 leading-relaxed">{info.description}</p>
        </div>

        <div className="mt-6 md:mt-8 bg-blush/40 rounded-xl p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900">How to fix this</h2>
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

        {/* Recovery actions: ตั้งแต่ sm เป็นปุ่มคู่แถวเดียว (Back to home เป็น secondary ใน error card
            อนุญาตให้มีได้เพราะเป็น recovery action) ส่วนมือถือเหลือ Try again ปุ่มเดียวเต็มความกว้าง
            สูง 52px — ทางกลับหน้าแรกบนมือถือคือปุ่ม chevron บน toolbar ของ Header */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
          <Link
            href="/"
            className="hidden sm:inline-flex sm:w-auto items-center justify-center border border-clay/40 text-gray-800 font-medium px-8 py-3 rounded-full hover:bg-blush/50 transition-colors"
          >
            Back to home
          </Link>
          <Link
            href="/analyze"
            className="inline-flex w-full min-h-13 sm:w-auto sm:min-h-0 items-center justify-center bg-clay text-mocha font-semibold px-8 py-3 rounded-full hover:bg-clay-dark transition-colors"
          >
            Try again
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
