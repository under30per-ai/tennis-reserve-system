'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useProducts from '@/hooks/useProducts';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants';
import type { ProductCategory } from '@/types';

const categoryOptions = (Object.entries(PRODUCT_CATEGORY_LABELS) as [ProductCategory, string][]).map(
  ([value, label]) => ({ value, label })
);

export default function EditProductPage() {
  const { getProduct, updateProduct } = useProducts({ eagerLoad: false });
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '' as string,
    price: '',
    stock: '',
    sku: '',
    barcode: '',
    imageUrl: '',
    displayOrder: '0',
    isActive: true,
  });

  useEffect(() => {
    (async () => {
      const product = await getProduct(productId);
      if (!product) {
        toast.error('商品が見つかりません');
        router.push('/admin/shop');
        return;
      }
      setForm({
        name: product.name,
        description: product.description,
        category: product.category,
        price: String(product.price),
        stock: String(product.stock),
        sku: product.sku ?? '',
        barcode: product.barcode ?? '',
        imageUrl: product.imageUrl ?? '',
        displayOrder: String(product.displayOrder),
        isActive: product.isActive,
      });
      setLoading(false);
    })();
  }, [productId, getProduct, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProduct(productId, {
        name: form.name,
        description: form.description,
        category: form.category as ProductCategory,
        price: parseInt(form.price),
        stock: parseInt(form.stock),
        sku: form.sku || null,
        barcode: form.barcode || null,
        imageUrl: form.imageUrl || null,
        displayOrder: parseInt(form.displayOrder) || 0,
        isActive: form.isActive,
      });
      toast.success('商品を更新しました');
      router.push('/admin/shop');
    } catch {
      toast.error('商品の更新に失敗しました');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>商品編集</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input label="商品名" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Textarea label="説明" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Select
            label="カテゴリ"
            options={categoryOptions}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder={false}
            required
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="価格 (円)" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required min="0" />
            <Input label="在庫数" type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} required min="0" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="SKU" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            <Input label="バーコード" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} />
          </div>
          <Input label="画像URL" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
          <Input label="表示順" type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-gray-300" />
            <span className="text-sm text-net-gray">公開する</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit">更新</Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
