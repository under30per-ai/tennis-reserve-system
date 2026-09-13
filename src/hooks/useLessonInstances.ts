'use client';

import { useState, useEffect, useCallback } from 'react';
import { LessonInstance, LessonInstanceWithDetails } from '@/types';
import { lessonInstanceUseCases } from '@/application/usecases';

export default function useLessonInstances() {
  const [instances, setInstances] = useState<LessonInstance[]>([]);

  const refresh = useCallback(() => {
    setInstances(lessonInstanceUseCases.getAll());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getInstance = useCallback((id: string) => lessonInstanceUseCases.getById(id), []);

  const getInstancesForDate = useCallback((date: string): LessonInstance[] => {
    return instances.filter(i => i.date === date && !i.isCancelled);
  }, [instances]);

  const getInstancesForDateRange = useCallback((from: string, to: string): LessonInstance[] => {
    return instances.filter(i => i.date >= from && i.date <= to && !i.isCancelled);
  }, [instances]);

  const getInstanceWithDetails = useCallback((instanceId: string): LessonInstanceWithDetails | null => {
    return lessonInstanceUseCases.getWithDetails(instanceId);
  }, []);

  const getInstancesWithDetailsForDate = useCallback((date: string, includeCancelled = false): LessonInstanceWithDetails[] => {
    return lessonInstanceUseCases.getWithDetailsForDate(date, instances, includeCancelled);
  }, [instances]);

  const cancelInstance = useCallback((id: string, reason: string) => {
    lessonInstanceUseCases.cancel(id, reason);
    refresh();
  }, [refresh]);

  return {
    instances, getInstance, getInstancesForDate, getInstancesForDateRange,
    getInstanceWithDetails, getInstancesWithDetailsForDate, cancelInstance, refresh,
  };
}
