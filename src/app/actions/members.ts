'use server';

import crypto from 'crypto';
import { db } from '@/db';
import { members, emailVerifications } from '@/db/schema';
import { toMember } from '@/db/mappers';
import { eq, or, ilike, and, gt } from 'drizzle-orm';
import type { Member, LessonLevel } from '@/domain/models';
import { getRandomAvatarColor } from '@/lib/utils';
import { sendVerificationCode } from '@/lib/email';

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

export async function registerMember(data: {
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ success: true; email: string } | { success: false; error: string }> {
  const existing = await getMemberByEmail(data.email);
  if (existing) {
    return { success: false, error: 'このメールアドレスは既に登録されています' };
  }

  // Delete any existing verification for this email
  await db.delete(emailVerifications).where(eq(emailVerifications.email, data.email));

  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(emailVerifications).values({
    email: data.email,
    code,
    name: data.name,
    nameKana: data.nameKana,
    phone: data.phone,
    password: data.password,
    expiresAt,
  });

  await sendVerificationCode(data.email, code);

  return { success: true, email: data.email };
}

export async function verifyEmail(data: {
  email: string;
  code: string;
}): Promise<{ success: true; member: Member } | { success: false; error: string }> {
  const rows = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.email, data.email),
        eq(emailVerifications.code, data.code),
        gt(emailVerifications.expiresAt, new Date())
      )
    );

  if (rows.length === 0) {
    // Check if expired
    const expired = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, data.email),
          eq(emailVerifications.code, data.code)
        )
      );
    if (expired.length > 0) {
      return { success: false, error: '認証コードの有効期限が切れています。再送してください。' };
    }
    return { success: false, error: '認証コードが正しくありません。' };
  }

  const verification = rows[0];

  // Check if email was registered while verifying
  const existingMember = await getMemberByEmail(data.email);
  if (existingMember) {
    await db.delete(emailVerifications).where(eq(emailVerifications.email, data.email));
    return { success: false, error: 'このメールアドレスは既に登録されています' };
  }

  const today = new Date().toISOString().slice(0, 10);
  const member = await createMember({
    name: verification.name,
    nameKana: verification.nameKana,
    email: verification.email,
    phone: verification.phone,
    password: verification.password,
    level: 'beginner',
    membershipType: 'regular',
    joinDate: today,
    isActive: true,
    notes: '',
    remainingTransfers: 3,
  });

  // Clean up verification record
  await db.delete(emailVerifications).where(eq(emailVerifications.email, data.email));

  return { success: true, member };
}

export async function resendVerificationCode(email: string): Promise<{ success: true } | { success: false; error: string }> {
  const existing = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.email, email));

  if (existing.length === 0) {
    return { success: false, error: '仮登録データが見つかりません。最初から登録し直してください。' };
  }

  const verification = existing[0];
  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.delete(emailVerifications).where(eq(emailVerifications.email, email));

  await db.insert(emailVerifications).values({
    email: verification.email,
    code,
    name: verification.name,
    nameKana: verification.nameKana,
    phone: verification.phone,
    password: verification.password,
    expiresAt,
  });

  await sendVerificationCode(email, code);

  return { success: true };
}

export async function getMembersByLevel(level: LessonLevel): Promise<Member[]> {
  const rows = await db
    .select()
    .from(members)
    .where(eq(members.level, level));
  return rows.filter(r => r.isActive).map(toMember);
}
