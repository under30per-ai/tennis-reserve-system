import { describe, it, expect } from 'vitest';
import {
  getWeekDays,
  getMonthDays,
  getCalendarMonthDays,
  generateInstancesForSlot,
  generateAllInstances,
  getNextWeeks,
  getTimeSlotHour,
  formatWeekRange,
} from '@/lib/calendar-utils';
import type { LessonSlot } from '@/types';

function makeSlot(overrides: Partial<LessonSlot> = {}): LessonSlot {
  return {
    id: 'slot-1',
    title: 'Test',
    level: 'beginner',
    coachId: 'c1',
    courtId: 'ct1',
    dayOfWeek: 1, // Monday
    startTime: '10:00',
    endTime: '11:00',
    maxCapacity: 8,
    isRecurring: true,
    recurrenceType: 'weekly',
    recurrenceStartDate: '2024-01-01',
    recurrenceEndDate: null,
    specificDate: null,
    monthlyWeekNumber: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('getWeekDays', () => {
  it('returns 7 days starting from Monday', () => {
    const days = getWeekDays(new Date('2024-03-06')); // Wednesday
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1); // Monday
    expect(days[6].getDay()).toBe(0); // Sunday
  });
});

describe('getMonthDays', () => {
  it('returns correct number of days for February 2024 (leap year)', () => {
    const days = getMonthDays(new Date('2024-02-15'));
    expect(days).toHaveLength(29);
  });

  it('returns 31 days for January', () => {
    const days = getMonthDays(new Date('2024-01-10'));
    expect(days).toHaveLength(31);
  });
});

describe('getCalendarMonthDays', () => {
  it('returns at least 28 days and starts on Monday', () => {
    const days = getCalendarMonthDays(new Date('2024-03-15'));
    expect(days.length).toBeGreaterThanOrEqual(28);
    expect(days[0].getDay()).toBe(1); // Monday
  });
});

describe('generateInstancesForSlot', () => {
  it('generates weekly instances for each matching day', () => {
    const slot = makeSlot({ dayOfWeek: 1, recurrenceType: 'weekly' });
    // 2024-01-01 (Mon) to 2024-01-31 (Wed) — 5 Mondays
    const instances = generateInstancesForSlot(
      slot,
      new Date('2024-01-01'),
      new Date('2024-01-31')
    );
    expect(instances).toHaveLength(5);
    expect(instances[0].date).toBe('2024-01-01');
    expect(instances[4].date).toBe('2024-01-29');
  });

  it('generates biweekly instances', () => {
    const slot = makeSlot({
      dayOfWeek: 1,
      recurrenceType: 'biweekly',
      recurrenceStartDate: '2024-01-01',
    });
    const instances = generateInstancesForSlot(
      slot,
      new Date('2024-01-01'),
      new Date('2024-01-31')
    );
    // Mondays: 1, 8, 15, 22, 29 — biweekly from Jan 1: 1, 15, 29
    expect(instances).toHaveLength(3);
    expect(instances[0].date).toBe('2024-01-01');
    expect(instances[1].date).toBe('2024-01-15');
    expect(instances[2].date).toBe('2024-01-29');
  });

  it('generates monthly instances for Nth week', () => {
    const slot = makeSlot({
      dayOfWeek: 1,
      recurrenceType: 'monthly',
      monthlyWeekNumber: 2, // 2nd Monday
    });
    const instances = generateInstancesForSlot(
      slot,
      new Date('2024-01-01'),
      new Date('2024-03-31')
    );
    // 2nd Monday: Jan 8, Feb 12, Mar 11
    expect(instances).toHaveLength(3);
    expect(instances[0].date).toBe('2024-01-08');
    expect(instances[1].date).toBe('2024-02-12');
    expect(instances[2].date).toBe('2024-03-11');
  });

  it('generates spot (none) instance within range', () => {
    const slot = makeSlot({
      recurrenceType: 'none',
      specificDate: '2024-02-15',
    });
    const instances = generateInstancesForSlot(
      slot,
      new Date('2024-02-01'),
      new Date('2024-02-28')
    );
    expect(instances).toHaveLength(1);
    expect(instances[0].date).toBe('2024-02-15');
  });

  it('returns empty for spot instance outside range', () => {
    const slot = makeSlot({
      recurrenceType: 'none',
      specificDate: '2024-03-15',
    });
    const instances = generateInstancesForSlot(
      slot,
      new Date('2024-02-01'),
      new Date('2024-02-28')
    );
    expect(instances).toHaveLength(0);
  });

  it('returns empty for none type without specificDate', () => {
    const slot = makeSlot({
      recurrenceType: 'none',
      specificDate: null,
    });
    const instances = generateInstancesForSlot(
      slot,
      new Date('2024-01-01'),
      new Date('2024-01-31')
    );
    expect(instances).toHaveLength(0);
  });

  it('copies slot fields to instances', () => {
    const slot = makeSlot();
    const instances = generateInstancesForSlot(
      slot,
      new Date('2024-01-01'),
      new Date('2024-01-07')
    );
    expect(instances.length).toBeGreaterThan(0);
    expect(instances[0].coachId).toBe('c1');
    expect(instances[0].courtId).toBe('ct1');
    expect(instances[0].startTime).toBe('10:00');
    expect(instances[0].endTime).toBe('11:00');
    expect(instances[0].maxCapacity).toBe(8);
    expect(instances[0].isCancelled).toBe(false);
  });
});

describe('generateAllInstances', () => {
  it('skips inactive slots', () => {
    const slots = [
      makeSlot({ id: 'active', isActive: true }),
      makeSlot({ id: 'inactive', isActive: false }),
    ];
    const instances = generateAllInstances(
      slots,
      new Date('2024-01-01'),
      new Date('2024-01-07')
    );
    expect(instances.every((i) => i.lessonSlotId === 'active')).toBe(true);
  });

  it('combines instances from multiple active slots', () => {
    const slots = [
      makeSlot({ id: 'a', dayOfWeek: 1 }),
      makeSlot({ id: 'b', dayOfWeek: 3 }), // Wednesday
    ];
    const instances = generateAllInstances(
      slots,
      new Date('2024-01-01'),
      new Date('2024-01-07')
    );
    expect(instances.length).toBeGreaterThan(1);
  });
});

describe('getNextWeeks', () => {
  it('returns from/to dates with correct span', () => {
    const base = new Date('2024-01-01');
    const range = getNextWeeks(base, 4);
    expect(range.from).toEqual(base);
    const diff = (range.to.getTime() - range.from.getTime()) / (7 * 24 * 60 * 60 * 1000);
    expect(diff).toBe(4);
  });
});

describe('getTimeSlotHour', () => {
  it('returns hour from HH:mm', () => {
    expect(getTimeSlotHour('09:30')).toBe(9);
    expect(getTimeSlotHour('14:00')).toBe(14);
    expect(getTimeSlotHour('23:59')).toBe(23);
  });
});

describe('formatWeekRange', () => {
  it('formats week range as M/d - M/d', () => {
    const result = formatWeekRange(new Date('2024-03-06'));
    expect(result).toMatch(/^\d{1,2}\/\d{1,2} - \d{1,2}\/\d{1,2}$/);
  });
});
