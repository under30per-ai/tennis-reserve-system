'use client';

import { useState, useCallback, useEffect } from 'react';
import { LessonSlot } from '@/types';
import {
  getLessonSlots as fetchLessonSlots,
  getLessonSlotById,
  createLessonSlot,
  updateLessonSlot as updateLessonSlotAction,
  deleteLessonSlot as deleteLessonSlotAction,
} from '@/app/actions/lesson-slots';

export default function useLessonSlots() {
  const [lessonSlots, setLessonSlots] = useState<LessonSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchLessonSlots();
    setLessonSlots(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLessonSlots().then(data => {
      setLessonSlots(data);
      setLoading(false);
    });
  }, []);

  const getLessonSlot = useCallback(async (id: string) => {
    return getLessonSlotById(id);
  }, []);

  const addLessonSlot = useCallback(
    async (data: Omit<LessonSlot, 'id' | 'createdAt' | 'updatedAt'>) => {
      const slot = await createLessonSlot(data);
      await refresh();
      return slot;
    },
    [refresh]
  );

  const updateLessonSlot = useCallback(
    async (id: string, data: Partial<LessonSlot>) => {
      const result = await updateLessonSlotAction(id, data);
      await refresh();
      return result;
    },
    [refresh]
  );

  const deleteLessonSlot = useCallback(
    async (id: string) => {
      await deleteLessonSlotAction(id);
      await refresh();
    },
    [refresh]
  );

  return {
    lessonSlots,
    loading,
    getLessonSlot,
    addLessonSlot,
    updateLessonSlot,
    deleteLessonSlot,
    refresh,
  };
}
