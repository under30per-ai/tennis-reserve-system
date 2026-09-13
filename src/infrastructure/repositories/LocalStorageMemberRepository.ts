import { Member, LessonLevel } from '@/domain/models';
import { IMemberRepository } from '@/domain/repositories';
import { STORAGE_KEYS, getAll, getById, create, update, remove } from '@/infrastructure/storage';

export class LocalStorageMemberRepository implements IMemberRepository {
  getAll(): Member[] {
    return getAll<Member>(STORAGE_KEYS.MEMBERS);
  }

  getById(id: string): Member | null {
    return getById<Member>(STORAGE_KEYS.MEMBERS, id);
  }

  create(data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Member {
    return create<Member>(STORAGE_KEYS.MEMBERS, data);
  }

  update(id: string, data: Partial<Member>): Member | null {
    return update<Member>(STORAGE_KEYS.MEMBERS, id, data);
  }

  remove(id: string): void {
    remove(STORAGE_KEYS.MEMBERS, id);
  }

  search(query: string): Member[] {
    const q = query.toLowerCase();
    return this.getAll().filter(
      m => m.name.toLowerCase().includes(q) || m.nameKana.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }

  getByLevel(level: LessonLevel): Member[] {
    return this.getAll().filter(m => m.level === level && m.isActive);
  }

  getByEmail(email: string): Member | null {
    return this.getAll().find(m => m.email === email) ?? null;
  }
}
