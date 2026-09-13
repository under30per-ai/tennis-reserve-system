'use client';

import { useState, useEffect, useCallback } from 'react';
import { Reservation, ReservationWithDetails } from '@/types';
import { reservationUseCases } from '@/application/usecases';

export default function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const refresh = useCallback(() => {
    setReservations(reservationUseCases.getAll());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const makeReservation = useCallback((memberId: string, lessonInstanceId: string): Reservation => {
    const reservation = reservationUseCases.makeReservation(memberId, lessonInstanceId);
    refresh();
    return reservation;
  }, [refresh]);

  const cancelReservation = useCallback((reservationId: string) => {
    reservationUseCases.cancelReservation(reservationId);
    refresh();
  }, [refresh]);

  const transferReservation = useCallback((
    memberId: string,
    fromInstanceId: string,
    toInstanceId: string
  ): Reservation => {
    const newReservation = reservationUseCases.transferReservation(memberId, fromInstanceId, toInstanceId);
    refresh();
    return newReservation;
  }, [refresh]);

  const getMemberReservations = useCallback((memberId: string): ReservationWithDetails[] => {
    return reservationUseCases.getMemberReservations(memberId, reservations);
  }, [reservations]);

  const getReservationsForInstance = useCallback((instanceId: string) => {
    return reservationUseCases.getForInstance(instanceId, reservations);
  }, [reservations]);

  const getAllWithDetails = useCallback((): ReservationWithDetails[] => {
    return reservationUseCases.getAllWithDetails(reservations);
  }, [reservations]);

  return {
    reservations, makeReservation, cancelReservation, transferReservation,
    getMemberReservations, getReservationsForInstance, getAllWithDetails, refresh,
  };
}
