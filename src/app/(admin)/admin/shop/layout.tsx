'use client';

import { usePathname, useRouter } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

const shopTabs = [
  { key: '/admin/shop', label: '商品管理' },
  { key: '/admin/shop/orders', label: '注文管理' },
];

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = pathname.startsWith('/admin/shop/orders')
    ? '/admin/shop/orders'
    : '/admin/shop';

  return (
    <div className="space-y-4">
      <Tabs
        tabs={shopTabs}
        activeTab={activeTab}
        onChange={(key) => router.push(key)}
      />
      {children}
    </div>
  );
}
