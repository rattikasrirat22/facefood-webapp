'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconCamera,
  IconUser,
  IconFaceId,
  IconBulb,
  IconRuler2,
  IconLock,
} from '@tabler/icons-react';
import { analyzeEmotion, toErrorReason } from '@/lib/api';
import { RESULT_STORAGE_KEY } from '@/lib/session';

type Stage = 'idle' | 'requesting' | 'detecting' | 'analyzing';

const tips = [
  { icon: IconUser, text: 'สแกนได้ครั้งละ 1 คน' },
  { icon: IconFaceId, text: 'วางใบหน้าให้อยู่ในกรอบ' },
  { icon: IconBulb, text: 'อยู่ในที่ที่มีแสงเพียงพอ' },
  { icon: IconRuler2, text: 'ห่างจากกล้อง 0.5–1.5 ม.' },
];

const stageMessages: Record<Stage, string> = {
  idle: '',
  requesting: 'กำลังขอสิทธิ์เข้าถึงกล้อง...',
  detecting: 'กำลังตรวจจับใบหน้า...',
  analyzing: 'กำลังวิเคราะห์อารมณ์... (ครั้งแรกอาจใช้เวลานานกว่าปกติ)',
};

type FaceDetectorLike = new () => {
  detect: (source: HTMLVideoElement) => Promise<unknown[]>;
};

/** ด้านที่ยาวที่สุดของภาพที่ส่งไปวิเคราะห์ — เล็กพอให้อัปโหลดเร็วบนมือถือ */
const MAX_CAPTURE_SIZE = 720;
const CAPTURE_QUALITY = 0.85;

/** รอจนกว่า <video> จะมีเฟรมจริงให้วาด ไม่งั้นจะได้ภาพเปล่า */
function waitForVideoReady(video: HTMLVideoElement, timeoutMs = 8000): Promise<boolean> {
  if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve(true);

  return new Promise((resolve) => {
    const cleanup = () => {
      video.removeEventListener('loadeddata', onReady);
      clearTimeout(timer);
    };
    const onReady = () => {
      cleanup();
      resolve(video.videoWidth > 0);
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);

    video.addEventListener('loadeddata', onReady);
  });
}

/** วาดเฟรมปัจจุบันลง canvas แล้วย่อขนาดก่อนส่ง — คืน null ถ้าเฟรมยังใช้ไม่ได้ */
async function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
  const ready = await waitForVideoReady(video);
  if (!ready) return null;

  const longestSide = Math.max(video.videoWidth, video.videoHeight);
  const scale = Math.min(1, MAX_CAPTURE_SIZE / longestSide);
  const width = Math.round(video.videoWidth * scale);
  const height = Math.round(video.videoHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return null;

  // วาดตามภาพจริงจากกล้อง ไม่กลับด้าน (พรีวิวกลับด้านด้วย CSS เพื่อความคุ้นเคยเท่านั้น)
  context.drawImage(video, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', CAPTURE_QUALITY);
  });
}

export default function AnalyzePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoStartedRef = useRef(false);
  const [stage, setStage] = useState<Stage>('idle');

  /** ปิดกล้องและยกเลิก request ที่ค้างอยู่ — เรียกซ้ำได้ปลอดภัย */
  const releaseCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const goToError = useCallback(
    (reason: string) => {
      releaseCamera();
      router.replace(`/error-screen?reason=${reason}`);
    },
    [releaseCamera, router],
  );

  const startAnalysis = useCallback(async () => {
    setStage('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      setStage('detecting');
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      const reason =
        name === 'NotAllowedError'
          ? 'camera-denied'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? 'no-camera'
            : 'unknown';
      setStage('idle');
      goToError(reason);
    }
  }, [goToError]);

  // ขอสิทธิ์กล้องอัตโนมัติทันทีที่เข้าหน้านี้ — ครั้งเดียวต่อการ mount จริง (กัน React
  // Strict Mode เรียกซ้ำตอน dev ด้วย ref guard) ปุ่ม Start analysis ด้านล่างยังอยู่เป็น
  // fallback ให้กดเองตอน retry (เช่นหลังกด "ยกเลิก") โดยไม่ auto-trigger ซ้ำอีก
  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    startAnalysis();
  }, [startAnalysis]);

  // ปิดกล้องเสมอเมื่อออกจากหน้า
  useEffect(() => releaseCamera, [releaseCamera]);

  // ต่อภาพจากกล้องเข้า <video> เมื่อเริ่มถ่าย
  useEffect(() => {
    if (
      (stage === 'detecting' || stage === 'analyzing') &&
      videoRef.current &&
      streamRef.current &&
      videoRef.current.srcObject !== streamRef.current
    ) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [stage]);

  // ตรวจจับใบหน้า: ใช้ FaceDetector API ของเบราว์เซอร์ถ้ามี ไม่มีก็รอตามเวลาแทน
  useEffect(() => {
    if (stage !== 'detecting') return;
    let cancelled = false;

    const waitForFace = async () => {
      const Detector = (window as { FaceDetector?: FaceDetectorLike }).FaceDetector;
      if (Detector) {
        const detector = new Detector();
        const startedAt = Date.now();
        let multiFaceCount = 0;
        while (!cancelled) {
          try {
            const video = videoRef.current;
            const faces = video ? await detector.detect(video) : [];
            if (faces.length === 1) break;
            if (faces.length > 1) {
              // ต้องเจอหลายหน้าติดกันหลายรอบก่อน กันภาพวูบชั่วขณะ
              multiFaceCount += 1;
              if (multiFaceCount >= 3) {
                if (!cancelled) goToError('multiple-faces');
                return;
              }
            } else {
              multiFaceCount = 0;
            }
            if (Date.now() - startedAt > 15000) {
              if (!cancelled) goToError('no-face');
              return;
            }
          } catch {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
      if (!cancelled) setStage('analyzing');
    };

    waitForFace();
    return () => {
      cancelled = true;
    };
  }, [stage, goToError]);

  // วิเคราะห์อารมณ์จากเฟรมปัจจุบัน แล้วพาไปหน้าผลลัพธ์
  useEffect(() => {
    if (stage !== 'analyzing') return;

    let cancelled = false;
    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      try {
        const video = videoRef.current;
        const image = video ? await captureFrame(video) : null;
        if (cancelled) return;

        if (!image) {
          goToError('unknown');
          return;
        }

        const result = await analyzeEmotion(image, { signal: controller.signal });
        if (cancelled) return;

        sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
        releaseCamera();
        router.replace('/results');
      } catch (error) {
        // ผู้ใช้กดยกเลิกเอง ไม่ใช่ข้อผิดพลาด
        if (cancelled || controller.signal.aborted) return;
        console.error('[analyze] วิเคราะห์อารมณ์ไม่สำเร็จ', error);
        goToError(toErrorReason(error));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [stage, goToError, releaseCamera, router]);

  const cancelAnalysis = () => {
    releaseCamera();
    setStage('idle');
  };

  const cameraOn = stage === 'detecting' || stage === 'analyzing';
  const busy = stage !== 'idle';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-rosewood transition-colors"
      >
        <IconArrowLeft size={18} />
        กลับหน้าแรก
      </Link>

      <h1 className="sr-only">วิเคราะห์อารมณ์จากใบหน้า</h1>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
        {/* Left: Camera panel */}
        <div className="lg:col-span-3">
          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-[#3F3128]">
            {cameraOn ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="ภาพสดจากกล้องหน้า"
                  className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent pt-16 pb-6 text-center">
                  <p className="text-white font-medium animate-pulse" aria-live="polite">
                    {stageMessages[stage]}
                  </p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                  <IconCamera size={36} className="text-blush" />
                </div>
                <p className="text-blush leading-relaxed" aria-live="polite">
                  {stage === 'requesting' ? (
                    stageMessages.requesting
                  ) : (
                    <>
                      กดปุ่มด้านขวาเพื่อเปิดกล้อง
                      <br />
                      และเริ่มวิเคราะห์อารมณ์
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Tips + CTA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-blush/40 border border-clay/25 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">คำแนะนำก่อนสแกน</h2>
            <p className="mt-1 text-sm text-gray-500">ทำตามเพื่อผลลัพธ์ที่แม่นยำที่สุด</p>

            <ul className="mt-6 space-y-4">
              {tips.map((tip) => (
                <li key={tip.text} className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-blush rounded-xl flex items-center justify-center shrink-0">
                    <tip.icon size={22} stroke={1.8} className="text-mocha" />
                  </div>
                  <span className="text-gray-800">{tip.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-center gap-2 text-sm text-gray-500">
            <IconLock size={16} />
            ไม่ต้องสมัครสมาชิก · ไม่มีการบันทึกภาพหรือข้อมูล
          </p>

          {busy ? (
            <button
              type="button"
              onClick={cancelAnalysis}
              className="block w-fit min-w-44 text-center border border-clay/40 text-gray-800 font-medium px-8 py-3 rounded-full hover:bg-blush/50 transition-colors"
            >
              ยกเลิก
            </button>
          ) : (
            <button
              type="button"
              onClick={startAnalysis}
              className="block w-fit min-w-44 text-center bg-clay text-mocha font-semibold px-8 py-3 rounded-full hover:bg-clay-dark transition-colors"
            >
              Start analysis
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
