'use server';

import { db } from '@/db';
import { lessonInstances, lessonSlots, coaches, courts, reservations } from '@/db/schema';
import { toLessonInstance, toLessonSlot, toCoach, toCourt, toReservation } from '@/db/mappers';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import type { LessonInstance, LessonInstanceWithDetails, LessonSlot } from '@/domain/models';
import { generateInstancesForSlot } from '@/lib/calendar-utils';

export async function getLessonInstances(): Promise<LessonInstance[]> {
  const rows = await db.select().from(lessonInstances);
  return rows.map(toLessonInstance);
}

export async function getLessonInstanceById(id: string): Promise<LessonInstance | null> {
  const rows = await db.select().from(lessonInstances).where(eq(lessonInstances.id, id));
  return rows.length > 0 ? toLessonInstance(rows[0]) : null;
}

export async function updateLessonInstance(
  id: string,
  data: Partial<LessonInstance>
): Promise<LessonInstance | null> {
  const values: Record<string, unknown> = {};
  if (data.coachId !== undefined) values.coachId = data.coachId;
  if (data.courtId !== undefined) values.courtId = data.courtId;
  if (data.startTime !== undefined) values.startTime = data.startTime;
  if (data.endTime !== undefined) values.endTime = data.endTime;
  if (data.maxCapacity !== undefined) values.maxCapacity = data.maxCapacity;
  if (data.isCancelled !== undefined) values.isCancelled = data.isCancelled;
  if (data.cancelReason !== undefined) values.cancelReason = data.cancelReason;
  if (data.notes !== undefined) values.notes = data.notes;

  const rows = await db
    .update(lessonInstances)
    .set(values)
    .where(eq(lessonInstances.id, id))
    .returning();
  return rows.length > 0 ? toLessonInstance(rows[0]) : null;
}

export async function getLessonInstancesByDate(date: string): Promise<LessonInstance[]> {
  const rows = await db
    .select()
    .from(lessonInstances)
    .where(eq(lessonInstances.date, date));
  return rows.map(toLessonInstance);
}

export async function getLessonInstancesByDateRange(
  from: string,
  to: string
): Promise<LessonInstance[]> {
  const rows = await db
    .select()
    .from(lessonInstances)
    .where(and(gte(lessonInstances.date, from), lte(lessonInstances.date, to)));
  return rows.map(toLessonInstance);
}

export async function getLessonInstanceWithDetails(
  instanceId: string
): Promise<LessonInstanceWithDetails | null> {
  const [rows, resRows] = await Promise.all([
    db
      .select()
      .from(lessonInstances)
      .innerJoin(lessonSlots, eq(lessonInstances.lessonSlotId, lessonSlots.id))
      .innerJoin(coaches, eq(lessonInstances.coachId, coaches.id))
      .innerJoin(courts, eq(lessonInstances.courtId, courts.id))
      .where(eq(lessonInstances.id, instanceId)),
    db
      .select()
      .from(reservations)
      .where(eq(reservations.lessonInstanceId, instanceId)),
  ]);

  if (rows.length === 0) return null;
  const row = rows[0];
  const instance = toLessonInstance(row.lesson_instances);
  const ress = resRows.map(toReservation);
  const confirmed = ress.filter((r) => r.status === 'confirmed').length;
  const waitlisted = ress.filter((r) => r.status === 'waitlisted').length;

  return {
    ...instance,
    lessonSlot: toLessonSlot(row.lesson_slots),
    coach: toCoach(row.coaches),
    court: toCourt(row.courts),
    reservations: ress,
    currentBookings: confirmed,
    waitlistCount: waitlisted,
    availableSpots: Math.max(0, instance.maxCapacity - confirmed),
  };
}

export async function cancelLessonInstance(id: string, reason: string): Promise<void> {
  await db
    .update(lessonInstances)
    .set({ isCancelled: true, cancelReason: reason })
    .where(eq(lessonInstances.id, id));
}

export async function generateLessonInstances(
  slot: LessonSlot,
  fromDate: Date,
  toDate: Date
): Promise<LessonInstance[]> {
  const generated = generateInstancesForSlot(slot, fromDate, toDate);
  if (generated.length === 0) return [];

  const rows = await db
    .insert(lessonInstances)
    .values(
      generated.map((inst) => ({
        lessonSlotId: inst.lessonSlotId,
        date: inst.date,
        coachId: inst.coachId,
        courtId: inst.courtId,
        startTime: inst.startTime,
        endTime: inst.endTime,
        maxCapacity: inst.maxCapacity,
        isCancelled: inst.isCancelled,
        cancelReason: inst.cancelReason,
        notes: inst.notes,
      }))
    )
    .returning();
  return rows.map(toLessonInstance);
}

export async function getInstancesWithDetailsForDate(
  date: string,
  includeCancelled = false
): Promise<LessonInstanceWithDetails[]> {
  return getInstancesWithDetailsForDateRange(date, date, includeCancelled);
}

export async function getInstancesWithDetailsForDateRange(
  from: string,
  to: string,
  includeCancelled = false
): Promise<LessonInstanceWithDetails[]> {
  const dateFilter = and(gte(lessonInstances.date, from), lte(lessonInstances.date, to));
  const rows = await db
    .select()
    .from(lessonInstances)
    .innerJoin(lessonSlots, eq(lessonInstances.lessonSlotId, lessonSlots.id))
    .innerJoin(coaches, eq(lessonInstances.coachId, coaches.id))
    .innerJoin(courts, eq(lessonInstances.courtId, courts.id))
    .where(
      includeCancelled
        ? dateFilter
        : and(dateFilter, eq(lessonInstances.isCancelled, false))
    );

  const instanceIds = rows.map((r) => r.lesson_instances.id);
  const resRows =
    instanceIds.length > 0
      ? await db
          .select()
          .from(reservations)
          .where(inArray(reservations.lessonInstanceId, instanceIds))
      : [];
  const allRes = resRows.map(toReservation);

  return rows
    .map((row) => {
      const instance = toLessonInstance(row.lesson_instances);
      const instRes = allRes.filter((r) => r.lessonInstanceId === instance.id);
      const confirmed = instRes.filter((r) => r.status === 'confirmed').length;
      const waitlisted = instRes.filter((r) => r.status === 'waitlisted').length;
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
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
}
