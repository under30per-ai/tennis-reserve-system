'use client';

import Button from '@/components/ui/Button';

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <h2 className="text-xl font-bold text-net-dark mb-2">エラーが発生しました</h2>
      <p className="text-sm text-gray-500 mb-4">{error.message || '予期しないエラーが発生しました'}</p>
      <Button onClick={reset}>再試行</Button>
    </div>
  );
}
