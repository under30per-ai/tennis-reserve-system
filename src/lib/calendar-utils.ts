import { startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, startOfMonth, endOfMonth, getDay, getDate, format, addDays, differenceInWeeks, parseISO } from 'date-fns';
import { LessonSlot, LessonInstance, DayOfWeek } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

export function getCalendarMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function generateInstancesForSlot(
  slot: LessonSlot,
  fromDate: Date,
  toDate: Date
): LessonInstance[] {
  const instances: LessonInstance[] = [];
  const recurrenceType = slot.recurrenceType ?? 'weekly';

  // Spot (non-recurring): only generate if specificDate falls in range
  if (recurrenceType === 'none') {
    if (slot.specificDate) {
      const specificDate = parseISO(slot.specificDate);
      if (specificDate >= fromDate && specificDate <= toDate) {
        instances.push({
          id: uuidv4(),
          lessonSlotId: slot.id,
          date: slot.specificDate,
          coachId: slot.coachId,
          courtId: slot.courtId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxCapacity: slot.maxCapacity,
          isCancelled: false,
          cancelReason: '',
          notes: '',
          createdAt: new Date().toISOString(),
        });
      }
    }
    return instances;
  }

  const days = eachDayOfInterval({ start: fromDate, end: toDate });

  for (const day of days) {
    if (getDay(day) !== slot.dayOfWeek) continue;

    // Biweekly: check if this week is an even number of weeks from recurrenceStartDate
    if (recurrenceType === 'biweekly') {
      const startDate = parseISO(slot.recurrenceStartDate);
      const weeksDiff = differenceInWeeks(day, startDate);
      if (weeksDiff % 2 !== 0) continue;
    }

    // Monthly: check if this is the Nth week of the month
    if (recurrenceType === 'monthly' && slot.monthlyWeekNumber != null) {
      const weekOfMonth = Math.ceil(getDate(day) / 7);
      if (weekOfMonth !== slot.monthlyWeekNumber) continue;
    }

    const dateStr = format(day, 'yyyy-MM-dd');
    instances.push({
      id: uuidv4(),
      lessonSlotId: slot.id,
      date: dateStr,
      coachId: slot.coachId,
      courtId: slot.courtId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      isCancelled: false,
      cancelReason: '',
      notes: '',
      createdAt: new Date().toISOString(),
    });
  }

  return instances;
}

export function generateAllInstances(
  slots: LessonSlot[],
  fromDate: Date,
  toDate: Date
): LessonInstance[] {
  const all: LessonInstance[] = [];
  for (const slot of slots) {
    if (!slot.isActive) continue;
    all.push(...generateInstancesForSlot(slot, fromDate, toDate));
  }
  return all;
}

export function getNextWeeks(baseDate: Date, weeks: number): { from: Date; to: Date } {
  return {
    from: baseDate,
    to: addWeeks(baseDate, weeks),
  };
}

export function getTimeSlotHour(time: string): number {
  const [h] = time.split(':').map(Number);
  return h;
}

export function formatWeekRange(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(start, 'M/d')} - ${format(end, 'M/d')}`;
}
