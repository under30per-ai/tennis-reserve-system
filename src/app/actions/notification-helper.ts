import { db } from '@/db';
import { notifications } from '@/db/schema';
import { toNotification } from '@/db/mappers';
import type { Notification, NotificationType } from '@/domain/models';

/**
 * Internal helper for creating notifications.
 * NOT a server action — not in a 'use server' file.
 * Only callable from other server-side code.
 */
export async function createNotificationInternal(
  memberId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string
): Promise<Notification> {
  const rows = await db
    .insert(notifications)
    .values({
      memberId,
      type,
      title,
      message,
      relatedId: relatedId ?? null,
    })
    .returning();
  return toNotification(rows[0]);
}
