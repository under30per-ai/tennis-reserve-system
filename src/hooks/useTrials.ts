'use client';

import { useCallback } from 'react';
import { useCRUD } from '@/hooks/useCRUD';
import type { TrialApplication, TrialStatus } from '@/types';
import {
  getTrialApplications,
  getTrialById,
  updateTrialStatus as updateTrialStatusAction,
} from '@/app/actions/trials';

export default function useTrials(options?: { eagerLoad?: boolean }) {
  const { items, loading, refresh, getById } = useCRUD<TrialApplication>(
    {
      getAll: getTrialApplications,
      getById: getTrialById,
    },
    { eagerLoad: options?.eagerLoad ?? false }
  );

  const updateTrialStatus = useCallback(
    async (id: string, status: TrialStatus, adminNotes?: string) => {
      const result = await updateTrialStatusAction(id, status, adminNotes);
      await refresh();
      return result;
    },
    [refresh]
  );

  return {
    applications: items,
    loading,
    refresh,
    getTrial: getById!,
    updateTrialStatus,
  };
}
