import { LessonInstance } from '@/domain/models';

export interface ILessonInstanceRepository {
  getAll(): LessonInstance[];
  getById(id: string): LessonInstance | null;
  update(id: string, data: Partial<LessonInstance>): LessonInstance | null;
  getByDate(date: string): LessonInstance[];
  getByDateRange(from: string, to: string): LessonInstance[];
}
