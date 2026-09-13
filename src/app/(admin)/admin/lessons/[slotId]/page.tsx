'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useLessonSlots from '@/hooks/useLessonSlots';
import useCoaches from '@/hooks/useCoaches';
import useCourts from '@/hooks/useCourts';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { LEVEL_LABELS, DAY_LABELS, RECURRENCE_TYPE_LABELS } from '@/lib/constants';
import { LessonSlot, LessonLevel, DayOfWeek, RecurrenceType } from '@/types';

export default function EditLessonPage() {
  const { getLessonSlot, updateLessonSlot } = useLessonSlots();
  const { coaches } = useCoaches();
  const { courts } = useCourts();
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const slotId = params.slotId as string;

  const [slot, setSlot] = useState<LessonSlot | null>(() => {
    const s = getLessonSlot(slotId);
    return s ? { ...s, recurrenceType: s.recurrenceType ?? 'weekly' } : null;
  });

  if (!slot) return <LoadingSpinner />;

  const recurrenceType = slot.recurrenceType ?? 'weekly';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLessonSlot(slotId, {
      ...slot,
      isRecurring: recurrenceType !== 'none',
      specificDate: recurrenceType === 'none' ? slot.specificDate : null,
      monthlyWeekNumber: recurrenceType === 'monthly' ? slot.monthlyWeekNumber : null,
    });
    toast.success('レッスンを更新しました');
    router.push('/admin/lessons');
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>レッスン編集: {slot.title}</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input label="レッスン名" value={slot.title} onChange={e => setSlot(s => s ? { ...s, title: e.target.value } : s)} required />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="レベル" value={slot.level} onChange={e => setSlot(s => s ? { ...s, level: e.target.value as LessonLevel } : s)} options={Object.entries(LEVEL_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Select
              label="繰り返し設定"
              value={recurrenceType}
              onChange={e => setSlot(s => s ? { ...s, recurrenceType: e.target.value as RecurrenceType } : s)}
              options={Object.entries(RECURRENCE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {recurrenceType === 'none' ? (
              <Input
                label="日付"
                type="date"
                value={slot.specificDate || ''}
                onChange={e => setSlot(s => s ? { ...s, specificDate: e.target.value } : s)}
                required
              />
            ) : (
              <Select label="曜日" value={String(slot.dayOfWeek)} onChange={e => setSlot(s => s ? { ...s, dayOfWeek: parseInt(e.target.value) as DayOfWeek } : s)} options={DAY_LABELS.map((l, i) => ({ value: String(i), label: l + '曜日' }))} />
            )}
            {recurrenceType === 'biweekly' && (
              <Input
                label="開始日"
                type="date"
                value={slot.recurrenceStartDate}
                onChange={e => setSlot(s => s ? { ...s, recurrenceStartDate: e.target.value } : s)}
                required
              />
            )}
            {recurrenceType === 'monthly' && (
              <Select
                label="第N週"
                value={String(slot.monthlyWeekNumber || 1)}
                onChange={e => setSlot(s => s ? { ...s, monthlyWeekNumber: parseInt(e.target.value) } : s)}
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
            <Select label="コーチ" value={slot.coachId} onChange={e => setSlot(s => s ? { ...s, coachId: e.target.value } : s)} options={coaches.map(c => ({ value: c.id, label: c.name }))} />
            <Select label="コート" value={slot.courtId} onChange={e => setSlot(s => s ? { ...s, courtId: e.target.value } : s)} options={courts.map(c => ({ value: c.id, label: c.name }))} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="開始時間" type="time" value={slot.startTime} onChange={e => setSlot(s => s ? { ...s, startTime: e.target.value } : s)} required />
            <Input label="終了時間" type="time" value={slot.endTime} onChange={e => setSlot(s => s ? { ...s, endTime: e.target.value } : s)} required />
            <Input label="定員" type="number" value={String(slot.maxCapacity)} onChange={e => setSlot(s => s ? { ...s, maxCapacity: parseInt(e.target.value) || 1 } : s)} required min="1" />
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
