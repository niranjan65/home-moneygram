import React from 'react';
import { AlertCircle } from 'lucide-react';

export const inputBase =
  'w-full min-w-0 box-border bg-surface border border-line-strong text-ink rounded-input px-3.5 py-3 text-body font-medium tnum ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white placeholder:text-muted placeholder:font-normal transition-all duration-200';

export const selectBase =
  'w-full min-w-0 box-border bg-surface border border-line-strong text-ink rounded-input px-3.5 py-3 text-body font-medium ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white placeholder:text-muted placeholder:font-normal transition-all duration-200 ' +
  'appearance-none pr-10 cursor-pointer';

export const fieldCls = (err) =>
  `${inputBase} ${err ? 'border-danger/40 bg-brand-50/30 focus:ring-2 focus:ring-brand-600' : ''}`;

export const selectCls = (err) =>
  `${selectBase} ${err ? 'border-danger/40 bg-brand-50/30 focus:ring-2 focus:ring-brand-600' : ''}`;

export const ErrorMsg = ({ message }) =>
  message ? (
    <p className="flex items-center gap-1 text-danger text-label mt-1.5 font-normal">
      <AlertCircle size={14} strokeWidth={2.5} /> {message}
    </p>
  ) : null;

export const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-line" />
    <span className="text-overline text-muted px-1">
      {label}
    </span>
    <div className="flex-1 h-px bg-line" />
  </div>
);

export const SectionHeader = ({ icon: Icon, title, subtitle, badge, action, className = '' }) => (
  <div className={`px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between gap-3 bg-surface ${className}`}>
    <div className="flex items-center gap-3 min-w-0">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-surface-alt border border-line flex items-center justify-center text-ink shrink-0">
          <Icon size={16} strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0">
        <h3 className="text-h3 font-bold text-ink leading-tight">{title}</h3>
        {subtitle && <p className="text-caption text-muted mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
    {(badge || action) && (
      <div className="flex items-center gap-2 shrink-0">
        {badge}
        {action}
      </div>
    )}
  </div>
);

export const SectionCard = ({ id, icon, title, subtitle, badge, action, children, className = '', bodyClassName = 'p-5 sm:p-6' }) => (
  <div id={id} className={`rounded-2xl border border-line bg-surface shadow-card overflow-hidden ${className}`}>
    <SectionHeader icon={icon} title={title} subtitle={subtitle} badge={badge} action={action} />
    <div className={bodyClassName}>
      {children}
    </div>
  </div>
);

export const FieldLabel = ({ children, required, icon: Icon, badge, className = '' }) => (
  <label className={`flex items-center justify-between text-label font-semibold text-ink mb-1.5 ${className}`}>
    <span className="flex items-center gap-1.5">
      {Icon && <Icon size={14} className="text-danger" />}
      <span>{children}</span>
      {required && <span className="text-danger ml-0.5">*</span>}
    </span>
    {badge && <span>{badge}</span>}
  </label>
);

export const getIdExpiryStatus = (rawDate) => {
  if (!rawDate) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      daysDiff: null,
      daysExpired: 0,
      formattedDate: "",
    };
  }

  let expDate = null;
  if (rawDate instanceof Date) {
    if (!isNaN(rawDate.getTime())) {
      expDate = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
    }
  } else if (typeof rawDate === "string") {
    const trimmed = rawDate.trim();
    if (!trimmed) {
      return {
        isExpired: false,
        isExpiringSoon: false,
        daysDiff: null,
        daysExpired: 0,
        formattedDate: "",
      };
    }
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      expDate = new Date(year, month, day);
    } else {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        expDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      }
    }
  }

  if (!expDate || isNaN(expDate.getTime())) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      daysDiff: null,
      daysExpired: 0,
      formattedDate: "",
    };
  }

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = expDate.getTime() - todayMidnight.getTime();
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysDiff < 0;
  const isExpiringSoon = daysDiff >= 0 && daysDiff <= 30;

  const yyyy = expDate.getFullYear();
  const mm = String(expDate.getMonth() + 1).padStart(2, "0");
  const dd = String(expDate.getDate()).padStart(2, "0");
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  return {
    isExpired,
    isExpiringSoon,
    daysDiff,
    daysExpired: isExpired ? Math.abs(daysDiff) : 0,
    formattedDate,
  };
};
