'use client';

import { useState, useCallback, useEffect } from 'react';
import { LessonInstance, LessonInstanceWithDetails } from '@/types';
import {
  getLessonInstances as fetchInstances,
  getLessonInstanceById,
  getLessonInstanceWithDetails,
  getInstancesWithDetailsForDate as fetchInstancesWithDetailsForDate,
  getInstancesWithDetailsForDateRange as fetchInstancesWithDetailsForDateRange,
  cancelLessonInstance,
} from '@/app/actions/lesson-instances';

interface UseLessonInstancesOptions {
  eagerLoad?: boolean;
}

export default function useLessonInstances(options?: UseLessonInstancesOptions) {
  const eagerLoad = options?.eagerLoad ?? false;
  const [instances, setInstances] = useState<LessonInstance[]>([]);
  const [loading, setLoading] = useState(eagerLoad);

  const refresh = useCallback(async () => {
    const data = await fetchInstances();
    setInstances(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!eagerLoad) return;
    fetchInstances().then(data => {
      setInstances(data);
      setLoading(false);
    });
  }, [eagerLoad]);

  const getInstance = useCallback(async (id: string) => {
    return getLessonInstanceById(id);
  }, []);

  const getInstancesForDate = useCallback(
    (date: string): LessonInstance[] => {
      return instances.filter((i) => i.date === date && !i.isCancelled);
    },
    [instances]
  );

  const getInstancesForDateRange = useCallback(
    (from: string, to: string): LessonInstance[] => {
      return instances.filter(
        (i) => i.date >= from && i.date <= to && !i.isCancelled
      );
    },
    [instances]
  );

  const getInstanceWithDetails = useCallback(
    async (instanceId: string): Promise<LessonInstanceWithDetails | null> => {
      return getLessonInstanceWithDetails(instanceId);
    },
    []
  );

  const getInstancesWithDetailsForDate = useCallback(
    async (
      date: string,
      includeCancelled = false
    ): Promise<LessonInstanceWithDetails[]> => {
      return fetchInstancesWithDetailsForDate(date, includeCancelled);
    },
    []
  );

  const getInstancesWithDetailsForDateRange = useCallback(
    async (
      from: string,
      to: string,
      includeCancelled = false
    ): Promise<LessonInstanceWithDetails[]> => {
      return fetchInstancesWithDetailsForDateRange(from, to, includeCancelled);
    },
    []
  );

  const cancelInstance = useCallback(
    async (id: string, reason: string) => {
      await cancelLessonInstance(id, reason);
      await refresh();
    },
    [refresh]
  );

  return {
    instances,
    loading,
    getInstance,
    getInstancesForDate,
    getInstancesForDateRange,
    getInstanceWithDetails,
    getInstancesWithDetailsForDate,
    getInstancesWithDetailsForDateRange,
    cancelInstance,
    refresh,
  };
}
