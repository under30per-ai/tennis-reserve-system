'use server';

import { db } from '@/db';
import { coaches } from '@/db/schema';
import { toCoach } from '@/db/mappers';
import { eq } from 'drizzle-orm';
import type { Coach } from '@/domain/models';
import { getRandomAvatarColor } from '@/lib/utils';

export async function getCoaches(): Promise<Coach[]> {
  const rows = await db.select().from(coaches);
  return rows.map(toCoach);
}

export async function getCoachById(id: string): Promise<Coach | null> {
  const rows = await db.select().from(coaches).where(eq(coaches.id, id));
  return rows.length > 0 ? toCoach(rows[0]) : null;
}

export async function createCoach(
  data: Omit<Coach, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'>
): Promise<Coach> {
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
}

export async function updateCoach(id: string, data: Partial<Coach>): Promise<Coach | null> {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) values.name = data.name;
  if (data.nameKana !== undefined) values.nameKana = data.nameKana;
  if (data.email !== undefined) values.email = data.email;
  if (data.phone !== undefined) values.phone = data.phone;
  if (data.specialties !== undefined) values.specialties = data.specialties;
  if (data.bio !== undefined) values.bio = data.bio;
  if (data.certifications !== undefined) values.certifications = data.certifications;
  if (data.avatarColor !== undefined) values.avatarColor = data.avatarColor;
  if (data.isActive !== undefined) values.isActive = data.isActive;

  const rows = await db.update(coaches).set(values).where(eq(coaches.id, id)).returning();
  return rows.length > 0 ? toCoach(rows[0]) : null;
}

export async function deleteCoach(id: string): Promise<void> {
  await db.delete(coaches).where(eq(coaches.id, id));
}
