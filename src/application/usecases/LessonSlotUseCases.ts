import { LessonSlot } from '@/domain/models';
import { ILessonSlotRepository } from '@/domain/repositories';

export class LessonSlotUseCases {
  constructor(private slotRepo: ILessonSlotRepository) {}

  getAll(): LessonSlot[] {
    return this.slotRepo.getAll();
  }

  getById(id: string): LessonSlot | null {
    return this.slotRepo.getById(id);
  }

  create(data: Omit<LessonSlot, 'id' | 'createdAt' | 'updatedAt'>): LessonSlot {
    return this.slotRepo.create(data);
  }

  update(id: string, data: Partial<LessonSlot>): LessonSlot | null {
    return this.slotRepo.update(id, data);
  }

  remove(id: string): void {
    this.slotRepo.remove(id);
  }
}
