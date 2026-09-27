'use server';

import { db } from '@/db';
import { lessonInstances, lessonSlots, coaches, courts, reservations } from '@/db/schema';
import { toLessonInstance, toLessonSlot, toCoach, toCourt, toReservation } from '@/db/mappers';
import { eq, and, gte, lte } from 'drizzle-orm';
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
  const instRows = await db
    .select()
    .from(lessonInstances)
    .where(eq(lessonInstances.id, instanceId));
  if (instRows.length === 0) return null;
  const instance = toLessonInstance(instRows[0]);

  const [slotRows, coachRows, courtRows, resRows] = await Promise.all([
    db.select().from(lessonSlots).where(eq(lessonSlots.id, instance.lessonSlotId)),
    db.select().from(coaches).where(eq(coaches.id, instance.coachId)),
    db.select().from(courts).where(eq(courts.id, instance.courtId)),
    db
      .select()
      .from(reservations)
      .where(eq(reservations.lessonInstanceId, instanceId)),
  ]);

  if (slotRows.length === 0 || coachRows.length === 0 || courtRows.length === 0) return null;

  const slot = toLessonSlot(slotRows[0]);
  const coach = toCoach(coachRows[0]);
  const court = toCourt(courtRows[0]);
  const ress = resRows.map(toReservation);
  const confirmed = ress.filter((r) => r.status === 'confirmed').length;
  const waitlisted = ress.filter((r) => r.status === 'waitlisted').length;

  return {
    ...instance,
    lessonSlot: slot,
    coach,
    court,
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
  let instRows = await db
    .select()
    .from(lessonInstances)
    .where(eq(lessonInstances.date, date));

  if (!includeCancelled) {
    instRows = instRows.filter((r) => !r.isCancelled);
  }

  const results: LessonInstanceWithDetails[] = [];

  for (const instRow of instRows) {
    const instance = toLessonInstance(instRow);
    const [slotRows, coachRows, courtRows, resRows] = await Promise.all([
      db.select().from(lessonSlots).where(eq(lessonSlots.id, instance.lessonSlotId)),
      db.select().from(coaches).where(eq(coaches.id, instance.coachId)),
      db.select().from(courts).where(eq(courts.id, instance.courtId)),
      db
        .select()
        .from(reservations)
        .where(eq(reservations.lessonInstanceId, instance.id)),
    ]);

    if (slotRows.length === 0 || coachRows.length === 0 || courtRows.length === 0) continue;

    const ress = resRows.map(toReservation);
    const confirmed = ress.filter((r) => r.status === 'confirmed').length;
    const waitlisted = ress.filter((r) => r.status === 'waitlisted').length;

    results.push({
      ...instance,
      lessonSlot: toLessonSlot(slotRows[0]),
      coach: toCoach(coachRows[0]),
      court: toCourt(courtRows[0]),
      reservations: ress,
      currentBookings: confirmed,
      waitlistCount: waitlisted,
      availableSpots: Math.max(0, instance.maxCapacity - confirmed),
    });
  }

  return results.sort((a, b) => a.startTime.localeCompare(b.startTime));
}
