import { LessonSlot } from '@/domain/models';
import { ILessonSlotRepository } from '@/domain/repositories';
import { STORAGE_KEYS, getAll, getById, create, update, remove } from '@/infrastructure/storage';

export class LocalStorageLessonSlotRepository implements ILessonSlotRepository {
  getAll(): LessonSlot[] {
    return getAll<LessonSlot>(STORAGE_KEYS.LESSON_SLOTS);
  }

  getById(id: string): LessonSlot | null {
    return getById<LessonSlot>(STORAGE_KEYS.LESSON_SLOTS, id);
  }

  create(data: Omit<LessonSlot, 'id' | 'createdAt' | 'updatedAt'>): LessonSlot {
    return create<LessonSlot>(STORAGE_KEYS.LESSON_SLOTS, data);
  }

  update(id: string, data: Partial<LessonSlot>): LessonSlot | null {
    return update<LessonSlot>(STORAGE_KEYS.LESSON_SLOTS, id, data);
  }

  remove(id: string): void {
    remove(STORAGE_KEYS.LESSON_SLOTS, id);
  }
}
