'use server';

import { db } from '@/db';
import { trialApplications } from '@/db/schema';
import { toTrialApplication } from '@/db/mappers';
import { eq, desc } from 'drizzle-orm';
import type { TrialApplication, TrialStatus, LessonLevel } from '@/domain/models';
import { requireAdmin } from '@/app/actions/auth';
import { withAdminWrite } from '@/app/actions/admin-guard';
import { sendTrialConfirmation, sendTrialStatusUpdate } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { writeAuditLog } from '@/lib/audit-log';

export async function applyForTrial(data: {
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  preferredLevel: LessonLevel;
  preferredDate: string;
  preferredTime: string;
  message: string;
}): Promise<TrialApplication> {
  // Rate limit: 5 attempts per hour per email
  const rl = await checkRateLimit(data.email, 'applyForTrial', 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.retryAfterMs / 60000);
    throw new Error(`体験申込の回数が上限に達しました。${minutes}分後に再度お試しください。`);
  }

  // Server-side validation for public endpoint
  if (!data.name.trim()) throw new Error('お名前を入力してください');
  if (!data.nameKana.trim()) throw new Error('お名前（カナ）を入力してください');
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('有効なメールアドレスを入力してください');
  }
  if (!data.phone.trim() || !/^[\d\-+() ]{8,}$/.test(data.phone)) {
    throw new Error('有効な電話番号を入力してください');
  }
  const validLevels: LessonLevel[] = ['beginner', 'intermediate', 'advanced', 'junior'];
  if (!validLevels.includes(data.preferredLevel)) {
    throw new Error('レベルの選択が不正です');
  }
  if (!data.preferredDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(data.preferredDate)) {
    throw new Error('希望日を選択してください');
  }
  if (!data.preferredTime.trim()) throw new Error('希望時間を選択してください');

  const rows = await db
    .insert(trialApplications)
    .values({
      name: data.name,
      nameKana: data.nameKana,
      email: data.email,
      phone: data.phone,
      preferredLevel: data.preferredLevel,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      message: data.message,
    })
    .returning();
  const application = toTrialApplication(rows[0]);

  try {
    await sendTrialConfirmation(data.email, data.name);
  } catch {
    // メール送信失敗は申込には影響させない
  }

  return application;
}

export async function getTrialApplications(): Promise<TrialApplication[]> {
  await requireAdmin();
  const rows = await db
    .select()
    .from(trialApplications)
    .orderBy(desc(trialApplications.createdAt));
  return rows.map(toTrialApplication);
}

export async function getTrialById(id: string): Promise<TrialApplication | null> {
  await requireAdmin();
  const rows = await db
    .select()
    .from(trialApplications)
    .where(eq(trialApplications.id, id));
  return rows.length > 0 ? toTrialApplication(rows[0]) : null;
}

export async function updateTrialStatus(
  id: string,
  status: TrialStatus,
  adminNotes?: string
): Promise<TrialApplication | null> {
  return withAdminWrite(async () => {
    const values: Record<string, unknown> = {
      status,
      reviewedAt: new Date(),
    };
    if (adminNotes !== undefined) values.adminNotes = adminNotes;

    const rows = await db
      .update(trialApplications)
      .set(values)
      .where(eq(trialApplications.id, id))
      .returning();

    if (rows.length === 0) return null;
    const application = toTrialApplication(rows[0]);

    await writeAuditLog({ actorId: 'admin', action: 'updateStatus', targetType: 'trialApplication', targetId: id, details: `体験申込ステータス変更: ${status}` });

    try {
      await sendTrialStatusUpdate(application.email, application.name, status);
    } catch {
      // メール送信失敗は更新には影響させない
    }

    return application;
  });
}
