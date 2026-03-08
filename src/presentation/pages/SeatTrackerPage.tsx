import React from 'react';
import { useTranslation } from 'react-i18next';
import { FloorPlanSeatMap } from '../components/FloorPlanSeatMap';
import { useSeats } from '../../application/hooks/useSeats';
import { SECTIONS, TOTAL_SEATS } from '../../domain/constants/seating';

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
  } = useSeats(serviceId);

  const occupancyPct = Math.round((occupiedCount / TOTAL_SEATS) * 100);
  const allOccupied = occupiedCount === TOTAL_SEATS;
  const allAvailable = occupiedCount === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Floor Plan with integrated stats */}
      <div className="card">
        {/* Compact stats bar */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-primary text-base">{t('nav.floorPlan')}</h2>
          <span className="text-[10px] text-gray-400">{t('seats.totalSeats', { count: TOTAL_SEATS })}</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              occupancyPct >= 95 ? 'bg-danger' : occupancyPct >= 80 ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>

        {/* Capacity alert */}
        {occupancyPct >= 95 && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-xs font-semibold px-3 py-1.5 rounded-lg mb-2 flex items-center gap-1.5">
            🚨 {t('seats.atCapacity')}
          </div>
        )}
        {occupancyPct >= 80 && occupancyPct < 95 && (
          <div className="bg-warning/10 border border-warning/30 text-warning text-xs font-semibold px-3 py-1.5 rounded-lg mb-2 flex items-center gap-1.5">
            ⚠️ {t('seats.nearCapacity', { count: availableCount })}
          </div>
        )}

        {/* Inline stats + section breakdown */}
        <div className="flex items-center gap-3 mb-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="font-bold text-success">{availableCount}</span>
            <span className="text-gray-400">{t('seats.free')}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold text-occupied">{occupiedCount}</span>
            <span className="text-gray-400">{t('seats.taken')}</span>
          </span>
          <span className={`font-bold ${occupancyPct >= 95 ? 'text-danger' : occupancyPct >= 80 ? 'text-warning' : 'text-primary'}`}>
            {occupancyPct}%
          </span>
          <span className="text-gray-200">|</span>
          {SECTIONS.map((section) => (
            <span key={section.name} className="flex items-center gap-1">
              <span className="text-gray-500">{section.label[0]}</span>
              <span className="font-bold text-success">{sectionAvailability[section.name]}</span>
            </span>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mb-3 text-[10px] text-gray-400 flex-wrap">
          <span className="flex items-center gap-0.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" /> {t('seats.legendFree')}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-occupied inline-block" /> {t('seats.legendTaken')}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-300 inline-block" /> {t('seats.legendFamily')}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-300 inline-block" /> {t('seats.legendVolunteer')}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-[5px] h-2.5 rounded-sm bg-gray-300 inline-block" /> {t('seats.legendRowToggle')}
          </span>
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

        {/* All seats toggle */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">{t('seats.allSeats')}</span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold ${allAvailable ? 'text-success' : 'text-gray-400'}`}>{t('seats.available')}</span>
            <button
              onClick={() => setAllSeats(allAvailable || (!allOccupied && occupiedCount < TOTAL_SEATS / 2) ? true : false)}
              disabled={bulkOperating}
              aria-label={allOccupied ? t('seats.available') : t('seats.occupied')}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 disabled:opacity-50 ${
                allOccupied ? 'bg-occupied' : allAvailable ? 'bg-success' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  allOccupied ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <span className={`text-[10px] font-semibold ${allOccupied ? 'text-occupied' : 'text-gray-400'}`}>{t('seats.occupied')}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          ⚠ {t('seats.connectionError')}
        </div>
      )}
    </div>
  );
};
