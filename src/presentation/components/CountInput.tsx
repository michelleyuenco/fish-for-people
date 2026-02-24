import React from 'react';

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0) {
      onChange(num);
    } else if (raw === '') {
      onChange(0);
    }
  };

  const increment = () => onChange(value + 1);
  const decrement = () => onChange(Math.max(0, value - 1));

  return (
    <div
      className={`flex items-center justify-between py-3 px-4 rounded-xl border ${
        hasDiscrepancy
          ? 'border-warning bg-warning/10'
          : 'border-gray-200 bg-white'
      }`}
    >
      <span className={`text-sm font-medium ${hasDiscrepancy ? 'text-warning' : 'text-gray-700'}`}>
        {label}
        {hasDiscrepancy && <span className="ml-1 text-warning">⚠</span>}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || value <= 0}
          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold flex items-center justify-center disabled:opacity-40 active:scale-90 transition-all"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          min={0}
          className={`w-14 text-center font-semibold text-base border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            hasDiscrepancy ? 'border-warning text-warning' : 'border-gray-300 text-gray-900'
          }`}
        />
        <button
          type="button"
          onClick={increment}
          disabled={disabled}
          className="w-8 h-8 rounded-lg bg-primary text-white font-bold flex items-center justify-center active:scale-90 transition-all disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
};
