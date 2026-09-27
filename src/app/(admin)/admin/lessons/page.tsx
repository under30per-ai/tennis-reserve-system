'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLessonSlots from '@/hooks/useLessonSlots';
import useCoaches from '@/hooks/useCoaches';
import useCourts from '@/hooks/useCourts';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { LevelBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { DAY_LABELS } from '@/lib/constants';
import { Coach, Court } from '@/types';

export default function LessonsPage() {
  const { lessonSlots, loading: slotsLoading, deleteLessonSlot } = useLessonSlots();
  const { getCoach, loading: coachesLoading } = useCoaches();
  const { getCourt, loading: courtsLoading } = useCourts();
  const toast = useToast();
  const router = useRouter();

  const [coachMap, setCoachMap] = useState<Record<string, Coach | null>>({});
  const [courtMap, setCourtMap] = useState<Record<string, Court | null>>({});

  useEffect(() => {
    const coachIds = [...new Set(lessonSlots.map(s => s.coachId))];
    const courtIds = [...new Set(lessonSlots.map(s => s.courtId))];

    Promise.all(coachIds.map(async id => [id, await getCoach(id)] as const)).then(entries => {
      setCoachMap(Object.fromEntries(entries));
    });

    Promise.all(courtIds.map(async id => [id, await getCourt(id)] as const)).then(entries => {
      setCourtMap(Object.fromEntries(entries));
    });
  }, [lessonSlots, getCoach, getCourt]);

  const handleDelete = async (id: string) => {
    try {
      await deleteLessonSlot(id);
      toast.success('レッスンを削除しました');
    } catch {
      toast.error('レッスンの削除に失敗しました');
    }
  };

  if (slotsLoading || coachesLoading || courtsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => router.push('/admin/lessons/new')}>レッスン追加</Button>
      </div>

      {lessonSlots.length === 0 ? (
        <Card>
          <EmptyState title="レッスンが登録されていません" />
        </Card>
      ) : (
        <>
          {/* Desktop: table */}
          <Card padding={false} className="hidden sm:block">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>レッスン名</TableHead>
                  <TableHead>レベル</TableHead>
                  <TableHead>曜日</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>コーチ</TableHead>
                  <TableHead>コート</TableHead>
                  <TableHead>定員</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </tr>
              </TableHeader>
              <tbody>
                {lessonSlots.map(slot => {
                  const coach = coachMap[slot.coachId];
                  const court = courtMap[slot.courtId];
                  return (
                    <TableRow key={slot.id} onClick={() => router.push(`/admin/lessons/${slot.id}`)}>
                      <TableCell><span className="font-medium">{slot.title}</span></TableCell>
                      <TableCell><LevelBadge level={slot.level} /></TableCell>
                      <TableCell>{DAY_LABELS[slot.dayOfWeek]}</TableCell>
                      <TableCell>{slot.startTime} - {slot.endTime}</TableCell>
                      <TableCell>{coach?.name || '-'}</TableCell>
                      <TableCell>{court?.name || '-'}</TableCell>
                      <TableCell>{slot.maxCapacity}名</TableCell>
                      <TableCell className="text-right">
                        <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(slot.id); }}>削除</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </Card>

          {/* Mobile: card list */}
          <div className="sm:hidden space-y-3">
            {lessonSlots.map(slot => {
              const coach = coachMap[slot.coachId];
              const court = courtMap[slot.courtId];
              return (
                <Card
                  key={slot.id}
                  className="cursor-pointer active:bg-gray-50"
                  onClick={() => router.push(`/admin/lessons/${slot.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-net-gray">{slot.title}</p>
                        <LevelBadge level={slot.level} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {DAY_LABELS[slot.dayOfWeek]}曜 {slot.startTime}-{slot.endTime}
                      </p>
                      <p className="text-xs text-gray-400">
                        {coach?.name || '-'} / {court?.name || '-'} / 定員{slot.maxCapacity}名
                      </p>
                    </div>
                    <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(slot.id); }}>
                      削除
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
