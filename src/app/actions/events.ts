'use server';

import { db } from '@/db';
import { events, eventRegistrations, courts, members } from '@/db/schema';
import { toEvent, toEventRegistration, toCourt } from '@/db/mappers';
import { eq, and, desc, gte, inArray } from 'drizzle-orm';
import type { Event, EventRegistration, EventWithDetails, LessonLevel } from '@/domain/models';
import { requireAuth } from '@/app/actions/auth';
import { withAdminWrite } from '@/app/actions/admin-guard';
import { createNotificationInternal as createNotification } from '@/app/actions/notification-helper';
import { buildPartialUpdate } from '@/lib/db-utils';
import { writeAuditLog } from '@/lib/audit-log';

// ── Admin CRUD ────────────────────────────────────────

export async function getEvents(): Promise<Event[]> {
  await requireAuth();
  const rows = await db.select().from(events).orderBy(desc(events.eventDate)).limit(1000);
  return rows.map(toEvent);
}

export async function getEventById(id: string): Promise<Event | null> {
  await requireAuth();
  const rows = await db.select().from(events).where(eq(events.id, id));
  return rows.length > 0 ? toEvent(rows[0]) : null;
}

export async function createEvent(data: {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  courtId?: string;
  maxParticipants: number;
  targetLevel?: LessonLevel;
  fee: number;
  isPublished: boolean;
}): Promise<Event> {
  return withAdminWrite(async () => {
    const rows = await db
      .insert(events)
      .values({
        title: data.title,
        description: data.description,
        eventDate: data.eventDate,
        startTime: data.startTime,
        endTime: data.endTime,
        courtId: data.courtId ?? null,
        maxParticipants: data.maxParticipants,
        targetLevel: data.targetLevel ?? null,
        fee: data.fee,
        isPublished: data.isPublished,
      })
      .returning();
    const event = toEvent(rows[0]);

    if (data.isPublished) {
      await notifyAllMembersAboutEvent(event);
    }

    return event;
  });
}

const EVENT_UPDATE_KEYS = [
  'title', 'description', 'eventDate', 'startTime', 'endTime',
  'courtId', 'maxParticipants', 'targetLevel', 'fee', 'isPublished',
] as const;

export async function updateEvent(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    courtId: string | null;
    maxParticipants: number;
    targetLevel: LessonLevel | null;
    fee: number;
    isPublished: boolean;
  }>
): Promise<Event | null> {
  return withAdminWrite(async () => {
    // Check if we need to notify (publishing for first time)
    let shouldNotify = false;
    if (data.isPublished === true) {
      const existing = await db.select().from(events).where(eq(events.id, id));
      if (existing.length > 0 && !existing[0].isPublished) {
        shouldNotify = true;
      }
    }

    const values = buildPartialUpdate(data, EVENT_UPDATE_KEYS, { updatedAt: new Date() });

    const rows = await db
      .update(events)
      .set(values)
      .where(eq(events.id, id))
      .returning();

    if (rows.length === 0) return null;
    const event = toEvent(rows[0]);

    if (shouldNotify) {
      await notifyAllMembersAboutEvent(event);
    }

    return event;
  });
}

export async function deleteEvent(id: string): Promise<void> {
  return withAdminWrite(async () => {
    await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, id));
    await db.delete(events).where(eq(events.id, id));
    await writeAuditLog({ actorId: 'admin', action: 'delete', targetType: 'event', targetId: id });
  });
}

// ── Event details with registrations ──────────────────

export async function getEventWithDetails(id: string): Promise<EventWithDetails | null> {
  await requireAuth();
  const eventRows = await db.select().from(events).where(eq(events.id, id));
  if (eventRows.length === 0) return null;
  const event = toEvent(eventRows[0]);

  const regRows = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, id));
  const registrations = regRows.map(toEventRegistration);

  let court = null;
  if (event.courtId) {
    const courtRows = await db.select().from(courts).where(eq(courts.id, event.courtId));
    if (courtRows.length > 0) court = toCourt(courtRows[0]);
  }

  const currentParticipants = registrations.filter((r) => r.status === 'registered').length;

  return {
    ...event,
    court,
    registrations,
    currentParticipants,
    availableSpots: Math.max(0, event.maxParticipants - currentParticipants),
  };
}

// ── Member: Browse & Register ─────────────────────────

export async function getUpcomingEvents(): Promise<EventWithDetails[]> {
  await requireAuth();
  const today = new Date().toISOString().slice(0, 10);
  const eventRows = await db
    .select()
    .from(events)
    .where(and(eq(events.isPublished, true), gte(events.eventDate, today)))
    .orderBy(events.eventDate);

  if (eventRows.length === 0) return [];
  const eventList = eventRows.map(toEvent);
  const eventIds = eventList.map((e) => e.id);

  const regRows = await db
    .select()
    .from(eventRegistrations)
    .where(inArray(eventRegistrations.eventId, eventIds));
  const allRegs = regRows.map(toEventRegistration);

  const courtIds = [...new Set(eventList.map((e) => e.courtId).filter(Boolean))] as string[];
  const courtRows = courtIds.length > 0
    ? await db.select().from(courts).where(inArray(courts.id, courtIds))
    : [];
  const courtMap = new Map(courtRows.map((c) => [c.id, toCourt(c)]));

  return eventList.map((event) => {
    const regs = allRegs.filter((r) => r.eventId === event.id);
    const currentParticipants = regs.filter((r) => r.status === 'registered').length;
    return {
      ...event,
      court: event.courtId ? courtMap.get(event.courtId) ?? null : null,
      registrations: regs,
      currentParticipants,
      availableSpots: Math.max(0, event.maxParticipants - currentParticipants),
    };
  });
}

export async function registerForEvent(eventId: string): Promise<EventRegistration> {
  const user = await requireAuth();
  if (!user.memberId) throw new Error('会員情報が見つかりません');

  const eventRows = await db.select().from(events).where(eq(events.id, eventId));
  if (eventRows.length === 0) throw new Error('イベントが見つかりません');
  const event = toEvent(eventRows[0]);

  if (!event.isPublished) throw new Error('このイベントは公開されていません');

  const existing = await db
    .select()
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.memberId, user.memberId),
        inArray(eventRegistrations.status, ['registered', 'waitlisted'])
      )
    );
  if (existing.length > 0) throw new Error('既に申込済みです');

  const regRows = await db
    .select()
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.status, 'registered')
      )
    );
  const isWaitlisted = regRows.length >= event.maxParticipants;

  const rows = await db
    .insert(eventRegistrations)
    .values({
      eventId,
      memberId: user.memberId,
      status: isWaitlisted ? 'waitlisted' : 'registered',
    })
    .returning();
  return toEventRegistration(rows[0]);
}

export async function cancelEventRegistration(registrationId: string): Promise<void> {
  const user = await requireAuth();
  const regRows = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.id, registrationId));
  if (regRows.length === 0) return;
  const reg = toEventRegistration(regRows[0]);

  // 管理者以外は自分の参加登録のみキャンセル可能
  if (user.role !== 'admin' && user.memberId !== reg.memberId) {
    throw new Error('権限がありません');
  }

  await db
    .update(eventRegistrations)
    .set({ status: 'cancelled', cancelledAt: new Date() })
    .where(eq(eventRegistrations.id, registrationId));

  if (reg.status === 'registered') {
    const waitlisted = await db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, reg.eventId),
          eq(eventRegistrations.status, 'waitlisted')
        )
      );
    if (waitlisted.length > 0) {
      const first = waitlisted.sort(
        (a, b) => a.registeredAt.getTime() - b.registeredAt.getTime()
      )[0];
      await db
        .update(eventRegistrations)
        .set({ status: 'registered' })
        .where(eq(eventRegistrations.id, first.id));

      try {
        const eventRows = await db.select().from(events).where(eq(events.id, reg.eventId));
        const eventTitle = eventRows.length > 0 ? toEvent(eventRows[0]).title : 'イベント';
        await createNotification(
          first.memberId,
          'waitlist_promoted',
          'キャンセル待ちから繰上げされました',
          `「${eventTitle}」のキャンセル待ちから参加が確定しました。`,
          reg.eventId
        );
      } catch {
        // 通知失敗は操作に影響させない
      }
    }
  }
}

export async function getMyEventRegistrations(): Promise<EventRegistration[]> {
  const user = await requireAuth();
  if (!user.memberId) return [];
  const rows = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.memberId, user.memberId))
    .orderBy(desc(eventRegistrations.registeredAt));
  return rows.map(toEventRegistration);
}

// ── Internal helper ───────────────────────────────────

async function notifyAllMembersAboutEvent(event: Event): Promise<void> {
  try {
    const memberRows = await db.select({ id: members.id }).from(members).where(eq(members.isActive, true));
    for (const m of memberRows) {
      await createNotification(
        m.id,
        'event_new',
        '新しいイベントが公開されました',
        `「${event.title}」が${event.eventDate}に開催されます。`,
        event.id
      );
    }
  } catch {
    // 通知失敗はイベント操作には影響させない
  }
}
