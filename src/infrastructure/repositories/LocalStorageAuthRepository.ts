import { AuthUser } from '@/domain/models';
import { IAuthRepository, StoredAuth } from '@/domain/repositories';
import { STORAGE_KEYS, getItem, setItem, removeItem } from '@/infrastructure/storage';

export class LocalStorageAuthRepository implements IAuthRepository {
  getStoredAuth(): StoredAuth | null {
    const stored = getItem(STORAGE_KEYS.AUTH_USER);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (parsed.expiresAt && parsed.user) {
        return parsed as StoredAuth;
      }
      // Legacy format: raw AuthUser object
      if (parsed.id) {
        return { user: parsed as AuthUser, expiresAt: 0 };
      }
      return null;
    } catch {
      return null;
    }
  }

  saveAuth(user: AuthUser, expiresAt: number): void {
    const data: StoredAuth = { user, expiresAt };
    setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(data));
  }

  removeAuth(): void {
    removeItem(STORAGE_KEYS.AUTH_USER);
  }
}
