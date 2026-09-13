'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useLessonSlots from '@/hooks/useLessonSlots';
import useCoaches from '@/hooks/useCoaches';
import useCourts from '@/hooks/useCourts';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { LEVEL_LABELS, DAY_LABELS, RECURRENCE_TYPE_LABELS } from '@/lib/constants';
import { LessonLevel, DayOfWeek, RecurrenceType } from '@/types';

export default function NewLessonPage() {
  const { addLessonSlot } = useLessonSlots();
  const { coaches } = useCoaches();
  const { courts } = useCourts();
  const toast = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    title: '', level: 'beginner' as LessonLevel, coachId: '', courtId: '',
    dayOfWeek: 1 as DayOfWeek, startTime: '10:00', endTime: '11:30', maxCapacity: 8,
    recurrenceType: 'weekly' as RecurrenceType,
    specificDate: '',
    recurrenceStartDate: '',
    monthlyWeekNumber: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLessonSlot({
      ...form,
      isRecurring: form.recurrenceType !== 'none',
      specificDate: form.recurrenceType === 'none' ? form.specificDate : null,
      recurrenceStartDate: form.recurrenceType === 'biweekly'
        ? form.recurrenceStartDate
        : form.recurrenceType === 'none' && form.specificDate
          ? form.specificDate
          : new Date().toISOString().split('T')[0],
      recurrenceEndDate: null,
      monthlyWeekNumber: form.recurrenceType === 'monthly' ? form.monthlyWeekNumber : null,
      isActive: true,
    });
    toast.success('レッスンを追加しました');
    router.push('/admin/lessons');
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>新規レッスン追加</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input label="レッスン名" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="例: 初級クラスA" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="レベル" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as LessonLevel }))} options={Object.entries(LEVEL_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Select
              label="繰り返し設定"
              value={form.recurrenceType}
              onChange={e => setForm(f => ({ ...f, recurrenceType: e.target.value as RecurrenceType }))}
              options={Object.entries(RECURRENCE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {form.recurrenceType === 'none' ? (
              <Input
                label="日付"
                type="date"
                value={form.specificDate}
                onChange={e => setForm(f => ({ ...f, specificDate: e.target.value }))}
                required
              />
            ) : (
              <Select label="曜日" value={String(form.dayOfWeek)} onChange={e => setForm(f => ({ ...f, dayOfWeek: parseInt(e.target.value) as DayOfWeek }))} options={DAY_LABELS.map((l, i) => ({ value: String(i), label: l + '曜日' }))} />
            )}
            {form.recurrenceType === 'biweekly' && (
              <Input
                label="開始日"
                type="date"
                value={form.recurrenceStartDate}
                onChange={e => setForm(f => ({ ...f, recurrenceStartDate: e.target.value }))}
                required
              />
            )}
            {form.recurrenceType === 'monthly' && (
              <Select
                label="第N週"
                value={String(form.monthlyWeekNumber)}
                onChange={e => setForm(f => ({ ...f, monthlyWeekNumber: parseInt(e.target.value) }))}
                options={[
                  { value: '1', label: '第1週' },
                  { value: '2', label: '第2週' },
                  { value: '3', label: '第3週' },
                  { value: '4', label: '第4週' },
                ]}
              />
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="コーチ" value={form.coachId} onChange={e => setForm(f => ({ ...f, coachId: e.target.value }))} options={coaches.map(c => ({ value: c.id, label: c.name }))} />
            <Select label="コート" value={form.courtId} onChange={e => setForm(f => ({ ...f, courtId: e.target.value }))} options={courts.map(c => ({ value: c.id, label: c.name }))} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="開始時間" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
            <Input label="終了時間" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
            <Input label="定員" type="number" value={String(form.maxCapacity)} onChange={e => setForm(f => ({ ...f, maxCapacity: parseInt(e.target.value) || 1 }))} required min="1" />
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
