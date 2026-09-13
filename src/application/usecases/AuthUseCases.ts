import { AuthUser } from '@/domain/models';
import { IAuthRepository, IMemberRepository } from '@/domain/repositories';

const AUTH_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const ADMIN_EMAIL = 'admin@tennis.jp';
const ADMIN_PASSWORD = 'admin';

export class AuthUseCases {
  constructor(
    private authRepo: IAuthRepository,
    private memberRepo: IMemberRepository,
  ) {}

  getStoredUser(): AuthUser | null {
    const stored = this.authRepo.getStoredAuth();
    if (!stored) return null;

    if (stored.expiresAt === 0) {
      // Legacy format: migrate
      this.authRepo.saveAuth(stored.user, Date.now() + AUTH_EXPIRY_MS);
      return stored.user;
    }

    if (Date.now() < stored.expiresAt) {
      return stored.user;
    }

    this.authRepo.removeAuth();
    return null;
  }

  login(email: string, password: string, role: 'member' | 'admin'): AuthUser | null {
    if (role === 'admin') {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const adminUser: AuthUser = { id: 'admin', name: '管理者', role: 'admin' };
        this.authRepo.saveAuth(adminUser, Date.now() + AUTH_EXPIRY_MS);
        return adminUser;
      }
      return null;
    }

    const members = this.memberRepo.getAll();
    const member = members.find(m => m.email === email && m.password === password);
    if (member) {
      const memberUser: AuthUser = { id: member.id, name: member.name, role: 'member', memberId: member.id };
      this.authRepo.saveAuth(memberUser, Date.now() + AUTH_EXPIRY_MS);
      return memberUser;
    }
    return null;
  }

  logout(): void {
    this.authRepo.removeAuth();
  }
}
