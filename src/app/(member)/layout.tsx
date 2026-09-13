'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import MemberHeader from '@/components/layout/MemberHeader';
import MemberNav from '@/components/layout/MemberNav';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [loading, isAuthenticated, user, router]);

  const topRef = useRef<HTMLDivElement>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      topRef.current?.scrollIntoView();
    }
  }, [pathname]);

  if (loading || !isAuthenticated || user?.role === 'admin') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div ref={topRef} />
      <MemberHeader />
      <div className="flex flex-1">
        <MemberNav />
        <main className="flex-1 min-w-0 pb-20 sm:pb-0">
          <div className="max-w-5xl mx-auto px-4 py-6 overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
