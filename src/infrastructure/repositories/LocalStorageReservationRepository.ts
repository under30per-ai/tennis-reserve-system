import { Reservation } from '@/domain/models';
import { IReservationRepository } from '@/domain/repositories';
import { STORAGE_KEYS, getAll, getById, create, update } from '@/infrastructure/storage';

export class LocalStorageReservationRepository implements IReservationRepository {
  getAll(): Reservation[] {
    return getAll<Reservation>(STORAGE_KEYS.RESERVATIONS);
  }

  getById(id: string): Reservation | null {
    return getById<Reservation>(STORAGE_KEYS.RESERVATIONS, id);
  }

  create(data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Reservation {
    return create<Reservation>(STORAGE_KEYS.RESERVATIONS, data);
  }

  update(id: string, data: Partial<Reservation>): Reservation | null {
    return update<Reservation>(STORAGE_KEYS.RESERVATIONS, id, data);
  }

  getByInstanceId(instanceId: string): Reservation[] {
    return this.getAll().filter(r => r.lessonInstanceId === instanceId);
  }

  getByMemberId(memberId: string): Reservation[] {
    return this.getAll().filter(r => r.memberId === memberId);
  }

  getActiveByInstanceId(instanceId: string): Reservation[] {
    return this.getAll().filter(
      r => r.lessonInstanceId === instanceId && (r.status === 'confirmed' || r.status === 'waitlisted')
    );
  }
}
