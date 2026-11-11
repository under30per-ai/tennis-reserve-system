'use client';

import type { Notification } from '@/types';
import { NOTIFICATION_TYPE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export default function NotificationList({ notifications, onMarkAsRead }: NotificationListProps) {
  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`p-4 rounded-lg border transition-colors cursor-pointer ${
            n.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
          }`}
          onClick={() => !n.isRead && onMarkAsRead(n.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {NOTIFICATION_TYPE_LABELS[n.type]}
                </span>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="font-medium text-sm text-net-gray">{n.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatDate(n.createdAt, 'MM/dd HH:mm')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
