import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import {
  IconCamera,
  IconMoodSearch,
  IconSalad,
  IconShieldCheck,
} from '@tabler/icons-react';

const steps = [
  {
    icon: IconCamera,
    title: 'เปิดกล้องถ่ายภาพใบหน้า',
    description:
      'กด Start analysis แล้วอนุญาตให้ใช้กล้อง ถ่ายภาพใบหน้าตรง ๆ ในที่ที่มีแสงเพียงพอ',
  },
  {
    icon: IconMoodSearch,
    title: 'AI วิเคราะห์อารมณ์',
    description:
      'ระบบวิเคราะห์อารมณ์จากใบหน้าของคุณ (มีความสุข เศร้า โกรธ หรือปกติ) ภายในไม่กี่วินาที',
  },
  {
    icon: IconSalad,
    title: 'รับเมนูที่ใช่สำหรับคุณ',
    description:
      'รับคำแนะนำอาหาร วัตถุดิบ เครื่องดื่ม และผลไม้ที่เหมาะกับความรู้สึกในตอนนั้น',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-xl aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
              <Image
                src="/hero-food.jpg"
                alt="อาหารเพื่อสุขภาพหลากหลายเมนู"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Right: Text */}
          <div className="space-y-6">
            <p className="text-sm font-bold tracking-widest text-rosewood uppercase">
              Emotion-Based Food Recommendation
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              ให้อารมณ์ของคุณ
              <br />
              เลือกเมนูที่ใช่ในวันนี้
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              ระบบจะวิเคราะห์อารมณ์จากใบหน้าของคุณผ่านกล้อง แล้วแนะนำเมนูอาหาร
              วัตถุดิบ ผลไม้ และเครื่องดื่มที่ช่วยดูแลสุขภาพจิตให้เหมาะกับความรู้สึกในตอนนั้น
              — เพราะอาหารที่ดี คือเพื่อนที่ดีของใจ
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/#how-to-use"
                className="inline-flex items-center border border-clay/50 text-gray-800 px-8 py-3 rounded-full hover:border-rosewood hover:text-rosewood transition-colors font-medium"
              >
                How to use
              </Link>
              <Link
                href="/analyze"
                className="inline-flex items-center bg-clay text-mocha px-8 py-3 rounded-full hover:bg-clay-dark transition-colors font-semibold"
              >
                Start analysis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section id="how-to-use" className="scroll-mt-20 bg-blush">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            How to use — ใช้งานง่ายใน 3 ขั้นตอน
          </h2>
          <p className="mt-3 text-gray-600">
            ไม่ต้องสมัครสมาชิก ไม่เก็บภาพใบหน้าของคุณ
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="bg-snow rounded-2xl p-8 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blush text-mocha rounded-full flex items-center justify-center">
                    <step.icon size={26} stroke={1.8} />
                  </div>
                  <span className="text-5xl font-bold text-clay">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-5">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                About FaceFood
              </h2>
              <p className="text-gray-600 leading-relaxed">
                FaceFood เชื่อว่าอารมณ์กับอาหารเป็นเรื่องเดียวกัน
                วันที่เหนื่อย เศร้า หรือหงุดหงิด อาหารที่เหมาะสมช่วยให้ใจกลับมาสมดุลได้
                เราจึงนำการวิเคราะห์อารมณ์จากใบหน้ามาจับคู่กับเมนูอาหาร วัตถุดิบ
                เครื่องดื่ม และผลไม้ที่เหมาะกับความรู้สึกของคุณใน 4 อารมณ์หลัก
                — มีความสุข เศร้า โกรธ และปกติ
              </p>
            </div>

            <div className="bg-blush rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-snow text-mocha rounded-full flex items-center justify-center">
                  <IconShieldCheck size={26} stroke={1.8} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ความเป็นส่วนตัวของคุณ
                </h3>
              </div>
              <ul className="mt-5 space-y-3 text-gray-600">
                <li>• ภาพใบหน้าใช้ประมวลผลชั่วคราวเท่านั้น ไม่มีการอัปโหลดหรือบันทึก</li>
                <li>• ไม่ต้องสมัครสมาชิกหรือกรอกข้อมูลส่วนตัวใด ๆ</li>
                <li>• ใช้งานได้ทั้งคอมพิวเตอร์และมือถือผ่านเบราว์เซอร์</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
