import { Court } from '@/domain/models';

export interface ICourtRepository {
  getAll(): Court[];
  getById(id: string): Court | null;
  create(data: Omit<Court, 'id'>): Court;
  update(id: string, data: Partial<Court>): Court | null;
  remove(id: string): void;
}
