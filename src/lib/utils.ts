import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AVATAR_COLORS } from './constants';

export function formatDate(dateStr: string, fmt: string = 'yyyy/MM/dd'): string {
  return format(parseISO(dateStr), fmt, { locale: ja });
}

export function formatDateObj(date: Date, fmt: string = 'yyyy/MM/dd'): string {
  return format(date, fmt, { locale: ja });
}

export function formatTime(time: string): string {
  return time;
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy/MM/dd HH:mm', { locale: ja });
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function getInitials(name: string): string {
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return parts[0].charAt(0) + parts[1].charAt(0);
  }
  return name.slice(0, 2);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getAvailabilityLabel(available: number, max: number): { label: string; color: string } {
  if (available <= 0) return { label: '満員', color: 'text-red-600' };
  if (available <= Math.ceil(max * 0.2)) return { label: `残り${available}名`, color: 'text-orange-600' };
  return { label: `空きあり (${available}/${max})`, color: 'text-green-600' };
}
