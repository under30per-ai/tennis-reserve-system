'use client';

import { useState, useCallback, useEffect } from 'react';
import type { TrialApplication, TrialStatus } from '@/types';
import {
  getTrialApplications,
  getTrialById,
  updateTrialStatus as updateTrialStatusAction,
} from '@/app/actions/trials';

export default function useTrials(options?: { eagerLoad?: boolean }) {
  const eagerLoad = options?.eagerLoad ?? false;
  const [applications, setApplications] = useState<TrialApplication[]>([]);
  const [loading, setLoading] = useState(eagerLoad);

  const refresh = useCallback(async () => {
    const data = await getTrialApplications();
    setApplications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!eagerLoad) return;
    refresh();
  }, [eagerLoad, refresh]);

  const getTrial = useCallback(async (id: string) => {
    return getTrialById(id);
  }, []);

  const updateTrialStatus = useCallback(
    async (id: string, status: TrialStatus, adminNotes?: string) => {
      const result = await updateTrialStatusAction(id, status, adminNotes);
      await refresh();
      return result;
    },
    [refresh]
  );

  return { applications, loading, refresh, getTrial, updateTrialStatus };
}
