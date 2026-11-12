'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useProducts from '@/hooks/useProducts';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants';
import type { ProductCategory } from '@/types';

const categoryOptions = (Object.entries(PRODUCT_CATEGORY_LABELS) as [ProductCategory, string][]).map(
  ([value, label]) => ({ value, label })
);

export default function NewProductPage() {
  const { addProduct } = useProducts({ eagerLoad: false });
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '' as string,
    price: '',
    stock: '0',
    sku: '',
    barcode: '',
    imageUrl: '',
    displayOrder: '0',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addProduct({
        name: form.name,
        description: form.description || undefined,
        category: form.category as ProductCategory,
        price: parseInt(form.price),
        stock: parseInt(form.stock),
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        imageUrl: form.imageUrl || undefined,
        displayOrder: parseInt(form.displayOrder) || 0,
      });
      toast.success('商品を追加しました');
      router.push('/admin/shop');
    } catch {
      toast.error('商品の追加に失敗しました');
    }
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>新規商品追加</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input label="商品名" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Textarea label="説明" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Select
            label="カテゴリ"
            options={categoryOptions}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
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
          <div className="flex gap-3 pt-2">
            <Button type="submit">追加</Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
