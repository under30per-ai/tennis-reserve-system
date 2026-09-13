'use client';

import { Toast as ToastType } from '@/types';
import { useEffect, useState } from 'react';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const typeStyles = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
  warning: 'bg-yellow-500 text-net-gray',
};

const typeIcons = {
  success: '✓',
  error: '✕',
  info: 'i',
  warning: '!',
};

export default function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-72 transition-all duration-300 ${
        typeStyles[toast.type]
      } ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-sm font-bold flex-shrink-0">
        {typeIcons[toast.type]}
      </span>
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
}
