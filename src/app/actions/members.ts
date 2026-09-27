'use server';

import { db } from '@/db';
import { members } from '@/db/schema';
import { toMember } from '@/db/mappers';
import { eq, or, ilike } from 'drizzle-orm';
import type { Member, LessonLevel } from '@/domain/models';
import { getRandomAvatarColor } from '@/lib/utils';

export async function getMembers(): Promise<Member[]> {
  const rows = await db.select().from(members);
  return rows.map(toMember);
}

export async function getMemberById(id: string): Promise<Member | null> {
  const rows = await db.select().from(members).where(eq(members.id, id));
  return rows.length > 0 ? toMember(rows[0]) : null;
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const rows = await db.select().from(members).where(eq(members.email, email));
  return rows.length > 0 ? toMember(rows[0]) : null;
}

export async function createMember(
  data: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'>
): Promise<Member> {
  const rows = await db
    .insert(members)
    .values({
      name: data.name,
      nameKana: data.nameKana,
      email: data.email,
      phone: data.phone,
      level: data.level,
      membershipType: data.membershipType,
      joinDate: data.joinDate,
      isActive: data.isActive,
      notes: data.notes,
      password: data.password,
      avatarColor: getRandomAvatarColor(),
      remainingTransfers: data.remainingTransfers,
    })
    .returning();
  return toMember(rows[0]);
}

export async function updateMember(id: string, data: Partial<Member>): Promise<Member | null> {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) values.name = data.name;
  if (data.nameKana !== undefined) values.nameKana = data.nameKana;
  if (data.email !== undefined) values.email = data.email;
  if (data.phone !== undefined) values.phone = data.phone;
  if (data.level !== undefined) values.level = data.level;
  if (data.membershipType !== undefined) values.membershipType = data.membershipType;
  if (data.joinDate !== undefined) values.joinDate = data.joinDate;
  if (data.isActive !== undefined) values.isActive = data.isActive;
  if (data.notes !== undefined) values.notes = data.notes;
  if (data.password !== undefined) values.password = data.password;
  if (data.avatarColor !== undefined) values.avatarColor = data.avatarColor;
  if (data.remainingTransfers !== undefined) values.remainingTransfers = data.remainingTransfers;

  const rows = await db.update(members).set(values).where(eq(members.id, id)).returning();
  return rows.length > 0 ? toMember(rows[0]) : null;
}

export async function deleteMember(id: string): Promise<void> {
  await db.delete(members).where(eq(members.id, id));
}

export async function searchMembers(query: string): Promise<Member[]> {
  const pattern = `%${query}%`;
  const rows = await db
    .select()
    .from(members)
    .where(
      or(
        ilike(members.name, pattern),
        ilike(members.nameKana, pattern),
        ilike(members.email, pattern)
      )
    );
  return rows.map(toMember);
}

export async function getMembersByLevel(level: LessonLevel): Promise<Member[]> {
  const rows = await db
    .select()
    .from(members)
    .where(eq(members.level, level));
  return rows.filter(r => r.isActive).map(toMember);
}
