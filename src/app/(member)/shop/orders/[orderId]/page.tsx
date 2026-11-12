'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useShop from '@/hooks/useShop';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  SHOP_ORDER_STATUS_LABELS,
  SHOP_ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/constants';
import type { ShopOrder, ShopOrderItem, ShopOrderStatus } from '@/types';

export default function MyOrderDetailPage() {
  const { getOrderDetail, cancelOrder } = useShop();
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<(ShopOrder & { items: ShopOrderItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getOrderDetail(orderId);
      if (!data) {
        toast.error('注文が見つかりません');
        router.push('/shop/orders');
        return;
      }
      setOrder(data);
      setLoading(false);
    })();
  }, [orderId, getOrderDetail, router, toast]);

  const handleCancel = async () => {
    try {
      await cancelOrder(orderId);
      toast.success('注文をキャンセルしました');
      // Reload
      const data = await getOrderDetail(orderId);
      if (data) setOrder(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'キャンセルに失敗しました');
    }
    setShowCancel(false);
  };

  if (loading || !order) return <LoadingSpinner />;

  const statusColor = SHOP_ORDER_STATUS_COLORS[order.status as ShopOrderStatus];

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-net-gray">
        &larr; 戻る
      </button>

      <Card>
        <CardTitle>注文詳細</CardTitle>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">注文番号</span>
            <span className="font-bold text-net-gray">{order.orderNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">ステータス</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor.bg} ${statusColor.text}`}>
              {SHOP_ORDER_STATUS_LABELS[order.status as ShopOrderStatus]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">決済方法</span>
            <span className="text-net-gray">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">決済ステータス</span>
            <span className="text-net-gray">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">注文日時</span>
            <span className="text-net-gray">{new Date(order.createdAt).toLocaleString('ja-JP')}</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>注文商品</CardTitle>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <p className="text-sm text-net-gray">{item.productName}</p>
                <p className="text-xs text-gray-500">&yen;{item.unitPrice.toLocaleString()} x {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-net-gray">&yen;{item.subtotal.toLocaleString()}</p>
            </div>
          ))}
          <div className="pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">小計</span>
              <span>&yen;{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">消費税</span>
              <span>&yen;{order.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span className="text-net-dark">合計</span>
              <span className="text-court-green">&yen;{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Card>

      {order.status === 'pending' && (
        <Button variant="danger" className="w-full" onClick={() => setShowCancel(true)}>
          注文をキャンセル
        </Button>
      )}

      <ConfirmDialog
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title="注文キャンセル"
        message="この注文をキャンセルしますか？"
        variant="danger"
        confirmLabel="キャンセルする"
      />
    </div>
  );
}
