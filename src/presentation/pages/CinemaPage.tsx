import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CinemaSeatMap } from '../components/CinemaSeatMap';
import { useSeats } from '../../application/hooks/useSeats';
import { getRecommendedSeats } from '../../domain/rules/seatGuidance';
import { SECTIONS, TOTAL_SEATS } from '../../domain/constants/seating';

interface CinemaPageProps {
  serviceId: string;
}

const REQUEST_URL = `${window.location.origin}/requests`;

export const CinemaPage: React.FC<CinemaPageProps> = ({ serviceId }) => {
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

  const recommendedSeats = useMemo(
    () => getRecommendedSeats(seatMap, 3),
    [seatMap]
  );

  const occupancyPct = Math.round((occupiedCount / TOTAL_SEATS) * 100);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[200]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading floor plan...</p>
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
          <span className="font-bold text-lg">Fish for People</span>
          <span className="text-white/60 text-sm">— Seat Availability</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Occupancy stats — just two numbers */}
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-success inline-block" />
              <span className="font-semibold">{availableCount}</span>
              <span className="text-white/60">free</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-occupied inline-block" />
              <span className="font-semibold">{occupiedCount}</span>
              <span className="text-white/60">taken</span>
            </span>
            <span className={`font-bold ${occupancyPct >= 95 ? 'text-red-300' : occupancyPct >= 80 ? 'text-yellow-300' : 'text-white'}`}>
              {occupancyPct}% full
            </span>
          </div>
          {/* Exit fullscreen */}
          <button
            onClick={() => navigate('/seats')}
            className="bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
            aria-label="Exit sanctuary view"
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {/* Capacity alerts */}
      {occupancyPct >= 95 && (
        <div className="bg-danger text-white text-sm font-bold text-center py-1.5 flex-shrink-0">
          🚨 AT CAPACITY — redirect newcomers to overflow area
        </div>
      )}
      {occupancyPct >= 80 && occupancyPct < 95 && (
        <div className="bg-warning text-white text-sm font-bold text-center py-1.5 flex-shrink-0">
          ⚠️ NEAR CAPACITY — only {availableCount} seats remaining
        </div>
      )}

      {/* Main content: floor plan + sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sanctuary seat map */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
          {/* Section availability bar */}
          <div className="flex gap-6 mb-4">
            {SECTIONS.map((section) => (
              <div key={section.name} className="text-center">
                <div className="text-sm font-bold text-primary">{section.label}</div>
                <div className="text-2xl font-bold text-success">{sectionAvailability[section.name]}</div>
                <div className="text-xs text-gray-400">available</div>
              </div>
            ))}
          </div>

          <CinemaSeatMap
            seatMap={seatMap}
            canToggle={false}
            toggling={toggling}
            onToggle={toggleSeat}
            recommendedSeats={recommendedSeats}
            simplified
          />

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-sm bg-success inline-block" /> Suggested
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-sm bg-success/55 inline-block" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-sm bg-gray-300 inline-block" /> Taken
            </span>
          </div>
        </div>

        {/* Sidebar: guidance + QR */}
        <div className="w-56 flex-shrink-0 bg-primary/5 border-l border-gray-200 flex flex-col items-center justify-center p-4 gap-4 overflow-y-auto">
          {/* Seating guidance card */}
          <div className="bg-white rounded-2xl shadow-lg p-4 w-full">
            <p className="text-sm font-bold text-primary mb-2 flex items-center gap-1.5">
              🪑 Seating Guide
            </p>
            <div className="space-y-2 text-xs text-gray-600 leading-snug">
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 rounded-sm bg-success flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Brighter seats</strong> are suggested — sitting there keeps aisles open for others arriving later.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base leading-none mt-[-2px]">♿</span>
                <span className="text-gray-500">
                  Need an aisle seat? No problem — please sit wherever is most comfortable for you.
                </span>
              </div>
            </div>
            {/* Fill direction summary */}
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="font-semibold text-primary w-12">Left</span>
                <span>Fill from wall → aisle</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="font-semibold text-primary w-12">Middle</span>
                <span>Fill from center → outward</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="font-semibold text-primary w-12">Right</span>
                <span>Fill from wall → aisle</span>
              </div>
            </div>
          </div>

          {/* QR Code card */}
          <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col items-center w-full">
            <p className="text-sm font-bold text-primary mb-1 text-center">Need Help?</p>
            <p className="text-xs text-gray-500 mb-3 text-center leading-snug">
              Scan to request a pen, offering envelope, voiceover device or other assistance
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

          <p className="text-[10px] text-gray-400 text-center">Welcome Team</p>
        </div>
      </div>
    </div>
  );
};
