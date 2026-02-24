import React from 'react';
import type { Seat, SectionName } from '../../domain/models/Seat';
import { SECTIONS } from '../../domain/constants/seating';
import { SeatCell } from './SeatCell';

interface SeatMapProps {
  seatMap: Map<string, Seat>;
  canToggle: boolean;
  toggling: Set<string>;
  onToggle: (seat: Seat) => void;
}

interface SectionColumnProps {
  sectionName: SectionName;
  sectionLabel: string;
  rows: number;
  seatsPerRow: (row: number) => number;
  seatMap: Map<string, Seat>;
  canToggle: boolean;
  toggling: Set<string>;
  onToggle: (seat: Seat) => void;
}

const SectionColumn: React.FC<SectionColumnProps> = ({
  sectionName,
  sectionLabel,
  rows,
  seatsPerRow,
  seatMap,
  canToggle,
  toggling,
  onToggle,
}) => {
  const maxSeatsInRow = seatsPerRow(2); // max seats (row 2+ is the wider row)

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Section label */}
      <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
        {sectionLabel}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }, (_, i) => {
        const rowNum = i + 1;
        const seatsInThisRow = seatsPerRow(rowNum);

        return (
          <div
            key={rowNum}
            className="flex items-center gap-0.5"
            style={{ width: `${maxSeatsInRow * 22}px` }} // fixed width for alignment
          >
            {/* Row number */}
            <span className="text-[9px] text-gray-400 w-3 text-right flex-shrink-0 mr-0.5">
              {rowNum}
            </span>

            {/* Seats */}
            {Array.from({ length: seatsInThisRow }, (_, j) => {
              const colNum = j + 1;
              const seatId = `${sectionName}-${rowNum}-${colNum}`;
              const seat = seatMap.get(seatId) || {
                id: seatId,
                section: sectionName,
                row: rowNum,
                col: colNum,
                occupied: false,
                updatedAt: null,
              };

              return (
                <SeatCell
                  key={seatId}
                  seat={seat}
                  canToggle={canToggle}
                  isToggling={toggling.has(seatId)}
                  onToggle={onToggle}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const SeatMap: React.FC<SeatMapProps> = ({
  seatMap,
  canToggle,
  toggling,
  onToggle,
}) => {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-max px-2">
        {SECTIONS.map((section) => (
          <SectionColumn
            key={section.name}
            sectionName={section.name}
            sectionLabel={section.label}
            rows={section.rows}
            seatsPerRow={section.seatsPerRow}
            seatMap={seatMap}
            canToggle={canToggle}
            toggling={toggling}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
};
