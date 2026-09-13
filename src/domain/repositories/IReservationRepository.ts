import { Reservation } from '@/domain/models';

export interface IReservationRepository {
  getAll(): Reservation[];
  getById(id: string): Reservation | null;
  create(data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Reservation;
  update(id: string, data: Partial<Reservation>): Reservation | null;
  getByInstanceId(instanceId: string): Reservation[];
  getByMemberId(memberId: string): Reservation[];
  getActiveByInstanceId(instanceId: string): Reservation[];
}
