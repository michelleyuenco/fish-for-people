import React from 'react';
import { useTranslation } from 'react-i18next';
import { FloorPlanSeatMap } from '../components/FloorPlanSeatMap';
import { SeatStats } from '../components/SeatStats';
import { SeatLegend } from '../components/SeatLegend';
import { SeatToolbar } from '../components/SeatToolbar';
import { useSeats } from '../../application/hooks/useSeats';
import { TOTAL_SEATS } from '../../domain/constants/seating';

interface SeatTrackerPageProps {
  serviceId: string;
}

export const SeatTrackerPage: React.FC<SeatTrackerPageProps> = ({ serviceId }) => {
  const { t } = useTranslation();
  const {
    seatMap,
    availableCount,
    occupiedCount,
    sectionAvailability,
    loading,
    error,
    toggling,
    toggleSeat,
    bulkOperating,
    setRowSeats,
    setAllSeats,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useSeats(serviceId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <SeatStats
          availableCount={availableCount}
          occupiedCount={occupiedCount}
          sectionAvailability={sectionAvailability}
        />

        <div className="my-3">
          <SeatLegend showRowToggle />
        </div>

        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <FloorPlanSeatMap
            seatMap={seatMap}
            canToggle={true}
            toggling={toggling}
            onToggle={toggleSeat}
            onToggleRow={setRowSeats}
          />
        </div>

        <SeatToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          allAvailable={occupiedCount === 0}
          allOccupied={occupiedCount === TOTAL_SEATS}
          bulkOperating={bulkOperating}
          onSetAll={setAllSeats}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {t('seats.connectionError')}
        </div>
      )}
    </div>
  );
};
