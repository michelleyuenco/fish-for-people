import React from 'react';

interface BadgeProps {
  count: number;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ count, className = '' }) => {
  if (count === 0) return null;

  return (
    <span
      className={`absolute -top-1 -right-1 bg-danger text-white text-[11px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 shadow-sm ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">{count} pending request{count !== 1 ? 's' : ''}</span>
      <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
    </span>
  );
};
