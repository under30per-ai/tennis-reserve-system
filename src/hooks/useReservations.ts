'use client';

import { useState, useCallback } from 'react';
import { Reservation, ReservationWithDetails } from '@/types';
import {
  getReservations as fetchReservations,
  makeReservation as makeReservationAction,
  cancelReservation as cancelReservationAction,
  transferReservation as transferReservationAction,
  getMemberReservations as fetchMemberReservations,
  getReservationsForInstance as fetchReservationsForInstance,
  getAllReservationsWithDetails,
} from '@/app/actions/reservations';

export default function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading] = useState(false);

  const refresh = useCallback(async () => {
    const data = await fetchReservations();
    setReservations(data);
  }, []);

  const makeReservation = useCallback(
    async (memberId: string, lessonInstanceId: string): Promise<Reservation> => {
      const reservation = await makeReservationAction(memberId, lessonInstanceId);
      // refresh() は admin専用の getReservations() を呼ぶため、会員操作では呼ばない
      try { await refresh(); } catch { /* 会員の場合は権限エラーになるため無視 */ }
      return reservation;
    },
    [refresh]
  );

  const cancelReservation = useCallback(
    async (reservationId: string) => {
      await cancelReservationAction(reservationId);
      try { await refresh(); } catch { /* 会員の場合は権限エラーになるため無視 */ }
    },
    [refresh]
  );

  const transferReservation = useCallback(
    async (
      memberId: string,
      fromInstanceId: string,
      toInstanceId: string
    ): Promise<Reservation> => {
      const newReservation = await transferReservationAction(
        memberId,
        fromInstanceId,
        toInstanceId
      );
      try { await refresh(); } catch { /* 会員の場合は権限エラーになるため無視 */ }
      return newReservation;
    },
    [refresh]
  );

  const getMemberReservations = useCallback(
    async (memberId: string): Promise<ReservationWithDetails[]> => {
      return fetchMemberReservations(memberId);
    },
    []
  );

  const getReservationsForInstance = useCallback(
    async (instanceId: string): Promise<Reservation[]> => {
      return fetchReservationsForInstance(instanceId);
    },
    []
  );

  const getAllWithDetails = useCallback(async (): Promise<
    ReservationWithDetails[]
  > => {
    return getAllReservationsWithDetails();
  }, []);

  return {
    reservations,
    loading,
    makeReservation,
    cancelReservation,
    transferReservation,
    getMemberReservations,
    getReservationsForInstance,
    getAllWithDetails,
    refresh,
  };
}
