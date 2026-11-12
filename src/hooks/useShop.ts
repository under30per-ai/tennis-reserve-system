'use client';

import { useState, useCallback } from 'react';
import type { Product, ShopOrder, ShopOrderItem, ProductCategory, PaymentMethod } from '@/types';
import { useCart } from '@/contexts/CartContext';
import {
  getActiveProducts,
  getProductDetail,
  createShopOrder,
  getMyShopOrders,
  getMyShopOrderDetail,
  cancelMyShopOrder,
} from '@/app/actions/shop';

export default function useShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    cart,
    cartTotal,
    cartItemCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const loadProducts = useCallback(async (category?: ProductCategory) => {
    setLoading(true);
    try {
      const data = await getActiveProducts(category);
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProduct = useCallback(async (id: string) => {
    return getProductDetail(id);
  }, []);

  const checkout = useCallback(
    async (paymentMethod: PaymentMethod, notes?: string) => {
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      const order = await createShopOrder({ items, paymentMethod, notes });
      clearCart();
      return order;
    },
    [cart, clearCart]
  );

  const loadMyOrders = useCallback(async () => {
    const data = await getMyShopOrders();
    setMyOrders(data);
  }, []);

  const getOrderDetail = useCallback(
    async (orderId: string): Promise<(ShopOrder & { items: ShopOrderItem[] }) | null> => {
      return getMyShopOrderDetail(orderId);
    },
    []
  );

  const cancelOrder = useCallback(async (orderId: string) => {
    const result = await cancelMyShopOrder(orderId);
    await loadMyOrders();
    return result;
  }, [loadMyOrders]);

  return {
    products,
    myOrders,
    cart,
    cartTotal,
    cartItemCount,
    loading,
    loadProducts,
    getProduct,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    checkout,
    loadMyOrders,
    getOrderDetail,
    cancelOrder,
  };
}
