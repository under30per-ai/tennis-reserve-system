'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useShopOrders from '@/hooks/useShopOrders';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  SHOP_ORDER_STATUS_LABELS,
  SHOP_ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  ORDER_SOURCE_LABELS,
} from '@/lib/constants';
import type { ShopOrderWithItems, ShopOrderStatus, PaymentStatus } from '@/types';

const statusOptions = (Object.entries(SHOP_ORDER_STATUS_LABELS) as [ShopOrderStatus, string][]).map(
  ([value, label]) => ({ value, label })
);

const paymentStatusOptions = (Object.entries(PAYMENT_STATUS_LABELS) as [PaymentStatus, string][]).map(
  ([value, label]) => ({ value, label })
);

export default function AdminOrderDetailPage() {
  const { getOrder, updateOrderStatus } = useShopOrders({ eagerLoad: false });
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<ShopOrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  useEffect(() => {
    (async () => {
      const data = await getOrder(orderId);
      if (!data) {
        toast.error('注文が見つかりません');
        router.push('/admin/shop/orders');
        return;
      }
      setOrder(data);
      setStatus(data.status);
      setPaymentStatus(data.paymentStatus);
      setLoading(false);
    })();
  }, [orderId, getOrder, router, toast]);

  const handleUpdate = async () => {
    if (!order) return;
    try {
      const updates: { status?: ShopOrderStatus; paymentStatus?: PaymentStatus } = {};
      if (status !== order.status) updates.status = status as ShopOrderStatus;
      if (paymentStatus !== order.paymentStatus) updates.paymentStatus = paymentStatus as PaymentStatus;
      if (Object.keys(updates).length === 0) {
        toast.info('変更がありません');
        return;
      }
      await updateOrderStatus(orderId, updates);
      toast.success('注文ステータスを更新しました');
      // Reload
      const data = await getOrder(orderId);
      if (data) {
        setOrder(data);
        setStatus(data.status);
        setPaymentStatus(data.paymentStatus);
      }
    } catch {
      toast.error('更新に失敗しました');
    }
  };

  if (loading || !order) return <LoadingSpinner />;

  const statusColor = SHOP_ORDER_STATUS_COLORS[order.status as ShopOrderStatus];

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardTitle>注文詳細</CardTitle>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">注文番号</span>
            <span className="font-bold text-net-gray">{order.orderNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">会員名</span>
            <span className="text-net-gray">{order.memberName}</span>
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
            <span className="text-sm text-gray-500">注文元</span>
            <span className="text-net-gray">{ORDER_SOURCE_LABELS[order.orderSource]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">注文日時</span>
            <span className="text-net-gray">{new Date(order.createdAt).toLocaleString('ja-JP')}</span>
          </div>
          {order.notes && (
            <div>
              <span className="text-sm text-gray-500">備考</span>
              <p className="text-sm text-net-gray mt-1">{order.notes}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>注文商品</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-500 font-medium">商品名</th>
                <th className="text-right py-2 text-gray-500 font-medium">単価</th>
                <th className="text-right py-2 text-gray-500 font-medium">数量</th>
                <th className="text-right py-2 text-gray-500 font-medium">小計</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2 text-net-gray">{item.productName}</td>
                  <td className="py-2 text-right text-gray-500">&yen;{item.unitPrice.toLocaleString()}</td>
                  <td className="py-2 text-right text-gray-500">{item.quantity}</td>
                  <td className="py-2 text-right text-net-gray">&yen;{item.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-b">
                <td colSpan={3} className="py-2 text-right text-gray-500">小計</td>
                <td className="py-2 text-right text-net-gray">&yen;{order.subtotal.toLocaleString()}</td>
              </tr>
              <tr className="border-b">
                <td colSpan={3} className="py-2 text-right text-gray-500">消費税</td>
                <td className="py-2 text-right text-net-gray">&yen;{order.tax.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan={3} className="py-2 text-right font-bold text-net-gray">合計</td>
                <td className="py-2 text-right font-bold text-court-green">&yen;{order.totalAmount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>ステータス更新</CardTitle>
        <div className="mt-4 space-y-4">
          <Select
            label="注文ステータス"
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder={false}
          />
          <Select
            label="決済ステータス"
            options={paymentStatusOptions}
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            placeholder={false}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleUpdate}>更新</Button>
            <Button variant="ghost" onClick={() => router.back()}>戻る</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
