'use client';

import { useState, useEffect, useCallback } from 'react';
import { LessonSlot } from '@/types';
import { lessonSlotUseCases } from '@/application/usecases';

export default function useLessonSlots() {
  const [lessonSlots, setLessonSlots] = useState<LessonSlot[]>([]);

  const refresh = useCallback(() => {
    setLessonSlots(lessonSlotUseCases.getAll());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getLessonSlot = useCallback((id: string) => lessonSlotUseCases.getById(id), []);

  const addLessonSlot = useCallback((data: Omit<LessonSlot, 'id' | 'createdAt' | 'updatedAt'>) => {
    const slot = lessonSlotUseCases.create(data);
    refresh();
    return slot;
  }, [refresh]);

  const updateLessonSlot = useCallback((id: string, data: Partial<LessonSlot>) => {
    const result = lessonSlotUseCases.update(id, data);
    refresh();
    return result;
  }, [refresh]);

  const deleteLessonSlot = useCallback((id: string) => {
    lessonSlotUseCases.remove(id);
    refresh();
  }, [refresh]);

  return { lessonSlots, getLessonSlot, addLessonSlot, updateLessonSlot, deleteLessonSlot, refresh };
}
