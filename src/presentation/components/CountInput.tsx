import React, { useRef } from 'react';

interface CountInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hasDiscrepancy?: boolean;
  disabled?: boolean;
}

export const CountInput: React.FC<CountInputProps> = ({
  label,
  value,
  onChange,
  hasDiscrepancy = false,
  disabled = false,
}) => {
  // Long-press support for rapid increment
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const increment = () => !disabled && onChange(value + 1);
  const decrement = () => !disabled && value > 0 && onChange(value - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    if (!isNaN(num) && num >= 0) onChange(num);
    else if (e.target.value === '') onChange(0);
  };

  // Long-press: hold + to rapid-fire increment
  const startLongPress = (fn: () => void) => {
    fn(); // immediate first hit
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(fn, 80);
    }, 400);
  };

  const stopLongPress = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all ${
        hasDiscrepancy ? 'border-warning bg-warning/5' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Label row */}
      <div
        className={`flex items-center justify-between px-4 pt-3 pb-1 ${
          hasDiscrepancy ? 'text-warning' : 'text-gray-600'
        }`}
      >
        <span className="text-sm font-semibold">
          {label}
          {hasDiscrepancy && <span className="ml-1.5">⚠</span>}
        </span>
        {/* Direct-type input */}
        <input
          type="number"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          min={0}
          inputMode="numeric"
          className={`w-16 text-center font-bold text-xl border rounded-xl py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-transparent ${
            hasDiscrepancy ? 'border-warning text-warning' : 'border-gray-200 text-gray-900'
          }`}
        />
      </div>

      {/* Large button row */}
      <div className="flex gap-2 px-3 pb-3 pt-1">
        {/* Decrement — secondary, smaller */}
        <button
          type="button"
          onPointerDown={() => startLongPress(decrement)}
          onPointerUp={stopLongPress}
          onPointerLeave={stopLongPress}
          disabled={disabled || value <= 0}
          className="flex-none w-14 h-12 rounded-xl bg-gray-100 text-gray-500 text-2xl font-bold
                     flex items-center justify-center
                     active:scale-95 transition-all disabled:opacity-30 select-none
                     touch-none"
          aria-label="Decrease"
        >
          −
        </button>

        {/* Increment — primary, dominant */}
        <button
          type="button"
          onPointerDown={() => startLongPress(increment)}
          onPointerUp={stopLongPress}
          onPointerLeave={stopLongPress}
          disabled={disabled}
          className="flex-1 h-12 rounded-xl bg-primary text-white text-2xl font-bold
                     flex items-center justify-center gap-2
                     active:scale-95 transition-all disabled:opacity-40 select-none
                     touch-none shadow-sm"
          aria-label="Increase"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-sm font-semibold opacity-80">Add</span>
        </button>
      </div>
    </div>
  );
};
