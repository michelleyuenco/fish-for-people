import React from 'react';
import { useTranslation } from 'react-i18next';

interface SeatToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  allAvailable: boolean;
  allOccupied: boolean;
  bulkOperating: boolean;
  onSetAll: (occupied: boolean) => void;
}

export const SeatToolbar: React.FC<SeatToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  allAvailable,
  allOccupied,
  bulkOperating,
  onSetAll,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center disabled:opacity-25 active:scale-90 transition-all"
          aria-label={t('seats.undo')}
          title={t('seats.undo')}
        >↩</button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center disabled:opacity-25 active:scale-90 transition-all"
          aria-label={t('seats.redo')}
          title={t('seats.redo')}
        >↪</button>
      </div>

      {/* Bulk seat actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onSetAll(false)}
          disabled={bulkOperating || allAvailable}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-30 flex items-center gap-1 ${
            allAvailable ? 'bg-success/15 text-success' : 'bg-gray-100 text-gray-500 hover:bg-success/10 hover:text-success'
          }`}
        >
          <span className="w-2 h-2 rounded-sm bg-success inline-block" />
          {t('seats.markAllFree')}
        </button>
        <button
          onClick={() => onSetAll(true)}
          disabled={bulkOperating || allOccupied}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-30 flex items-center gap-1 ${
            allOccupied ? 'bg-occupied/15 text-occupied' : 'bg-gray-100 text-gray-500 hover:bg-occupied/10 hover:text-occupied'
          }`}
        >
          <span className="w-2 h-2 rounded-sm bg-occupied inline-block" />
          {t('seats.markAllTaken')}
        </button>
      </div>
    </div>
  );
};
