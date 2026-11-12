'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ShopOrderWithItems, ShopOrderStatus, PaymentStatus } from '@/types';
import {
  getShopOrders,
  getShopOrderById,
  updateShopOrderStatus,
} from '@/app/actions/shop';

export default function useShopOrders(options?: { eagerLoad?: boolean }) {
  const eagerLoad = options?.eagerLoad ?? false;
  const [orders, setOrders] = useState<ShopOrderWithItems[]>([]);
  const [loading, setLoading] = useState(eagerLoad);

  const refresh = useCallback(async () => {
    const data = await getShopOrders();
    setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!eagerLoad) return;
    refresh();
  }, [eagerLoad, refresh]);

  const getOrder = useCallback(async (id: string) => {
    return getShopOrderById(id);
  }, []);

  const updateStatus = useCallback(async (
    id: string,
    data: { status?: ShopOrderStatus; paymentStatus?: PaymentStatus }
  ) => {
    const result = await updateShopOrderStatus(id, data);
    await refresh();
    return result;
  }, [refresh]);

  return {
    orders,
    loading,
    refresh,
    getOrder,
    updateOrderStatus: updateStatus,
  };
}
