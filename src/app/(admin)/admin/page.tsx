'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useDashboardStats from '@/hooks/useDashboardStats';
import Card, { CardTitle } from '@/components/ui/Card';
import { LevelBadge } from '@/components/ui/Badge';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';
import RacketIcon from '@/components/tennis/RacketIcon';
import NetDivider from '@/components/tennis/NetDivider';
import { RESERVATION_STATUS_LABELS, DAY_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const stats = useDashboardStats();

  const maxTrend = useMemo(() => Math.max(...stats.weeklyTrend.map(t => t.count), 1), [stats.weeklyTrend]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/admin/schedule')}>
          <div className="w-12 h-12 rounded-full bg-court-light flex items-center justify-center flex-shrink-0">
            <TennisBallIcon size={28} />
          </div>
          <div>
            <p className="text-2xl font-bold text-net-dark">{stats.todayLessonCount}</p>
            <p className="text-xs text-gray-500">今日のレッスン</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/admin/members')}>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-net-dark">{stats.totalMembers}</p>
            <p className="text-xs text-gray-500">会員数</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/admin/coaches')}>
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
            <RacketIcon size={28} />
          </div>
          <div>
            <p className="text-2xl font-bold text-net-dark">{stats.totalCoaches}</p>
            <p className="text-xs text-gray-500">コーチ数</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/admin/reservations')}>
          <div className="w-12 h-12 rounded-full bg-ball-glow flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-court-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-net-dark">{stats.todayReservationCount}</p>
            <p className="text-xs text-gray-500">本日の予約 ({stats.reservationRate}%)</p>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardTitle>本日のスケジュール</CardTitle>
          <NetDivider className="!my-3" />
          {stats.upcomingLessonsToday.length === 0 ? (
            <EmptyState title="本日のレッスンはありません" />
          ) : (
            <div className="space-y-3">
              {stats.upcomingLessonsToday.map(lesson => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg bg-court-light/50">
                  <div className="text-center min-w-16">
                    <p className="text-sm font-bold text-court-green">{lesson.startTime}</p>
                    <p className="text-xs text-gray-400">{lesson.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-net-gray truncate">{lesson.lessonSlot.title}</p>
                      <LevelBadge level={lesson.lessonSlot.level} />
                    </div>
                    <p className="text-xs text-gray-500">{lesson.coach.name} / {lesson.court.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-court-green">{lesson.currentBookings}/{lesson.maxCapacity}名</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardTitle>週間予約推移</CardTitle>
          <NetDivider className="!my-3" />
          <div className="flex items-end gap-2 h-40 mt-4">
            {stats.weeklyTrend.map((day, i) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{day.count}</span>
                <div
                  className="w-full bg-court-grass/70 rounded-t-md transition-all min-h-1"
                  style={{ height: `${(day.count / maxTrend) * 100}%` }}
                />
                <span className="text-xs text-gray-400">{DAY_LABELS[new Date(day.date).getDay()]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Reservations */}
      <Card>
        <CardTitle>最近の予約</CardTitle>
        <NetDivider className="!my-3" />
        {stats.recentReservations.length === 0 ? (
          <EmptyState title="予約がありません" />
        ) : (
          <div className="space-y-2">
            {stats.recentReservations.map(res => (
              <div key={res.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-court-light/30 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: res.member.avatarColor }}>
                  {res.member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-net-gray truncate">{res.member.name} - {res.lessonSlot.title}</p>
                  <p className="text-xs text-gray-400">{formatDate(res.lessonInstance.date)} {res.lessonInstance.startTime}</p>
                </div>
                <Badge variant={res.status === 'confirmed' ? 'success' : res.status === 'cancelled' ? 'error' : res.status === 'waitlisted' ? 'warning' : 'info'}>
                  {RESERVATION_STATUS_LABELS[res.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
