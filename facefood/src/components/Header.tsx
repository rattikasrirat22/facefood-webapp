'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconMoodSmileFilled } from '@tabler/icons-react';

const navItems = [
  { href: '/', label: 'Home', section: 'home' },
  { href: '/#how-to-use', label: 'How to use', section: 'how-to-use' },
  { href: '/#about', label: 'About', section: 'about' },
];

export default function Header() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState('home');

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

  return (
    <header className="sticky top-0 z-50 bg-snow/90 backdrop-blur border-b border-clay/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-clay rounded-full flex items-center justify-center">
              <IconMoodSmileFilled size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FaceFood</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2 sm:gap-3">
            {navItems.map((item) => {
              const isActive = pathname === '/' && activeSection === item.section;
              return (
                <Link
                  key={item.section}
                  href={item.href}
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
              className="bg-clay text-mocha text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-clay-dark transition-colors ml-1 sm:ml-3"
            >
              Start analysis
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
