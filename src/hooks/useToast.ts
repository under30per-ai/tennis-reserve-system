'use client';

import { useToastContext } from '@/contexts/ToastContext';

export default function useToast() {
  const { addToast } = useToastContext();
  return {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
    warning: (message: string) => addToast(message, 'warning'),
  };
}
