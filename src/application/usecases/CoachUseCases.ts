import { Coach } from '@/domain/models';
import { ICoachRepository } from '@/domain/repositories';
import { getRandomAvatarColor } from '@/lib/utils';

export class CoachUseCases {
  constructor(private coachRepo: ICoachRepository) {}

  getAll(): Coach[] {
    return this.coachRepo.getAll();
  }

  getById(id: string): Coach | null {
    return this.coachRepo.getById(id);
  }

  create(data: Omit<Coach, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'>): Coach {
    return this.coachRepo.create({ ...data, avatarColor: getRandomAvatarColor() });
  }

  update(id: string, data: Partial<Coach>): Coach | null {
    return this.coachRepo.update(id, data);
  }

  remove(id: string): void {
    this.coachRepo.remove(id);
  }
}
