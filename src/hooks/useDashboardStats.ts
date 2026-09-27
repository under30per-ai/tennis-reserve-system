'use client';

import { useState, useEffect } from 'react';
import { DashboardStats } from '@/types';
import { getDashboardStats } from '@/app/actions/dashboard';

export default function useDashboardStats(): { stats: DashboardStats | null; loading: boolean } {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  return { stats, loading };
}
