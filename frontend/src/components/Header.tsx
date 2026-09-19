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
 * ชื่อหน้าที่แสดงบน toolbar ของมือถือ (ต่ำกว่า sm)
 *
 * ตาราง route → ชื่อ ไม่ใช่การเพิ่มหรือเปลี่ยน routing แค่ตั้งชื่อให้ route ที่มีอยู่แล้ว
 * path ที่ไม่อยู่ในตารางแปลว่าไม่ใช่ route จริง จึงเป็นหน้า 404
 */
const MOBILE_PAGE_TITLES: Record<string, string> = {
  '/analyze': 'Analyze',
  '/results': 'Results',
  '/error-screen': 'Error',
};

const NOT_FOUND_TITLE = 'Page not found';

/**
 * ปลายทางของปุ่มย้อนกลับบน toolbar มือถือ — เป็นทางกลับหน้าแรกทางเดียวของหน้าเหล่านั้นบนมือถือ
 * ใช้ <Link href="/"> เสมอ ไม่ใช้ router.back() เพราะ deep link/refresh จะไม่มี history ให้ย้อน
 * และ history อาจพาผู้ใช้ออกนอกระบบหรือย้อนไปหน้าที่ไม่คาดคิด
 */
const BACK_HREF = '/';

function Logo({ className }: { className: string }) {
  return (
    // min-h-11 ขยายพื้นที่กดของโลโก้ให้ถึง 44px (เดิม 36px) โดยไม่เปลี่ยนหน้าตา
    // เพราะแถว header สูง 64px และจัดกึ่งกลางแนวตั้งอยู่แล้ว
    <Link href="/" className={`${className} min-h-11 items-center gap-2 shrink-0`}>
      <div className="w-9 h-9 bg-clay rounded-full flex items-center justify-center shrink-0">
        <IconMoodSmileFilled size={20} className="text-white" aria-hidden="true" />
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

  // ล้างค่าที่ค้างเมื่อผู้ใช้ย้อน/ไปข้างหน้าด้วย history ของเบราว์เซอร์
  //
  // ถ้าเปิดเมนูที่ "/" แล้วออกจากหน้า openPathname ยังเป็น "/" อยู่ (menuOpen เป็น false
  // เพราะ pathname ไม่ตรง) พอกด Back กลับมา "/" ค่าจะตรงกันอีกครั้งและเมนูเด้งเปิดเอง
  // จึงต้องฟัง popstate ตราบใดที่ยังมีค่าค้าง — ผูกกับ openPathname ไม่ใช่ menuOpen
  // เพราะตอนอยู่หน้าอื่น menuOpen เป็น false แล้วแต่ค่าค้างยังอยู่
  // setOpenPathname เรียกจาก event handler ไม่ใช่ตัว effect และเป็นฟังก์ชันคงที่ จึงไม่มี stale closure
  useEffect(() => {
    if (openPathname === null) return;

    const onPopState = () => setOpenPathname(null);

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [openPathname]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-snow/90 backdrop-blur border-b border-clay/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* breakpoint ของทั้ง header คือ sm (640px): ต่ำกว่านั้นเป็นมือถือ ตั้งแต่ sm เป็น desktop/tablet
              แถว toolbar ของหน้าอื่นบนมือถือสูง 56px ส่วนหน้าแรกและ desktop คง 64px เดิม
              (overlay ของเมนูยึด top-16 ซึ่งมีเฉพาะหน้าแรก จึงไม่ต้องแก้) */}
          <div
            className={`flex justify-between items-center gap-2 ${mobileTitle ? 'h-14 sm:h-16' : 'h-16'}`}
          >
            {/* ฝั่งซ้าย: หน้าแรกเป็นโลโก้เสมอ ส่วนหน้าอื่นบนมือถือเป็น toolbar ย้อนกลับ + ชื่อหน้า
                ตั้งแต่ sm ขึ้นไปกลับไปเป็นโลโก้เดิมทุกหน้า มีชิ้นเดียวที่มองเห็นได้เสมอ */}
            {mobileTitle ? (
              <>
                <div className="flex items-center gap-3 min-w-0 sm:hidden">
                  <Link
                    href={BACK_HREF}
                    aria-label="Back to home"
                    className="w-11 h-11 flex items-center justify-center rounded-xl border border-clay/50 text-gray-700 hover:bg-blush/60 active:bg-blush transition-colors shrink-0"
                  >
                    <IconChevronLeft size={20} stroke={2} aria-hidden="true" />
                  </Link>
                  <span className="text-[17px] font-semibold text-gray-900 truncate">
                    {mobileTitle}
                  </span>
                </div>
                <Logo className="hidden sm:flex" />
              </>
            ) : (
              <Logo className="flex" />
            )}

            {/* ฝั่งขวา: ตั้งแต่ sm ขึ้นไปคือ navigation เดิม + CTA เฉพาะหน้าแรก
                ต่ำกว่า sm เหลือเฉพาะปุ่ม hamburger และเฉพาะหน้าแรกเท่านั้น */}
            <nav aria-label="Main" className="flex items-center gap-2 md:gap-3">
              {navItems.map((item) => {
                const isActive = pathname === '/' && activeSection === item.section;
                return (
                  <Link
                    key={item.section}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`hidden sm:block text-sm font-medium px-5 py-2 rounded-full border transition-colors ${
                      isActive
                        ? 'bg-blush border-clay text-rosewood'
                        : 'bg-transparent border-clay/40 text-gray-700 hover:bg-blush/50 active:bg-blush'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {/* CTA แสดงเฉพาะหน้าแรก: /analyze คือปลายทางเดียวกับปุ่ม ส่วน /results มี Analyze again
                  และ /error-screen มี Try again เป็น action ของ flow อยู่แล้ว */}
              {isHome && (
                <Link
                  href="/analyze"
                  className="hidden sm:block bg-clay text-mocha text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-clay-dark transition-colors sm:ml-3"
                >
                  Start analysis
                </Link>
              )}

              {isHome && (
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={() => setOpenPathname(menuOpen ? null : pathname)}
                  aria-expanded={menuOpen}
                  aria-controls={MOBILE_NAV_ID}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  className="sm:hidden -mr-2 w-11 h-11 flex items-center justify-center rounded-full text-gray-700 hover:bg-blush/60 active:bg-blush transition-colors"
                >
                  {menuOpen ? (
                    <IconX size={22} aria-hidden="true" />
                  ) : (
                    <IconMenu2 size={22} aria-hidden="true" />
                  )}
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
            className="sm:hidden absolute inset-x-0 top-full bg-snow border-b border-clay/25 shadow-md"
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
          className="sm:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-mocha/40"
        />
      )}
    </>
  );
}
