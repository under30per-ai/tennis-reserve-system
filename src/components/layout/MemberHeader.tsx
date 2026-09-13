'use client';

import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';
import { getInitials } from '@/lib/utils';

export default function MemberHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-court-grass/20 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={() => router.push('/dashboard')} role="button" tabIndex={0}>
          <div className="bg-court-green rounded-full p-1.5">
            <TennisBallIcon size={20} />
          </div>
          <span className="font-bold text-net-dark text-sm">テニススクール</span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-court-grass text-white flex items-center justify-center text-xs font-bold">
                {getInitials(user.name)}
              </div>
              <span className="text-sm text-net-gray hidden sm:inline">{user.name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
