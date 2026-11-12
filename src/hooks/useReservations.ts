'use client';

import {
  makeReservation,
  cancelReservation,
  transferReservation,
  getMemberReservations,
  getReservationsForInstance,
  getAllReservationsWithDetails,
} from '@/app/actions/reservations';

/**
 * Thin wrapper exposing reservation server actions.
 * No local state — actions are called directly.
 */
export default function useReservations() {
  return {
    loading: false,
    makeReservation,
    cancelReservation,
    transferReservation,
    getMemberReservations,
    getReservationsForInstance,
    getAllWithDetails: getAllReservationsWithDetails,
  };
}
