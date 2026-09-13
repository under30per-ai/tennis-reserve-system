'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import useLessonInstances from '@/hooks/useLessonInstances';
import useLessonRecords from '@/hooks/useLessonRecords';
import useMembers from '@/hooks/useMembers';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import StarRating from '@/components/ui/StarRating';
import { LevelBadge } from '@/components/ui/Badge';
import { MemberLessonNote, AttendanceStatus } from '@/types';
import { DAY_LABELS, ATTENDANCE_STATUS_LABELS } from '@/lib/constants';

interface MemberNoteForm {
  memberId: string;
  memberName: string;
  avatarColor: string;
  attendance: AttendanceStatus;
  performanceRating: number;
  goodPoints: string;
  improvementPoints: string;
  memo: string;
}

export default function RecordEditPage() {
  const router = useRouter();
  const params = useParams();
  const instanceId = params.instanceId as string;
  const { getInstanceWithDetails } = useLessonInstances();
  const { getRecordForInstance, getReservationsForInstance, createRecord, updateRecord } = useLessonRecords();
  const { getMember } = useMembers();
  const toast = useToast();

  const instanceDetails = useMemo(() => getInstanceWithDetails(instanceId), [instanceId, getInstanceWithDetails]);
  const existingRecord = useMemo(() => getRecordForInstance(instanceId), [instanceId, getRecordForInstance]);

  const initialFormData = useMemo(() => {
    if (!instanceDetails) return { theme: '', content: '', memberNotes: [] as MemberNoteForm[] };
    if (existingRecord) {
      return {
        theme: existingRecord.theme,
        content: existingRecord.content,
        memberNotes: existingRecord.memberNotes.map(note => {
          const m = getMember(note.memberId);
          return {
            memberId: note.memberId,
            memberName: m?.name ?? '不明',
            avatarColor: m?.avatarColor ?? '#888',
            attendance: note.attendance,
            performanceRating: note.performanceRating,
            goodPoints: note.goodPoints,
            improvementPoints: note.improvementPoints,
            memo: note.memo,
          };
        }),
      };
    }
    const reservations = getReservationsForInstance(instanceId);
    return {
      theme: '',
      content: '',
      memberNotes: reservations.map(r => {
        const m = getMember(r.memberId);
        return {
          memberId: r.memberId,
          memberName: m?.name ?? '不明',
          avatarColor: m?.avatarColor ?? '#888',
          attendance: 'present' as AttendanceStatus,
          performanceRating: 3,
          goodPoints: '',
          improvementPoints: '',
          memo: '',
        };
      }),
    };
  }, [instanceDetails, existingRecord, instanceId, getMember, getReservationsForInstance]);

  const [theme, setTheme] = useState(() => initialFormData.theme);
  const [content, setContent] = useState(() => initialFormData.content);
  const [memberNotes, setMemberNotes] = useState<MemberNoteForm[]>(() => initialFormData.memberNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateMemberNote = (index: number, field: keyof MemberNoteForm, value: string | number) => {
    setMemberNotes(prev => prev.map((note, i) => i === index ? { ...note, [field]: value } : note));
  };

  const handleSubmit = async () => {
    if (!theme.trim()) {
      toast.error('テーマを入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const noteData: MemberLessonNote[] = memberNotes.map(n => ({
        memberId: n.memberId,
        attendance: n.attendance,
        performanceRating: n.performanceRating,
        goodPoints: n.goodPoints,
        improvementPoints: n.improvementPoints,
        memo: n.memo,
      }));

      if (existingRecord) {
        updateRecord(existingRecord.id, { theme, content, memberNotes: noteData });
        toast.success('レッスン記録を更新しました');
      } else {
        createRecord({ lessonInstanceId: instanceId, theme, content, memberNotes: noteData });
        toast.success('レッスン記録を保存しました');
      }
      router.push('/admin/records');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!instanceDetails) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/admin/records')}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </Button>
        <Card>
          <p className="text-gray-500 text-center py-8">レッスンが見つかりません</p>
        </Card>
      </div>
    );
  }

  const date = parseISO(instanceDetails.date);
  const dayLabel = DAY_LABELS[date.getDay()];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.push('/admin/records')}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </Button>
        <h1 className="text-xl font-bold text-net-gray">
          {existingRecord ? 'レッスン記録の編集' : 'レッスン記録の作成'}
        </h1>
      </div>

      {/* Lesson info */}
      <Card>
        <div className="flex flex-wrap items-center gap-4 text-sm text-net-gray">
          <div className="flex items-center gap-2">
            <span className="font-medium">{instanceDetails.lessonSlot.title}</span>
            <LevelBadge level={instanceDetails.lessonSlot.level} />
          </div>
          <span>{format(date, 'yyyy/M/d', { locale: ja })}({dayLabel})</span>
          <span>{instanceDetails.startTime} - {instanceDetails.endTime}</span>
          <span>コーチ: {instanceDetails.coach.name}</span>
          <span>{instanceDetails.court.name}</span>
        </div>
      </Card>

      {/* Theme and content */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-base font-bold text-net-gray">レッスン内容</h2>
          <Input
            label="テーマ"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            placeholder="例: フォアハンドストローク基礎"
          />
          <Textarea
            label="内容・メモ"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="レッスンの内容、ドリル、ポイントなどを記録..."
            rows={4}
          />
        </div>
      </Card>

      {/* Member notes */}
      <Card>
        <h2 className="text-base font-bold text-net-gray mb-4">
          参加者別記録 ({memberNotes.length}名)
        </h2>
        {memberNotes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">予約済みの会員がいません</p>
        ) : (
          <div className="space-y-6">
            {memberNotes.map((note, index) => (
              <div key={note.memberId} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: note.avatarColor }}
                  >
                    {note.memberName.charAt(0)}
                  </div>
                  <span className="font-medium text-net-gray">{note.memberName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="出欠"
                    value={note.attendance}
                    onChange={e => updateMemberNote(index, 'attendance', e.target.value)}
                    options={Object.entries(ATTENDANCE_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                    placeholder={false}
                  />
                  <StarRating
                    label="評価"
                    value={note.performanceRating}
                    onChange={val => updateMemberNote(index, 'performanceRating', val)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Textarea
                    label="良い点"
                    value={note.goodPoints}
                    onChange={e => updateMemberNote(index, 'goodPoints', e.target.value)}
                    placeholder="良かった点を記録..."
                    rows={2}
                  />
                  <Textarea
                    label="改善点"
                    value={note.improvementPoints}
                    onChange={e => updateMemberNote(index, 'improvementPoints', e.target.value)}
                    placeholder="改善すべき点を記録..."
                    rows={2}
                  />
                </div>

                <Textarea
                  label="メモ"
                  value={note.memo}
                  onChange={e => updateMemberNote(index, 'memo', e.target.value)}
                  placeholder="その他気付いた点..."
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/admin/records')}>
          キャンセル
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : (existingRecord ? '更新する' : '保存する')}
        </Button>
      </div>
    </div>
  );
}
