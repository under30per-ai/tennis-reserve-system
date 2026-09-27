'use client';

import { useState, useCallback, useEffect } from 'react';
import { Court } from '@/types';
import {
  getCourts as fetchCourts,
  getCourtById,
  createCourt,
  updateCourt as updateCourtAction,
  deleteCourt as deleteCourtAction,
} from '@/app/actions/courts';

export default function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchCourts();
    setCourts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCourts().then(data => {
      setCourts(data);
      setLoading(false);
    });
  }, []);

  const getCourt = useCallback(async (id: string) => {
    return getCourtById(id);
  }, []);

  const addCourt = useCallback(
    async (data: Omit<Court, 'id'>) => {
      const court = await createCourt(data);
      await refresh();
      return court;
    },
    [refresh]
  );

  const updateCourt = useCallback(
    async (id: string, data: Partial<Court>) => {
      const result = await updateCourtAction(id, data);
      await refresh();
      return result;
    },
    [refresh]
  );

  const deleteCourt = useCallback(
    async (id: string) => {
      await deleteCourtAction(id);
      await refresh();
    },
    [refresh]
  );

  return { courts, loading, getCourt, addCourt, updateCourt, deleteCourt, refresh };
}
