import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionName } from '../../domain/models/Seat';
import { SECTIONS, TOTAL_SEATS } from '../../domain/constants/seating';

interface SeatStatsProps {
  availableCount: number;
  occupiedCount: number;
  sectionAvailability: Record<SectionName, number>;
}

export const SeatStats: React.FC<SeatStatsProps> = ({
  availableCount,
  occupiedCount,
  sectionAvailability,
}) => {
  const { t } = useTranslation();
  const occupancyPct = Math.round((occupiedCount / TOTAL_SEATS) * 100);

  return (
    <div>
      {/* Header */}
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

      {/* Counts + section breakdown */}
      <div className="flex items-center gap-3 text-xs">
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
    </div>
  );
};
