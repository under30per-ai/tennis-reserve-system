import { LessonInstance } from '@/domain/models';
import { ILessonInstanceRepository } from '@/domain/repositories';
import { STORAGE_KEYS, getAll, getById, update } from '@/infrastructure/storage';

export class LocalStorageLessonInstanceRepository implements ILessonInstanceRepository {
  getAll(): LessonInstance[] {
    return getAll<LessonInstance>(STORAGE_KEYS.LESSON_INSTANCES);
  }

  getById(id: string): LessonInstance | null {
    return getById<LessonInstance>(STORAGE_KEYS.LESSON_INSTANCES, id);
  }

  update(id: string, data: Partial<LessonInstance>): LessonInstance | null {
    return update<LessonInstance>(STORAGE_KEYS.LESSON_INSTANCES, id, data);
  }

  getByDate(date: string): LessonInstance[] {
    return this.getAll().filter(i => i.date === date && !i.isCancelled);
  }

  getByDateRange(from: string, to: string): LessonInstance[] {
    return this.getAll().filter(i => i.date >= from && i.date <= to && !i.isCancelled);
  }
}
