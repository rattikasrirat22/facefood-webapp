import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';

const prompt = Prompt({
  variable: '--font-prompt',
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FaceFood - Emotion-Based Food Recommendation',
  description: 'Analyze your mood and get personalized food recommendations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-scroll-behavior บอก Next 16 ให้จัดการ scroll ตอนเปลี่ยนหน้าเอง
    // ไม่ใส่จะมี warning ขึ้น console ทุกหน้า (พฤติกรรมเปลี่ยนจาก Next 15)
    <html lang="th" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${prompt.variable} antialiased bg-snow text-gray-900`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
