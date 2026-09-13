'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, addWeeks, subWeeks, isToday } from 'date-fns';
import useAuth from '@/hooks/useAuth';
import useReservations from '@/hooks/useReservations';
import useLessonInstances from '@/hooks/useLessonInstances';
import useMembers from '@/hooks/useMembers';
import useLessonSlots from '@/hooks/useLessonSlots';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { LevelBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import NetDivider from '@/components/tennis/NetDivider';
import { getWeekDays, formatWeekRange } from '@/lib/calendar-utils';
import { DAY_LABELS } from '@/lib/constants';
import { formatDate, toISODateString, getAvailabilityLabel } from '@/lib/utils';
import { ReservationWithDetails } from '@/types';

export default function TransferPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { getMemberReservations } = useReservations();
  const { getInstanceWithDetails, instances } = useLessonInstances();
  const { getMember } = useMembers();
  const { lessonSlots: slots } = useLessonSlots();

  const [selectedFrom, setSelectedFrom] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const member = user?.memberId ? getMember(user.memberId) : null;

  const reservations = useMemo(() => {
    if (!user?.memberId) return [];
    return getMemberReservations(user.memberId);
  }, [user, getMemberReservations]);

  // Completed transfers: confirmed reservations that have a transferFromInstanceId
  const completedTransfers = useMemo(() => {
    return reservations
      .filter(r => r.status === 'confirmed' && r.transferFromInstanceId)
      .map(r => {
        const fromInstance = getInstanceWithDetails(r.transferFromInstanceId!);
        return { reservation: r, fromInstance };
      });
  }, [reservations, getInstanceWithDetails]);

  // Eligible for transfer: cancelled by member OR confirmed/waitlisted on a cancelled lesson
  const transferEligible = useMemo(() => {
    const eligible: (ReservationWithDetails & { reason: 'member_cancelled' | 'lesson_cancelled' })[] = [];

    for (const r of reservations) {
      if (r.status === 'cancelled') {
        eligible.push({ ...r, reason: 'member_cancelled' });
      } else if ((r.status === 'confirmed' || r.status === 'waitlisted') && r.lessonInstance.isCancelled) {
        eligible.push({ ...r, reason: 'lesson_cancelled' });
      }
    }
    return eligible.sort((a, b) =>
      a.lessonInstance.date.localeCompare(b.lessonInstance.date) ||
      a.lessonInstance.startTime.localeCompare(b.lessonInstance.startTime)
    );
  }, [reservations]);

  const availableTargets = useMemo(() => {
    if (!selectedFrom) return [];
    const fromRes = transferEligible.find(r => r.id === selectedFrom);
    if (!fromRes) return [];
    const fromSlot = slots.find(s => s.id === fromRes.lessonInstance.lessonSlotId);
    if (!fromSlot) return [];

    const today = toISODateString(new Date());
    // Check which instances member already has a reservation for (include cancelled to prevent re-booking)
    const memberInstanceIds = new Set(
      reservations
        .filter(r => r.status === 'confirmed' || r.status === 'waitlisted' || r.status === 'cancelled')
        .map(r => r.lessonInstanceId)
    );

    return instances
      .filter(i => i.date > today && !i.isCancelled && !memberInstanceIds.has(i.id))
      .map(i => getInstanceWithDetails(i.id))
      .filter(i => i !== null && i.lessonSlot.level === fromSlot.level && i.availableSpots > 0)
      .sort((a, b) => a!.date.localeCompare(b!.date));
  }, [selectedFrom, transferEligible, reservations, instances, getInstanceWithDetails, slots]);

  const fromRes = transferEligible.find(r => r.id === selectedFrom);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-net-dark">振替予約</h1>
        {member && <p className="text-sm text-gray-500">振替残回数: <span className="font-bold text-court-green">{member.remainingTransfers}</span></p>}
      </div>

      {member && member.remainingTransfers <= 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">振替回数の上限に達しています</p>
        </div>
      )}

      {completedTransfers.length > 0 && (
        <Card>
          <CardTitle>振替済みの予約</CardTitle>
          <NetDivider className="!my-3" />
          <div className="space-y-2">
            {completedTransfers.map(({ reservation: res, fromInstance }) => (
              <div key={res.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">振替済</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">振替元</p>
                    {fromInstance ? (
                      <p className="text-sm text-gray-600">
                        {formatDate(fromInstance.date, 'M/d')} {fromInstance.startTime} {fromInstance.lessonSlot.title}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">情報なし</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">振替先</p>
                    <p className="text-sm font-medium text-court-green">
                      {formatDate(res.lessonInstance.date, 'M/d')} {res.lessonInstance.startTime} {res.lessonSlot.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>振替元のレッスンを選択</CardTitle>
        <NetDivider className="!my-3" />
        {transferEligible.length === 0 ? (
          <EmptyState title="振替可能なレッスンはありません" description="キャンセルした予約やレッスンが中止された予約がある場合に振替できます" />
        ) : (
          <div className="space-y-2">
            {transferEligible.map(res => (
              <div key={res.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedFrom === res.id ? 'border-court-green bg-court-light' : 'border-gray-200 hover:border-court-grass'}`}
                onClick={() => { setSelectedFrom(selectedFrom === res.id ? null : res.id); setCurrentDate(new Date()); }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="min-w-14 text-center">
                      <p className="text-sm font-bold text-gray-500">{formatDate(res.lessonInstance.date, 'M/d')}</p>
                      <p className="text-xs text-gray-400">{res.lessonInstance.startTime}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{res.lessonSlot.title}</p>
                      <p className="text-xs text-gray-400">{res.coach.name}</p>
                    </div>
                  </div>
                  <Badge variant={res.reason === 'lesson_cancelled' ? 'error' : 'default'}>
                    {res.reason === 'lesson_cancelled' ? 'レッスン中止' : 'キャンセル済'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedFrom && (
        <>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(d => subWeeks(d, 1))}>← 前週</Button>
            <h2 className="font-bold text-net-dark text-sm">{formatWeekRange(currentDate)}</h2>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(d => addWeeks(d, 1))}>次週 →</Button>
          </div>

          <div className="space-y-4">
            {weekDays.map(day => {
              const dateStr = toISODateString(day);
              const dayTargets = availableTargets.filter(inst => inst && inst.date === dateStr);
              const today = isToday(day);
              return (
                <div key={dateStr}>
                  <div className={`flex items-center gap-2 mb-2 ${today ? 'text-court-green' : 'text-net-gray'}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${today ? 'bg-court-green text-white' : 'bg-gray-100'}`}>
                      {format(day, 'd')}
                    </span>
                    <span className="text-sm font-medium">{DAY_LABELS[day.getDay()]}曜日</span>
                    <span className="text-xs text-gray-400">{format(day, 'M月d日')}</span>
                  </div>
                  {dayTargets.length === 0 ? (
                    <p className="text-xs text-gray-400 ml-10">振替可能なレッスンなし</p>
                  ) : (
                    <div className="ml-10 space-y-2">
                      {dayTargets.map(inst => {
                        if (!inst) return null;
                        const avail = getAvailabilityLabel(inst.availableSpots, inst.maxCapacity);
                        return (
                          <Card key={inst.id} className="cursor-pointer hover:border-court-grass/50" onClick={() => {
                            if (fromRes) {
                              router.push(`/reserve/${inst.id}?fromInstanceId=${fromRes.lessonInstanceId}`);
                            }
                          }}>
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="text-center min-w-10 md:min-w-12 flex-shrink-0">
                                <p className="text-sm md:text-base font-bold text-court-green">{inst.startTime}</p>
                                <p className="text-xs text-gray-400">{inst.endTime}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                  <p className="text-sm md:text-base font-medium truncate md:truncate-none">{inst.lessonSlot.title}</p>
                                  <LevelBadge level={inst.lessonSlot.level} className="flex-shrink-0" />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-xs md:text-sm text-gray-500 truncate">{inst.coach.name} / {inst.court.name}</p>
                                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                    <p className={`text-xs md:text-sm font-medium whitespace-nowrap ${avail.color}`}>{avail.label}</p>
                                    <div className="w-12 md:w-20 h-1.5 bg-gray-200 rounded-full">
                                      <div className="h-full bg-court-grass rounded-full" style={{ width: `${Math.min(100, (inst.currentBookings / inst.maxCapacity) * 100)}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
