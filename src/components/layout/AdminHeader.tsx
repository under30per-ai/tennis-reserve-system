'use client';

import { usePathname } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { getInitials } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/admin': 'ダッシュボード',
  '/admin/members': '会員管理',
  '/admin/members/new': '会員追加',
  '/admin/coaches': 'コーチ管理',
  '/admin/coaches/new': 'コーチ追加',
  '/admin/lessons': 'レッスン管理',
  '/admin/lessons/new': 'レッスン追加',
  '/admin/schedule': 'スケジュール',
  '/admin/reservations': '予約管理',
};

export default function AdminHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  const title = pageTitles[pathname] ||
    (pathname.includes('/members/') ? '会員詳細' :
    pathname.includes('/coaches/') ? 'コーチ詳細' :
    pathname.includes('/lessons/') ? 'レッスン詳細' : '管理画面');

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 hidden lg:flex items-center justify-between">
      <h1 className="text-xl font-bold text-net-dark">{title}</h1>
      {user && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-net-dark text-white flex items-center justify-center text-xs font-bold">
            {getInitials(user.name)}
          </div>
          <span className="text-sm text-net-gray">{user.name}</span>
        </div>
      )}
    </header>
  );
}
