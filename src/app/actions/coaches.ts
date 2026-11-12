'use server';

import { db } from '@/db';
import { coaches } from '@/db/schema';
import { toCoach } from '@/db/mappers';
import { eq } from 'drizzle-orm';
import type { Coach } from '@/domain/models';
import { getRandomAvatarColor } from '@/lib/utils';
import { requireAuth } from '@/app/actions/auth';
import { withAdminWrite } from '@/app/actions/admin-guard';
import { buildPartialUpdate } from '@/lib/db-utils';

export async function getCoaches(): Promise<Coach[]> {
  await requireAuth();
  const rows = await db.select().from(coaches).limit(500);
  return rows.map(toCoach);
}

export async function getCoachById(id: string): Promise<Coach | null> {
  await requireAuth();
  const rows = await db.select().from(coaches).where(eq(coaches.id, id));
  return rows.length > 0 ? toCoach(rows[0]) : null;
}

export async function createCoach(
  data: Omit<Coach, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'>
): Promise<Coach> {
  return withAdminWrite(async () => {
    const rows = await db
      .insert(coaches)
      .values({
        name: data.name,
        nameKana: data.nameKana,
        email: data.email,
        phone: data.phone,
        specialties: data.specialties,
        bio: data.bio,
        certifications: data.certifications,
        avatarColor: getRandomAvatarColor(),
        isActive: data.isActive,
      })
      .returning();
    return toCoach(rows[0]);
  });
}

const COACH_UPDATE_KEYS = [
  'name', 'nameKana', 'email', 'phone', 'specialties',
  'bio', 'certifications', 'avatarColor', 'isActive',
] as const;

export async function updateCoach(id: string, data: Partial<Coach>): Promise<Coach | null> {
  return withAdminWrite(async () => {
    const values = buildPartialUpdate(data, COACH_UPDATE_KEYS, { updatedAt: new Date() });
    const rows = await db.update(coaches).set(values).where(eq(coaches.id, id)).returning();
    return rows.length > 0 ? toCoach(rows[0]) : null;
  });
}

export async function deleteCoach(id: string): Promise<void> {
  return withAdminWrite(async () => {
    await db.delete(coaches).where(eq(coaches.id, id));
  });
}
