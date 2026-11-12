'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useProducts from '@/hooks/useProducts';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_COLORS } from '@/lib/constants';
import type { ProductCategory } from '@/types';

export default function AdminProductsPage() {
  const { products, loading, deleteProduct } = useProducts({ eagerLoad: true });
  const toast = useToast();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteProduct(deleteTarget);
        toast.success('商品を非公開にしました');
      } catch {
        toast.error('操作に失敗しました');
      }
      setDeleteTarget(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => router.push('/admin/shop/new')}>商品追加</Button>
      </div>

      {products.length === 0 ? (
        <EmptyState title="商品が登録されていません" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const catColor = PRODUCT_CATEGORY_COLORS[product.category as ProductCategory];
            return (
              <Card key={product.id} className="cursor-pointer" onClick={() => router.push(`/admin/shop/${product.id}`)}>
                {product.imageUrl && (
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-net-gray truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}>
                        {PRODUCT_CATEGORY_LABELS[product.category as ProductCategory]}
                      </span>
                      {!product.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">非公開</span>
                      )}
                    </div>
                  </div>
                  <p className="font-bold text-court-green whitespace-nowrap ml-2">&yen;{product.price.toLocaleString()}</p>
                </div>
                <div className="mt-2 flex gap-4 text-sm text-gray-500">
                  <span>在庫: {product.stock}</span>
                  {product.sku && <span>SKU: {product.sku}</span>}
                </div>
                <div className="flex justify-end mt-3">
                  <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(product.id); }}>非公開</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="商品を非公開にする"
        message="この商品を非公開にしますか？ショップに表示されなくなります。"
        variant="danger"
        confirmLabel="非公開にする"
      />
    </div>
  );
}
