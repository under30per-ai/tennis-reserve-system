'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';
import { LessonLevel } from '@/types';
import { LEVEL_LABELS, LEVEL_COLORS } from '@/lib/constants';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-teal-100 text-teal-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-indigo-100 text-indigo-800',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  );
}

export function LevelBadge({ level, className }: { level: LessonLevel; className?: string }) {
  const colors = LEVEL_COLORS[level];
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors.bg, colors.text, className)}>
      {LEVEL_LABELS[level]}
    </span>
  );
}
