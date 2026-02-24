import React from 'react';
import type { Seat } from '../../domain/models/Seat';

interface SeatCellProps {
  seat: Seat | null; // null = empty placeholder for row alignment
  canToggle: boolean;
  isToggling: boolean;
  hasPendingRequest?: boolean;
  onToggle?: (seat: Seat) => void;
}

export const SeatCell: React.FC<SeatCellProps> = ({
  seat,
  canToggle,
  isToggling,
  hasPendingRequest = false,
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

  // Colour precedence: request pending (amber) > occupied (slate) > available (green)
  const colorClass = hasPendingRequest
    ? 'bg-warning ring-1 ring-warning/60'
    : seat.occupied
    ? 'bg-occupied'
    : 'bg-success';

  return (
    <button
      onClick={handleClick}
      disabled={!canToggle || isToggling}
      aria-label={`Seat ${seat.id}: ${hasPendingRequest ? 'request pending' : seat.occupied ? 'occupied' : 'available'}`}
      className={`
        w-5 h-5 rounded-sm flex-shrink-0 transition-all
        ${colorClass}
        ${canToggle && !isToggling ? 'cursor-pointer active:scale-90 hover:opacity-80' : 'cursor-default'}
        ${isToggling ? 'opacity-50' : ''}
      `}
    />
  );
};
