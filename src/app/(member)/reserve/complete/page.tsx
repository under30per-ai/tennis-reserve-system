'use client';

import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';
import CourtIllustration from '@/components/tennis/CourtIllustration';

export default function ReserveCompletePage() {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto">
      <Card className="text-center">
        <div className="py-6">
          <div className="w-20 h-20 rounded-full bg-court-light mx-auto flex items-center justify-center mb-4">
            <TennisBallIcon size={48} />
          </div>
          <h1 className="text-xl font-bold text-net-dark mb-2">予約が完了しました</h1>
          <p className="text-sm text-gray-500 mb-6">マイ予約から予約内容を確認できます</p>
          <CourtIllustration className="mb-6" />
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push('/my-reservations')}>マイ予約を確認</Button>
            <Button variant="outline" onClick={() => router.push('/reserve')}>続けて予約する</Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>ホームに戻る</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
