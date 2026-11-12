'use client';

import { useCRUD } from '@/hooks/useCRUD';
import type { Court } from '@/types';
import {
  getCourts,
  getCourtById,
  createCourt,
  updateCourt as updateCourtAction,
  deleteCourt as deleteCourtAction,
} from '@/app/actions/courts';

export default function useCourts() {
  const { items, loading, refresh, getById, add, update, remove } = useCRUD<
    Court,
    Omit<Court, 'id'>,
    Partial<Court>
  >({
    getAll: getCourts,
    getById: getCourtById,
    create: createCourt,
    update: updateCourtAction,
    remove: deleteCourtAction,
  });

  return {
    courts: items,
    loading,
    getCourt: getById!,
    addCourt: add!,
    updateCourt: update!,
    deleteCourt: remove!,
    refresh,
  };
}
