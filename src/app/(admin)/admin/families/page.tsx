'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useFamilies from '@/hooks/useFamilies';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { FAMILY_RELATIONSHIP_LABELS } from '@/lib/constants';

export default function FamilyGroupsPage() {
  const { groups, loading, deleteFamilyGroup } = useFamilies({ eagerLoad: true });
  const toast = useToast();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteFamilyGroup(deleteTarget);
        toast.success('家族グループを削除しました');
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
        <Button onClick={() => router.push('/admin/families/new')}>家族グループ作成</Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="家族グループが登録されていません" />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id} className="cursor-pointer" onClick={() => router.push(`/admin/families/${group.id}`)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-net-gray">{group.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{group.members.length}名</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.members.map((m) => (
                  <span key={m.id} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                    {m.member.name} ({FAMILY_RELATIONSHIP_LABELS[m.relationship]})
                  </span>
                ))}
              </div>
              <div className="flex justify-end mt-3">
                <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(group.id); }}>削除</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="家族グループ削除" message="この家族グループを削除してもよろしいですか？" variant="danger" confirmLabel="削除" />
    </div>
  );
}
