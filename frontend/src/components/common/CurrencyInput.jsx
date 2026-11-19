import React from 'react';

/**
 * CurrencyInput
 * Renders a text-type input formatted for numeric currency entry.
 * Eliminates native browser increment/decrement buttons,
 * enforces strict numeric validation (digits and at most one decimal point),
 * and handles paste/keyboard input cleanly.
 */
export const CurrencyInput = React.forwardRef(({
  value,
  onChange,
  onKeyDown,
  onPaste,
  placeholder = "0.00",
  allowDecimals = true,
  maxDecimals = 4,
  max,
  min = 0,
  className = "",
  ...props
}, ref) => {

  const sanitize = (raw) => {
    if (raw === null || raw === undefined) return '';
    const str = String(raw);

    if (!allowDecimals) {
      return str.replace(/\D/g, '');
    }

    // Keep only numbers and at most one decimal point
    let cleaned = str.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    if (parts.length >= 2 && typeof maxDecimals === 'number') {
      cleaned = parts[0] + '.' + parts.slice(1).join('').slice(0, maxDecimals);
    }

    // If starts with '.', prepend '0' for clean formatting
    if (cleaned.startsWith('.')) {
      cleaned = '0' + cleaned;
    }

    return cleaned;
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    const sanitized = sanitize(raw);

    if (max !== undefined && sanitized !== '') {
      const num = parseFloat(sanitized);
      if (!isNaN(num) && num > Number(max)) {
        return;
      }
    }

    if (onChange) {
      const synthEvent = {
        ...e,
        target: {
          ...e.target,
          name: props.name,
          value: sanitized,
        },
      };
      onChange(synthEvent);
    }
  };

  const handleKeyDown = (e) => {
    // Call user-provided onKeyDown if present
    onKeyDown?.(e);
    if (e.defaultPrevented) return;

    // Allow navigation, deletion, copy/paste shortcuts
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Home',
      'End',
      'Enter',
      'Escape',
    ];
    if (allowedKeys.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(e.key.toLowerCase())) return;

    if (e.key === '.') {
      if (!allowDecimals || String(value || '').includes('.')) {
        e.preventDefault();
      }
      return;
    }

    // Block any non-digit key
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    onPaste?.(e);
    if (e.defaultPrevented) return;

    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain');
    const sanitized = sanitize(pasted);

    if (max !== undefined && sanitized !== '') {
      const num = parseFloat(sanitized);
      if (!isNaN(num) && num > Number(max)) {
        return;
      }
    }

    if (onChange) {
      const synthEvent = {
        ...e,
        target: {
          ...e.target,
          name: props.name,
          value: sanitized,
        },
      };
      onChange(synthEvent);
    }
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value ?? ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';
export default CurrencyInput;
