'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import useReservations from '@/hooks/useReservations';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import { LevelBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { RESERVATION_STATUS_LABELS } from '@/lib/constants';
import { formatDate, toISODateString } from '@/lib/utils';

export default function MyReservationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { getMemberReservations, cancelReservation } = useReservations();
  const toast = useToast();
  const [tab, setTab] = useState('upcoming');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const reservations = useMemo(() => {
    if (!user?.memberId) return [];
    return getMemberReservations(user.memberId);
  }, [user, getMemberReservations]);

  const today = toISODateString(new Date());

  // Identify confirmed reservations whose lesson was cancelled by admin (exclude already-transferred ones)
  const lessonCancelledReservations = useMemo(() => {
    const transferredFromInstanceIds = new Set(
      reservations
        .filter(r => r.status === 'confirmed' && r.transferFromInstanceId)
        .map(r => r.transferFromInstanceId)
    );
    return reservations.filter(r => {
      if (r.status !== 'confirmed' && r.status !== 'waitlisted') return false;
      if (!r.lessonInstance.isCancelled) return false;
      if (transferredFromInstanceIds.has(r.lessonInstanceId)) return false;
      return true;
    });
  }, [reservations]);

  const upcoming = reservations.filter(r => {
    if (r.status !== 'confirmed' && r.status !== 'waitlisted') return false;
    if (r.lessonInstance.date < today) return false;
    return !r.lessonInstance.isCancelled;
  }).sort((a, b) =>
    a.lessonInstance.date.localeCompare(b.lessonInstance.date) ||
    a.lessonInstance.startTime.localeCompare(b.lessonInstance.startTime)
  );
  const past = reservations.filter(r => {
    if (r.status === 'transferred') return false;
    if (r.lessonInstance.date < today || r.status === 'cancelled') return true;
    // Include lesson-cancelled reservations in past tab too
    if ((r.status === 'confirmed' || r.status === 'waitlisted') && r.lessonInstance.isCancelled) return true;
    return false;
  }).sort((a, b) =>
    b.lessonInstance.date.localeCompare(a.lessonInstance.date) ||
    b.lessonInstance.startTime.localeCompare(a.lessonInstance.startTime)
  );
  const display = tab === 'upcoming' ? upcoming : past;

  const handleCancel = () => {
    if (cancelTarget) {
      cancelReservation(cancelTarget);
      toast.success('予約をキャンセルしました');
      setCancelTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-net-dark">マイ予約</h1>

      {/* Alert for lesson-cancelled reservations */}
      {lessonCancelledReservations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm font-bold text-red-800">レッスンが中止になりました</p>
          </div>
          {lessonCancelledReservations.map(res => (
            <div key={res.id} className="bg-white rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="text-center flex-shrink-0">
                  <p className="text-sm font-bold text-red-500">{formatDate(res.lessonInstance.date, 'M/d')}</p>
                  <p className="text-xs text-gray-400">{res.lessonInstance.startTime}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-net-gray">{res.lessonSlot.title}</p>
                    <LevelBadge level={res.lessonSlot.level} />
                  </div>
                  <p className="text-xs text-gray-500">{res.coach.name} / {res.court.name}</p>
                  {res.lessonInstance.cancelReason && (
                    <p className="text-xs text-red-500 mt-0.5">理由: {res.lessonInstance.cancelReason}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <Button size="sm" onClick={() => router.push('/transfer')}>振替する</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Tabs tabs={[{ key: 'upcoming', label: `今後 (${upcoming.length})` }, { key: 'past', label: `過去 (${past.length})` }]} activeTab={tab} onChange={setTab} />

      {display.length === 0 ? (
        <EmptyState title={tab === 'upcoming' ? '今後の予約はありません' : '過去の予約はありません'} />
      ) : (
        <div className="space-y-3">
          {display.map(res => {
            const isLessonCancelled = res.lessonInstance.isCancelled === true;
            return (
              <Card key={res.id}>
                <div className="flex items-center gap-3">
                  <div className="text-center flex-shrink-0">
                    <p className="text-sm font-bold text-court-green">{formatDate(res.lessonInstance.date, 'M/d')}</p>
                    <p className="text-xs text-gray-400">{res.lessonInstance.startTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-net-gray">{res.lessonSlot.title}</p>
                      <LevelBadge level={res.lessonSlot.level} />
                      {isLessonCancelled && <Badge variant="error">レッスン中止</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{res.coach.name} / {res.court.name}</p>
                    <p className="text-xs text-gray-400">{res.lessonInstance.startTime}-{res.lessonInstance.endTime}</p>
                    <Badge variant={res.status === 'confirmed' ? 'success' : res.status === 'cancelled' ? 'error' : res.status === 'waitlisted' ? 'warning' : 'info'} className="mt-1">
                      {RESERVATION_STATUS_LABELS[res.status]}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0 min-w-20">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/reserve/${res.lessonInstanceId}`)}>詳細</Button>
                    {(res.status === 'confirmed' || res.status === 'waitlisted') && res.lessonInstance.date >= today && !isLessonCancelled && (
                      <Button variant="danger" size="sm" className="w-full" onClick={() => setCancelTarget(res.id)}>キャンセル</Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel} title="予約キャンセル" message="この予約をキャンセルしてもよろしいですか？" variant="danger" confirmLabel="キャンセルする" />
    </div>
  );
}
