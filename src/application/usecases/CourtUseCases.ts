import { Court } from '@/domain/models';
import { ICourtRepository } from '@/domain/repositories';

export class CourtUseCases {
  constructor(private courtRepo: ICourtRepository) {}

  getAll(): Court[] {
    return this.courtRepo.getAll();
  }

  getById(id: string): Court | null {
    return this.courtRepo.getById(id);
  }

  create(data: Omit<Court, 'id'>): Court {
    return this.courtRepo.create(data);
  }

  update(id: string, data: Partial<Court>): Court | null {
    return this.courtRepo.update(id, data);
  }

  remove(id: string): void {
    this.courtRepo.remove(id);
  }
}
