import React, { useState } from 'react';
import { SeatMap } from '../components/SeatMap';
import { useSeats } from '../../application/hooks/useSeats';
import { SECTIONS, TOTAL_SEATS } from '../../domain/constants/seating';
import type { SeatSummary } from '../../domain/models/Seat';

interface SeatTrackerPageProps {
  serviceId: string;
}

export const SeatTrackerPage: React.FC<SeatTrackerPageProps> = ({ serviceId }) => {
  const { seatMap, summaries, availableCount, occupiedCount, sectionAvailability, loading, error, toggling, toggleSeat } =
    useSeats(serviceId);
  const [activeSection, setActiveSection] = useState<'all' | 'left' | 'middle' | 'right'>('all');

  const filteredSummaries = summaries.filter(
    (s) => activeSection === 'all' || s.section === activeSection
  );

  const occupancyPct = Math.round((occupiedCount / TOTAL_SEATS) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Occupancy Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-primary text-base">Occupancy Overview</h2>
          <span className="text-xs text-gray-500">{TOTAL_SEATS} total seats</span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${occupancyPct}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-success/10 rounded-xl py-2">
            <div className="font-bold text-success text-lg">{availableCount}</div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
          <div className="bg-occupied/20 rounded-xl py-2">
            <div className="font-bold text-occupied text-lg">{occupiedCount}</div>
            <div className="text-xs text-gray-500">Occupied</div>
          </div>
          <div className="bg-primary/10 rounded-xl py-2">
            <div className="font-bold text-primary text-lg">{occupancyPct}%</div>
            <div className="text-xs text-gray-500">Full</div>
          </div>
        </div>

        {/* Section breakdown */}
        <div className="flex gap-2 mt-3">
          {SECTIONS.map((section) => (
            <div key={section.name} className="flex-1 bg-gray-50 rounded-lg py-1.5 text-center">
              <div className="text-xs font-semibold text-gray-600">{section.label}</div>
              <div className="text-sm font-bold text-success">
                {sectionAvailability[section.name]}
              </div>
              <div className="text-[10px] text-gray-400">avail.</div>
            </div>
          ))}
        </div>
      </div>

      {/* Entrance View — Row Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-primary text-base">Entrance Guide</h2>
          <span className="text-xs text-gray-400">tap section to filter</span>
        </div>

        {/* Section filter tabs */}
        <div className="flex gap-2 mb-3">
          {(['all', 'left', 'middle', 'right'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === s
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Row summaries */}
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {filteredSummaries.map((summary: SeatSummary) => {
            const pct = summary.totalSeats > 0
              ? (summary.availableSeats / summary.totalSeats) * 100
              : 0;
            const color =
              pct === 0
                ? 'bg-danger/10 text-danger'
                : pct < 30
                ? 'bg-warning/10 text-warning'
                : 'bg-success/10 text-success';

            return (
              <div
                key={`${summary.section}-${summary.row}`}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${color}`}
              >
                <span className="text-xs font-medium">
                  {summary.section.charAt(0).toUpperCase() + summary.section.slice(1)} Row {summary.row}
                </span>
                <span className="text-xs font-bold">
                  {summary.availableSeats}/{summary.totalSeats} free
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seat Map */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-primary text-base">Floor Plan</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-success inline-block" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-occupied inline-block" /> Occupied
            </span>
          </div>
        </div>

        {/* Stage indicator */}
        <div className="w-full bg-accent/20 border border-accent/40 text-accent text-xs font-semibold text-center py-1.5 rounded-lg mb-3">
          ✝ STAGE / PULPIT ✝
        </div>

        <SeatMap
          seatMap={seatMap}
          canToggle={true}
          toggling={toggling}
          onToggle={toggleSeat}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          ⚠ Connection error. Changes may not sync. Please check your internet.
        </div>
      )}
    </div>
  );
};
