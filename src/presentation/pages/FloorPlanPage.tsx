import React, { useMemo, useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { FloorPlanSeatMap } from '../components/FloorPlanSeatMap';
import { useSeats } from '../../application/hooks/useSeats';
import { getRecommendedSeats } from '../../domain/rules/seatGuidance';
import { SECTIONS, TOTAL_SEATS } from '../../domain/constants/seating';

interface FloorPlanPageProps {
  serviceId: string;
}

const REQUEST_URL = `${window.location.origin}/requests`;

function useIsLandscape() {
  const [landscape, setLandscape] = useState(
    () => window.innerWidth > window.innerHeight
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

export const FloorPlanPage: React.FC<FloorPlanPageProps> = ({ serviceId }) => {
  const { t } = useTranslation();
  const {
    seatMap,
    availableCount,
    occupiedCount,
    sectionAvailability,
    loading,
    toggling,
    toggleSeat,
  } = useSeats(serviceId);

  const navigate = useNavigate();
  const isLandscape = useIsLandscape();

  const recommendedSeats = useMemo(
    () => getRecommendedSeats(seatMap, 3),
    [seatMap]
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const occupancyPct = Math.round((occupiedCount / TOTAL_SEATS) * 100);

  // Scale-to-fit: measure container vs map natural size
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const recalcScale = useCallback(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map) return;
    // Temporarily reset scale to measure natural size
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
    // Recalc after render and on resize
    recalcScale();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(recalcScale);
    ro.observe(container);
    return () => ro.disconnect();
  }, [recalcScale, sidebarOpen, isLandscape]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[200]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('floorPlanPage.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="bg-primary text-white px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🐟</span>
          <span className="text-white/60 text-sm hidden sm:inline">{t('floorPlanPage.seatAvailability')}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Occupancy stats */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-success inline-block" />
              <span className="font-semibold">{availableCount}</span>
              <span className="text-white/60 hidden sm:inline">{t('seats.free')}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-occupied inline-block" />
              <span className="font-semibold">{occupiedCount}</span>
              <span className="text-white/60 hidden sm:inline">{t('seats.taken')}</span>
            </span>
            <span className={`font-bold ${occupancyPct >= 95 ? 'text-red-300' : occupancyPct >= 80 ? 'text-yellow-300' : 'text-white'}`}>
              {t('floorPlanPage.pctFull', { pct: occupancyPct })}
            </span>
          </div>
          {/* Exit */}
          <button
            onClick={() => navigate('/seats')}
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
          ⚠️ {t('floorPlanPage.nearCapacity', { count: availableCount })}
        </div>
      )}

      {/* Main content: floor plan + sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Floor plan area — map takes all available space, stats/legend float in gutter */}
        <div className="flex-1 overflow-hidden relative">
          {/* Scaled map container — full area with small padding for overlays */}
          <div
            ref={containerRef}
            className={`absolute inset-0 flex items-center justify-center overflow-hidden ${
              isLandscape
                ? 'pl-16 pr-2 py-1'
                : 'pt-9 pb-6 px-2'
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
                seatMap={seatMap}
                canToggle={false}
                toggling={toggling}
                onToggle={toggleSeat}
                recommendedSeats={recommendedSeats}
                simplified
              />
            </div>
          </div>

          {/* Section availability — compact overlay in gutter space */}
          {isLandscape ? (
            /* Landscape: vertical strip on the left */
            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1 bg-white/90 backdrop-blur-sm rounded-xl shadow px-2 py-1.5">
              {SECTIONS.map((section) => (
                <div key={section.name} className="text-center">
                  <div className="text-[9px] font-bold text-primary leading-tight">{t(`floorPlan.${section.name}`)}</div>
                  <div className="text-base font-bold text-success leading-tight">{sectionAvailability[section.name]}</div>
                </div>
              ))}
            </div>
          ) : (
            /* Portrait: horizontal strip across top gutter */
            <div className="absolute top-0 inset-x-0 z-10 flex justify-center gap-4 sm:gap-6 py-1">
              {SECTIONS.map((section) => (
                <div key={section.name} className="text-center">
                  <div className="text-[10px] sm:text-xs font-bold text-primary leading-tight">{t(`floorPlan.${section.name}`)}</div>
                  <div className="text-base sm:text-lg font-bold text-success leading-none">{sectionAvailability[section.name]}</div>
                </div>
              ))}
            </div>
          )}

          {/* Legend — compact overlay in gutter space */}
          {isLandscape ? (
            <div className="absolute right-1.5 bottom-1.5 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow px-2 py-1 flex flex-col gap-0.5 text-[9px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-5 h-1.5 rounded-sm inline-block" style={{ background: 'linear-gradient(to right, rgba(34,197,94,1), rgba(34,197,94,0.5))' }} />
                {t('floorPlanPage.legendSuggested')} → {t('floorPlanPage.legendAvailable')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-blue-300 inline-block" /> {t('floorPlanPage.legendFamily')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-purple-300 inline-block" /> {t('floorPlanPage.legendVolunteer')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-occupied inline-block" /> {t('floorPlanPage.legendTaken')}
              </span>
            </div>
          ) : (
            <div className="absolute bottom-0 inset-x-0 z-10 flex items-center gap-2 sm:gap-4 py-1 text-[9px] sm:text-[10px] text-gray-500 flex-wrap justify-center px-2">
              <span className="flex items-center gap-1">
                <span className="w-6 h-2 sm:w-8 sm:h-2.5 rounded-sm inline-block" style={{ background: 'linear-gradient(to right, rgba(34,197,94,1), rgba(34,197,94,0.5))' }} />
                {t('floorPlanPage.legendSuggested')} → {t('floorPlanPage.legendAvailable')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-blue-300 inline-block" /> {t('floorPlanPage.legendFamily')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-purple-300 inline-block" /> {t('floorPlanPage.legendVolunteer')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-occupied inline-block" /> {t('floorPlanPage.legendTaken')}
              </span>
            </div>
          )}
        </div>

        {/* Sidebar toggle + panel */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="flex-shrink-0 w-6 bg-primary/5 border-l border-gray-200 flex items-center justify-center hover:bg-primary/10 transition-colors"
          aria-label={sidebarOpen ? t('floorPlanPage.collapseSidebar') : t('floorPlanPage.expandSidebar')}
        >
          <span className="text-gray-400 text-xs font-bold">{sidebarOpen ? '▸' : '◂'}</span>
        </button>

        {sidebarOpen && (
          <div className="w-56 flex-shrink-0 bg-primary/5 border-l border-gray-200 flex flex-col items-center justify-center p-4 gap-4 overflow-y-auto">
            {/* Seating guidance card */}
            <div className="bg-white rounded-2xl shadow-lg p-4 w-full">
              <p className="text-sm font-bold text-primary mb-2 flex items-center gap-1.5">
                🪑 {t('floorPlanPage.seatingGuide')}
              </p>
              <div className="space-y-2 text-xs text-gray-600 leading-snug">
                <div className="flex items-start gap-2">
                  <span className="w-3 h-3 rounded-sm bg-success flex-shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: t('floorPlanPage.suggestedExplain') }} />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none mt-[-2px]">♿</span>
                  <span className="text-gray-500">
                    {t('floorPlanPage.accessibilityNote')}
                  </span>
                </div>
              </div>
              {/* Fill direction summary */}
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="font-semibold text-primary w-12">{t('floorPlan.left')}</span>
                  <span>{t('floorPlanPage.fillWallToAisle')}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="font-semibold text-primary w-12">{t('floorPlan.middle')}</span>
                  <span>{t('floorPlanPage.fillCenterOutward')}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="font-semibold text-primary w-12">{t('floorPlan.right')}</span>
                  <span>{t('floorPlanPage.fillWallToAisle')}</span>
                </div>
              </div>
            </div>

            {/* QR Code card */}
            <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col items-center w-full">
              <p className="text-sm font-bold text-primary mb-1 text-center">{t('floorPlanPage.needHelp')}</p>
              <p className="text-xs text-gray-500 mb-3 text-center leading-snug">
                {t('floorPlanPage.qrDescription')}
              </p>
              <div className="bg-white p-2 rounded-xl border-2 border-primary/20">
                <QRCodeSVG
                  value={REQUEST_URL}
                  size={150}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#1B2B5E"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center break-all">{REQUEST_URL}</p>
            </div>

            <p className="text-[10px] text-gray-400 text-center">{t('common.welcomeTeam')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
