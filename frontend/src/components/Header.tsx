'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { IconMenu2, IconMoodSmileFilled, IconX } from '@tabler/icons-react';

const navItems = [
  { href: '/', label: 'Home', section: 'home' },
  { href: '/#how-to-use', label: 'How to use', section: 'how-to-use' },
  { href: '/#about', label: 'About', section: 'about' },
];

/** ผูก aria-controls ของปุ่ม hamburger เข้ากับ id ของ dropdown */
const MOBILE_NAV_ID = 'mobile-nav';

export default function Header() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState('home');
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // เก็บ "เมนูถูกเปิดค้างไว้ที่หน้าไหน" แทนการเก็บ boolean เปิด/ปิด
  // พอ pathname เปลี่ยน ค่าที่เก็บไว้จะไม่ตรงกับหน้าปัจจุบันอีก menuOpen จึงกลายเป็น false
  // เองโดยไม่ต้องมี useEffect มารีเซ็ต และไม่ต้องเรียก setState ระหว่าง render
  // (สำคัญตอนกดปุ่ม Analyze บนแถบ header ขณะเมนูเปิดอยู่ — เมนูต้องไม่ค้างข้ามหน้า)
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const menuOpen = openPathname === pathname;

  const closeMenu = () => setOpenPathname(null);

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
    <header className="sticky top-0 z-50 bg-snow/90 backdrop-blur border-b border-clay/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-2 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-clay rounded-full flex items-center justify-center shrink-0">
              <IconMoodSmileFilled size={20} className="text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">FaceFood</span>
          </Link>

          {/* Navigation */}
          <nav aria-label="Main" className="flex items-center gap-2 sm:gap-3">
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
            <Link
              href="/analyze"
              className="bg-clay text-mocha text-sm font-semibold px-4 sm:px-6 py-3 sm:py-2.5 rounded-full hover:bg-clay-dark transition-colors sm:ml-3"
            >
              {/* ข้อความสั้นบนจอแคบ กันแถบ header ล้นที่ความกว้าง 320px */}
              <span className="sm:hidden">Analyze</span>
              <span className="hidden sm:inline">Start analysis</span>
            </Link>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpenPathname(menuOpen ? null : pathname)}
              aria-expanded={menuOpen}
              aria-controls={MOBILE_NAV_ID}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="sm:hidden -mr-2 w-11 h-11 flex items-center justify-center rounded-full text-gray-700 hover:bg-blush/60 active:bg-blush transition-colors"
            >
              {menuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile dropdown — วางแบบ absolute ให้ทับเนื้อหาด้านล่างแทนที่จะดันหน้าลง
          (header เป็น sticky ซึ่งเป็น positioned element อยู่แล้ว จึงเป็นกรอบอ้างอิงให้เอง) */}
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
  );
}
