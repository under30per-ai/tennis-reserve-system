'use server';

import { db } from '@/db';
import {
  lessonRecords,
  lessonInstances,
  lessonSlots,
  coaches,
  courts,
  reservations,
} from '@/db/schema';
import {
  toLessonRecord,
  toLessonInstance,
  toLessonSlot,
  toCoach,
  toCourt,
  toReservation,
} from '@/db/mappers';
import { eq, and, inArray } from 'drizzle-orm';
import type {
  LessonRecord,
  LessonRecordWithDetails,
  MemberLessonHistoryEntry,
  Reservation,
} from '@/domain/models';

export async function getLessonRecords(): Promise<LessonRecord[]> {
  const rows = await db.select().from(lessonRecords);
  return rows.map(toLessonRecord);
}

export async function createLessonRecord(
  data: Omit<LessonRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LessonRecord> {
  const existing = await db
    .select()
    .from(lessonRecords)
    .where(eq(lessonRecords.lessonInstanceId, data.lessonInstanceId));
  if (existing.length > 0) throw new Error('このレッスンの記録は既に存在します');

  const rows = await db
    .insert(lessonRecords)
    .values({
      lessonInstanceId: data.lessonInstanceId,
      theme: data.theme,
      content: data.content,
      memberNotes: data.memberNotes,
    })
    .returning();
  return toLessonRecord(rows[0]);
}

export async function updateLessonRecord(
  id: string,
  data: Partial<LessonRecord>
): Promise<LessonRecord | null> {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (data.theme !== undefined) values.theme = data.theme;
  if (data.content !== undefined) values.content = data.content;
  if (data.memberNotes !== undefined) values.memberNotes = data.memberNotes;

  const rows = await db
    .update(lessonRecords)
    .set(values)
    .where(eq(lessonRecords.id, id))
    .returning();
  return rows.length > 0 ? toLessonRecord(rows[0]) : null;
}

export async function getLessonRecordByInstanceId(
  instanceId: string
): Promise<LessonRecord | null> {
  const rows = await db
    .select()
    .from(lessonRecords)
    .where(eq(lessonRecords.lessonInstanceId, instanceId));
  return rows.length > 0 ? toLessonRecord(rows[0]) : null;
}

export async function getLessonRecordWithDetails(
  id: string
): Promise<LessonRecordWithDetails | null> {
  const rows = await db
    .select()
    .from(lessonRecords)
    .innerJoin(lessonInstances, eq(lessonRecords.lessonInstanceId, lessonInstances.id))
    .innerJoin(lessonSlots, eq(lessonInstances.lessonSlotId, lessonSlots.id))
    .innerJoin(coaches, eq(lessonInstances.coachId, coaches.id))
    .innerJoin(courts, eq(lessonInstances.courtId, courts.id))
    .where(eq(lessonRecords.id, id));

  if (rows.length === 0) return null;
  const row = rows[0];

  return {
    ...toLessonRecord(row.lesson_records),
    lessonInstance: toLessonInstance(row.lesson_instances),
    lessonSlot: toLessonSlot(row.lesson_slots),
    coach: toCoach(row.coaches),
    court: toCourt(row.courts),
  };
}

export async function getMemberLessonHistory(
  memberId: string
): Promise<MemberLessonHistoryEntry[]> {
  const rows = await db
    .select()
    .from(lessonRecords)
    .innerJoin(lessonInstances, eq(lessonRecords.lessonInstanceId, lessonInstances.id))
    .innerJoin(lessonSlots, eq(lessonInstances.lessonSlotId, lessonSlots.id))
    .innerJoin(coaches, eq(lessonInstances.coachId, coaches.id))
    .innerJoin(courts, eq(lessonInstances.courtId, courts.id));

  const entries: MemberLessonHistoryEntry[] = [];
  for (const row of rows) {
    const record = toLessonRecord(row.lesson_records);
    const memberNote = record.memberNotes.find((n) => n.memberId === memberId);
    if (!memberNote) continue;

    entries.push({
      record,
      lessonInstance: toLessonInstance(row.lesson_instances),
      lessonSlot: toLessonSlot(row.lesson_slots),
      coach: toCoach(row.coaches),
      court: toCourt(row.courts),
      memberNote,
    });
  }

  return entries.sort((a, b) =>
    b.lessonInstance.date.localeCompare(a.lessonInstance.date)
  );
}

export async function getReservationsForInstance(
  instanceId: string
): Promise<Reservation[]> {
  const rows = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.lessonInstanceId, instanceId),
        inArray(reservations.status, ['confirmed', 'waitlisted'])
      )
    );
  return rows.map(toReservation);
}
