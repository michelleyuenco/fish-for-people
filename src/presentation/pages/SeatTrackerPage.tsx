import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SeatMap } from '../components/SeatMap';
import { useSeats } from '../../application/hooks/useSeats';
import { useRequests } from '../../application/hooks/useRequests';
import { SECTIONS, TOTAL_SEATS } from '../../domain/constants/seating';
import type { SeatSummary } from '../../domain/models/Seat';

/** Returns the section with the most available seats and the top 3 rows in that section */
function getBestAvailable(summaries: SeatSummary[]): {
  section: string;
  sectionLabel: string;
  topRows: SeatSummary[];
} | null {
  // Aggregate available seats per section from summaries
  const sectionTotals = new Map<string, number>();
  for (const s of summaries) {
    sectionTotals.set(s.section, (sectionTotals.get(s.section) ?? 0) + s.availableSeats);
  }
  let bestSection = '';
  let bestAvail = 0;
  sectionTotals.forEach((avail, section) => {
    if (avail > bestAvail) {
      bestAvail = avail;
      bestSection = section;
    }
  });
  if (bestAvail === 0) return null;
  const sectionConfig = SECTIONS.find((s) => s.name === bestSection);
  const topRows = summaries
    .filter((s) => s.section === bestSection && s.availableSeats > 0)
    .sort((a, b) => b.availableSeats - a.availableSeats)
    .slice(0, 3);
  return { section: bestSection, sectionLabel: sectionConfig?.label ?? bestSection, topRows };
}

interface SeatTrackerPageProps {
  serviceId: string;
}

export const SeatTrackerPage: React.FC<SeatTrackerPageProps> = ({ serviceId }) => {
  const {
    seatMap,
    summaries,
    availableCount,
    occupiedCount,
    sectionAvailability,
    loading,
    error,
    toggling,
    toggleSeat,
  } = useSeats(serviceId);

  const { pendingRequests } = useRequests(serviceId);

  const [activeSection, setActiveSection] = useState<'all' | 'left' | 'middle' | 'right'>('all');

  // Build a set of row keys that have pending requests: "${section}-${row}"
  const pendingRequestRows = useMemo(() => {
    const rowSet = new Set<string>();
    for (const req of pendingRequests) {
      rowSet.add(`${req.section}-${req.row}`);
    }
    return rowSet;
  }, [pendingRequests]);

  const filteredSummaries = summaries.filter(
    (s) => activeSection === 'all' || s.section === activeSection
  );

  const occupancyPct = Math.round((occupiedCount / TOTAL_SEATS) * 100);
  const bestAvailable = useMemo(
    () => getBestAvailable(summaries),
    [summaries]
  );

  // Track arrivals since page load
  const initialOccupiedRef = useRef<number | null>(null);
  useEffect(() => {
    if (!loading && initialOccupiedRef.current === null) {
      initialOccupiedRef.current = occupiedCount;
    }
  }, [loading, occupiedCount]);
  const arrivalsSinceLoad = initialOccupiedRef.current !== null ? occupiedCount - initialOccupiedRef.current : 0;

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

        {/* Progress bar with dynamic color */}
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              occupancyPct >= 95 ? 'bg-danger' : occupancyPct >= 80 ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>

        {/* Capacity alert */}
        {occupancyPct >= 95 && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-sm font-semibold px-3 py-2 rounded-xl mb-3 flex items-center gap-2">
            🚨 At Capacity — redirect newcomers to overflow area
          </div>
        )}
        {occupancyPct >= 80 && occupancyPct < 95 && (
          <div className="bg-warning/10 border border-warning/30 text-warning text-sm font-semibold px-3 py-2 rounded-xl mb-3 flex items-center gap-2">
            ⚠️ Near Capacity — only {availableCount} seats remaining
          </div>
        )}

        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-success/10 rounded-xl py-2">
            <div className="font-bold text-success text-lg">{availableCount}</div>
            <div className="text-[10px] text-gray-500">Available</div>
          </div>
          <div className="bg-occupied/20 rounded-xl py-2">
            <div className="font-bold text-occupied text-lg">{occupiedCount}</div>
            <div className="text-[10px] text-gray-500">Occupied</div>
          </div>
          <div className="bg-primary/10 rounded-xl py-2">
            <div className="font-bold text-primary text-lg">{occupancyPct}%</div>
            <div className="text-[10px] text-gray-500">Full</div>
          </div>
          <div className="bg-accent/10 rounded-xl py-2">
            <div className={`font-bold text-lg ${arrivalsSinceLoad > 0 ? 'text-accent' : 'text-gray-400'}`}>
              {arrivalsSinceLoad > 0 ? `+${arrivalsSinceLoad}` : '—'}
            </div>
            <div className="text-[10px] text-gray-500">New</div>
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

      {/* Quick Verbal Guide Banner */}
      {bestAvailable && (
        <div className="card bg-accent/5 border border-accent/20">
          <p className="text-xs font-bold text-accent uppercase tracking-wide mb-1">🎙 Say this to latecomers:</p>
          <p className="text-base font-semibold text-gray-800 leading-snug">
            "Please head to the{' '}
            <span className="text-primary">{bestAvailable.sectionLabel}</span> section,{' '}
            {bestAvailable.topRows.length > 0 && (
              <>row <span className="text-primary">{bestAvailable.topRows[0].row}</span>
              {bestAvailable.topRows[0].availableSeats <= 3 && (
                <span className="text-warning"> — only {bestAvailable.topRows[0].availableSeats} seats!</span>
              )}
              </>
            )}."
          </p>
        </div>
      )}

      {/* Best Available Banner */}
      {bestAvailable && (
        <div className="card bg-success/10 border border-success/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🟢</span>
            <span className="font-bold text-success text-sm">Best Available — {bestAvailable.sectionLabel} Section</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {bestAvailable.topRows.map((r) => (
              <span key={`${r.section}-${r.row}`} className="bg-success text-white text-xs font-semibold px-3 py-1 rounded-full">
                Row {r.row} · {r.availableSeats} free
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Direct latecomers to these rows first</p>
        </div>
      )}

      {/* Entrance View — Row Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-primary text-base">Entrance Guide</h2>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" />Free</span>
            <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded-sm bg-warning inline-block" />Limited</span>
            <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded-sm bg-danger inline-block" />Full</span>
          </div>
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
            const rowKey = `${summary.section}-${summary.row}`;
            const hasPending = pendingRequestRows.has(rowKey);
            const pct = summary.totalSeats > 0
              ? (summary.availableSeats / summary.totalSeats) * 100
              : 0;

            // Pending request overrides colour to amber; otherwise use availability
            const colorClass = hasPending
              ? 'bg-warning/15 text-warning border border-warning/40'
              : pct === 0
              ? 'bg-danger/10 text-danger'
              : pct < 30
              ? 'bg-warning/10 text-warning'
              : 'bg-success/10 text-success';

            return (
              <div
                key={`${summary.section}-${summary.row}`}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${colorClass}`}
              >
                <span className="text-xs font-medium flex items-center gap-1">
                  {summary.section.charAt(0).toUpperCase() + summary.section.slice(1)} Row {summary.row}
                  {hasPending && <span title="Pending request">🙋</span>}
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
              <span className="w-3 h-3 rounded-sm bg-success inline-block" /> Free
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-occupied inline-block" /> Taken
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-warning inline-block" /> Request
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
          pendingRequestRows={pendingRequestRows}
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
