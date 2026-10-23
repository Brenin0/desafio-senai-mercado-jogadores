import type { InputHTMLAttributes, Ref, SelectHTMLAttributes } from 'react';

const FIELD_CLASS_NAME =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-slate-100 aria-invalid:border-red-500';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

export function Input({ className = '', ...props }: InputProps) {
  return <input {...props} className={`${FIELD_CLASS_NAME} ${className}`} />;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>;
}

export function Select({ className = '', ...props }: SelectProps) {
  return <select {...props} className={`${FIELD_CLASS_NAME} ${className}`} />;
}
