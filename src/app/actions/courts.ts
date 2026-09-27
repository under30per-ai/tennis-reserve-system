'use server';

import { db } from '@/db';
import { courts } from '@/db/schema';
import { toCourt } from '@/db/mappers';
import { eq } from 'drizzle-orm';
import type { Court } from '@/domain/models';

export async function getCourts(): Promise<Court[]> {
  const rows = await db.select().from(courts);
  return rows.map(toCourt);
}

export async function getCourtById(id: string): Promise<Court | null> {
  const rows = await db.select().from(courts).where(eq(courts.id, id));
  return rows.length > 0 ? toCourt(rows[0]) : null;
}

export async function createCourt(data: Omit<Court, 'id'>): Promise<Court> {
  const rows = await db
    .insert(courts)
    .values({
      name: data.name,
      type: data.type,
      surface: data.surface,
      capacity: data.capacity,
      isActive: data.isActive,
    })
    .returning();
  return toCourt(rows[0]);
}

export async function updateCourt(id: string, data: Partial<Court>): Promise<Court | null> {
  const values: Record<string, unknown> = {};
  if (data.name !== undefined) values.name = data.name;
  if (data.type !== undefined) values.type = data.type;
  if (data.surface !== undefined) values.surface = data.surface;
  if (data.capacity !== undefined) values.capacity = data.capacity;
  if (data.isActive !== undefined) values.isActive = data.isActive;

  const rows = await db.update(courts).set(values).where(eq(courts.id, id)).returning();
  return rows.length > 0 ? toCourt(rows[0]) : null;
}

export async function deleteCourt(id: string): Promise<void> {
  await db.delete(courts).where(eq(courts.id, id));
}
