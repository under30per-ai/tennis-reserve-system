'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import useReservations from '@/hooks/useReservations';
import useMembers from '@/hooks/useMembers';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { LevelBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';
import NetDivider from '@/components/tennis/NetDivider';
import CourtIllustration from '@/components/tennis/CourtIllustration';
import { RESERVATION_STATUS_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { toISODateString } from '@/lib/utils';

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const { getMemberReservations } = useReservations();
  const { getMember } = useMembers();
  const router = useRouter();
  const member = user?.memberId ? getMember(user.memberId) : null;

  const reservations = useMemo(() => {
    if (!user?.memberId) return [];
    return getMemberReservations(user.memberId);
  }, [user, getMemberReservations]);

  const today = toISODateString(new Date());
  const upcoming = reservations
    .filter(r => r.lessonInstance.date >= today && r.status === 'confirmed' && !r.lessonInstance.isCancelled)
    .sort((a, b) => a.lessonInstance.date.localeCompare(b.lessonInstance.date) || a.lessonInstance.startTime.localeCompare(b.lessonInstance.startTime));
  const recent = reservations.slice(0, 5);

  // Reservations whose lesson was cancelled by admin (exclude already-transferred ones)
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

  return (
    <div className="space-y-6">
      {/* Lesson cancelled notification - styled as お知らせ */}
      {lessonCancelledReservations.length > 0 && (
        <Card className="!p-0 border-red-200 overflow-hidden">
          <div className="bg-red-600 px-4 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-sm font-bold text-white">お知らせ</span>
          </div>
          <div className="p-4 space-y-3">
            {lessonCancelledReservations.map(res => (
              <div key={res.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-800">
                    {formatDate(res.lessonInstance.date, 'M/d')} {res.lessonInstance.startTime} {res.lessonSlot.title} が中止になりました
                  </p>
                  {res.lessonInstance.cancelReason && (
                    <p className="text-xs text-red-600 mt-0.5">
                      理由: {res.lessonInstance.cancelReason}
                    </p>
                  )}
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-100"
                      onClick={() => router.push('/transfer')}
                    >
                      振替予約する
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="tennis-card p-6 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl font-bold text-net-dark">
            こんにちは、{user?.name}さん
          </h1>
          <p className="text-sm text-gray-500 mt-1">テニスの予約を管理しましょう</p>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => router.push('/reserve')}>レッスンを予約</Button>
            <Button variant="outline" onClick={() => router.push('/calendar')}>カレンダー</Button>
          </div>
        </div>
        <div className="absolute right-4 top-0 bottom-0 w-48 opacity-20 hidden sm:block">
          <CourtIllustration className="h-full" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-court-light flex items-center justify-center">
            <TennisBallIcon size={28} />
          </div>
          <div>
            <p className="text-2xl font-bold text-court-green">{upcoming.length}</p>
            <p className="text-xs text-gray-500">今後の予約</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-ball-glow flex items-center justify-center">
            <svg className="w-6 h-6 text-court-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-court-green">{member?.remainingTransfers ?? 0}</p>
            <p className="text-xs text-gray-500">振替残回数</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>今後のレッスン</CardTitle>
        <NetDivider className="!my-3" />
        {upcoming.length === 0 ? (
          <EmptyState title="予約されたレッスンはありません" description="レッスンを予約してみましょう" action={<Button size="sm" onClick={() => router.push('/reserve')}>予約する</Button>} />
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map(res => (
              <div key={res.id} className="flex items-center gap-3 p-3 rounded-lg bg-court-light/50 cursor-pointer hover:bg-court-light" onClick={() => router.push(`/reserve/${res.lessonInstanceId}`)}>
                <div className="text-center min-w-16">
                  <p className="text-sm font-bold text-court-green">{formatDate(res.lessonInstance.date, 'M/d')}</p>
                  <p className="text-xs text-gray-400">{res.lessonInstance.startTime}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-net-gray truncate">{res.lessonSlot.title}</p>
                    <LevelBadge level={res.lessonSlot.level} />
                    {res.transferFromInstanceId && <Badge variant="info">振替</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{res.coach.name} / {res.court.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {recent.length > 0 && (
        <Card>
          <CardTitle>最近の予約</CardTitle>
          <NetDivider className="!my-3" />
          <div className="space-y-2">
            {recent.map(res => (
              <div key={res.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/reserve/${res.lessonInstanceId}`)}>
                <div>
                  <p className="text-sm text-net-gray">{res.lessonSlot.title}</p>
                  <p className="text-xs text-gray-400">{formatDate(res.lessonInstance.date)} {res.lessonInstance.startTime}</p>
                </div>
                <Badge variant={res.status === 'confirmed' ? 'success' : res.status === 'cancelled' ? 'error' : res.status === 'waitlisted' ? 'warning' : 'info'}>
                  {RESERVATION_STATUS_LABELS[res.status]}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-2" onClick={() => router.push('/my-reservations')}>全ての予約を見る →</Button>
        </Card>
      )}
    </div>
  );
}
