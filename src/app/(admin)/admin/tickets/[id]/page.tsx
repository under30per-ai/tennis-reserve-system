'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useTickets from '@/hooks/useTickets';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditTicketTypePage() {
  const { getType, updateTicketType } = useTickets();
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [form, setForm] = useState({ name: '', description: '', lessonCount: '', validDays: '', price: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getType(id).then((t) => {
      if (t) {
        setForm({
          name: t.name,
          description: t.description,
          lessonCount: String(t.lessonCount),
          validDays: String(t.validDays),
          price: String(t.price),
        });
      }
      setLoading(false);
    });
  }, [id, getType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTicketType(id, {
        name: form.name,
        description: form.description,
        lessonCount: parseInt(form.lessonCount),
        validDays: parseInt(form.validDays),
        price: parseInt(form.price),
      });
      toast.success('チケット種別を更新しました');
      router.push('/admin/tickets');
    } catch {
      toast.error('更新に失敗しました');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>チケット種別編集</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input label="名前" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="説明" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="レッスン回数" type="number" value={form.lessonCount} onChange={e => setForm(f => ({ ...f, lessonCount: e.target.value }))} required />
            <Input label="有効日数" type="number" value={form.validDays} onChange={e => setForm(f => ({ ...f, validDays: e.target.value }))} required />
            <Input label="価格 (円)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit">更新</Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
