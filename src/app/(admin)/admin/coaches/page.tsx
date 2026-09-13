'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useCoaches from '@/hooks/useCoaches';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LevelBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getInitials } from '@/lib/utils';

export default function CoachesPage() {
  const { coaches, deleteCoach } = useCoaches();
  const toast = useToast();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteTarget) {
      deleteCoach(deleteTarget);
      toast.success('コーチを削除しました');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => router.push('/admin/coaches/new')}>コーチ追加</Button>
      </div>

      {coaches.length === 0 ? (
        <EmptyState title="コーチが登録されていません" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map(coach => (
            <Card key={coach.id} className="cursor-pointer" onClick={() => router.push(`/admin/coaches/${coach.id}`)}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style={{ backgroundColor: coach.avatarColor }}>
                  {getInitials(coach.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-net-gray">{coach.name}</p>
                  <p className="text-xs text-gray-400 mb-2">{coach.nameKana}</p>
                  <div className="flex flex-wrap gap-1">
                    {coach.specialties.map(s => <LevelBadge key={s} level={s} />)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3 line-clamp-2">{coach.bio}</p>
              <div className="flex justify-end mt-3">
                <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(coach.id); }}>削除</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="コーチ削除" message="このコーチを削除してもよろしいですか？" variant="danger" confirmLabel="削除" />
    </div>
  );
}
