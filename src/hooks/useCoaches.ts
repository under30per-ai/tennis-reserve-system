'use client';

import { useState, useCallback } from 'react';
import { Coach } from '@/types';
import { coachUseCases } from '@/application/usecases';

export default function useCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>(() => coachUseCases.getAll());

  const refresh = useCallback(() => {
    setCoaches(coachUseCases.getAll());
  }, []);

  const getCoach = useCallback((id: string) => coachUseCases.getById(id), []);

  const addCoach = useCallback((data: Omit<Coach, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'>) => {
    const coach = coachUseCases.create(data);
    refresh();
    return coach;
  }, [refresh]);

  const updateCoach = useCallback((id: string, data: Partial<Coach>) => {
    const result = coachUseCases.update(id, data);
    refresh();
    return result;
  }, [refresh]);

  const deleteCoach = useCallback((id: string) => {
    coachUseCases.remove(id);
    refresh();
  }, [refresh]);

  return { coaches, getCoach, addCoach, updateCoach, deleteCoach, refresh };
}
