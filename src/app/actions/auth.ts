'use server';

import { cookies } from 'next/headers';
import { db } from '@/db';
import { members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { AuthUser } from '@/domain/models';
import { hashPassword, verifyPassword, isHashedPassword } from '@/lib/password';
import { signValue, verifySignedValue } from '@/lib/cookie-signing';

const COOKIE_NAME = 'tennis_auth';
const AUTH_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || 'admin@tennis.jp').trim();
}

function getAdminPasswordHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!hash) {
    throw new Error('ADMIN_PASSWORD_HASH environment variable is required');
  }
  return hash;
}

export async function login(
  email: string,
  password: string,
  role: 'member' | 'admin'
): Promise<AuthUser | null> {
  if (role === 'admin') {
    if (email !== getAdminEmail()) return null;
    const adminHash = getAdminPasswordHash();
    const valid = await verifyPassword(password, adminHash);
    if (!valid) return null;

    const adminUser: AuthUser = { id: 'admin', name: '管理者', role: 'admin' };
    await setAuthCookie(adminUser);
    return adminUser;
  }

  const rows = await db.select().from(members).where(eq(members.email, email));
  if (rows.length === 0) return null;

  const row = rows[0];
  const storedPassword = row.password;

  let passwordValid: boolean;
  if (isHashedPassword(storedPassword)) {
    passwordValid = await verifyPassword(password, storedPassword);
  } else {
    // Legacy plaintext comparison for migration
    passwordValid = storedPassword === password;
    if (passwordValid) {
      // Upgrade to hashed password on successful login
      const hashed = await hashPassword(password);
      await db.update(members).set({ password: hashed, updatedAt: new Date() }).where(eq(members.id, row.id));
    }
  }

  if (!passwordValid) return null;

  const memberUser: AuthUser = {
    id: row.id,
    name: row.name,
    role: 'member',
    memberId: row.id,
  };
  await setAuthCookie(memberUser);
  return memberUser;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;

  try {
    const jsonStr = verifySignedValue(cookie.value);
    if (!jsonStr) {
      // Invalid signature - possible tampering
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    const data = JSON.parse(jsonStr) as { user: AuthUser; expiresAt: number };
    if (Date.now() > data.expiresAt) {
      cookieStore.delete(COOKIE_NAME);
      return null;
    }
    return data.user;
  } catch {
    cookieStore.delete(COOKIE_NAME);
    return null;
  }
}

/**
 * Requires an authenticated admin user. Throws if not authenticated or not admin.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error('認証が必要です');
  if (user.role !== 'admin') throw new Error('管理者権限が必要です');
  return user;
}

/**
 * Requires an authenticated user. Throws if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error('認証が必要です');
  return user;
}

async function setAuthCookie(user: AuthUser): Promise<void> {
  const cookieStore = await cookies();
  const data = {
    user,
    expiresAt: Date.now() + AUTH_EXPIRY_SECONDS * 1000,
  };
  const jsonStr = JSON.stringify(data);
  const signedValue = signValue(jsonStr);
  cookieStore.set(COOKIE_NAME, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_EXPIRY_SECONDS,
    path: '/',
  });
}
