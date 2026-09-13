'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';
import CourtBackground from '@/components/tennis/CourtBackground';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <CourtBackground opacity={0.04} />
      <div className="text-center relative z-10">
        <div className="mb-6 flex justify-center">
          <TennisBallIcon size={80} className="opacity-50" />
        </div>
        <h1 className="text-6xl font-bold text-court-green mb-2">404</h1>
        <h2 className="text-xl font-bold text-net-dark mb-2">ページが見つかりません</h2>
        <p className="text-sm text-gray-500 mb-6">
          お探しのページはコートの外に出てしまったようです
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push('/')}>ホームに戻る</Button>
          <Button variant="outline" onClick={() => router.back()}>前のページに戻る</Button>
        </div>
      </div>
    </div>
  );
}
