import React from 'react';
import type { Seat, SectionName } from '../../domain/models/Seat';
import { SECTIONS } from '../../domain/constants/seating';

interface CinemaSeatMapProps {
  seatMap: Map<string, Seat>;
  canToggle: boolean;
  toggling: Set<string>;
  onToggle: (seat: Seat) => void;
  pendingRequestRows?: Set<string>;
  /** Set of seat IDs that are "recommended" — pulsed gently to draw the eye */
  recommendedSeats?: Set<string>;
  /** Simplified mode for public display: only green/gray, no reservation detail */
  simplified?: boolean;
}

/**
 * Cinema-style seat map for larger screens (iPad / entrance display).
 * Shows the full floor plan with a stage at top and curved/trapezoid perspective.
 */
export const CinemaSeatMap: React.FC<CinemaSeatMapProps> = ({
  seatMap,
  canToggle,
  toggling,
  onToggle,
  pendingRequestRows = new Set(),
  recommendedSeats = new Set(),
  simplified = false,
}) => {
  const maxRows = Math.max(...SECTIONS.map((s) => s.rows));
  const hasRecommendations = recommendedSeats.size > 0;

  return (
    <div className="w-full min-w-[700px]">
      {/* Stage */}
      <div className="mx-auto mb-4 w-3/5 bg-accent/20 border-2 border-accent/40 text-accent text-sm font-bold text-center py-2.5 rounded-b-[50%] rounded-t-lg">
        ✝ STAGE / PULPIT ✝
      </div>

      {/* Fill-direction arrows above sections */}
      {hasRecommendations && (
        <div className="flex items-center justify-center gap-0 mb-1">
          <span className="text-[10px] text-gray-400 font-semibold w-5 mr-1.5 flex-shrink-0" />
          {SECTIONS.map((section, idx) => {
            const maxInRow = section.seatsPerRow(2);
            const arrow = section.name === 'left' ? '← fill inward'
              : section.name === 'right' ? 'fill inward →'
              : '← fill outward →';
            return (
              <div
                key={section.name}
                className={`text-center text-[9px] text-gray-400 font-medium ${idx < SECTIONS.length - 1 ? 'mr-3 md:mr-5' : ''}`}
                style={{ width: `${maxInRow * 28}px` }}
              >
                {arrow}
              </div>
            );
          })}
          <span className="text-[10px] text-gray-400 font-semibold w-5 ml-1.5 flex-shrink-0" />
        </div>
      )}

      {/* Seat grid — row by row across all sections */}
      <div className="flex flex-col items-center gap-[3px]">
        {Array.from({ length: maxRows }, (_, rowIdx) => {
          const rowNum = rowIdx + 1;
          // Slight perspective: front rows narrower, back rows wider
          const scaleFactor = 0.88 + (rowIdx / maxRows) * 0.12;

          return (
            <div
              key={rowNum}
              className="flex items-center justify-center gap-0"
              style={{ transform: `scaleX(${scaleFactor})` }}
            >
              {/* Row label */}
              <span className="text-[10px] text-gray-400 font-semibold w-5 text-right mr-1.5 flex-shrink-0">
                {rowNum}
              </span>

              {SECTIONS.map((section, secIdx) => {
                if (rowNum > section.rows) {
                  const maxInRow = section.seatsPerRow(2);
                  return (
                    <div
                      key={section.name}
                      className={secIdx < SECTIONS.length - 1 ? 'mr-3 md:mr-5' : ''}
                      style={{ width: `${maxInRow * 28}px` }}
                    />
                  );
                }

                const seatsInRow = section.seatsPerRow(rowNum);
                const rowKey = `${section.name}-${rowNum}`;
                const rowHasPending = !simplified && pendingRequestRows.has(rowKey);

                return (
                  <div
                    key={section.name}
                    className={`flex items-center justify-center gap-[2px] ${secIdx < SECTIONS.length - 1 ? 'mr-3 md:mr-5' : ''}`}
                  >
                    {Array.from({ length: seatsInRow }, (_, colIdx) => {
                      const colNum = colIdx + 1;
                      const seatId = `${section.name}-${rowNum}-${colNum}`;
                      const seat = seatMap.get(seatId) || {
                        id: seatId,
                        section: section.name as SectionName,
                        row: rowNum,
                        col: colNum,
                        occupied: false,
                        reservedFor: 'none' as const,
                        updatedAt: null,
                      };
                      const isToggling = toggling.has(seatId);
                      const isRecommended = hasRecommendations && recommendedSeats.has(seatId);
                      const isAvailable = !seat.occupied && seat.reservedFor === 'none';

                      // Simplified mode (cinema entrance): green = available, gray = taken
                      // Detailed mode (welcome team): shows reservation types and pending requests
                      let colorClass: string;
                      let statusLabel: string;

                      if (simplified) {
                        if (isAvailable) {
                          colorClass = isRecommended ? 'bg-success' : 'bg-success/55';
                          statusLabel = isRecommended ? 'suggested' : 'available';
                        } else {
                          colorClass = 'bg-gray-300';
                          statusLabel = 'taken';
                        }
                      } else {
                        colorClass = rowHasPending
                          ? 'bg-warning ring-1 ring-warning/60'
                          : seat.occupied
                          ? 'bg-occupied'
                          : seat.reservedFor === 'family'
                          ? 'bg-blue-300 ring-1 ring-blue-200/60'
                          : seat.reservedFor === 'volunteer'
                          ? 'bg-purple-300 ring-1 ring-purple-200/60'
                          : 'bg-success';

                        statusLabel = rowHasPending
                          ? 'request pending'
                          : seat.occupied
                          ? 'occupied'
                          : seat.reservedFor !== 'none'
                          ? `reserved for ${seat.reservedFor}`
                          : 'available';
                      }

                      return (
                        <button
                          key={seatId}
                          onClick={() => {
                            if (canToggle && !isToggling) onToggle(seat);
                          }}
                          disabled={!canToggle || isToggling}
                          aria-label={`${section.label} Row ${rowNum} seat ${colNum}: ${statusLabel}`}
                          aria-pressed={seat.occupied}
                          className={`
                            w-[22px] h-[22px] md:w-[26px] md:h-[26px] rounded-sm flex-shrink-0 transition-all duration-150
                            ${colorClass}
                            ${canToggle && !isToggling ? 'cursor-pointer hover:opacity-80 hover:scale-110 active:scale-90' : 'cursor-default'}
                            ${isToggling ? 'scale-75 opacity-60 animate-pulse' : ''}
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary
                          `}
                        />
                      );
                    })}
                  </div>
                );
              })}

              {/* Row label (right side) */}
              <span className="text-[10px] text-gray-400 font-semibold w-5 text-left ml-1.5 flex-shrink-0">
                {rowNum}
              </span>
            </div>
          );
        })}
      </div>

      {/* Section labels at bottom */}
      <div className="flex items-center justify-center mt-3 gap-0">
        {SECTIONS.map((section, idx) => {
          const maxInRow = section.seatsPerRow(2);
          return (
            <div
              key={section.name}
              className={`text-center ${idx < SECTIONS.length - 1 ? 'mr-3 md:mr-5' : ''}`}
              style={{ width: `${maxInRow * 28}px` }}
            >
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {section.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
