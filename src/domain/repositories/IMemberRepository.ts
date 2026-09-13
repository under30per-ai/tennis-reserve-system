import { Member, LessonLevel } from '@/domain/models';

export interface IMemberRepository {
  getAll(): Member[];
  getById(id: string): Member | null;
  create(data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Member;
  update(id: string, data: Partial<Member>): Member | null;
  remove(id: string): void;
  search(query: string): Member[];
  getByLevel(level: LessonLevel): Member[];
  getByEmail(email: string): Member | null;
}
