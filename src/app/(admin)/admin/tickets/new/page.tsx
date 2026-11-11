'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useTickets from '@/hooks/useTickets';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function NewTicketTypePage() {
  const { addTicketType } = useTickets();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', description: '', lessonCount: '', validDays: '', price: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTicketType({
        name: form.name,
        description: form.description,
        lessonCount: parseInt(form.lessonCount),
        validDays: parseInt(form.validDays),
        price: parseInt(form.price),
      });
      toast.success('チケット種別を追加しました');
      router.push('/admin/tickets');
    } catch {
      toast.error('チケット種別の追加に失敗しました');
    }
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>新規チケット種別</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input label="名前" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="説明" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="レッスン回数" type="number" value={form.lessonCount} onChange={e => setForm(f => ({ ...f, lessonCount: e.target.value }))} required />
            <Input label="有効日数" type="number" value={form.validDays} onChange={e => setForm(f => ({ ...f, validDays: e.target.value }))} required />
            <Input label="価格 (円)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit">追加</Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
