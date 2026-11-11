'use client';

import useNotifications from '@/hooks/useNotifications';
import NotificationList from '@/components/notifications/NotificationList';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-net-dark">通知</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            すべて既読にする
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="通知はありません" />
      ) : (
        <NotificationList notifications={notifications} onMarkAsRead={markAsRead} />
      )}
    </div>
  );
}
