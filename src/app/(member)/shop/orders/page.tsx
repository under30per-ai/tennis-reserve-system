'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useShop from '@/hooks/useShop';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { SHOP_ORDER_STATUS_LABELS, SHOP_ORDER_STATUS_COLORS } from '@/lib/constants';
import type { ShopOrderStatus } from '@/types';

export default function MyOrdersPage() {
  const { myOrders, loading, loadMyOrders } = useShop();
  const router = useRouter();

  useEffect(() => {
    loadMyOrders();
  }, [loadMyOrders]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-net-dark">注文履歴</h1>

      {myOrders.length === 0 ? (
        <EmptyState title="注文履歴がありません" />
      ) : (
        <div className="space-y-3">
          {myOrders.map((order) => {
            const statusColor = SHOP_ORDER_STATUS_COLORS[order.status as ShopOrderStatus];
            return (
              <Card key={order.id} className="cursor-pointer" onClick={() => router.push(`/shop/orders/${order.id}`)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-net-gray">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor.bg} ${statusColor.text}`}>
                      {SHOP_ORDER_STATUS_LABELS[order.status as ShopOrderStatus]}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-bold text-court-green">&yen;{order.totalAmount.toLocaleString()}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
