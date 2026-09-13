import { Coach } from '@/domain/models';

export interface ICoachRepository {
  getAll(): Coach[];
  getById(id: string): Coach | null;
  create(data: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>): Coach;
  update(id: string, data: Partial<Coach>): Coach | null;
  remove(id: string): void;
}
