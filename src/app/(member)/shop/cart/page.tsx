'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useShop from '@/hooks/useShop';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import { PAYMENT_METHOD_LABELS, TAX_RATE } from '@/lib/constants';
import type { PaymentMethod } from '@/types';

const paymentOptions = (Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(
  ([value, label]) => ({ value, label })
);

export default function CartPage() {
  const { cart, cartTotal, cartItemCount, updateCartQuantity, removeFromCart, clearCart, checkout } = useShop();
  const toast = useToast();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<string>('mock');
  const [submitting, setSubmitting] = useState(false);

  const tax = Math.floor(cartTotal * TAX_RATE);
  const totalWithTax = cartTotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const order = await checkout(paymentMethod as PaymentMethod);
      toast.success(`注文が完了しました (${order.orderNumber})`);
      router.push('/shop/orders');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '注文に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-net-dark">カート</h1>
        <EmptyState
          title="カートは空です"
          description="商品を追加してください"
          action={<Button onClick={() => router.push('/shop')}>ショップへ戻る</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-net-dark">カート ({cartItemCount}点)</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700">
          すべて削除
        </button>
      </div>

      <div className="space-y-3">
        {cart.map((item) => (
          <Card key={item.product.id}>
            <div className="flex items-start gap-3">
              {item.product.imageUrl ? (
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-net-gray text-sm truncate">{item.product.name}</p>
                <p className="text-sm text-court-green font-bold">&yen;{item.product.price.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border border-gray-300 rounded text-sm">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="px-2 py-0.5 text-gray-500 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-3 py-0.5 text-net-gray">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                      className="px-2 py-0.5 text-gray-500 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                </div>
              </div>
              <p className="font-bold text-net-gray text-sm whitespace-nowrap">
                &yen;{(item.product.price * item.quantity).toLocaleString()}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">小計</span>
            <span className="text-net-gray">&yen;{cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">消費税 (10%)</span>
            <span className="text-net-gray">&yen;{tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
            <span className="text-net-dark">合計</span>
            <span className="text-court-green">&yen;{totalWithTax.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      <Card>
        <Select
          label="決済方法"
          options={paymentOptions}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          placeholder={false}
        />
        <div className="mt-4">
          <Button onClick={handleCheckout} disabled={submitting} className="w-full">
            {submitting ? '処理中...' : '注文を確定する'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
