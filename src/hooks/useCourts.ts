'use client';

import { useState, useEffect, useCallback } from 'react';
import { Court } from '@/types';
import { courtUseCases } from '@/application/usecases';

export default function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);

  const refresh = useCallback(() => {
    setCourts(courtUseCases.getAll());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getCourt = useCallback((id: string) => courtUseCases.getById(id), []);

  const addCourt = useCallback((data: Omit<Court, 'id'>) => {
    const court = courtUseCases.create(data);
    refresh();
    return court;
  }, [refresh]);

  const updateCourt = useCallback((id: string, data: Partial<Court>) => {
    const result = courtUseCases.update(id, data);
    refresh();
    return result;
  }, [refresh]);

  const deleteCourt = useCallback((id: string) => {
    courtUseCases.remove(id);
    refresh();
  }, [refresh]);

  return { courts, getCourt, addCourt, updateCourt, deleteCourt, refresh };
}
