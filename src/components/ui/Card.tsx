'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: boolean;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>;

export default function Card({ children, className, padding = true, ...rest }: CardProps) {
  return (
    <div className={clsx('tennis-card', padding && 'p-4 sm:p-6', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={clsx('text-lg font-bold text-net-gray', className)}>
      {children}
    </h3>
  );
}
