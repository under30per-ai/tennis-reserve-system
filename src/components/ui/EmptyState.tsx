'use client';

import { ReactNode } from 'react';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 opacity-40">
        {icon || <TennisBallIcon size={64} />}
      </div>
      <h3 className="text-lg font-medium text-net-gray mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
