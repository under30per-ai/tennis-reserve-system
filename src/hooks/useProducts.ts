'use client';

import { useCRUD } from '@/hooks/useCRUD';
import type { Product } from '@/types';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct as updateProductAction,
  deleteProduct as deleteProductAction,
} from '@/app/actions/shop';

export default function useProducts(options?: { eagerLoad?: boolean }) {
  const { items, loading, refresh, getById, add, update, remove } = useCRUD<
    Product,
    Parameters<typeof createProduct>[0],
    Parameters<typeof updateProductAction>[1]
  >(
    {
      getAll: getProducts,
      getById: getProductById,
      create: createProduct,
      update: updateProductAction,
      remove: deleteProductAction,
    },
    { eagerLoad: options?.eagerLoad ?? false }
  );

  return {
    products: items,
    loading,
    refresh,
    getProduct: getById!,
    addProduct: add!,
    updateProduct: update!,
    deleteProduct: remove!,
  };
}
