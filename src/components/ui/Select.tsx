'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  options: { value: string; label: string }[];
  placeholder?: string | false;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, placeholder, className, id, ...props }, ref) => {
  const selectId = id || label?.replace(/\s/g, '-').toLowerCase();
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-net-gray">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg text-net-gray bg-white',
          'focus:outline-none focus:ring-2 focus:ring-court-grass focus:border-court-grass',
          'transition-colors',
          error ? 'border-red-400' : 'border-gray-300',
          className
        )}
        {...props}
      >
        {placeholder !== false && <option value="">{typeof placeholder === 'string' ? placeholder : '選択してください'}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
