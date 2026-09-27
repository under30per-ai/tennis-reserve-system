'use server';

import { db } from '@/db';
import {
  reservations,
  lessonInstances,
  lessonSlots,
  members,
  coaches,
  courts,
} from '@/db/schema';
import {
  toReservation,
  toLessonInstance,
  toLessonSlot,
  toMember,
  toCoach,
  toCourt,
} from '@/db/mappers';
import { eq, and, inArray } from 'drizzle-orm';
import type { Reservation, ReservationWithDetails } from '@/domain/models';

export async function getReservations(): Promise<Reservation[]> {
  const rows = await db.select().from(reservations);
  return rows.map(toReservation);
}

export async function makeReservation(
  memberId: string,
  lessonInstanceId: string
): Promise<Reservation> {
  const instRows = await db
    .select()
    .from(lessonInstances)
    .where(eq(lessonInstances.id, lessonInstanceId));
  if (instRows.length === 0) throw new Error('レッスンが見つかりません');
  const instance = toLessonInstance(instRows[0]);

  const existingRows = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.lessonInstanceId, lessonInstanceId),
        inArray(reservations.status, ['confirmed', 'waitlisted'])
      )
    );
  const existing = existingRows.map(toReservation);

  const alreadyReserved = existing.find((r) => r.memberId === memberId);
  if (alreadyReserved) throw new Error('既に予約済みです');

  const confirmedCount = existing.filter((r) => r.status === 'confirmed').length;
  const isWaitlisted = confirmedCount >= instance.maxCapacity;
  const waitlistPosition = isWaitlisted
    ? existing.filter((r) => r.status === 'waitlisted').length + 1
    : null;

  const rows = await db
    .insert(reservations)
    .values({
      memberId,
      lessonInstanceId,
      status: isWaitlisted ? 'waitlisted' : 'confirmed',
      reservedAt: new Date(),
      waitlistPosition,
      notes: '',
    })
    .returning();
  return toReservation(rows[0]);
}

export async function cancelReservation(reservationId: string): Promise<void> {
  const resRows = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, reservationId));
  if (resRows.length === 0) return;
  const reservation = toReservation(resRows[0]);

  await db
    .update(reservations)
    .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(reservations.id, reservationId));

  if (reservation.status === 'confirmed') {
    const waitlistedRows = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.lessonInstanceId, reservation.lessonInstanceId),
          eq(reservations.status, 'waitlisted')
        )
      );
    const waitlisted = waitlistedRows
      .map(toReservation)
      .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));

    if (waitlisted.length > 0) {
      await db
        .update(reservations)
        .set({ status: 'confirmed', waitlistPosition: null, updatedAt: new Date() })
        .where(eq(reservations.id, waitlisted[0].id));
    }
  }
}

export async function transferReservation(
  memberId: string,
  fromInstanceId: string,
  toInstanceId: string
): Promise<Reservation> {
  const allRes = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.memberId, memberId),
        eq(reservations.lessonInstanceId, fromInstanceId)
      )
    );
  const original = allRes
    .map(toReservation)
    .find((r) => r.status === 'confirmed' || r.status === 'cancelled');

  if (original) {
    await db
      .update(reservations)
      .set({
        status: 'transferred',
        transferToInstanceId: toInstanceId,
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, original.id));
  }

  const newRows = await db
    .insert(reservations)
    .values({
      memberId,
      lessonInstanceId: toInstanceId,
      status: 'confirmed',
      reservedAt: new Date(),
      transferFromInstanceId: fromInstanceId,
      notes: '振替予約',
    })
    .returning();

  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId));
  if (memberRows.length > 0 && memberRows[0].remainingTransfers > 0) {
    await db
      .update(members)
      .set({
        remainingTransfers: memberRows[0].remainingTransfers - 1,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId));
  }

  return toReservation(newRows[0]);
}

export async function getMemberReservations(
  memberId: string
): Promise<ReservationWithDetails[]> {
  const resRows = await db
    .select()
    .from(reservations)
    .where(eq(reservations.memberId, memberId));

  const results: ReservationWithDetails[] = [];
  for (const row of resRows) {
    const r = toReservation(row);
    const detail = await enrichReservation(r);
    if (detail) results.push(detail);
  }

  return results.sort((a, b) =>
    b.lessonInstance.date.localeCompare(a.lessonInstance.date)
  );
}

export async function getReservationsForInstance(
  instanceId: string
): Promise<Reservation[]> {
  const rows = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.lessonInstanceId, instanceId),
        inArray(reservations.status, ['confirmed', 'waitlisted'])
      )
    );
  return rows.map(toReservation);
}

export async function getAllReservationsWithDetails(): Promise<
  ReservationWithDetails[]
> {
  const resRows = await db.select().from(reservations);

  const results: ReservationWithDetails[] = [];
  for (const row of resRows) {
    const r = toReservation(row);
    const detail = await enrichReservation(r);
    if (detail) results.push(detail);
  }

  return results.sort((a, b) => b.reservedAt.localeCompare(a.reservedAt));
}

async function enrichReservation(
  r: Reservation
): Promise<ReservationWithDetails | null> {
  const instRows = await db
    .select()
    .from(lessonInstances)
    .where(eq(lessonInstances.id, r.lessonInstanceId));
  if (instRows.length === 0) return null;
  const instance = toLessonInstance(instRows[0]);

  const [slotRows, memberRows, coachRows, courtRows] = await Promise.all([
    db.select().from(lessonSlots).where(eq(lessonSlots.id, instance.lessonSlotId)),
    db.select().from(members).where(eq(members.id, r.memberId)),
    db.select().from(coaches).where(eq(coaches.id, instance.coachId)),
    db.select().from(courts).where(eq(courts.id, instance.courtId)),
  ]);

  if (
    slotRows.length === 0 ||
    memberRows.length === 0 ||
    coachRows.length === 0 ||
    courtRows.length === 0
  )
    return null;

  return {
    ...r,
    member: toMember(memberRows[0]),
    lessonInstance: instance,
    lessonSlot: toLessonSlot(slotRows[0]),
    coach: toCoach(coachRows[0]),
    court: toCourt(courtRows[0]),
  };
}
