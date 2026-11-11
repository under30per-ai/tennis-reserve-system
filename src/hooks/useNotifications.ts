'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Notification } from '@/types';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
} from '@/app/actions/notifications';

export default function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [data, count] = await Promise.all([getMyNotifications(), getUnreadCount()]);
    setNotifications(data);
    setUnreadCount(count);
    setLoading(false);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markAsRead = useCallback(
    async (id: string) => {
      await markAsReadAction(id);
      await refresh();
    },
    [refresh]
  );

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadAction();
    await refresh();
  }, [refresh]);

  return { notifications, unreadCount, loading, refresh, refreshUnreadCount, markAsRead, markAllAsRead };
}
