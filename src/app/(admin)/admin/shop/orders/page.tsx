'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useShopOrders from '@/hooks/useShopOrders';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { SHOP_ORDER_STATUS_LABELS, SHOP_ORDER_STATUS_COLORS, PAYMENT_STATUS_LABELS } from '@/lib/constants';
import type { ShopOrderStatus } from '@/types';

const statusFilters: { key: string; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'pending', label: '注文受付' },
  { key: 'confirmed', label: '確認済' },
  { key: 'paid', label: '支払済' },
  { key: 'shipped', label: '発送済' },
  { key: 'completed', label: '完了' },
  { key: 'cancelled', label: 'キャンセル' },
];

export default function AdminOrdersPage() {
  const { orders, loading } = useShopOrders({ eagerLoad: true });
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              filter === f.key
                ? 'bg-court-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState title="注文がありません" />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusColor = SHOP_ORDER_STATUS_COLORS[order.status as ShopOrderStatus];
            return (
              <Card key={order.id} className="cursor-pointer" onClick={() => router.push(`/admin/shop/orders/${order.id}`)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-net-gray">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500 mt-1">{order.memberName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor.bg} ${statusColor.text}`}>
                      {SHOP_ORDER_STATUS_LABELS[order.status as ShopOrderStatus]}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-sm text-gray-500">
                  <span>&yen;{order.totalAmount.toLocaleString()}</span>
                  <span>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString('ja-JP')}</span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {order.items.length}点の商品
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
