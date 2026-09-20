import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';

// คง subset 'thai' ไว้แม้ UI จะเป็นอังกฤษทั้งหมดแล้ว เพราะชื่อเมนู/เหตุผลแนะนำ
// ที่ Backend ส่งมาจาก Firebase ยังเป็นภาษาไทย ถ้าตัด subset นี้ทิ้งการ์ดเมนูจะ fallback
// ไปใช้ฟอนต์ระบบและหน้าตาเพี้ยน
const prompt = Prompt({
  variable: '--font-prompt',
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FaceFood - Emotion-Based Food Recommendation',
  description:
    'Facial expression analysis that suggests food, drinks, ingredients, and fruits.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-scroll-behavior บอก Next 16 ให้จัดการ scroll ตอนเปลี่ยนหน้าเอง
    // ไม่ใส่จะมี warning ขึ้น console ทุกหน้า (พฤติกรรมเปลี่ยนจาก Next 15)
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${prompt.variable} antialiased bg-snow text-gray-900`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
