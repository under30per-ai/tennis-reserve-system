'use client';

import { useState, useCallback, useEffect } from 'react';
import { Coach } from '@/types';
import {
  getCoaches as fetchCoaches,
  getCoachById,
  createCoach,
  updateCoach as updateCoachAction,
  deleteCoach as deleteCoachAction,
} from '@/app/actions/coaches';

export default function useCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchCoaches();
    setCoaches(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoaches().then(data => {
      setCoaches(data);
      setLoading(false);
    });
  }, []);

  const getCoach = useCallback(async (id: string) => {
    return getCoachById(id);
  }, []);

  const addCoach = useCallback(
    async (data: Omit<Coach, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'>) => {
      const coach = await createCoach(data);
      await refresh();
      return coach;
    },
    [refresh]
  );

  const updateCoach = useCallback(
    async (id: string, data: Partial<Coach>) => {
      const result = await updateCoachAction(id, data);
      await refresh();
      return result;
    },
    [refresh]
  );

  const deleteCoach = useCallback(
    async (id: string) => {
      await deleteCoachAction(id);
      await refresh();
    },
    [refresh]
  );

  return { coaches, loading, getCoach, addCoach, updateCoach, deleteCoach, refresh };
}
