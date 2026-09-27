'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  LessonRecord,
  LessonRecordWithDetails,
  MemberLessonHistoryEntry,
  Reservation,
} from '@/types';
import {
  getLessonRecords as fetchRecords,
  createLessonRecord,
  updateLessonRecord as updateRecordAction,
  getLessonRecordByInstanceId,
  getLessonRecordWithDetails,
  getMemberLessonHistory as fetchMemberHistory,
  getReservationsForInstance as fetchReservationsForInstance,
} from '@/app/actions/lesson-records';

interface UseLessonRecordsOptions {
  eagerLoad?: boolean;
}

export default function useLessonRecords(options?: UseLessonRecordsOptions) {
  const eagerLoad = options?.eagerLoad ?? false;
  const [records, setRecords] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(eagerLoad);

  const refresh = useCallback(async () => {
    const data = await fetchRecords();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!eagerLoad) return;
    fetchRecords().then(data => {
      setRecords(data);
      setLoading(false);
    });
  }, [eagerLoad]);

  const getRecordForInstance = useCallback(
    async (instanceId: string): Promise<LessonRecord | null> => {
      return getLessonRecordByInstanceId(instanceId);
    },
    []
  );

  const createRecord = useCallback(
    async (
      data: Omit<LessonRecord, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<LessonRecord> => {
      const record = await createLessonRecord(data);
      await refresh();
      return record;
    },
    [refresh]
  );

  const updateRecord = useCallback(
    async (id: string, data: Partial<LessonRecord>): Promise<LessonRecord | null> => {
      const result = await updateRecordAction(id, data);
      await refresh();
      return result;
    },
    [refresh]
  );

  const getRecordWithDetails = useCallback(
    async (id: string): Promise<LessonRecordWithDetails | null> => {
      return getLessonRecordWithDetails(id);
    },
    []
  );

  const getMemberLessonHistory = useCallback(
    async (memberId: string): Promise<MemberLessonHistoryEntry[]> => {
      return fetchMemberHistory(memberId);
    },
    []
  );

  const getReservationsForInstance = useCallback(
    async (instanceId: string): Promise<Reservation[]> => {
      return fetchReservationsForInstance(instanceId);
    },
    []
  );

  return {
    records,
    loading,
    getRecordForInstance,
    createRecord,
    updateRecord,
    getRecordWithDetails,
    getMemberLessonHistory,
    getReservationsForInstance,
    refresh,
  };
}
