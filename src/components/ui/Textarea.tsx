'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, id, ...props }, ref) => {
  const textareaId = id || label?.replace(/\s/g, '-').toLowerCase();
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-net-gray">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg text-net-gray bg-white',
          'focus:outline-none focus:ring-2 focus:ring-court-grass focus:border-court-grass',
          'transition-colors resize-vertical',
          error ? 'border-red-400' : 'border-gray-300',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
