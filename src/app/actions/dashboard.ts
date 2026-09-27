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
import { eq } from 'drizzle-orm';
import { format, subDays } from 'date-fns';
import type {
  DashboardStats,
  LessonInstanceWithDetails,
  ReservationWithDetails,
} from '@/domain/models';

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = format(new Date(), 'yyyy-MM-dd');

  const [allInstRows, allResRows, allMemberRows, allCoachRows] = await Promise.all([
    db.select().from(lessonInstances),
    db.select().from(reservations),
    db.select().from(members),
    db.select().from(coaches),
  ]);

  const allInstances = allInstRows.map(toLessonInstance);
  const allReservations = allResRows.map(toReservation);
  const allMembers = allMemberRows.map(toMember);
  const allCoaches = allCoachRows;

  const todayInstances = allInstances.filter(
    (i) => i.date === today && !i.isCancelled
  );
  const todayReservations = allReservations.filter((r) => {
    const instance = allInstances.find((i) => i.id === r.lessonInstanceId);
    return instance?.date === today && r.status === 'confirmed';
  });

  const totalCapacity = todayInstances.reduce(
    (sum, i) => sum + i.maxCapacity,
    0
  );
  const reservationRate =
    totalCapacity > 0
      ? Math.round((todayReservations.length / totalCapacity) * 100)
      : 0;

  // Upcoming lessons today with details
  const upcomingLessonsToday: LessonInstanceWithDetails[] = [];
  for (const instance of todayInstances) {
    const [slotRows, coachRows, courtRows] = await Promise.all([
      db
        .select()
        .from(lessonSlots)
        .where(eq(lessonSlots.id, instance.lessonSlotId)),
      db.select().from(coaches).where(eq(coaches.id, instance.coachId)),
      db.select().from(courts).where(eq(courts.id, instance.courtId)),
    ]);
    if (
      slotRows.length === 0 ||
      coachRows.length === 0 ||
      courtRows.length === 0
    )
      continue;

    const instReservations = allReservations.filter(
      (r) => r.lessonInstanceId === instance.id
    );
    const confirmed = instReservations.filter(
      (r) => r.status === 'confirmed'
    ).length;
    const waitlisted = instReservations.filter(
      (r) => r.status === 'waitlisted'
    ).length;

    upcomingLessonsToday.push({
      ...instance,
      lessonSlot: toLessonSlot(slotRows[0]),
      coach: toCoach(coachRows[0]),
      court: toCourt(courtRows[0]),
      reservations: instReservations,
      currentBookings: confirmed,
      waitlistCount: waitlisted,
      availableSpots: Math.max(0, instance.maxCapacity - confirmed),
    });
  }
  upcomingLessonsToday.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Recent reservations (last 10)
  const sortedRes = [...allReservations].sort((a, b) =>
    b.reservedAt.localeCompare(a.reservedAt)
  );
  const recentReservations: ReservationWithDetails[] = [];
  for (const r of sortedRes.slice(0, 10)) {
    const instance = allInstances.find((i) => i.id === r.lessonInstanceId);
    if (!instance) continue;

    const [slotRows, memberRows, coachRows, courtRows] = await Promise.all([
      db
        .select()
        .from(lessonSlots)
        .where(eq(lessonSlots.id, instance.lessonSlotId)),
      db.select().from(members).where(eq(members.id, r.memberId)),
      db.select().from(coaches).where(eq(coaches.id, instance.coachId)),
      db.select().from(courts).where(eq(courts.id, instance.courtId)),
    ]);
    if (
      slotRows.length === 0 ||
      memberRows.length === 0 ||
      coachRows.length === 0 ||
      courtRows.length === 0
    )
      continue;

    recentReservations.push({
      ...r,
      member: toMember(memberRows[0]),
      lessonInstance: instance,
      lessonSlot: toLessonSlot(slotRows[0]),
      coach: toCoach(coachRows[0]),
      court: toCourt(courtRows[0]),
    });
  }

  // Weekly trend
  const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const count = allReservations.filter((r) => {
      const inst = allInstances.find((inst) => inst.id === r.lessonInstanceId);
      return inst?.date === date && r.status === 'confirmed';
    }).length;
    return { date, count };
  });

  return {
    todayLessonCount: todayInstances.length,
    totalMembers: allMembers.filter((m) => m.isActive).length,
    totalCoaches: allCoaches.filter((c) => c.isActive).length,
    todayReservationCount: todayReservations.length,
    reservationRate,
    upcomingLessonsToday,
    recentReservations,
    weeklyTrend,
  };
}
