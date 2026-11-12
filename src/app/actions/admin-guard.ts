'use server';

import { requireAdmin } from '@/app/actions/auth';
import { checkAdminWriteLimit } from '@/lib/rate-limit';

/**
 * Admin write guard: checks admin auth + rate limit, then executes the callback.
 * Replaces the repetitive `await requireAdmin(); await checkAdminWriteLimit();` pattern.
 */
export async function withAdminWrite<T>(fn: () => Promise<T>): Promise<T> {
  await requireAdmin();
  await checkAdminWriteLimit();
  return fn();
}
