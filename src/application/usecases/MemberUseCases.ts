import { Member, LessonLevel } from '@/domain/models';
import { IMemberRepository } from '@/domain/repositories';
import { getRandomAvatarColor } from '@/lib/utils';

export class MemberUseCases {
  constructor(private memberRepo: IMemberRepository) {}

  getAll(): Member[] {
    return this.memberRepo.getAll();
  }

  getById(id: string): Member | null {
    return this.memberRepo.getById(id);
  }

  create(data: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'>): Member {
    return this.memberRepo.create({ ...data, avatarColor: getRandomAvatarColor() });
  }

  update(id: string, data: Partial<Member>): Member | null {
    return this.memberRepo.update(id, data);
  }

  remove(id: string): void {
    this.memberRepo.remove(id);
  }

  search(query: string): Member[] {
    return this.memberRepo.search(query);
  }

  getByLevel(level: LessonLevel): Member[] {
    return this.memberRepo.getByLevel(level);
  }
}
