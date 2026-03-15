import React, { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FloorPlanSeatMap } from '../components/FloorPlanSeatMap';
import { useZonePlan } from '../../application/hooks/useZonePlan';
import { TOTAL_SEATS } from '../../domain/constants/seating';

function useIsLandscape() {
  const [landscape, setLandscape] = useState(
    () => window.innerWidth > window.innerHeight,
  );
  useEffect(() => {
    const mql = window.matchMedia('(orientation: landscape)');
    const handler = (e: MediaQueryListEvent) => setLandscape(e.matches);
    setLandscape(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return landscape;
}

// Dummy no-op toggle for the read-only map
const EMPTY_SET = new Set<string>();
const noop = () => {};

export const ZonePlanPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();
  const {
    syntheticSeatMap,
    totalAvailable,
    totalOccupied,
  } = useZonePlan();

  useEffect(() => {
    document.title = `${t('zonePlan.kioskTitle')} | Fish for People`;
  }, [t]);

  const occupancyPct = Math.round((totalOccupied / TOTAL_SEATS) * 100);

  // Scale-to-fit logic (same as FloorPlanPage)
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const recalcScale = useCallback(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map) return;
    map.style.transform = 'scale(1)';
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const mw = map.scrollWidth;
    const mh = map.scrollHeight;
    if (mw === 0 || mh === 0) return;
    const s = Math.min(cw / mw, ch / mh, 1);
    setScale(s);
    map.style.transform = `scale(${s})`;
  }, []);

  useLayoutEffect(() => {
    recalcScale();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(recalcScale);
    ro.observe(container);
    return () => ro.disconnect();
  }, [recalcScale, isLandscape]);

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="bg-primary text-white px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🐟</span>
          <span className="text-white/60 text-sm hidden sm:inline">{t('zonePlan.kioskTitle')}</span>
          <span className="bg-white/20 text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline">
            {t('zonePlan.approximate')}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Occupancy stats */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-success inline-block" />
              <span className="font-semibold">{totalAvailable}</span>
              <span className="text-white/60 hidden sm:inline">{t('seats.free')}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-occupied inline-block" />
              <span className="font-semibold">{totalOccupied}</span>
              <span className="text-white/60 hidden sm:inline">{t('seats.taken')}</span>
            </span>
            <span className={`font-bold ${occupancyPct >= 95 ? 'text-red-300' : occupancyPct >= 80 ? 'text-yellow-300' : 'text-white'}`}>
              {t('floorPlanPage.pctFull', { pct: occupancyPct })}
            </span>
          </div>
          {/* Exit */}
          <button
            onClick={() => navigate('/zone-input')}
            className="bg-white/20 hover:bg-white/30 active:bg-white/40 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all"
            aria-label={t('floorPlanPage.exitFloorPlan')}
          >
            ✕ <span className="hidden sm:inline">{t('floorPlanPage.exit')}</span>
          </button>
        </div>
      </div>

      {/* Capacity alerts */}
      {occupancyPct >= 95 && (
        <div className="bg-danger text-white text-xs sm:text-sm font-bold text-center py-1 sm:py-1.5 flex-shrink-0">
          🚨 {t('floorPlanPage.atCapacity')}
        </div>
      )}
      {occupancyPct >= 80 && occupancyPct < 95 && (
        <div className="bg-warning text-white text-xs sm:text-sm font-bold text-center py-1 sm:py-1.5 flex-shrink-0">
          ⚠️ {t('floorPlanPage.nearCapacity', { count: totalAvailable })}
        </div>
      )}

      {/* Floor plan */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={containerRef}
          className={`absolute inset-0 flex items-center justify-center overflow-hidden ${
            isLandscape ? 'px-4 py-1' : 'pt-4 pb-8 px-2'
          }`}
        >
          <div
            ref={mapRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            <FloorPlanSeatMap
              seatMap={syntheticSeatMap}
              canToggle={false}
              toggling={EMPTY_SET}
              onToggle={noop}
              simplified
            />
          </div>
        </div>

        {/* Legend */}
        {isLandscape ? (
          <div className="absolute right-1.5 bottom-1.5 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow px-2 py-1 flex flex-col gap-0.5 text-[9px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-success inline-block" /> {t('seats.available')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-occupied inline-block" /> {t('seats.taken')}
            </span>
            <span className="text-[8px] text-gray-400 mt-0.5">{t('zonePlan.approximate')}</span>
          </div>
        ) : (
          <div className="absolute bottom-0 inset-x-0 z-10 flex items-center gap-4 py-1.5 text-[10px] text-gray-500 justify-center">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" /> {t('seats.available')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-occupied inline-block" /> {t('seats.taken')}
            </span>
            <span className="text-gray-400">({t('zonePlan.approximate')})</span>
          </div>
        )}
      </div>
    </div>
  );
};
