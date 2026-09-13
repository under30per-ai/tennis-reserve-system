import { Court } from '@/domain/models';
import { ICourtRepository } from '@/domain/repositories';
import { STORAGE_KEYS, getAll, getById, create, update, remove } from '@/infrastructure/storage';

export class LocalStorageCourtRepository implements ICourtRepository {
  getAll(): Court[] {
    return getAll<Court>(STORAGE_KEYS.COURTS);
  }

  getById(id: string): Court | null {
    return getById<Court>(STORAGE_KEYS.COURTS, id);
  }

  create(data: Omit<Court, 'id'>): Court {
    return create<Court>(STORAGE_KEYS.COURTS, data);
  }

  update(id: string, data: Partial<Court>): Court | null {
    return update<Court>(STORAGE_KEYS.COURTS, id, data);
  }

  remove(id: string): void {
    remove(STORAGE_KEYS.COURTS, id);
  }
}
