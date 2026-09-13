'use client';

import { useMemo } from 'react';
import { DashboardStats } from '@/types';
import { dashboardUseCases } from '@/application/usecases';

export default function useDashboardStats(): DashboardStats {
  return useMemo(() => dashboardUseCases.getStats(), []);
}
