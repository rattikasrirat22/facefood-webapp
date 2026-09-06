'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  IconChevronLeft,
  IconMenu2,
  IconMoodSmileFilled,
  IconX,
} from '@tabler/icons-react';

const navItems = [
  { href: '/', label: 'Home', section: 'home' },
  { href: '/#how-to-use', label: 'How to use', section: 'how-to-use' },
  { href: '/#about', label: 'About', section: 'about' },
];

/** ผูก aria-controls ของปุ่ม hamburger เข้ากับ id ของ dropdown */
const MOBILE_NAV_ID = 'mobile-nav';

/**
 * ชื่อหน้าที่แสดงบน toolbar ของมือถือ (ต่ำกว่า md)
 *
 * ตาราง route → ชื่อ ไม่ใช่การเพิ่มหรือเปลี่ยน routing แค่ตั้งชื่อให้ route ที่มีอยู่แล้ว
 * /error-screen ใช้ชื่อ "Analyze" เพราะผู้ใช้มาถึงหน้านี้จากขั้นตอนวิเคราะห์เสมอ
 * path ที่ไม่อยู่ในตารางแปลว่าไม่ใช่ route จริง จึงเป็นหน้า 404
 */
const MOBILE_PAGE_TITLES: Record<string, string> = {
  '/analyze': 'Analyze',
  '/results': 'Results',
  '/error-screen': 'Analyze',
};

const NOT_FOUND_TITLE = 'Page not found';

/**
 * ปลายทางของปุ่มย้อนกลับ ตรงกับลิงก์ "Back to home" ที่ทุกหน้ามีอยู่เดิม
 * ไม่ใช้ router.back() เพราะ history อาจพาผู้ใช้ออกนอกระบบหรือย้อนไปหน้าที่ไม่คาดคิด
 */
const BACK_HREF = '/';

function Logo({ className }: { className: string }) {
  return (
    <Link href="/" className={`${className} items-center gap-2 shrink-0`}>
      <div className="w-9 h-9 bg-clay rounded-full flex items-center justify-center shrink-0">
        <IconMoodSmileFilled size={20} className="text-white" />
      </div>
      <span className="text-xl font-bold text-gray-900">FaceFood</span>
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState('home');
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // เก็บ "เมนูถูกเปิดค้างไว้ที่หน้าไหน" แทนการเก็บ boolean เปิด/ปิด
  // พอ pathname เปลี่ยน ค่าที่เก็บไว้จะไม่ตรงกับหน้าปัจจุบันอีก menuOpen จึงกลายเป็น false
  // เองโดยไม่ต้องมี useEffect มารีเซ็ต และไม่ต้องเรียก setState ระหว่าง render
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const menuOpen = openPathname === pathname;

  const closeMenu = () => setOpenPathname(null);

  const isHome = pathname === '/';
  /** null เมื่ออยู่หน้าแรก (มือถือแสดงโลโก้ + hamburger) นอกนั้นคือชื่อหน้าบน toolbar */
  const mobileTitle = isHome ? null : (MOBILE_PAGE_TITLES[pathname] ?? NOT_FOUND_TITLE);

  useEffect(() => {
    if (pathname !== '/') return;

    const onScroll = () => {
      // ระยะอ้างอิงใต้ header: section ไหนเลื่อนพ้นเส้นนี้ถือว่ากำลังดูอยู่
      const offset = 96;
      const about = document.getElementById('about');
      const howTo = document.getElementById('how-to-use');
      if (about && about.getBoundingClientRect().top <= offset) {
        setActiveSection('about');
      } else if (howTo && howTo.getBoundingClientRect().top <= offset) {
        setActiveSection('how-to-use');
      } else {
        setActiveSection('home');
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  // ปิดด้วย Escape แล้วคืนโฟกัสกลับไปที่ปุ่มเปิดเมนู เพื่อไม่ให้ผู้ใช้คีย์บอร์ดหลุดตำแหน่ง
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenPathname(null);
      menuButtonRef.current?.focus();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-snow/90 backdrop-blur border-b border-clay/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-2 h-16">
            {/* ฝั่งซ้าย: หน้าแรกเป็นโลโก้เสมอ ส่วนหน้าอื่นบนมือถือเป็น toolbar ย้อนกลับ + ชื่อหน้า
                ตั้งแต่ md ขึ้นไปกลับไปเป็นโลโก้เดิมทุกหน้า มีชิ้นเดียวที่มองเห็นได้เสมอ */}
            {mobileTitle ? (
              <>
                <div className="flex items-center gap-1 min-w-0 md:hidden">
                  <Link
                    href={BACK_HREF}
                    aria-label="Back to home"
                    className="-ml-2 w-11 h-11 flex items-center justify-center rounded-full text-gray-700 hover:bg-blush/60 active:bg-blush transition-colors shrink-0"
                  >
                    <IconChevronLeft size={22} />
                  </Link>
                  <span className="text-lg font-bold text-gray-900 truncate">
                    {mobileTitle}
                  </span>
                </div>
                <Logo className="hidden md:flex" />
              </>
            ) : (
              <Logo className="flex" />
            )}

            {/* ฝั่งขวา: ตั้งแต่ md ขึ้นไปคือ navigation + CTA เดิมทั้งชุด
                ต่ำกว่า md เหลือเฉพาะปุ่ม hamburger และเฉพาะหน้าแรกเท่านั้น */}
            <nav aria-label="Main" className="flex items-center gap-2 md:gap-3">
              {navItems.map((item) => {
                const isActive = pathname === '/' && activeSection === item.section;
                return (
                  <Link
                    key={item.section}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`hidden md:block text-sm font-medium px-5 py-2 rounded-full border transition-colors ${
                      isActive
                        ? 'bg-blush border-clay text-rosewood'
                        : 'bg-transparent border-clay/40 text-gray-700 hover:bg-blush/50 active:bg-blush'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/analyze"
                className="hidden md:block bg-clay text-mocha text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-clay-dark transition-colors md:ml-3"
              >
                Start analysis
              </Link>

              {isHome && (
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={() => setOpenPathname(menuOpen ? null : pathname)}
                  aria-expanded={menuOpen}
                  aria-controls={MOBILE_NAV_ID}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  className="md:hidden -mr-2 w-11 h-11 flex items-center justify-center rounded-full text-gray-700 hover:bg-blush/60 active:bg-blush transition-colors"
                >
                  {menuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Mobile dropdown — วางแบบ absolute ให้ทับเนื้อหาด้านล่างแทนที่จะดันหน้าลง
            (header เป็น sticky ซึ่งเป็น positioned element อยู่แล้ว จึงเป็นกรอบอ้างอิงให้เอง)
            อยู่ใน stacking context ของ header (z-50) จึงลอยเหนือ overlay (z-40) เสมอ */}
        {menuOpen && (
          <nav
            id={MOBILE_NAV_ID}
            aria-label="Mobile"
            className="md:hidden absolute inset-x-0 top-full bg-snow border-b border-clay/25 shadow-md"
          >
            <ul className="max-w-7xl mx-auto px-4 py-2">
              {navItems.map((item) => {
                const isActive = pathname === '/' && activeSection === item.section;
                return (
                  <li key={item.section}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      aria-current={isActive ? 'page' : undefined}
                      className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-blush text-rosewood'
                          : 'text-gray-700 hover:bg-blush/50 active:bg-blush'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>

      {/* Overlay หรี่เนื้อหาด้านหลังขณะเมนูเปิด และรับการแตะเพื่อปิดเมนู

          วางนอก <header> เพราะ backdrop-blur ของ header สร้าง containing block
          ทำให้ position: fixed ข้างในจะไปยึดกับกล่อง header แทนที่จะยึดกับ viewport

          เป็น div ไม่ใช่ button โดยตั้งใจ: ผู้ใช้คีย์บอร์ดมี Escape กับปุ่ม toggle อยู่แล้ว
          การใส่ปุ่มซ้ำจะเพิ่ม stop ใน tab order โดยไม่จำเป็น และ nav ชุดนี้ไม่ใช่ modal
          จึงไม่ทำ focus trap ตามที่กำหนด */}
      {menuOpen && (
        <div
          aria-hidden="true"
          onClick={closeMenu}
          className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-mocha/40"
        />
      )}
    </>
  );
}
