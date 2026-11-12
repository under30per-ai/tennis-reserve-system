'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useShop from '@/hooks/useShop';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CartFloatingButton from '@/components/shop/CartFloatingButton';
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_COLORS } from '@/lib/constants';
import type { ProductCategory } from '@/types';

const categories: { key: string; label: string }[] = [
  { key: 'all', label: 'すべて' },
  ...(Object.entries(PRODUCT_CATEGORY_LABELS) as [ProductCategory, string][]).map(
    ([key, label]) => ({ key, label })
  ),
];

export default function ShopCatalogPage() {
  const { products, loading, loadProducts, cartItemCount } = useShop();
  const router = useRouter();
  const [category, setCategory] = useState('all');

  useEffect(() => {
    loadProducts(category === 'all' ? undefined : (category as ProductCategory));
  }, [category, loadProducts]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-net-dark">ショップ</h1>
        <div className="flex items-center gap-3">
          <Link href="/shop/cart" className="relative text-gray-500 hover:text-net-gray transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartItemCount > 99 ? '99' : cartItemCount}
              </span>
            )}
          </Link>
          <Link href="/shop/orders" className="text-sm text-gray-500 hover:text-net-gray transition-colors">
            注文履歴
          </Link>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              category === c.key
                ? 'bg-court-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState title="商品がありません" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map((product) => {
            const catColor = PRODUCT_CATEGORY_COLORS[product.category as ProductCategory];
            return (
              <Card key={product.id} className="cursor-pointer" onClick={() => router.push(`/shop/${product.id}`)}>
                {product.imageUrl ? (
                  <div className="w-full h-28 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-28 bg-gray-50 rounded-lg mb-2 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}>
                  {PRODUCT_CATEGORY_LABELS[product.category as ProductCategory]}
                </span>
                <p className="font-medium text-sm text-net-gray mt-1 truncate">{product.name}</p>
                <p className="font-bold text-court-green text-sm mt-0.5">&yen;{product.price.toLocaleString()}</p>
                {product.stock <= 0 && (
                  <p className="text-xs text-red-500 mt-0.5">在庫切れ</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <CartFloatingButton />
    </div>
  );
}
