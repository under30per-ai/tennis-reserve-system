import { LessonRecord } from '@/domain/models';
import { ILessonRecordRepository } from '@/domain/repositories';
import { STORAGE_KEYS, getAll, getById, create, update } from '@/infrastructure/storage';

export class LocalStorageLessonRecordRepository implements ILessonRecordRepository {
  getAll(): LessonRecord[] {
    return getAll<LessonRecord>(STORAGE_KEYS.LESSON_RECORDS);
  }

  getById(id: string): LessonRecord | null {
    return getById<LessonRecord>(STORAGE_KEYS.LESSON_RECORDS, id);
  }

  create(data: Omit<LessonRecord, 'id' | 'createdAt' | 'updatedAt'>): LessonRecord {
    return create<LessonRecord>(STORAGE_KEYS.LESSON_RECORDS, data);
  }

  update(id: string, data: Partial<LessonRecord>): LessonRecord | null {
    return update<LessonRecord>(STORAGE_KEYS.LESSON_RECORDS, id, data);
  }

  getByInstanceId(instanceId: string): LessonRecord | null {
    return this.getAll().find(r => r.lessonInstanceId === instanceId) ?? null;
  }
}
