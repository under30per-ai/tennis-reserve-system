'use server';

import { cookies } from 'next/headers';
import { db } from '@/db';
import { members } from '@/db/schema';
import { toMember } from '@/db/mappers';
import { eq } from 'drizzle-orm';
import type { AuthUser } from '@/domain/models';

const COOKIE_NAME = 'tennis_auth';
const AUTH_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours
const ADMIN_EMAIL = 'admin@tennis.jp';
const ADMIN_PASSWORD = 'admin';

export async function login(
  email: string,
  password: string,
  role: 'member' | 'admin'
): Promise<AuthUser | null> {
  if (role === 'admin') {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser: AuthUser = { id: 'admin', name: '管理者', role: 'admin' };
      await setAuthCookie(adminUser);
      return adminUser;
    }
    return null;
  }

  const rows = await db.select().from(members).where(eq(members.email, email));
  if (rows.length === 0) return null;

  const member = toMember(rows[0]);
  if (member.password !== password) return null;

  const memberUser: AuthUser = {
    id: member.id,
    name: member.name,
    role: 'member',
    memberId: member.id,
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
    const data = JSON.parse(cookie.value) as { user: AuthUser; expiresAt: number };
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

async function setAuthCookie(user: AuthUser): Promise<void> {
  const cookieStore = await cookies();
  const data = {
    user,
    expiresAt: Date.now() + AUTH_EXPIRY_SECONDS * 1000,
  };
  cookieStore.set(COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_EXPIRY_SECONDS,
    path: '/',
  });
}
