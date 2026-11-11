'use server';

import { randomInt } from 'node:crypto';
import { db } from '@/db';
import { members, emailVerifications } from '@/db/schema';
import { toMember } from '@/db/mappers';
import { eq, or, ilike, and, gt } from 'drizzle-orm';
import type { Member, LessonLevel } from '@/domain/models';
import { getRandomAvatarColor } from '@/lib/utils';
import { sendVerificationCode } from '@/lib/email';
import { validateEmail, validateRequired, validatePhone, validatePassword } from '@/lib/validators';
import { hashPassword } from '@/lib/password';
import { requireAdmin, requireAuth } from '@/app/actions/auth';

const MAX_OTP_ATTEMPTS = 5;

export async function getMembers(): Promise<Member[]> {
  await requireAdmin();
  const rows = await db.select().from(members);
  return rows.map(toMember);
}

export async function getMemberById(id: string): Promise<Member | null> {
  await requireAuth();
  const rows = await db.select().from(members).where(eq(members.id, id));
  return rows.length > 0 ? toMember(rows[0]) : null;
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const rows = await db.select().from(members).where(eq(members.email, email));
  return rows.length > 0 ? toMember(rows[0]) : null;
}

export async function createMember(
  data: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'> & { password: string }
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

export async function updateMember(id: string, data: Partial<Member> & { password?: string }): Promise<Member | null> {
  await requireAdmin();
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
  if (data.password !== undefined) values.password = await hashPassword(data.password);
  if (data.avatarColor !== undefined) values.avatarColor = data.avatarColor;
  if (data.remainingTransfers !== undefined) values.remainingTransfers = data.remainingTransfers;

  const rows = await db.update(members).set(values).where(eq(members.id, id)).returning();
  return rows.length > 0 ? toMember(rows[0]) : null;
}

export async function deleteMember(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(members).where(eq(members.id, id));
}

export async function searchMembers(query: string): Promise<Member[]> {
  await requireAdmin();
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
  // Server-side validation
  const nameError = validateRequired(data.name, '氏名');
  if (nameError) return { success: false, error: nameError };

  const nameKanaError = validateRequired(data.nameKana, 'フリガナ');
  if (nameKanaError) return { success: false, error: nameKanaError };

  const emailError = validateEmail(data.email);
  if (emailError) return { success: false, error: emailError };

  const phoneError = validatePhone(data.phone);
  if (phoneError) return { success: false, error: phoneError };

  const passwordError = validatePassword(data.password);
  if (passwordError) return { success: false, error: passwordError };

  const existing = await getMemberByEmail(data.email);
  if (existing) {
    return { success: false, error: 'このメールアドレスは既に登録されています' };
  }

  // Delete any existing verification for this email
  await db.delete(emailVerifications).where(eq(emailVerifications.email, data.email));

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Hash the password before storing in the verification table
  const hashedPassword = await hashPassword(data.password);

  await db.insert(emailVerifications).values({
    email: data.email,
    code,
    name: data.name,
    nameKana: data.nameKana,
    phone: data.phone,
    password: hashedPassword,
    expiresAt,
  });

  try {
    await sendVerificationCode(data.email, code);
  } catch {
    // メール送信失敗時は仮登録レコードを削除
    await db.delete(emailVerifications).where(eq(emailVerifications.email, data.email));
    return { success: false, error: 'メール送信に失敗しました。しばらく経ってから再度お試しください。' };
  }

  return { success: true, email: data.email };
}

export async function verifyEmail(data: {
  email: string;
  code: string;
}): Promise<{ success: true; member: Member } | { success: false; error: string }> {
  // Check attempt count first
  const existing = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.email, data.email));

  if (existing.length === 0) {
    return { success: false, error: '認証コードが正しくありません。' };
  }

  const verification = existing[0];

  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    // Delete the verification to force re-registration
    await db.delete(emailVerifications).where(eq(emailVerifications.email, data.email));
    return { success: false, error: '認証コードの試行回数上限に達しました。最初から登録し直してください。' };
  }

  // Check expiration
  if (new Date() > verification.expiresAt) {
    return { success: false, error: '認証コードの有効期限が切れています。再送してください。' };
  }

  // Increment attempt count before checking the code
  await db
    .update(emailVerifications)
    .set({ attempts: verification.attempts + 1 })
    .where(eq(emailVerifications.id, verification.id));

  if (verification.code !== data.code) {
    return { success: false, error: '認証コードが正しくありません。' };
  }

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
    password: verification.password, // Already hashed during registration
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
  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.delete(emailVerifications).where(eq(emailVerifications.email, email));

  await db.insert(emailVerifications).values({
    email: verification.email,
    code,
    name: verification.name,
    nameKana: verification.nameKana,
    phone: verification.phone,
    password: verification.password, // Already hashed
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
