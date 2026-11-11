'use client';

import useMyTickets from '@/hooks/useMyTickets';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';

export default function MyTicketsPage() {
  const { tickets, loading } = useMyTickets();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-net-dark">マイチケット</h1>

      {tickets.length === 0 ? (
        <EmptyState title="チケットはありません" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {tickets.map((t) => {
            const isExpired = new Date(t.expiresAt) < new Date();
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-net-gray">{t.ticketType.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{t.ticketType.description}</p>
                  </div>
                  {isExpired ? (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full flex-shrink-0">期限切れ</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full flex-shrink-0">有効</span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-court-green">{t.remainingCount}</p>
                    <p className="text-xs text-gray-500">残り回数 / {t.ticketType.lessonCount}回</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>購入日: {formatDate(t.purchasedAt, 'yyyy/MM/dd')}</p>
                    <p>有効期限: {formatDate(t.expiresAt, 'yyyy/MM/dd')}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
