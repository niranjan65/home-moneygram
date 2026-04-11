import React from 'react';
import { AlertCircle } from 'lucide-react';

export const inputBase =
  'w-full rounded-lg border border-gray-200 bg-white h-12 px-4 text-sm text-gray-800 ' +
  'focus:outline-none placeholder:text-gray-400 transition-colors ' +
  'focus:ring-2 focus:ring-red-100 focus:border-[#E00000]';

export const fieldCls = (err) =>
  `${inputBase} ${err ? 'border-[#E00000]/30 bg-[#E00000]/5 focus:ring-red-100 focus:border-[#E00000]' : ''}`;

export const ErrorMsg = ({ message }) =>
  message ? (
    <p className="flex items-center gap-1 text-[#E00000] text-xs mt-1">
      <AlertCircle size={11} strokeWidth={2.5} /> {message}
    </p>
  ) : null;

export const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-3 my-2">
    <div className="flex-1 h-px bg-gray-100" />
    <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 px-1">
      {label}
    </span>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

export const FieldLabel = ({ children, required, icon: Icon }) => (
  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
    {Icon && <Icon size={11} className="text-[#E00000]" />}
    {children}
    {required && <span className="text-[#E00000]">*</span>}
  </label>
);
