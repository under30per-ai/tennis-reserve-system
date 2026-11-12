'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

export default function CartFloatingButton() {
  const { cartItemCount } = useCart();

  if (cartItemCount === 0) return null;

  return (
    <Link
      href="/shop/cart"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-30 bg-court-green text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-court-green/90 transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {cartItemCount > 99 ? '99+' : cartItemCount}
      </span>
    </Link>
  );
}
