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

  if (instance.isCancelled) throw new Error('このレッスンは中止されています');

  const today = new Date().toISOString().slice(0, 10);
  if (instance.date < today) throw new Error('過去のレッスンは予約できません');

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
  // Validate target instance
  const toInstRows = await db
    .select()
    .from(lessonInstances)
    .where(eq(lessonInstances.id, toInstanceId));
  if (toInstRows.length === 0) throw new Error('振替先のレッスンが見つかりません');
  const toInstance = toLessonInstance(toInstRows[0]);

  if (toInstance.isCancelled) throw new Error('振替先のレッスンは中止されています');

  const today = new Date().toISOString().slice(0, 10);
  if (toInstance.date < today) throw new Error('過去のレッスンには振替できません');

  // Validate member has transfers remaining
  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId));
  if (memberRows.length === 0) throw new Error('会員情報が見つかりません');
  if (memberRows[0].remainingTransfers <= 0) throw new Error('振替回数の上限に達しています');

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

  await db
    .update(members)
    .set({
      remainingTransfers: memberRows[0].remainingTransfers - 1,
      updatedAt: new Date(),
    })
    .where(eq(members.id, memberId));

  return toReservation(newRows[0]);
}

export async function getMemberReservations(
  memberId: string
): Promise<ReservationWithDetails[]> {
  const rows = await db
    .select()
    .from(reservations)
    .innerJoin(lessonInstances, eq(reservations.lessonInstanceId, lessonInstances.id))
    .innerJoin(lessonSlots, eq(lessonInstances.lessonSlotId, lessonSlots.id))
    .innerJoin(members, eq(reservations.memberId, members.id))
    .innerJoin(coaches, eq(lessonInstances.coachId, coaches.id))
    .innerJoin(courts, eq(lessonInstances.courtId, courts.id))
    .where(eq(reservations.memberId, memberId));

  return rows
    .map((row) => ({
      ...toReservation(row.reservations),
      member: toMember(row.members),
      lessonInstance: toLessonInstance(row.lesson_instances),
      lessonSlot: toLessonSlot(row.lesson_slots),
      coach: toCoach(row.coaches),
      court: toCourt(row.courts),
    }))
    .sort((a, b) => b.lessonInstance.date.localeCompare(a.lessonInstance.date));
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
  const rows = await db
    .select()
    .from(reservations)
    .innerJoin(lessonInstances, eq(reservations.lessonInstanceId, lessonInstances.id))
    .innerJoin(lessonSlots, eq(lessonInstances.lessonSlotId, lessonSlots.id))
    .innerJoin(members, eq(reservations.memberId, members.id))
    .innerJoin(coaches, eq(lessonInstances.coachId, coaches.id))
    .innerJoin(courts, eq(lessonInstances.courtId, courts.id));

  return rows
    .map((row) => ({
      ...toReservation(row.reservations),
      member: toMember(row.members),
      lessonInstance: toLessonInstance(row.lesson_instances),
      lessonSlot: toLessonSlot(row.lesson_slots),
      coach: toCoach(row.coaches),
      court: toCourt(row.courts),
    }))
    .sort((a, b) => b.reservedAt.localeCompare(a.reservedAt));
}
