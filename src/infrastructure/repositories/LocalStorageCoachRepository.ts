import { Coach } from '@/domain/models';
import { ICoachRepository } from '@/domain/repositories';
import { STORAGE_KEYS, getAll, getById, create, update, remove } from '@/infrastructure/storage';

export class LocalStorageCoachRepository implements ICoachRepository {
  getAll(): Coach[] {
    return getAll<Coach>(STORAGE_KEYS.COACHES);
  }

  getById(id: string): Coach | null {
    return getById<Coach>(STORAGE_KEYS.COACHES, id);
  }

  create(data: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>): Coach {
    return create<Coach>(STORAGE_KEYS.COACHES, data);
  }

  update(id: string, data: Partial<Coach>): Coach | null {
    return update<Coach>(STORAGE_KEYS.COACHES, id, data);
  }

  remove(id: string): void {
    remove(STORAGE_KEYS.COACHES, id);
  }
}
