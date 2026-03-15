import React, { useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHandedness } from '../../application/hooks/useHandedness';

interface CountInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hasDiscrepancy?: boolean;
  disabled?: boolean;
  colorAccent?: 'blue' | 'emerald' | 'violet' | 'amber' | 'slate';
}

const ACCENT = {
  blue:    { bg: 'bg-blue-600',    active: 'active:bg-blue-700',    minus: 'bg-white text-blue-700 ring-blue-300' },
  emerald: { bg: 'bg-emerald-600', active: 'active:bg-emerald-700', minus: 'bg-white text-emerald-700 ring-emerald-300' },
  violet:  { bg: 'bg-violet-600',  active: 'active:bg-violet-700',  minus: 'bg-white text-violet-700 ring-violet-300' },
  amber:   { bg: 'bg-amber-500',   active: 'active:bg-amber-600',   minus: 'bg-white text-amber-700 ring-amber-300' },
  slate:   { bg: 'bg-slate-600',   active: 'active:bg-slate-700',   minus: 'bg-white text-slate-700 ring-slate-300' },
};

export const CountInput: React.FC<CountInputProps> = ({
  label,
  value,
  onChange,
  hasDiscrepancy = false,
  disabled = false,
  colorAccent = 'blue',
}) => {
  const { t } = useTranslation();
  const isLeftHanded = useHandedness();
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const colors = ACCENT[colorAccent];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const increment = useCallback(() => onChange(value + 1), [value, onChange]);
  const decrement = useCallback(() => onChange(Math.max(0, value - 1)), [value, onChange]);

  const stopRepeat = () => {
    if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
    if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  const handleCardClick = () => {
    if (disabled || editing) return;
    increment();
  };

  /* Non-dominant side = left for right-handers, right for left-handers */
  const minusSide = isLeftHanded ? 'order-last' : 'order-first';
  const mainSide = isLeftHanded ? 'order-first' : 'order-last';

  return (
    <div
      className={`
        rounded-xl overflow-hidden select-none flex
        ${hasDiscrepancy ? 'ring-2 ring-warning' : ''}
        ${colors.bg}
        ${!disabled && !editing ? `cursor-pointer ${colors.active} active:scale-[0.98] transition-all` : ''}
      `}
      onClick={handleCardClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${label}: ${value}. ${t('common.tapToAdd')}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
    >
      {/* Minus / Edit strip — non-dominant side */}
      <div
        className={`flex flex-col items-center justify-between py-3 px-2 gap-2 ${minusSide}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Edit button */}
        <button
          type="button"
          onClick={startEditing}
          disabled={disabled}
          aria-label={t('common.tapToEdit')}
          className="w-10 h-10 rounded-lg bg-white/20 text-white/70 text-[10px] font-semibold
                     flex items-center justify-center active:scale-90 transition-all touch-none"
        >{t('common.edit')}</button>

        {/* Minus button — white, high contrast */}
        <button
          type="button"
          onClick={() => { if (!disabled && value > 0) decrement(); }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!disabled && value > 0) {
              repeatTimerRef.current = setTimeout(() => {
                repeatIntervalRef.current = setInterval(decrement, 120);
              }, 500);
            }
          }}
          onPointerUp={(e) => { e.stopPropagation(); stopRepeat(); }}
          onPointerLeave={(e) => { e.stopPropagation(); stopRepeat(); }}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
          className={`w-10 h-10 rounded-lg ring-1 text-xl font-bold
                     flex items-center justify-center disabled:opacity-20 active:scale-90
                     transition-all touch-none ${colors.minus}`}
        >−</button>
      </div>

      {/* Main tap area — label + count on the dominant side */}
      <div className={`flex-1 flex flex-col items-center justify-center py-3 px-3 ${mainSide}`}>
        {/* Label */}
        <span className="text-sm font-extrabold tracking-wide uppercase text-white/90 mb-0.5">
          {label}
          {hasDiscrepancy && <span className="ml-1.5">⚠</span>}
        </span>

        {/* Count display */}
        {editing ? (
          <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
              className="w-24 text-center text-5xl font-bold tabular-nums bg-transparent border-b-2 border-white/50 outline-none text-white"
            />
            <span className="text-xs text-white/60 mt-1">{t('common.people')}</span>
          </div>
        ) : (
          <>
            <span className="text-5xl font-bold tabular-nums text-white">{value}</span>
            <span className="text-xs text-white/60">{t('common.people')}</span>
          </>
        )}
      </div>
    </div>
  );
};
