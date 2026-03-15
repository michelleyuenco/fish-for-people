import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionName } from '../../domain/models/Seat';
import {
  SECTIONS,
  REGIONS,
  getRowLabel,
  getRegionSeatCount,
  getRegionRowRange,
  type RegionConfig,
} from '../../domain/constants/seating';
import type { RegionAvailability } from '../../domain/rules/syntheticSeatMap';

interface ZoneFloorPlanInputProps {
  regionCounts: RegionAvailability;
  onRegionChange: (regionId: string, count: number) => void;
}

/** Region overlay colours keyed by section */
const OVERLAY_COLORS: Record<SectionName, { base: string; active: string; border: string }> = {
  left:   { base: 'rgba(59,130,246,0.15)',  active: 'rgba(59,130,246,0.30)',  border: 'rgba(59,130,246,0.45)' },
  middle: { base: 'rgba(16,185,129,0.15)',  active: 'rgba(16,185,129,0.30)',  border: 'rgba(16,185,129,0.45)' },
  right:  { base: 'rgba(139,92,246,0.15)',  active: 'rgba(139,92,246,0.30)',  border: 'rgba(139,92,246,0.45)' },
};

/** Special overlay colours for reserved regions */
const RESERVATION_OVERLAY_COLORS: Record<string, { base: string; active: string; border: string }> = {
  family:    { base: 'rgba(245,158,11,0.15)', active: 'rgba(245,158,11,0.30)', border: 'rgba(245,158,11,0.45)' },
  volunteer: { base: 'rgba(236,72,153,0.15)', active: 'rgba(236,72,153,0.30)', border: 'rgba(236,72,153,0.45)' },
};

const BADGE_COLORS: Record<SectionName, string> = {
  left:   'bg-blue-600 text-white',
  middle: 'bg-emerald-600 text-white',
  right:  'bg-violet-600 text-white',
};

const RESERVATION_BADGE_COLORS: Record<string, string> = {
  family:    'bg-amber-600 text-white',
  volunteer: 'bg-pink-600 text-white',
};

/** Inline count badge rendered inside a region overlay */
const RegionBadge: React.FC<{
  region: RegionConfig;
  count: number;
  onChange: (val: number) => void;
}> = ({ region, count, onChange }) => {
  const { t } = useTranslation();
  const capacity = getRegionSeatCount(region);
  const rowRange = getRegionRowRange(region);
  const hasAvailable = count > 0;
  const badgeColor = region.reservation
    ? RESERVATION_BADGE_COLORS[region.reservation]
    : BADGE_COLORS[region.section];

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editing) onChange(Math.min(count + 1, capacity));
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (count > 0) onChange(count - 1);
  };

  const handleFillAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(capacity);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(0);
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(String(count));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(Math.min(parsed, capacity));
    }
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Main counter row */}
      <div
        className={`
          flex items-center gap-1 rounded-lg shadow-lg px-2 py-1
          select-none cursor-pointer transition-all active:scale-95
          ${hasAvailable ? badgeColor : 'bg-gray-500/80 text-white'}
        `}
        onClick={handleIncrement}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleIncrement(e as unknown as React.MouseEvent); } }}
        aria-label={`${t(`zones.${region.section}`)} ${t(`zonePlan.region.${region.label}`)} (${rowRange}): ${count}/${capacity}`}
      >
        <button
          type="button"
          onClick={handleDecrement}
          disabled={count <= 0}
          className="w-5 h-5 rounded bg-white/25 text-white text-xs font-bold flex items-center justify-center active:scale-90 disabled:opacity-30 transition-all"
        >−</button>

        {editing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
              className="w-8 text-center text-sm font-bold tabular-nums bg-transparent border-b border-white/50 outline-none text-white"
            />
          </div>
        ) : (
          <div className="flex items-baseline gap-0.5 min-w-[2rem] justify-center" onClick={startEditing}>
            <span className="text-sm font-bold tabular-nums">{count}</span>
            <span className="text-[8px] opacity-60">/{capacity}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleIncrement}
          disabled={count >= capacity}
          className="w-5 h-5 rounded bg-white/25 text-white text-xs font-bold flex items-center justify-center active:scale-90 disabled:opacity-30 transition-all"
        >+</button>
      </div>

      {/* Quick fill / clear buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleClearAll}
          disabled={count === 0}
          className="px-1.5 py-0 rounded text-[8px] font-semibold bg-white/60 text-gray-600 hover:bg-white/90 active:scale-90 disabled:opacity-30 transition-all leading-tight"
          aria-label={t('seats.allOccupied')}
        >{t('seats.allOccupied')}</button>
        <button
          type="button"
          onClick={handleFillAll}
          disabled={count === capacity}
          className="px-1.5 py-0 rounded text-[8px] font-semibold bg-white/60 text-gray-600 hover:bg-white/90 active:scale-90 disabled:opacity-30 transition-all leading-tight"
          aria-label={t('seats.allAvailable')}
        >{t('seats.allAvailable')}</button>
      </div>
    </div>
  );
};

/** Rect relative to a parent element */
interface RelRect { top: number; left: number; width: number; height: number }

/**
 * Floor plan with interactive zone overlays.
 * Renders the seat layout as dimmed dots, then measures the DOM to position
 * continuous (gap-free) region overlays on top.
 */
export const ZoneFloorPlanInput: React.FC<ZoneFloorPlanInputProps> = ({
  regionCounts,
  onRegionChange,
}) => {
  const { t } = useTranslation();
  const maxRows = Math.max(...SECTIONS.map((s) => s.rows));
  const gridRef = useRef<HTMLDivElement>(null);
  const [overlayRects, setOverlayRects] = useState<Record<string, RelRect>>({});

  // Measure section cells after layout to position continuous overlays
  const measure = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const gridRect = grid.getBoundingClientRect();
    const rects: Record<string, RelRect> = {};

    for (const region of REGIONS) {
      const firstEl = grid.querySelector(`[data-region-cell="${region.section}-${region.startRow}"]`);
      const lastEl = grid.querySelector(`[data-region-cell="${region.section}-${region.endRow}"]`);
      if (!firstEl || !lastEl) continue;

      const firstRect = firstEl.getBoundingClientRect();
      const lastRect = lastEl.getBoundingClientRect();

      rects[region.id] = {
        top: firstRect.top - gridRect.top,
        left: firstRect.left - gridRect.left,
        width: Math.max(firstRect.width, lastRect.width),
        height: lastRect.bottom - firstRect.top,
      };
    }

    setOverlayRects(rects);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (gridRef.current) ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div className="w-fit min-w-[700px]">
      {/* Stage */}
      <div className="mx-auto mb-4 w-3/5 bg-accent/20 border-2 border-accent/40 text-accent text-sm font-bold text-center py-2.5 rounded-b-[50%] rounded-t-lg">
        {t('seats.stage')}
      </div>

      {/* Seat grid (background) + absolutely-positioned region overlays */}
      <div ref={gridRef} className="relative">
        {/* Background: seat dots rendered row by row */}
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
                  {getRowLabel(rowNum)}
                </span>

                {SECTIONS.map((section, secIdx) => {
                  const maxSeats = section.seatsPerRow(2);
                  const sectionMargin = secIdx < SECTIONS.length - 1 ? 'mr-3 md:mr-5' : '';

                  if (rowNum > section.rows) {
                    return (
                      <div
                        key={section.name}
                        className={`flex items-center gap-[2px] ${sectionMargin}`}
                      >
                        {Array.from({ length: maxSeats }, (_, i) => (
                          <span key={i} className="w-[22px] h-[22px] md:w-[26px] md:h-[26px] flex-shrink-0" />
                        ))}
                      </div>
                    );
                  }

                  const seatsInRow = section.seatsPerRow(rowNum);
                  const padding = maxSeats - seatsInRow;
                  const padLeft = section.name === 'left' ? padding
                    : section.name === 'right' ? 0 : 0;
                  const padRight = section.name === 'right' ? padding
                    : section.name === 'left' ? 0 : 0;
                  const useCenter = section.name === 'middle' && padding > 0;

                  const dots = Array.from({ length: seatsInRow }, (_, colIdx) => (
                    <span
                      key={colIdx}
                      className="w-[22px] h-[22px] md:w-[26px] md:h-[26px] rounded-sm flex-shrink-0 bg-gray-300/60"
                    />
                  ));

                  return (
                    <div
                      key={section.name}
                      data-region-cell={`${section.name}-${rowNum}`}
                      className={`flex items-center gap-[2px] ${sectionMargin}`}
                    >
                      {useCenter ? (
                        <>
                          <span className="w-[10px] h-[22px] md:w-[12px] md:h-[26px] flex-shrink-0" />
                          {dots}
                          <span className="w-[10px] h-[22px] md:w-[12px] md:h-[26px] flex-shrink-0" />
                        </>
                      ) : (
                        <>
                          {Array.from({ length: padLeft }, (_, i) => (
                            <span key={`pl-${i}`} className="w-[22px] h-[22px] md:w-[26px] md:h-[26px] flex-shrink-0" />
                          ))}
                          {dots}
                          {Array.from({ length: padRight }, (_, i) => (
                            <span key={`pr-${i}`} className="w-[22px] h-[22px] md:w-[26px] md:h-[26px] flex-shrink-0" />
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Row label (right side) */}
                <span className="text-[10px] text-gray-400 font-semibold w-5 text-left ml-1.5 flex-shrink-0">
                  {getRowLabel(rowNum)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Region overlays — continuous blocks positioned via measured rects */}
        {REGIONS.map((region) => {
          const rect = overlayRects[region.id];
          if (!rect) return null;

          const count = regionCounts[region.id] ?? 0;
          const hasAvailable = count > 0;
          const colors = region.reservation
            ? RESERVATION_OVERLAY_COLORS[region.reservation]
            : OVERLAY_COLORS[region.section];

          return (
            <div
              key={region.id}
              className="absolute z-10 rounded-md flex flex-col items-center justify-center transition-colors duration-200"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                backgroundColor: hasAvailable ? colors.active : colors.base,
                border: `1.5px solid ${colors.border}`,
              }}
            >
              {/* Region label */}
              <div className="text-[7px] font-semibold text-gray-600/80 leading-none mb-0.5">
                {t(`zonePlan.region.${region.label}`)}
              </div>

              {/* Count badge */}
              <RegionBadge
                region={region}
                count={count}
                onChange={(val) => onRegionChange(region.id, val)}
              />
            </div>
          );
        })}
      </div>

      {/* Section labels */}
      <div className="flex items-center justify-center mt-3 gap-0">
        <span className="w-5 mr-1.5 flex-shrink-0" />
        {SECTIONS.map((section, secIdx) => {
          const maxSeats = section.seatsPerRow(2);
          return (
            <div
              key={section.name}
              className={`flex items-center gap-[2px] ${secIdx < SECTIONS.length - 1 ? 'mr-3 md:mr-5' : ''}`}
            >
              <div className="text-center" style={{ width: `${maxSeats * 24}px` }}>
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
