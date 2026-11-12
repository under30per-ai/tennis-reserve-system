'use client';

import { useCRUD } from '@/hooks/useCRUD';
import type { Coach } from '@/types';
import {
  getCoaches,
  getCoachById,
  createCoach,
  updateCoach as updateCoachAction,
  deleteCoach as deleteCoachAction,
} from '@/app/actions/coaches';

export default function useCoaches() {
  const { items, loading, refresh, getById, add, update, remove } = useCRUD<
    Coach,
    Omit<Coach, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'>,
    Partial<Coach>
  >({
    getAll: getCoaches,
    getById: getCoachById,
    create: createCoach,
    update: updateCoachAction,
    remove: deleteCoachAction,
  });

  return {
    coaches: items,
    loading,
    getCoach: getById!,
    addCoach: add!,
    updateCoach: update!,
    deleteCoach: remove!,
    refresh,
  };
}
