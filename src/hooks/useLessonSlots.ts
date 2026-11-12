'use client';

import { useCRUD } from '@/hooks/useCRUD';
import type { LessonSlot } from '@/types';
import {
  getLessonSlots,
  getLessonSlotById,
  createLessonSlot,
  updateLessonSlot as updateLessonSlotAction,
  deleteLessonSlot as deleteLessonSlotAction,
} from '@/app/actions/lesson-slots';

export default function useLessonSlots(options?: { eagerLoad?: boolean }) {
  const { items, loading, refresh, getById, add, update, remove } = useCRUD<
    LessonSlot,
    Omit<LessonSlot, 'id' | 'createdAt' | 'updatedAt'>,
    Partial<LessonSlot>
  >(
    {
      getAll: getLessonSlots,
      getById: getLessonSlotById,
      create: createLessonSlot,
      update: updateLessonSlotAction,
      remove: deleteLessonSlotAction,
    },
    { eagerLoad: options?.eagerLoad ?? false }
  );

  return {
    lessonSlots: items,
    loading,
    getLessonSlot: getById!,
    addLessonSlot: add!,
    updateLessonSlot: update!,
    deleteLessonSlot: remove!,
    refresh,
  };
}
