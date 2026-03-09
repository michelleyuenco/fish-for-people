import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Seat, SectionName } from '../../domain/models/Seat';
import { SECTIONS, getRowReservation } from '../../domain/constants/seating';

interface FloorPlanSeatMapProps {
  seatMap: Map<string, Seat>;
  canToggle: boolean;
  toggling: Set<string>;
  onToggle: (seat: Seat) => void;
  /** Toggle all seats in a section-row: if any unoccupied → fill all, else → clear all */
  onToggleRow?: (section: SectionName, row: number, occupied: boolean) => void;
  pendingRequestRows?: Set<string>;
  /** Set of seat IDs that are "recommended" — pulsed gently to draw the eye */
  recommendedSeats?: Set<string>;
  /** Simplified mode for public display: only green/gray, no reservation detail */
  simplified?: boolean;
}

/**
 * Compute a 0–1 preference score for a seat based on fill direction.
 * 1 = most preferred (brightest green), 0 = least preferred (dimmest).
 * - Left section: fill from wall (col 1) → aisle (last col)
 * - Middle section: fill from center → outward
 * - Right section: fill from wall (last col) → aisle (col 1)
 */
function getSeatPreference(sectionName: SectionName, colIdx: number, seatsInRow: number, rowNum: number): number {
  // Row 1 in every section is always suggested (easy aisle access)
  if (rowNum === 1) return 1;
  if (seatsInRow <= 1) return 1;
  const maxIdx = seatsInRow - 1;
  switch (sectionName) {
    case 'left':
      return 1 - colIdx / maxIdx;
    case 'right':
      return colIdx / maxIdx;
    case 'middle': {
      const center = maxIdx / 2;
      const dist = Math.abs(colIdx - center);
      return 1 - dist / center;
    }
    default:
      return 0.5;
  }
}

/** Map preference score to a green color with opacity gradient */
function preferenceToGreen(score: number): string {
  // Opacity from 0.5 (least preferred) to 1.0 (most preferred)
  const opacity = 0.5 + score * 0.5;
  // success green = #22C55E → rgb(34, 197, 94)
  return `rgba(34, 197, 94, ${opacity.toFixed(2)})`;
}

/**
 * Floor-plan seat map for larger screens (iPad / entrance display).
 * Shows the full floor plan with a stage at top and curved/trapezoid perspective.
 */
export const FloorPlanSeatMap: React.FC<FloorPlanSeatMapProps> = ({
  seatMap,
  canToggle,
  toggling,
  onToggle,
  onToggleRow,
  pendingRequestRows = new Set(),
  recommendedSeats = new Set(),
  simplified = false,
}) => {
  const { t } = useTranslation();
  const maxRows = Math.max(...SECTIONS.map((s) => s.rows));
  const hasRecommendations = recommendedSeats.size > 0;

  return (
    <div className="w-fit min-w-[700px]">
      {/* Stage */}
      <div className="mx-auto mb-4 w-3/5 bg-accent/20 border-2 border-accent/40 text-accent text-sm font-bold text-center py-2.5 rounded-b-[50%] rounded-t-lg">
        {t('seats.stage')}
      </div>

      {/* Fill-direction arrows above sections */}
      {hasRecommendations && (
        <div className="flex items-center justify-center gap-0 mb-1">
          <span className="text-[10px] text-gray-400 font-semibold w-5 mr-1.5 flex-shrink-0" />
          {SECTIONS.map((section, secIdx) => {
            const maxSeats = section.seatsPerRow(2);
            const showToggle = canToggle && onToggleRow;
            const arrow = section.name === 'left' ? t('seats.fillInwardLeft')
              : section.name === 'right' ? t('seats.fillInwardRight')
              : t('seats.fillOutward');
            return (
              <div
                key={section.name}
                className={`flex items-center gap-[2px] ${secIdx < SECTIONS.length - 1 ? 'mr-3 md:mr-5' : ''}`}
              >
                {showToggle && <span className="w-[6px] mr-[3px] flex-shrink-0" />}
                <div className="text-center text-[9px] text-gray-400 font-medium" style={{ width: `${maxSeats * 24}px` }}>
                  {arrow}
                </div>
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
                const maxSeats = section.seatsPerRow(2);
                const sectionMargin = secIdx < SECTIONS.length - 1 ? 'mr-3 md:mr-5' : '';
                const showToggle = canToggle && onToggleRow;

                if (rowNum > section.rows) {
                  return (
                    <div
                      key={section.name}
                      className={`flex items-center gap-[2px] ${sectionMargin}`}
                    >
                      {showToggle && (
                        <span className="w-[6px] h-[22px] md:h-[26px] mr-[3px] flex-shrink-0" />
                      )}
                      {Array.from({ length: maxSeats }, (_, i) => (
                        <span key={i} className="w-[22px] h-[22px] md:w-[26px] md:h-[26px] flex-shrink-0" />
                      ))}
                    </div>
                  );
                }

                const seatsInRow = section.seatsPerRow(rowNum);
                const rowKey = `${section.name}-${rowNum}`;
                const rowHasPending = !simplified && pendingRequestRows.has(rowKey);

                const padding = maxSeats - seatsInRow;
                const padLeft = Math.floor(padding / 2);
                const padRight = padding - padLeft;

                const hasUnoccupied = Array.from({ length: seatsInRow }, (_, ci) => {
                  const sid = `${section.name}-${rowNum}-${ci + 1}`;
                  const s = seatMap.get(sid);
                  return !s || !s.occupied;
                }).some(Boolean);

                return (
                  <div
                    key={section.name}
                    className={`flex items-center gap-[2px] ${sectionMargin}`}
                  >
                    {showToggle && (
                      <button
                        onClick={() => onToggleRow!(section.name, rowNum, hasUnoccupied)}
                        aria-label={`${hasUnoccupied ? t('seats.fillRow') : t('seats.clearRow')} ${section.label} ${rowNum}`}
                        title={hasUnoccupied ? t('seats.fillRow') : t('seats.clearRow')}
                        className="w-[6px] h-[22px] md:h-[26px] rounded-sm mr-[3px] flex-shrink-0 transition-all
                                   bg-gray-300 hover:bg-primary active:scale-90 cursor-pointer"
                      />
                    )}
                    {Array.from({ length: padLeft }, (_, i) => (
                      <span key={`pl-${i}`} className="w-[22px] h-[22px] md:w-[26px] md:h-[26px] flex-shrink-0" />
                    ))}
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
                      const rowReservation = getRowReservation(section.name, rowNum);

                      let colorClass: string;
                      let statusLabel: string;
                      let inlineColor: string | undefined;

                      if (simplified) {
                        if (seat.occupied) {
                          colorClass = '';
                          inlineColor = '#EF4444';
                          statusLabel = t('seats.taken');
                        } else if (rowReservation === 'volunteer') {
                          colorClass = 'bg-purple-300 ring-1 ring-purple-400/40';
                          statusLabel = t('seats.reservedFor', { type: t('seats.legendVolunteer') });
                        } else if (rowReservation === 'family') {
                          colorClass = 'bg-blue-300 ring-1 ring-blue-400/40';
                          statusLabel = t('seats.reservedFor', { type: t('seats.legendFamily') });
                        } else {
                          // Green seat — use gradient
                          colorClass = '';
                          inlineColor = preferenceToGreen(getSeatPreference(section.name, colIdx, seatsInRow, rowNum));
                          statusLabel = isRecommended ? t('seats.suggested') : t('seats.available');
                        }
                      } else {
                        if (rowHasPending) {
                          colorClass = 'bg-warning ring-1 ring-warning/60';
                        } else if (seat.occupied) {
                          colorClass = '';
                          inlineColor = '#EF4444';
                        } else if (rowReservation === 'volunteer') {
                          colorClass = 'bg-purple-300 ring-1 ring-purple-400/40';
                        } else if (rowReservation === 'family') {
                          colorClass = 'bg-blue-300 ring-1 ring-blue-400/40';
                        } else if (seat.reservedFor === 'family') {
                          colorClass = 'bg-blue-300 ring-1 ring-blue-200/60';
                        } else if (seat.reservedFor === 'volunteer') {
                          colorClass = 'bg-purple-300 ring-1 ring-purple-200/60';
                        } else {
                          // Green seat — use gradient
                          colorClass = '';
                          inlineColor = preferenceToGreen(getSeatPreference(section.name, colIdx, seatsInRow, rowNum));
                        }

                        statusLabel = rowHasPending
                          ? t('seats.requestPending')
                          : seat.occupied
                          ? t('seats.occupied')
                          : rowReservation
                          ? t('seats.reservedFor', { type: rowReservation })
                          : seat.reservedFor !== 'none'
                          ? t('seats.reservedFor', { type: seat.reservedFor })
                          : t('seats.available');
                      }

                      return (
                        <button
                          key={seatId}
                          onClick={() => {
                            if (canToggle && !isToggling) onToggle(seat);
                          }}
                          disabled={!canToggle || isToggling}
                          aria-label={`${section.label} ${t('welcomeTeam.row', { row: rowNum })} ${colNum}: ${statusLabel}`}
                          aria-pressed={seat.occupied}
                          style={inlineColor ? { backgroundColor: inlineColor } : undefined}
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
                    {Array.from({ length: padRight }, (_, i) => (
                      <span key={`pr-${i}`} className="w-[22px] h-[22px] md:w-[26px] md:h-[26px] flex-shrink-0" />
                    ))}
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
        <span className="w-5 mr-1.5 flex-shrink-0" />
        {SECTIONS.map((section, secIdx) => {
          const maxSeats = section.seatsPerRow(2);
          const showToggle = canToggle && onToggleRow;
          return (
            <div
              key={section.name}
              className={`flex items-center gap-[2px] ${secIdx < SECTIONS.length - 1 ? 'mr-3 md:mr-5' : ''}`}
            >
              {showToggle && <span className="w-[6px] mr-[3px] flex-shrink-0" />}
              <div
                className="text-center"
                style={{ width: `${maxSeats * 24}px` }}
              >
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {section.label}
                </span>
              </div>
            </div>
          );
        })}
        <span className="w-5 ml-1.5 flex-shrink-0" />
      </div>
    </div>
  );
};
