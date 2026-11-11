'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useEvents from '@/hooks/useEvents';
import useCourts from '@/hooks/useCourts';
import useMembers from '@/hooks/useMembers';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { LEVEL_LABELS, TIME_SLOTS, EVENT_REGISTRATION_STATUS_LABELS } from '@/lib/constants';
import { LessonLevel } from '@/types';
import { getEventWithDetails } from '@/app/actions/events';
import type { EventWithDetails } from '@/types';
import { formatDate } from '@/lib/utils';

export default function EditEventPage() {
  const { updateEvent } = useEvents();
  const { courts } = useCourts();
  const { members } = useMembers({ eagerLoad: true });
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [eventDetails, setEventDetails] = useState<EventWithDetails | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', eventDate: '', startTime: '', endTime: '',
    courtId: '', maxParticipants: '', targetLevel: '', fee: '', isPublished: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEventWithDetails(id).then((e) => {
      if (e) {
        setEventDetails(e);
        setForm({
          title: e.title, description: e.description, eventDate: e.eventDate,
          startTime: e.startTime, endTime: e.endTime, courtId: e.courtId ?? '',
          maxParticipants: String(e.maxParticipants), targetLevel: e.targetLevel ?? '',
          fee: String(e.fee), isPublished: e.isPublished,
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEvent(id, {
        title: form.title, description: form.description, eventDate: form.eventDate,
        startTime: form.startTime, endTime: form.endTime,
        courtId: form.courtId || null, maxParticipants: parseInt(form.maxParticipants),
        targetLevel: (form.targetLevel as LessonLevel) || null, fee: parseInt(form.fee),
        isPublished: form.isPublished,
      });
      toast.success('イベントを更新しました');
      router.push('/admin/events');
    } catch {
      toast.error('更新に失敗しました');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!eventDetails) return <p className="text-gray-500">イベントが見つかりません</p>;

  const memberMap = new Map(members.map(m => [m.id, m]));

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardTitle>イベント編集</CardTitle>
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
            <Button type="submit">更新</Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>参加者一覧 ({eventDetails.currentParticipants} / {eventDetails.maxParticipants}名)</CardTitle>
        {eventDetails.registrations.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">参加者はまだいません</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">会員名</th>
                  <th className="pb-2 pr-4">ステータス</th>
                  <th className="pb-2">登録日</th>
                </tr>
              </thead>
              <tbody>
                {eventDetails.registrations.map((r) => {
                  const member = memberMap.get(r.memberId);
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{member?.name ?? '不明'}</td>
                      <td className="py-2 pr-4">{EVENT_REGISTRATION_STATUS_LABELS[r.status]}</td>
                      <td className="py-2">{formatDate(r.registeredAt, 'yyyy/MM/dd')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
