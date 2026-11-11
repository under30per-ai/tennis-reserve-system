'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useFamilies from '@/hooks/useFamilies';
import useMembers from '@/hooks/useMembers';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function NewFamilyGroupPage() {
  const { createFamilyGroup } = useFamilies();
  const { members, loading } = useMembers({ eagerLoad: true });
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [primaryMemberId, setPrimaryMemberId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryMemberId) {
      toast.error('代表会員を選択してください');
      return;
    }
    try {
      await createFamilyGroup(name, primaryMemberId);
      toast.success('家族グループを作成しました');
      router.push('/admin/families');
    } catch {
      toast.error('作成に失敗しました');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>新規家族グループ作成</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input label="グループ名" value={name} onChange={e => setName(e.target.value)} required placeholder="例: 田中ファミリー" />
          <div>
            <label className="block text-sm font-medium text-net-gray mb-1">代表会員</label>
            <select value={primaryMemberId} onChange={(e) => setPrimaryMemberId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
              <option value="">会員を選択</option>
              {members.filter((m) => m.isActive).map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit">作成</Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
