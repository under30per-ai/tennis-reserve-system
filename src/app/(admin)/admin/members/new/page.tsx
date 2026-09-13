'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useMembers from '@/hooks/useMembers';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { LEVEL_LABELS, MEMBERSHIP_LABELS } from '@/lib/constants';
import { LessonLevel, MembershipType } from '@/types';

export default function NewMemberPage() {
  const { addMember } = useMembers();
  const toast = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '', nameKana: '', email: '', phone: '',
    level: 'beginner' as LessonLevel,
    membershipType: 'regular' as MembershipType,
    password: 'password',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMember({
      ...form,
      joinDate: new Date().toISOString().split('T')[0],
      isActive: true,
      notes: '',
      remainingTransfers: 3,
    });
    toast.success('会員を追加しました');
    router.push('/admin/members');
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>新規会員追加</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="氏名" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input label="フリガナ" value={form.nameKana} onChange={e => setForm(f => ({ ...f, nameKana: e.target.value }))} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="メールアドレス" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <Input label="電話番号" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="レベル" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as LessonLevel }))} options={Object.entries(LEVEL_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Select label="会員種別" value={form.membershipType} onChange={e => setForm(f => ({ ...f, membershipType: e.target.value as MembershipType }))} options={Object.entries(MEMBERSHIP_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </div>
          <Input label="パスワード" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <div className="flex gap-3 pt-2">
            <Button type="submit">追加</Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
