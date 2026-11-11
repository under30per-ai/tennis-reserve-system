'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useFamilies from '@/hooks/useFamilies';
import useMembers from '@/hooks/useMembers';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { FAMILY_RELATIONSHIP_LABELS } from '@/lib/constants';
import type { FamilyGroupWithMembers, FamilyRelationship } from '@/types';

export default function EditFamilyGroupPage() {
  const { getGroup, addFamilyMember, removeFamilyMember } = useFamilies();
  const { members } = useMembers({ eagerLoad: true });
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [group, setGroup] = useState<FamilyGroupWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [addMemberId, setAddMemberId] = useState('');
  const [addRelationship, setAddRelationship] = useState<FamilyRelationship>('spouse');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const refreshGroup = async () => {
    const g = await getGroup(id);
    setGroup(g);
    setLoading(false);
  };

  useEffect(() => { refreshGroup(); }, [id]);

  const handleAddMember = async () => {
    if (!addMemberId) {
      toast.error('会員を選択してください');
      return;
    }
    try {
      await addFamilyMember(id, addMemberId, addRelationship);
      toast.success('メンバーを追加しました');
      setAddMemberId('');
      await refreshGroup();
    } catch {
      toast.error('追加に失敗しました');
    }
  };

  const handleRemove = async () => {
    if (removeTarget) {
      try {
        await removeFamilyMember(removeTarget);
        toast.success('メンバーを削除しました');
        await refreshGroup();
      } catch {
        toast.error('削除に失敗しました');
      }
      setRemoveTarget(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!group) return <p className="text-gray-500">家族グループが見つかりません</p>;

  const existingMemberIds = new Set(group.members.map((m) => m.memberId));
  const availableMembers = members.filter((m) => m.isActive && !existingMemberIds.has(m.id));

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>← 戻る</Button>

      <Card>
        <CardTitle>{group.name}</CardTitle>
        <div className="mt-4 space-y-3">
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="font-medium text-sm text-net-gray">{m.member.name}</p>
                <p className="text-xs text-gray-500">{FAMILY_RELATIONSHIP_LABELS[m.relationship]} / {m.member.email}</p>
              </div>
              {m.relationship !== 'primary' && (
                <Button variant="danger" size="sm" onClick={() => setRemoveTarget(m.id)}>削除</Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>メンバー追加</CardTitle>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-net-gray mb-1">会員</label>
            <select value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">会員を選択</option>
              {availableMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-net-gray mb-1">続柄</label>
            <select value={addRelationship} onChange={(e) => setAddRelationship(e.target.value as FamilyRelationship)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {(Object.entries(FAMILY_RELATIONSHIP_LABELS) as [FamilyRelationship, string][])
                .filter(([k]) => k !== 'primary')
                .map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
            </select>
          </div>
          <Button onClick={handleAddMember}>追加</Button>
        </div>
      </Card>

      <ConfirmDialog isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={handleRemove} title="メンバー削除" message="このメンバーを家族グループから削除してもよろしいですか？" variant="danger" confirmLabel="削除" />
    </div>
  );
}
