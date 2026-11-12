'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Product, ShopOrder, ShopOrderItem, ProductCategory, PaymentMethod } from '@/types';
import {
  getActiveProducts,
  getProductDetail,
  createShopOrder,
  getMyShopOrders,
  getMyShopOrderDetail,
  cancelMyShopOrder,
} from '@/app/actions/shop';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function useShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<ShopOrder[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const checkout = useCallback(
    async (paymentMethod: PaymentMethod, notes?: string) => {
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      const order = await createShopOrder({ items, paymentMethod, notes });
      setCart([]);
      return order;
    },
    [cart]
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
