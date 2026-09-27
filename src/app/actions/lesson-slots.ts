'use server';

import { db } from '@/db';
import { lessonSlots } from '@/db/schema';
import { toLessonSlot } from '@/db/mappers';
import { eq } from 'drizzle-orm';
import type { LessonSlot } from '@/domain/models';

export async function getLessonSlots(): Promise<LessonSlot[]> {
  const rows = await db.select().from(lessonSlots);
  return rows.map(toLessonSlot);
}

export async function getLessonSlotById(id: string): Promise<LessonSlot | null> {
  const rows = await db.select().from(lessonSlots).where(eq(lessonSlots.id, id));
  return rows.length > 0 ? toLessonSlot(rows[0]) : null;
}

export async function createLessonSlot(
  data: Omit<LessonSlot, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LessonSlot> {
  const rows = await db
    .insert(lessonSlots)
    .values({
      title: data.title,
      level: data.level,
      coachId: data.coachId,
      courtId: data.courtId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      maxCapacity: data.maxCapacity,
      isRecurring: data.isRecurring,
      recurrenceType: data.recurrenceType,
      recurrenceStartDate: data.recurrenceStartDate,
      recurrenceEndDate: data.recurrenceEndDate,
      specificDate: data.specificDate,
      monthlyWeekNumber: data.monthlyWeekNumber,
      isActive: data.isActive,
    })
    .returning();
  return toLessonSlot(rows[0]);
}

export async function updateLessonSlot(
  id: string,
  data: Partial<LessonSlot>
): Promise<LessonSlot | null> {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) values.title = data.title;
  if (data.level !== undefined) values.level = data.level;
  if (data.coachId !== undefined) values.coachId = data.coachId;
  if (data.courtId !== undefined) values.courtId = data.courtId;
  if (data.dayOfWeek !== undefined) values.dayOfWeek = data.dayOfWeek;
  if (data.startTime !== undefined) values.startTime = data.startTime;
  if (data.endTime !== undefined) values.endTime = data.endTime;
  if (data.maxCapacity !== undefined) values.maxCapacity = data.maxCapacity;
  if (data.isRecurring !== undefined) values.isRecurring = data.isRecurring;
  if (data.recurrenceType !== undefined) values.recurrenceType = data.recurrenceType;
  if (data.recurrenceStartDate !== undefined) values.recurrenceStartDate = data.recurrenceStartDate;
  if (data.recurrenceEndDate !== undefined) values.recurrenceEndDate = data.recurrenceEndDate;
  if (data.specificDate !== undefined) values.specificDate = data.specificDate;
  if (data.monthlyWeekNumber !== undefined) values.monthlyWeekNumber = data.monthlyWeekNumber;
  if (data.isActive !== undefined) values.isActive = data.isActive;

  const rows = await db.update(lessonSlots).set(values).where(eq(lessonSlots.id, id)).returning();
  return rows.length > 0 ? toLessonSlot(rows[0]) : null;
}

export async function deleteLessonSlot(id: string): Promise<void> {
  await db.delete(lessonSlots).where(eq(lessonSlots.id, id));
}
