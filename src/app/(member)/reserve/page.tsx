'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, addWeeks, subWeeks, isToday, parseISO } from 'date-fns';
import useLessonInstances from '@/hooks/useLessonInstances';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LevelBadge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getWeekDays, formatWeekRange } from '@/lib/calendar-utils';
import { DAY_LABELS } from '@/lib/constants';
import { toISODateString, getAvailabilityLabel } from '@/lib/utils';
import { LessonInstanceWithDetails } from '@/types';

export default function ReservePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekParam = searchParams.get('week');

  const [currentDate, setCurrentDate] = useState(() => {
    if (weekParam) {
      try { return parseISO(weekParam); } catch { /* fall through */ }
    }
    return new Date();
  });

  const { getInstancesWithDetailsForDateRange } = useLessonInstances();

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const [instancesByDate, setInstancesByDate] = useState<Record<string, LessonInstanceWithDetails[]>>({});
  const [dataLoading, setDataLoading] = useState(true);

  const updateWeek = (nextDate: Date) => {
    setCurrentDate(nextDate);
    const dateStr = toISODateString(nextDate);
    router.replace(`/reserve?week=${dateStr}`, { scroll: false });
  };

  useEffect(() => {
    setDataLoading(true);
    const from = toISODateString(weekDays[0]);
    const to = toISODateString(weekDays[weekDays.length - 1]);
    getInstancesWithDetailsForDateRange(from, to).then(allInstances => {
      const map: Record<string, LessonInstanceWithDetails[]> = {};
      for (const inst of allInstances) {
        if (!map[inst.date]) map[inst.date] = [];
        map[inst.date].push(inst);
      }
      setInstancesByDate(map);
      setDataLoading(false);
    });
  }, [weekDays, getInstancesWithDetailsForDateRange]);

  if (dataLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => updateWeek(subWeeks(currentDate, 1))}>← 前週</Button>
        <h2 className="font-bold text-net-dark text-sm">{formatWeekRange(currentDate)}</h2>
        <Button variant="ghost" size="sm" onClick={() => updateWeek(addWeeks(currentDate, 1))}>次週 →</Button>
      </div>

      <div className="space-y-4">
        {weekDays.map(day => {
          const dateStr = toISODateString(day);
          const instances = instancesByDate[dateStr] ?? [];
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
              {instances.length === 0 ? (
                <p className="text-xs text-gray-400 ml-10">レッスンなし</p>
              ) : (
                <div className="ml-10 space-y-2">
                  {instances.map(inst => {
                    const avail = getAvailabilityLabel(inst.availableSpots, inst.maxCapacity);
                    return (
                      <Card key={inst.id} className="cursor-pointer hover:border-court-grass/50" onClick={() => router.push(`/reserve/${inst.id}`)}>
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
    </div>
  );
}
