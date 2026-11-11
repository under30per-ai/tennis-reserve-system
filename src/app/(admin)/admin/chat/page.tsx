'use client';

import { useRouter } from 'next/navigation';
import useChat from '@/hooks/useChat';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';

export default function AdminChatPage() {
  const { threads, loading } = useChat();
  const router = useRouter();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-net-dark">チャット管理</h2>

      {threads.length === 0 ? (
        <EmptyState title="メッセージはありません" />
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <Card key={t.partnerId} className="cursor-pointer" onClick={() => router.push(`/admin/chat/${t.partnerId}`)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-net-gray">{t.partnerName}</p>
                    {t.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{t.lastMessage}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {formatDate(t.lastMessageAt, 'MM/dd HH:mm')}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
