'use client';

import { useRouter } from 'next/navigation';
import useTickets from '@/hooks/useTickets';
import useToast from '@/hooks/useToast';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function TicketTypesPage() {
  const { ticketTypes, loading, deleteTicketType } = useTickets({ eagerLoad: true });
  const toast = useToast();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteTicketType(deleteTarget);
        toast.success('チケット種別を無効化しました');
      } catch {
        toast.error('操作に失敗しました');
      }
      setDeleteTarget(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin/tickets/new')}>チケット種別追加</Button>
          <Button variant="secondary" onClick={() => router.push('/admin/tickets/members')}>会員チケット管理</Button>
        </div>
      </div>

      {ticketTypes.length === 0 ? (
        <EmptyState title="チケット種別が登録されていません" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ticketTypes.map((t) => (
            <Card key={t.id} className="cursor-pointer" onClick={() => router.push(`/admin/tickets/${t.id}`)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-net-gray">{t.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{t.description || '説明なし'}</p>
                </div>
                {!t.isActive && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">無効</span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">回数</p>
                  <p className="font-bold text-sm">{t.lessonCount}回</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">有効日数</p>
                  <p className="font-bold text-sm">{t.validDays}日</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">価格</p>
                  <p className="font-bold text-sm">&yen;{t.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(t.id); }}>無効化</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="チケット種別無効化" message="このチケット種別を無効化してもよろしいですか？" variant="danger" confirmLabel="無効化" />
    </div>
  );
}
