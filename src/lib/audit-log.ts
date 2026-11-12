import { db } from '@/db';
import { auditLogs } from '@/db/schema';

/**
 * Record an audit log entry for admin operations.
 * Fire-and-forget — never throws to avoid disrupting the main operation.
 */
export async function writeAuditLog(params: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      details: params.details ?? '',
    });
  } catch {
    // 監査ログの書き込み失敗は本体操作に影響させない
  }
}
