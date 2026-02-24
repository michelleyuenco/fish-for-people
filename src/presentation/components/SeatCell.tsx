import React from 'react';
import type { Seat } from '../../domain/models/Seat';

interface SeatCellProps {
  seat: Seat | null; // null = empty placeholder for row alignment
  canToggle: boolean;
  isToggling: boolean;
  onToggle?: (seat: Seat) => void;
}

export const SeatCell: React.FC<SeatCellProps> = ({
  seat,
  canToggle,
  isToggling,
  onToggle,
}) => {
  if (!seat) {
    // Empty placeholder for row alignment
    return <div className="w-5 h-5 flex-shrink-0" />;
  }

  const handleClick = () => {
    if (canToggle && !isToggling && onToggle) {
      onToggle(seat);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!canToggle || isToggling}
      aria-label={`Seat ${seat.id}: ${seat.occupied ? 'occupied' : 'available'}`}
      className={`
        w-5 h-5 rounded-sm flex-shrink-0 transition-all
        ${seat.occupied ? 'bg-occupied' : 'bg-success'}
        ${canToggle && !isToggling ? 'cursor-pointer active:scale-90 hover:opacity-80' : 'cursor-default'}
        ${isToggling ? 'opacity-50' : ''}
      `}
    />
  );
};
