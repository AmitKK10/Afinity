import React, { useCallback } from 'react';

export interface FinancialAmountInputProps {
  id?: string;
  name?: string;
  value: string | number;
  onChange: (value: string) => void;
  allowNegative?: boolean;
  currencySymbol?: string | null;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  inputClassName?: string;
  showSignToggle?: boolean;
  min?: number;
  max?: number;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  ariaLabel?: string;
}

/**
 * Robust Financial & Numeric Input Component.
 * 
 * - Supports negative numbers (-500, -1000.50) without browser clearing or input freezing.
 * - Works smoothly on Mobile keyboards (Android Gboard, iOS Safari) and Desktop.
 * - Sanitizes pasted & typed input to valid signed decimal numbers.
 * - Provides an intuitive '±' sign toggle button for quick mobile entry.
 * - Prevents non-numeric characters while allowing valid decimal points and minus signs.
 */
export const FinancialAmountInput: React.FC<FinancialAmountInputProps> = ({
  id,
  name,
  value,
  onChange,
  allowNegative = true,
  currencySymbol = '₹',
  placeholder = '0',
  required = false,
  autoFocus = false,
  disabled = false,
  readOnly = false,
  className = '',
  inputClassName = '',
  showSignToggle = true,
  min,
  max,
  onBlur,
  onFocus,
  onKeyDown,
  ariaLabel,
}) => {
  const stringValue = value === undefined || value === null ? '' : String(value);
  const isNegative = stringValue.startsWith('-');

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;

      // Normalize unicode dashes/minuses from various keyboards or copy-paste
      raw = raw.replace(/[−–—]/g, '-');

      // Allow empty string to clear the field
      if (raw === '') {
        onChange('');
        return;
      }

      // Allow typing a bare '-' when starting a negative number
      if (allowNegative && raw === '-') {
        onChange('-');
        return;
      }

      // If user typed a minus sign somewhere in the middle or pressed minus
      if (allowNegative && raw.includes('-') && !raw.startsWith('-')) {
        // Toggle sign or move minus to front if user pressed '-'
        const cleanDigits = raw.replace(/-/g, '');
        raw = '-' + cleanDigits;
      }

      // Match valid decimal number format: optional leading minus, digits, optional single dot, optional digits
      const regex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;

      if (regex.test(raw)) {
        // Enforce min/max if numeric limits are specified and valid
        if (raw !== '-' && !raw.endsWith('.')) {
          const num = parseFloat(raw);
          if (!isNaN(num)) {
            if (min !== undefined && num < min) {
              // Only block if strictly non-negative limit violated (e.g. min >= 0)
              if (min >= 0 && num < 0) return;
            }
            if (max !== undefined && num > max) {
              return;
            }
          }
        }
        onChange(raw);
      }
    },
    [allowNegative, min, max, onChange]
  );

  const handleToggleSign = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!allowNegative || disabled || readOnly) return;

      if (!stringValue || stringValue === '0' || stringValue === '0.00') {
        onChange('-');
        return;
      }

      if (stringValue === '-') {
        onChange('');
        return;
      }

      if (stringValue.startsWith('-')) {
        onChange(stringValue.slice(1));
      } else {
        onChange('-' + stringValue);
      }
    },
    [allowNegative, disabled, readOnly, stringValue, onChange]
  );

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {/* Optional Currency Symbol Prefix */}
      {currencySymbol && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-sm pointer-events-none select-none z-10">
          {currencySymbol}
        </span>
      )}

      {/* Input Field: Uses type="text" to allow '-' on all mobile & desktop keyboards */}
      <input
        id={id}
        name={name}
        type="text"
        inputMode={allowNegative ? 'text' : 'decimal'}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        required={required}
        autoFocus={autoFocus}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        value={stringValue}
        onChange={handleInputChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel || name || placeholder}
        className={`w-full ${
          currencySymbol ? 'pl-8' : 'pl-3.5'
        } ${
          allowNegative && showSignToggle ? 'pr-12' : 'pr-3.5'
        } py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-cyan-500 transition-colors ${
          isNegative ? 'text-rose-400 border-rose-800/80 focus:border-rose-500' : ''
        } ${inputClassName}`}
      />

      {/* Quick +/- Sign Toggle Button for Mobile / Desktop Convenience */}
      {allowNegative && showSignToggle && !readOnly && !disabled && (
        <button
          type="button"
          onClick={handleToggleSign}
          title={isNegative ? 'Switch to positive (+)' : 'Switch to negative (-)'}
          aria-label="Toggle positive/negative sign"
          tabIndex={-1}
          className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all select-none cursor-pointer flex items-center justify-center ${
            isNegative
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700'
          }`}
        >
          {isNegative ? '−' : '±'}
        </button>
      )}
    </div>
  );
};
