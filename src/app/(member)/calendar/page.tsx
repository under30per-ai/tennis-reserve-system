'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, addWeeks, subWeeks, addMonths, subMonths, isSameMonth, isToday, isSameDay } from 'date-fns';
import useLessonInstances from '@/hooks/useLessonInstances';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import { LevelBadge } from '@/components/ui/Badge';
import { getWeekDays, getCalendarMonthDays, formatWeekRange } from '@/lib/calendar-utils';
import { DAY_LABELS, LEVEL_COLORS } from '@/lib/constants';
import { toISODateString, getAvailabilityLabel } from '@/lib/utils';

export default function CalendarPage() {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { getInstancesWithDetailsForDate } = useLessonInstances();
  const router = useRouter();

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = useMemo(() => getCalendarMonthDays(currentDate), [currentDate]);

  return (
    <div className="space-y-4">
      <Tabs tabs={[{ key: 'weekly', label: '週間' }, { key: 'monthly', label: '月間' }]} activeTab={view} onChange={k => setView(k as 'weekly' | 'monthly')} />

      {view === 'weekly' ? (
        <>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(d => subWeeks(d, 1))}>← 前週</Button>
            <h2 className="font-bold text-net-dark text-sm">{formatWeekRange(currentDate)}</h2>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(d => addWeeks(d, 1))}>次週 →</Button>
          </div>

          <div className="space-y-4">
            {weekDays.map(day => {
              const dateStr = toISODateString(day);
              const instances = getInstancesWithDetailsForDate(dateStr);
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
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(d => subMonths(d, 1))}>← 前月</Button>
            <h2 className="font-bold text-net-dark">{format(currentDate, 'yyyy年 M月')}</h2>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(d => addMonths(d, 1))}>次月 →</Button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {DAY_LABELS.slice(1).concat(DAY_LABELS[0]).map(d => (
              <div key={d} className="bg-court-light p-2 text-center text-xs font-medium text-court-green">{d}</div>
            ))}
            {monthDays.map((day, i) => {
              const dateStr = toISODateString(day);
              const instances = getInstancesWithDetailsForDate(dateStr);
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              return (
                <div key={i} className={`bg-white p-1.5 min-h-24 ${!inMonth ? 'opacity-30' : ''} ${today ? 'ring-2 ring-inset ring-court-green' : ''} cursor-pointer hover:bg-court-light/30`}
                  onClick={() => { setCurrentDate(day); setView('weekly'); }}>
                  <p className={`text-xs font-medium mb-1 ${today ? 'text-court-green font-bold' : 'text-gray-600'}`}>{format(day, 'd')}</p>
                  <div className="space-y-0.5">
                    {instances.slice(0, 2).map(inst => (
                      <div
                        key={inst.id}
                        className={`px-1 py-0.5 rounded text-[10px] leading-tight truncate ${LEVEL_COLORS[inst.lessonSlot.level].bg} ${LEVEL_COLORS[inst.lessonSlot.level].text}`}
                        title={`${inst.startTime} ${inst.lessonSlot.title}`}
                        onClick={(e) => { e.stopPropagation(); router.push(`/reserve/${inst.id}`); }}
                      >
                        {inst.startTime} {inst.lessonSlot.title}
                      </div>
                    ))}
                    {instances.length > 2 && <p className="text-[9px] text-gray-400">+{instances.length - 2}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
