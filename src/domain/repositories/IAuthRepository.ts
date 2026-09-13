import { AuthUser } from '@/domain/models';

export interface StoredAuth {
  user: AuthUser;
  expiresAt: number;
}

export interface IAuthRepository {
  getStoredAuth(): StoredAuth | null;
  saveAuth(user: AuthUser, expiresAt: number): void;
  removeAuth(): void;
}
