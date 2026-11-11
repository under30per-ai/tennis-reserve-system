'use client';

import { useCallback } from 'react';
import { Reservation, ReservationWithDetails } from '@/types';
import {
  makeReservation as makeReservationAction,
  cancelReservation as cancelReservationAction,
  transferReservation as transferReservationAction,
  getMemberReservations as fetchMemberReservations,
  getReservationsForInstance as fetchReservationsForInstance,
  getAllReservationsWithDetails,
} from '@/app/actions/reservations';

export default function useReservations() {
  const makeReservation = useCallback(
    async (memberId: string, lessonInstanceId: string): Promise<Reservation> => {
      return makeReservationAction(memberId, lessonInstanceId);
    },
    []
  );

  const cancelReservation = useCallback(
    async (reservationId: string) => {
      await cancelReservationAction(reservationId);
    },
    []
  );

  const transferReservation = useCallback(
    async (
      memberId: string,
      fromInstanceId: string,
      toInstanceId: string
    ): Promise<Reservation> => {
      return transferReservationAction(memberId, fromInstanceId, toInstanceId);
    },
    []
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
    loading: false,
    makeReservation,
    cancelReservation,
    transferReservation,
    getMemberReservations,
    getReservationsForInstance,
    getAllWithDetails,
  };
}
