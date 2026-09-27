'use client';

import { useState, useCallback, useEffect } from 'react';
import { LessonInstance, LessonInstanceWithDetails } from '@/types';
import {
  getLessonInstances as fetchInstances,
  getLessonInstanceById,
  getLessonInstanceWithDetails,
  getInstancesWithDetailsForDate as fetchInstancesWithDetailsForDate,
  cancelLessonInstance,
} from '@/app/actions/lesson-instances';

export default function useLessonInstances() {
  const [instances, setInstances] = useState<LessonInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchInstances();
    setInstances(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstances().then(data => {
      setInstances(data);
      setLoading(false);
    });
  }, []);

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
    cancelInstance,
    refresh,
  };
}
