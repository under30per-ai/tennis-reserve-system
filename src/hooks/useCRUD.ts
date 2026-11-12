'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface CRUDActions<T, CreateData, UpdateData> {
  getAll: () => Promise<T[]>;
  getById?: (id: string) => Promise<T | null>;
  create?: (data: CreateData) => Promise<T>;
  update?: (id: string, data: UpdateData) => Promise<T | null>;
  remove?: (id: string) => Promise<void>;
}

export interface UseCRUDOptions {
  eagerLoad?: boolean;
}

export interface UseCRUDResult<T, CreateData, UpdateData> {
  items: T[];
  loading: boolean;
  refresh: () => Promise<void>;
  getById: CRUDActions<T, CreateData, UpdateData>['getById'];
  add: CRUDActions<T, CreateData, UpdateData>['create'];
  update: CRUDActions<T, CreateData, UpdateData>['update'];
  remove: CRUDActions<T, CreateData, UpdateData>['remove'];
}

export function useCRUD<T, C = never, U = never>(
  actions: CRUDActions<T, C, U>,
  options?: UseCRUDOptions
): UseCRUDResult<T, C, U> {
  const eagerLoad = options?.eagerLoad ?? true;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(eagerLoad);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const refresh = useCallback(async () => {
    const data = await actionsRef.current.getAll();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!eagerLoad) return;
    refresh();
  }, [eagerLoad, refresh]);

  const add = actions.create
    ? async (data: C) => {
        const result = await actions.create!(data);
        await refresh();
        return result;
      }
    : undefined;

  const update = actions.update
    ? async (id: string, data: U) => {
        const result = await actions.update!(id, data);
        await refresh();
        return result;
      }
    : undefined;

  const remove = actions.remove
    ? async (id: string) => {
        await actions.remove!(id);
        await refresh();
      }
    : undefined;

  return {
    items,
    loading,
    refresh,
    getById: actions.getById,
    add,
    update,
    remove,
  };
}
