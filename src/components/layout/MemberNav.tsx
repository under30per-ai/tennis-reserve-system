'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const mainNavItems = [
  { href: '/dashboard', label: 'ホーム', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/reserve', label: '予約', icon: 'M12 4v16m8-8H4' },
  { href: '/my-reservations', label: 'マイ予約', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/events', label: 'イベント', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
];

const moreNavItems = [
  { href: '/chat', label: 'チャット', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/transfer', label: '振替', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { href: '/my-tickets', label: 'マイチケット', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { href: '/family', label: '家族情報', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/profile', label: 'プロフィール', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

const allNavItems = [...mainNavItems, ...moreNavItems];

export default function MemberNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const scrollToTop = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  };

  const isMoreActive = moreNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setMoreOpen(false)} />
      )}

      {/* More menu popup */}
      {moreOpen && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg rounded-t-xl px-4 py-3 sm:absolute sm:bottom-auto sm:left-auto sm:right-auto sm:w-48 sm:rounded-lg sm:border sm:shadow-lg">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-1 sm:gap-1">
            {moreNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { setMoreOpen(false); scrollToTop(); }}
                  className={`flex flex-col sm:flex-row items-center sm:gap-3 gap-1 py-2 px-2 rounded-lg transition-colors ${
                    isActive ? 'text-court-green bg-court-green/5' : 'text-gray-500 hover:text-net-gray hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  <span className="text-[10px] sm:text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:sticky sm:top-14 sm:border-t-0 sm:border-r sm:w-20 sm:h-[calc(100vh-3.5rem)] sm:overflow-y-auto sm:shrink-0">
        <div className="flex sm:flex-col items-center justify-around sm:justify-start sm:pt-4 sm:gap-2">
          {/* Main nav items */}
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={scrollToTop}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 sm:px-2 sm:w-full transition-colors relative ${
                  isActive ? 'text-court-green' : 'text-gray-400 hover:text-net-gray'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-court-green rounded-full sm:left-0 sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0 sm:w-0.5 sm:h-6" />
                )}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 sm:px-2 sm:w-full transition-colors relative ${
              isMoreActive || moreOpen ? 'text-court-green' : 'text-gray-400 hover:text-net-gray'
            }`}
          >
            {isMoreActive && !moreOpen && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-court-green rounded-full sm:left-0 sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0 sm:w-0.5 sm:h-6" />
            )}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span className="text-[10px] font-medium">その他</span>
          </button>

          {/* Desktop sidebar: show all items */}
          <div className="hidden sm:flex sm:flex-col sm:w-full sm:mt-2 sm:pt-2 sm:border-t sm:border-gray-100">
            {moreNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={scrollToTop}
                  className={`flex flex-col items-center gap-0.5 py-2 px-2 w-full transition-colors relative ${
                    isActive ? 'text-court-green' : 'text-gray-400 hover:text-net-gray'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-court-green rounded-full" />
                  )}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
