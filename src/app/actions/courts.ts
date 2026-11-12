'use server';

import { db } from '@/db';
import { courts } from '@/db/schema';
import { toCourt } from '@/db/mappers';
import { eq } from 'drizzle-orm';
import type { Court } from '@/domain/models';
import { requireAuth } from '@/app/actions/auth';
import { withAdminWrite } from '@/app/actions/admin-guard';
import { buildPartialUpdate } from '@/lib/db-utils';

export async function getCourts(): Promise<Court[]> {
  await requireAuth();
  const rows = await db.select().from(courts).limit(500);
  return rows.map(toCourt);
}

export async function getCourtById(id: string): Promise<Court | null> {
  await requireAuth();
  const rows = await db.select().from(courts).where(eq(courts.id, id));
  return rows.length > 0 ? toCourt(rows[0]) : null;
}

export async function createCourt(data: Omit<Court, 'id'>): Promise<Court> {
  return withAdminWrite(async () => {
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
  });
}

const COURT_UPDATE_KEYS = ['name', 'type', 'surface', 'capacity', 'isActive'] as const;

export async function updateCourt(id: string, data: Partial<Court>): Promise<Court | null> {
  return withAdminWrite(async () => {
    const values = buildPartialUpdate(data, COURT_UPDATE_KEYS);
    const rows = await db.update(courts).set(values).where(eq(courts.id, id)).returning();
    return rows.length > 0 ? toCourt(rows[0]) : null;
  });
}

export async function deleteCourt(id: string): Promise<void> {
  return withAdminWrite(async () => {
    await db.delete(courts).where(eq(courts.id, id));
  });
}
