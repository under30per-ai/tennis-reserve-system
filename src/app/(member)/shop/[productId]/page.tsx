'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useShop from '@/hooks/useShop';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CartFloatingButton from '@/components/shop/CartFloatingButton';
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_COLORS } from '@/lib/constants';
import type { Product, ProductCategory } from '@/types';

export default function ProductDetailPage() {
  const { getProduct, addToCart } = useShop();
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    (async () => {
      const data = await getProduct(productId);
      if (!data) {
        toast.error('商品が見つかりません');
        router.push('/shop');
        return;
      }
      setProduct(data);
      setLoading(false);
    })();
  }, [productId, getProduct, router, toast]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    toast.success('カートに追加しました');
  };

  if (loading || !product) return <LoadingSpinner />;

  const catColor = PRODUCT_CATEGORY_COLORS[product.category as ProductCategory];

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-net-gray">
        &larr; 戻る
      </button>

      <Card>
        {product.imageUrl ? (
          <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-50 rounded-lg mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        )}

        <span className={`text-xs px-2 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}>
          {PRODUCT_CATEGORY_LABELS[product.category as ProductCategory]}
        </span>

        <h1 className="text-xl font-bold text-net-dark mt-2">{product.name}</h1>
        <p className="text-2xl font-bold text-court-green mt-1">&yen;{product.price.toLocaleString()}</p>

        {product.description && (
          <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{product.description}</p>
        )}

        <div className="mt-4 text-sm text-gray-500">
          {product.stock > 0 ? (
            <span className="text-green-600">在庫あり ({product.stock}点)</span>
          ) : (
            <span className="text-red-500">在庫切れ</span>
          )}
        </div>

        {product.stock > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-net-gray">数量:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded-l-lg"
                >
                  -
                </button>
                <span className="px-4 py-1 text-net-gray font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded-r-lg"
                >
                  +
                </button>
              </div>
            </div>
            <Button onClick={handleAddToCart} className="w-full">カートに追加</Button>
          </div>
        )}
      </Card>

      <CartFloatingButton />
    </div>
  );
}
