'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LessonRecord,
  LessonRecordWithDetails,
  MemberLessonHistoryEntry,
  Reservation,
} from '@/types';
import { lessonRecordUseCases } from '@/application/usecases';

export default function useLessonRecords() {
  const [records, setRecords] = useState<LessonRecord[]>([]);

  const refresh = useCallback(() => {
    setRecords(lessonRecordUseCases.getAll());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getRecordForInstance = useCallback((instanceId: string): LessonRecord | null => {
    return records.find(r => r.lessonInstanceId === instanceId) ?? null;
  }, [records]);

  const createRecord = useCallback((data: Omit<LessonRecord, 'id' | 'createdAt' | 'updatedAt'>): LessonRecord => {
    const record = lessonRecordUseCases.create(data, records);
    refresh();
    return record;
  }, [records, refresh]);

  const updateRecord = useCallback((id: string, data: Partial<LessonRecord>): LessonRecord | null => {
    const result = lessonRecordUseCases.update(id, data);
    refresh();
    return result;
  }, [refresh]);

  const getRecordWithDetails = useCallback((id: string): LessonRecordWithDetails | null => {
    return lessonRecordUseCases.getWithDetails(id, records);
  }, [records]);

  const getMemberLessonHistory = useCallback((memberId: string): MemberLessonHistoryEntry[] => {
    return lessonRecordUseCases.getMemberHistory(memberId, records);
  }, [records]);

  const getReservationsForInstance = useCallback((instanceId: string): Reservation[] => {
    return lessonRecordUseCases.getReservationsForInstance(instanceId);
  }, []);

  return {
    records,
    getRecordForInstance,
    createRecord,
    updateRecord,
    getRecordWithDetails,
    getMemberLessonHistory,
    getReservationsForInstance,
    refresh,
  };
}
