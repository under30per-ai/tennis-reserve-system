import { LessonSlot } from '@/domain/models';

export interface ILessonSlotRepository {
  getAll(): LessonSlot[];
  getById(id: string): LessonSlot | null;
  create(data: Omit<LessonSlot, 'id' | 'createdAt' | 'updatedAt'>): LessonSlot;
  update(id: string, data: Partial<LessonSlot>): LessonSlot | null;
  remove(id: string): void;
}
