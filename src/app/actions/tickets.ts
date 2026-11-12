'use server';

import { db } from '@/db';
import { ticketTypes, memberTickets, ticketUsages } from '@/db/schema';
import { toTicketType, toMemberTicket, toTicketUsage } from '@/db/mappers';
import { eq, and, desc } from 'drizzle-orm';
import type { TicketType, MemberTicket, MemberTicketWithType, TicketUsage } from '@/domain/models';
import { requireAdmin, requireAuth } from '@/app/actions/auth';
import { withAdminWrite } from '@/app/actions/admin-guard';
import { buildPartialUpdate } from '@/lib/db-utils';
import { writeAuditLog } from '@/lib/audit-log';

// ── Admin: Ticket Type CRUD ───────────────────────────

export async function getTicketTypes(): Promise<TicketType[]> {
  await requireAuth();
  const rows = await db.select().from(ticketTypes).orderBy(desc(ticketTypes.createdAt)).limit(500);
  return rows.map(toTicketType);
}

export async function getTicketTypeById(id: string): Promise<TicketType | null> {
  await requireAuth();
  const rows = await db.select().from(ticketTypes).where(eq(ticketTypes.id, id));
  return rows.length > 0 ? toTicketType(rows[0]) : null;
}

export async function createTicketType(data: {
  name: string;
  description: string;
  lessonCount: number;
  validDays: number;
  price: number;
}): Promise<TicketType> {
  return withAdminWrite(async () => {
    const rows = await db
      .insert(ticketTypes)
      .values({
        name: data.name,
        description: data.description,
        lessonCount: data.lessonCount,
        validDays: data.validDays,
        price: data.price,
      })
      .returning();
    return toTicketType(rows[0]);
  });
}

const TICKET_TYPE_UPDATE_KEYS = [
  'name', 'description', 'lessonCount', 'validDays', 'price', 'isActive',
] as const;

export async function updateTicketType(
  id: string,
  data: Partial<{ name: string; description: string; lessonCount: number; validDays: number; price: number; isActive: boolean }>
): Promise<TicketType | null> {
  return withAdminWrite(async () => {
    const values = buildPartialUpdate(data, TICKET_TYPE_UPDATE_KEYS);
    const rows = await db
      .update(ticketTypes)
      .set(values)
      .where(eq(ticketTypes.id, id))
      .returning();
    return rows.length > 0 ? toTicketType(rows[0]) : null;
  });
}

export async function deleteTicketType(id: string): Promise<void> {
  return withAdminWrite(async () => {
    await db.update(ticketTypes).set({ isActive: false }).where(eq(ticketTypes.id, id));
  });
}

// ── Admin: Member Ticket Management ───────────────────

export async function issueMemberTicket(
  memberId: string,
  ticketTypeId: string
): Promise<MemberTicket> {
  return withAdminWrite(async () => {
    const typeRows = await db.select().from(ticketTypes).where(eq(ticketTypes.id, ticketTypeId));
    if (typeRows.length === 0) throw new Error('チケット種別が見つかりません');
    const ticketType = toTicketType(typeRows[0]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ticketType.validDays);

    const rows = await db
      .insert(memberTickets)
      .values({
        memberId,
        ticketTypeId,
        remainingCount: ticketType.lessonCount,
        expiresAt,
      })
      .returning();
    const ticket = toMemberTicket(rows[0]);
    await writeAuditLog({ actorId: 'admin', action: 'issue', targetType: 'memberTicket', targetId: ticket.id, details: `チケット発行: ${ticketType.name} → 会員${memberId}` });
    return ticket;
  });
}

export async function getAllMemberTickets(): Promise<MemberTicketWithType[]> {
  await requireAdmin();
  const rows = await db
    .select()
    .from(memberTickets)
    .innerJoin(ticketTypes, eq(memberTickets.ticketTypeId, ticketTypes.id))
    .orderBy(desc(memberTickets.purchasedAt));
  return rows.map((row) => ({
    ...toMemberTicket(row.member_tickets),
    ticketType: toTicketType(row.ticket_types),
  }));
}

// ── Member: My Tickets ────────────────────────────────

export async function getMyTickets(): Promise<MemberTicketWithType[]> {
  const user = await requireAuth();
  if (!user.memberId) return [];
  const rows = await db
    .select()
    .from(memberTickets)
    .innerJoin(ticketTypes, eq(memberTickets.ticketTypeId, ticketTypes.id))
    .where(eq(memberTickets.memberId, user.memberId))
    .orderBy(desc(memberTickets.purchasedAt));
  return rows.map((row) => ({
    ...toMemberTicket(row.member_tickets),
    ticketType: toTicketType(row.ticket_types),
  }));
}

export async function useTicket(
  memberTicketId: string,
  reservationId: string
): Promise<TicketUsage> {
  const user = await requireAuth();
  const ticketRows = await db
    .select()
    .from(memberTickets)
    .where(eq(memberTickets.id, memberTicketId));
  if (ticketRows.length === 0) throw new Error('チケットが見つかりません');
  const ticket = toMemberTicket(ticketRows[0]);

  // 自分のチケットのみ使用可能
  if (user.role !== 'admin' && user.memberId !== ticket.memberId) {
    throw new Error('権限がありません');
  }

  if (!ticket.isActive) throw new Error('このチケットは無効です');
  if (ticket.remainingCount <= 0) throw new Error('チケットの残り回数がありません');
  if (new Date(ticket.expiresAt) < new Date()) throw new Error('チケットの有効期限が切れています');

  const result = await db.transaction(async (tx) => {
    await tx
      .update(memberTickets)
      .set({ remainingCount: ticket.remainingCount - 1 })
      .where(eq(memberTickets.id, memberTicketId));

    const rows = await tx
      .insert(ticketUsages)
      .values({ memberTicketId, reservationId })
      .returning();
    return rows;
  });

  return toTicketUsage(result[0]);
}

export async function getTicketUsageHistory(memberTicketId: string): Promise<TicketUsage[]> {
  const user = await requireAuth();
  // チケット所有者のみ履歴閲覧可能
  const ticketRows = await db
    .select()
    .from(memberTickets)
    .where(eq(memberTickets.id, memberTicketId));
  if (ticketRows.length === 0) throw new Error('チケットが見つかりません');
  if (user.role !== 'admin' && user.memberId !== ticketRows[0].memberId) {
    throw new Error('権限がありません');
  }
  const rows = await db
    .select()
    .from(ticketUsages)
    .where(eq(ticketUsages.memberTicketId, memberTicketId))
    .orderBy(desc(ticketUsages.usedAt));
  return rows.map(toTicketUsage);
}
