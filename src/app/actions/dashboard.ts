'use server';

import { db } from '@/db';
import {
  lessonInstances,
  reservations,
  members,
  coaches,
  lessonSlots,
  courts,
} from '@/db/schema';
import {
  toLessonInstance,
  toReservation,
  toLessonSlot,
  toCoach,
  toCourt,
  toMember,
} from '@/db/mappers';
import { eq, and, gte, lte, desc, count, inArray } from 'drizzle-orm';
import { format, subDays } from 'date-fns';
import type {
  DashboardStats,
  LessonInstanceWithDetails,
  ReservationWithDetails,
} from '@/domain/models';

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(subDays(new Date(), 6), 'yyyy-MM-dd');

  // 1. Today's instances with slot/coach/court via JOIN (1 query)
  // 2. Active member/coach counts (2 queries)
  // 3. Recent 10 reservations with full details via JOIN (1 query)
  // 4. Weekly trend aggregation (1 query)
  const [todayInstanceRows, memberCountRows, coachCountRows, recentResRows, weeklyRows] =
    await Promise.all([
      db
        .select()
        .from(lessonInstances)
        .innerJoin(lessonSlots, eq(lessonInstances.lessonSlotId, lessonSlots.id))
        .innerJoin(coaches, eq(lessonInstances.coachId, coaches.id))
        .innerJoin(courts, eq(lessonInstances.courtId, courts.id))
        .where(
          and(eq(lessonInstances.date, today), eq(lessonInstances.isCancelled, false))
        ),
      db
        .select({ count: count() })
        .from(members)
        .where(eq(members.isActive, true)),
      db
        .select({ count: count() })
        .from(coaches)
        .where(eq(coaches.isActive, true)),
      db
        .select()
        .from(reservations)
        .innerJoin(
          lessonInstances,
          eq(reservations.lessonInstanceId, lessonInstances.id)
        )
        .innerJoin(lessonSlots, eq(lessonInstances.lessonSlotId, lessonSlots.id))
        .innerJoin(members, eq(reservations.memberId, members.id))
        .innerJoin(coaches, eq(lessonInstances.coachId, coaches.id))
        .innerJoin(courts, eq(lessonInstances.courtId, courts.id))
        .orderBy(desc(reservations.reservedAt))
        .limit(10),
      db
        .select({
          date: lessonInstances.date,
          count: count(),
        })
        .from(reservations)
        .innerJoin(
          lessonInstances,
          eq(reservations.lessonInstanceId, lessonInstances.id)
        )
        .where(
          and(
            gte(lessonInstances.date, weekStart),
            lte(lessonInstances.date, today),
            eq(reservations.status, 'confirmed')
          )
        )
        .groupBy(lessonInstances.date),
    ]);

  // 5. Fetch reservations for today's instances (1 query)
  const todayInstanceIds = todayInstanceRows.map((r) => r.lesson_instances.id);
  const todayResRows =
    todayInstanceIds.length > 0
      ? await db
          .select()
          .from(reservations)
          .where(inArray(reservations.lessonInstanceId, todayInstanceIds))
      : [];
  const todayReservations = todayResRows.map(toReservation);

  // Build today's instance details
  const todayConfirmed = todayReservations.filter(
    (r) => r.status === 'confirmed'
  ).length;
  const totalCapacity = todayInstanceRows.reduce(
    (sum, r) => sum + r.lesson_instances.maxCapacity,
    0
  );
  const reservationRate =
    totalCapacity > 0
      ? Math.round((todayConfirmed / totalCapacity) * 100)
      : 0;

  const upcomingLessonsToday: LessonInstanceWithDetails[] = todayInstanceRows
    .map((row) => {
      const instance = toLessonInstance(row.lesson_instances);
      const instRes = todayReservations.filter(
        (r) => r.lessonInstanceId === instance.id
      );
      const confirmed = instRes.filter(
        (r) => r.status === 'confirmed'
      ).length;
      const waitlisted = instRes.filter(
        (r) => r.status === 'waitlisted'
      ).length;
      return {
        ...instance,
        lessonSlot: toLessonSlot(row.lesson_slots),
        coach: toCoach(row.coaches),
        court: toCourt(row.courts),
        reservations: instRes,
        currentBookings: confirmed,
        waitlistCount: waitlisted,
        availableSpots: Math.max(0, instance.maxCapacity - confirmed),
      };
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Build recent reservations
  const recentReservations: ReservationWithDetails[] = recentResRows.map(
    (row) => ({
      ...toReservation(row.reservations),
      member: toMember(row.members),
      lessonInstance: toLessonInstance(row.lesson_instances),
      lessonSlot: toLessonSlot(row.lesson_slots),
      coach: toCoach(row.coaches),
      court: toCourt(row.courts),
    })
  );

  // Build weekly trend
  const weeklyTrendMap = new Map(
    weeklyRows.map((r) => [r.date, Number(r.count)])
  );
  const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    return { date, count: weeklyTrendMap.get(date) ?? 0 };
  });

  return {
    todayLessonCount: todayInstanceRows.length,
    totalMembers: Number(memberCountRows[0].count),
    totalCoaches: Number(coachCountRows[0].count),
    todayReservationCount: todayConfirmed,
    reservationRate,
    upcomingLessonsToday,
    recentReservations,
    weeklyTrend,
  };
}
