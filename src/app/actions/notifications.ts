'use server';

import { db } from '@/db';
import { notifications } from '@/db/schema';
import { toNotification } from '@/db/mappers';
import { eq, and, desc, count } from 'drizzle-orm';
import type { Notification } from '@/domain/models';
import { requireAuth } from '@/app/actions/auth';

export async function getMyNotifications(): Promise<Notification[]> {
  const user = await requireAuth();
  if (!user.memberId) return [];
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.memberId, user.memberId))
    .orderBy(desc(notifications.createdAt));
  return rows.map(toNotification);
}

export async function getUnreadCount(): Promise<number> {
  const user = await requireAuth();
  if (!user.memberId) return 0;
  const rows = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.memberId, user.memberId),
        eq(notifications.isRead, false)
      )
    );
  return rows[0]?.value ?? 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const user = await requireAuth();
  // 自分の通知のみ既読にできる
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId));
  if (rows.length === 0) return;
  if (user.memberId !== rows[0].memberId) {
    throw new Error('権限がありません');
  }
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

export async function markAllAsRead(): Promise<void> {
  const user = await requireAuth();
  if (!user.memberId) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.memberId, user.memberId),
        eq(notifications.isRead, false)
      )
    );
}

// createNotification is intentionally NOT exported from this 'use server' file.
// Use createNotificationInternal from './notification-helper' in server-side code.
