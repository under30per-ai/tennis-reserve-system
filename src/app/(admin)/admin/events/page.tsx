'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useEvents from '@/hooks/useEvents';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { LEVEL_LABELS } from '@/lib/constants';

export default function EventsPage() {
  const { events, loading, deleteEvent } = useEvents({ eagerLoad: true });
  const toast = useToast();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteEvent(deleteTarget);
        toast.success('イベントを削除しました');
      } catch {
        toast.error('削除に失敗しました');
      }
      setDeleteTarget(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => router.push('/admin/events/new')}>イベント作成</Button>
      </div>

      {events.length === 0 ? (
        <EmptyState title="イベントが登録されていません" />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id} className="cursor-pointer" onClick={() => router.push(`/admin/events/${event.id}`)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-net-gray">{event.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{event.eventDate} {event.startTime}〜{event.endTime}</p>
                </div>
                <div className="flex items-center gap-2">
                  {event.targetLevel && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">{LEVEL_LABELS[event.targetLevel]}</span>
                  )}
                  {event.isPublished ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">公開中</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">下書き</span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-sm text-gray-500">
                <span>定員: {event.maxParticipants}名</span>
                {event.fee > 0 && <span>参加費: ¥{event.fee.toLocaleString()}</span>}
              </div>
              <div className="flex justify-end mt-3">
                <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(event.id); }}>削除</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="イベント削除" message="このイベントを削除してもよろしいですか？関連する参加登録も削除されます。" variant="danger" confirmLabel="削除" />
    </div>
  );
}
