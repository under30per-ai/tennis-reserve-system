'use server';

import { db } from '@/db';
import { lessonSlots } from '@/db/schema';
import { toLessonSlot } from '@/db/mappers';
import { eq } from 'drizzle-orm';
import type { LessonSlot } from '@/domain/models';
import { requireAuth } from '@/app/actions/auth';
import { withAdminWrite } from '@/app/actions/admin-guard';
import { buildPartialUpdate } from '@/lib/db-utils';

export async function getLessonSlots(): Promise<LessonSlot[]> {
  await requireAuth();
  const rows = await db.select().from(lessonSlots).limit(500);
  return rows.map(toLessonSlot);
}

export async function getLessonSlotById(id: string): Promise<LessonSlot | null> {
  await requireAuth();
  const rows = await db.select().from(lessonSlots).where(eq(lessonSlots.id, id));
  return rows.length > 0 ? toLessonSlot(rows[0]) : null;
}

export async function createLessonSlot(
  data: Omit<LessonSlot, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LessonSlot> {
  return withAdminWrite(async () => {
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
  });
}

const LESSON_SLOT_UPDATE_KEYS = [
  'title', 'level', 'coachId', 'courtId', 'dayOfWeek',
  'startTime', 'endTime', 'maxCapacity', 'isRecurring', 'recurrenceType',
  'recurrenceStartDate', 'recurrenceEndDate', 'specificDate', 'monthlyWeekNumber', 'isActive',
] as const;

export async function updateLessonSlot(
  id: string,
  data: Partial<LessonSlot>
): Promise<LessonSlot | null> {
  return withAdminWrite(async () => {
    const values = buildPartialUpdate(data, LESSON_SLOT_UPDATE_KEYS, { updatedAt: new Date() });
    const rows = await db.update(lessonSlots).set(values).where(eq(lessonSlots.id, id)).returning();
    return rows.length > 0 ? toLessonSlot(rows[0]) : null;
  });
}

export async function deleteLessonSlot(id: string): Promise<void> {
  return withAdminWrite(async () => {
    await db.delete(lessonSlots).where(eq(lessonSlots.id, id));
  });
}
