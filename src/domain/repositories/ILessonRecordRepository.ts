import { LessonRecord } from '@/domain/models';

export interface ILessonRecordRepository {
  getAll(): LessonRecord[];
  getById(id: string): LessonRecord | null;
  create(data: Omit<LessonRecord, 'id' | 'createdAt' | 'updatedAt'>): LessonRecord;
  update(id: string, data: Partial<LessonRecord>): LessonRecord | null;
  getByInstanceId(instanceId: string): LessonRecord | null;
}
