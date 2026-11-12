import { db } from '@/db';
import { rateLimits } from '@/db/schema';
import { and, eq, gt, lt, sql } from 'drizzle-orm';

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; retryAfterMs: number };

/**
 * DB-backed rate limiter using a fixed-window approach.
 *
 * @param identifier - The key to rate-limit on (e.g. email address)
 * @param action     - The action being rate-limited (e.g. 'login')
 * @param maxAttempts - Maximum attempts allowed within the window
 * @param windowMs   - Window duration in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxAttempts: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();

  // Clean up expired records for this identifier+action
  await db
    .delete(rateLimits)
    .where(
      and(
        eq(rateLimits.identifier, identifier),
        eq(rateLimits.action, action),
        lt(rateLimits.expiresAt, now),
      ),
    );

  // Find active window
  const existing = await db
    .select()
    .from(rateLimits)
    .where(
      and(
        eq(rateLimits.identifier, identifier),
        eq(rateLimits.action, action),
        gt(rateLimits.expiresAt, now),
      ),
    );

  if (existing.length > 0) {
    const record = existing[0];

    if (record.count >= maxAttempts) {
      const retryAfterMs = record.expiresAt.getTime() - now.getTime();
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    // Increment count
    await db
      .update(rateLimits)
      .set({ count: sql`${rateLimits.count} + 1` })
      .where(eq(rateLimits.id, record.id));

    return { allowed: true, remaining: maxAttempts - record.count - 1 };
  }

  // No active window — create new record
  const expiresAt = new Date(now.getTime() + windowMs);
  await db.insert(rateLimits).values({
    identifier,
    action,
    count: 1,
    windowStart: now,
    expiresAt,
  });

  return { allowed: true, remaining: maxAttempts - 1 };
}

/**
 * Rate limit for admin write operations.
 * 100 mutations per hour across all admin actions.
 * Throws if the limit is exceeded.
 */
export async function checkAdminWriteLimit(): Promise<void> {
  const rl = await checkRateLimit('admin', 'adminWrite', 100, 60 * 60 * 1000);
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.retryAfterMs / 60000);
    throw new Error(`管理者操作の上限に達しました。${minutes}分後に再度お試しください。`);
  }
}
