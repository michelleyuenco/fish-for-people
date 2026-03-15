import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useZonePlan } from '../../application/hooks/useZonePlan';
import { ZoneFloorPlanInput } from '../components/ZoneFloorPlanInput';
import { TOTAL_SEATS } from '../../domain/constants/seating';

export const ZoneInputPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    regionCounts,
    setRegionCount,
    clearAll,
    totalAvailable,
    totalOccupied,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useZonePlan();

  const [confirmingClear, setConfirmingClear] = useState(false);
  const occupancyPct = Math.round((totalOccupied / TOTAL_SEATS) * 100);

  return (
    <div className="space-y-4">
      {/* Header card with controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/seats')}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
            aria-label={t('common.back')}
          >
            ← {t('nav.seats')}
          </button>
          <button
            onClick={() => navigate('/zone-plan')}
            className="btn-primary text-sm px-4 py-2"
          >
            🗺️ {t('zonePlan.openKiosk')}
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">{t('zonePlan.instructions')}</p>

        {/* Toolbar: undo/redo/clear + summary */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 text-sm transition-all disabled:opacity-30 active:scale-90 bg-white hover:bg-gray-50"
            aria-label={t('headcount.undo')}
          >↩</button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 text-sm transition-all disabled:opacity-30 active:scale-90 bg-white hover:bg-gray-50"
            aria-label={t('headcount.redo')}
          >↪</button>
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-danger/20 bg-danger/5 text-danger/70 text-xs font-semibold whitespace-nowrap transition-all active:scale-90 hover:bg-danger/10 hover:text-danger"
          >
            {t('headcount.clearAll')}
          </button>

          <div className="flex-1" />

          {/* Occupancy summary */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" />
              <span className="font-bold text-gray-700">{totalAvailable}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-300 inline-block" />
              <span className="font-bold text-gray-700">{totalOccupied}</span>
            </span>
            <span className={`font-bold ${occupancyPct >= 95 ? 'text-danger' : occupancyPct >= 80 ? 'text-warning' : 'text-gray-500'}`}>
              {occupancyPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Floor plan with zone overlays */}
      <div className="card overflow-x-auto">
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <ZoneFloorPlanInput
            regionCounts={regionCounts}
            onRegionChange={setRegionCount}
          />
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-3">
          {t('zonePlan.tapHint')}
        </p>
      </div>

      {/* Clear confirmation modal */}
      {confirmingClear && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setConfirmingClear(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-gray-700 text-center">{t('zonePlan.confirmClearAll')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="btn-outline flex-1 text-sm"
              >
                {t('headcount.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setConfirmingClear(false);
                }}
                className="flex-1 text-sm font-semibold py-2.5 rounded-lg bg-danger text-white active:scale-95 transition-all"
              >
                {t('headcount.confirmClear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
