'use server';

import { db } from '@/db';
import { lessonInstances, lessonSlots, coaches, courts, reservations } from '@/db/schema';
import { toLessonInstance, toLessonSlot, toCoach, toCourt, toReservation } from '@/db/mappers';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import type { LessonInstance, LessonInstanceWithDetails, LessonSlot } from '@/domain/models';
import { generateInstancesForSlot } from '@/lib/calendar-utils';
import { validateDateString } from '@/lib/validators';
import { requireAuth } from '@/app/actions/auth';
import { withAdminWrite } from '@/app/actions/admin-guard';
import { createNotificationInternal as createNotification } from '@/app/actions/notification-helper';
import { buildPartialUpdate } from '@/lib/db-utils';
import { writeAuditLog } from '@/lib/audit-log';

export async function getLessonInstances(): Promise<LessonInstance[]> {
  await requireAuth();
  const rows = await db.select().from(lessonInstances).limit(5000);
  return rows.map(toLessonInstance);
}

export async function getLessonInstanceById(id: string): Promise<LessonInstance | null> {
  await requireAuth();
  const rows = await db.select().from(lessonInstances).where(eq(lessonInstances.id, id));
  return rows.length > 0 ? toLessonInstance(rows[0]) : null;
}

const LESSON_INSTANCE_UPDATE_KEYS = [
  'coachId', 'courtId', 'startTime', 'endTime',
  'maxCapacity', 'isCancelled', 'cancelReason', 'notes',
] as const;

export async function updateLessonInstance(
  id: string,
  data: Partial<LessonInstance>
): Promise<LessonInstance | null> {
  return withAdminWrite(async () => {
    const values = buildPartialUpdate(data, LESSON_INSTANCE_UPDATE_KEYS);
    const rows = await db
      .update(lessonInstances)
      .set(values)
      .where(eq(lessonInstances.id, id))
      .returning();
    return rows.length > 0 ? toLessonInstance(rows[0]) : null;
  });
}

export async function getLessonInstancesByDate(date: string): Promise<LessonInstance[]> {
  await requireAuth();
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
  await requireAuth();
  const fromErr = validateDateString(from);
  const toErr = validateDateString(to);
  if (fromErr || toErr) throw new Error('日付の形式が不正です');
  const rows = await db
    .select()
    .from(lessonInstances)
    .where(and(gte(lessonInstances.date, from), lte(lessonInstances.date, to)));
  return rows.map(toLessonInstance);
}

export async function getLessonInstanceWithDetails(
  instanceId: string
): Promise<LessonInstanceWithDetails | null> {
  await requireAuth();
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
  return withAdminWrite(async () => {
  await writeAuditLog({ actorId: 'admin', action: 'cancel', targetType: 'lessonInstance', targetId: id, details: `レッスンキャンセル: ${reason}` });
  await db
    .update(lessonInstances)
    .set({ isCancelled: true, cancelReason: reason })
    .where(eq(lessonInstances.id, id));

  // Notify affected members
  try {
    const instRows = await db.select().from(lessonInstances).where(eq(lessonInstances.id, id));
    if (instRows.length > 0) {
      const instance = toLessonInstance(instRows[0]);
      const resRows = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.lessonInstanceId, id),
            inArray(reservations.status, ['confirmed', 'waitlisted'])
          )
        );
      for (const r of resRows) {
        await createNotification(
          r.memberId,
          'lesson_cancel',
          'レッスンが中止になりました',
          `${instance.date} ${instance.startTime}〜${instance.endTime} のレッスンが中止になりました。理由: ${reason}`,
          id
        );
      }
    }
  } catch {
    // 通知失敗はキャンセル操作には影響させない
  }
  });
}

export async function generateLessonInstances(
  slot: LessonSlot,
  fromDate: Date,
  toDate: Date
): Promise<LessonInstance[]> {
  return withAdminWrite(async () => {
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
  });
}

export async function getInstancesWithDetailsForDate(
  date: string,
  includeCancelled = false
): Promise<LessonInstanceWithDetails[]> {
  await requireAuth();
  return getInstancesWithDetailsForDateRange(date, date, includeCancelled);
}

export async function getInstancesWithDetailsForDateRange(
  from: string,
  to: string,
  includeCancelled = false
): Promise<LessonInstanceWithDetails[]> {
  await requireAuth();
  const fromErr = validateDateString(from);
  const toErr = validateDateString(to);
  if (fromErr || toErr) throw new Error('日付の形式が不正です');
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
