'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useEvents from '@/hooks/useEvents';
import useCourts from '@/hooks/useCourts';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LEVEL_LABELS, TIME_SLOTS } from '@/lib/constants';
import { LessonLevel } from '@/types';

export default function NewEventPage() {
  const { addEvent } = useEvents();
  const { courts } = useCourts();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', eventDate: '', startTime: '10:00', endTime: '12:00',
    courtId: '', maxParticipants: '10', targetLevel: '', fee: '0', isPublished: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEvent({
        title: form.title,
        description: form.description,
        eventDate: form.eventDate,
        startTime: form.startTime,
        endTime: form.endTime,
        courtId: form.courtId || undefined,
        maxParticipants: parseInt(form.maxParticipants),
        targetLevel: (form.targetLevel as LessonLevel) || undefined,
        fee: parseInt(form.fee),
        isPublished: form.isPublished,
      });
      toast.success('イベントを作成しました');
      router.push('/admin/events');
    } catch {
      toast.error('イベントの作成に失敗しました');
    }
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>新規イベント作成</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input label="タイトル" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-net-gray mb-1">説明</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24 resize-none" required />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="開催日" type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} required />
            <div>
              <label className="block text-sm font-medium text-net-gray mb-1">開始時間</label>
              <select value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-net-gray mb-1">終了時間</label>
              <select value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-net-gray mb-1">コート</label>
              <select value={form.courtId} onChange={e => setForm(f => ({ ...f, courtId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">指定なし</option>
                {courts.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-net-gray mb-1">対象レベル</label>
              <select value={form.targetLevel} onChange={e => setForm(f => ({ ...f, targetLevel: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">指定なし</option>
                {(Object.entries(LEVEL_LABELS) as [LessonLevel, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="定員" type="number" value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))} required />
            <Input label="参加費 (円)" type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="rounded border-gray-300" />
            <span className="text-sm text-net-gray">公開する</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit">作成</Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
