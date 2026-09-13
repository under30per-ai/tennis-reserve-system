import { v4 as uuidv4 } from 'uuid';

export const STORAGE_KEYS = {
  MEMBERS: 'tennis_members',
  COACHES: 'tennis_coaches',
  COURTS: 'tennis_courts',
  LESSON_SLOTS: 'tennis_lesson_slots',
  LESSON_INSTANCES: 'tennis_lesson_instances',
  RESERVATIONS: 'tennis_reservations',
  LESSON_RECORDS: 'tennis_lesson_records',
  AUTH_USER: 'tennis_auth_user',
  IS_SEEDED: 'tennis_is_seeded',
} as const;

function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function getAll<T>(key: string): T[] {
  if (!isClient()) return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getById<T extends { id: string }>(key: string, id: string): T | null {
  const items = getAll<T>(key);
  return items.find(item => item.id === id) ?? null;
}

export function create<T extends { id: string }>(key: string, item: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<T, 'id'>>): T {
  const items = getAll<T>(key);
  const now = new Date().toISOString();
  const newItem = {
    ...item,
    id: (item as { id?: string }).id || uuidv4(),
    createdAt: now,
    updatedAt: now,
  } as unknown as T;
  items.push(newItem);
  localStorage.setItem(key, JSON.stringify(items));
  return newItem;
}

export function update<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null {
  const items = getAll<T>(key);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  const now = new Date().toISOString();
  items[index] = { ...items[index], ...updates, updatedAt: now };
  localStorage.setItem(key, JSON.stringify(items));
  return items[index];
}

export function remove(key: string, id: string): boolean {
  const items = getAll<{ id: string }>(key);
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length === items.length) return false;
  localStorage.setItem(key, JSON.stringify(filtered));
  return true;
}

export function query<T>(key: string, predicate: (item: T) => boolean): T[] {
  return getAll<T>(key).filter(predicate);
}

export function setAll<T>(key: string, items: T[]): void {
  if (!isClient()) return;
  localStorage.setItem(key, JSON.stringify(items));
}

export function getItem(key: string): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(key);
}

export function setItem(key: string, value: string): void {
  if (!isClient()) return;
  localStorage.setItem(key, value);
}

export function removeItem(key: string): void {
  if (!isClient()) return;
  localStorage.removeItem(key);
}
