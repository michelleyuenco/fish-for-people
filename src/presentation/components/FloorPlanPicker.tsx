import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionName } from '../../domain/models/Seat';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AreaName = 'front' | 'mid' | 'back';

export interface FloorPlanSelection {
  section: SectionName;
  area: AreaName;
  /** Representative row number stored in Firestore (midpoint of the zone) */
  row: number;
  /** Human-readable label shown to Welcome Team, e.g. "Front", "Middle", "Back" */
  areaLabel: string;
}

interface ZoneDef {
  section: SectionName;
  area: AreaName;
  row: number;
}

// ─── Zone Definitions ─────────────────────────────────────────────────────────
// Rows are split into thirds; representative row is the midpoint of each band.
// Left (14 rows), Middle (14 rows), Right (13 rows).
// Front = rows 1-5, Mid = rows 6-10, Back = rows 11-end

const AREA_ROWS: Record<AreaName, number> = {
  front: 3,
  mid: 8,
  back: 12,
};

// i18n keys for sections and areas
const SECTION_I18N: Record<SectionName, string> = {
  left: 'floorPlan.left',
  middle: 'floorPlan.middle',
  right: 'floorPlan.right',
};

const AREA_I18N: Record<AreaName, string> = {
  front: 'floorPlan.front',
  mid: 'floorPlan.mid',
  back: 'floorPlan.back',
};

const SECTIONS: SectionName[] = ['left', 'middle', 'right'];
const AREAS: AreaName[] = ['front', 'mid', 'back'];

const ZONES: ZoneDef[] = AREAS.flatMap((area) =>
  SECTIONS.map((section) => ({
    section,
    area,
    row: AREA_ROWS[area],
  }))
);

function zoneKey(section: SectionName, area: AreaName) {
  return `${section}-${area}`;
}

// ─── FloorPlanPicker ──────────────────────────────────────────────────────────

interface FloorPlanPickerProps {
  value: FloorPlanSelection | null;
  onChange: (selection: FloorPlanSelection) => void;
}

export const FloorPlanPicker: React.FC<FloorPlanPickerProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const selectedKey = value ? zoneKey(value.section, value.area) : null;

  const handleSelect = (zone: ZoneDef) => {
    onChange({
      section: zone.section,
      area: zone.area,
      row: zone.row,
      areaLabel: t('floorPlan.sectionArea', { section: t(SECTION_I18N[zone.section]), area: t(AREA_I18N[zone.area]) }),
    });
  };

  return (
    <div className="space-y-1">
      {/* Stage label */}
      <div className="w-full bg-accent/20 border border-accent/40 text-accent text-[11px] font-semibold text-center py-0.5 rounded-lg">
        {t('floorPlan.stage')}
      </div>

      {/* Section headers — proportional widths matching seat counts */}
      <div className="grid gap-1" style={{ gridTemplateColumns: '3fr 5fr 3fr' }}>
        {SECTIONS.map((sec) => (
          <div
            key={sec}
            className="text-center text-xs font-bold text-primary"
          >
            {t(SECTION_I18N[sec])}
          </div>
        ))}
      </div>

      {/* Zone rows: front → mid → back */}
      <div className="space-y-1">
        {AREAS.map((area) => (
          <div
            key={area}
            className="grid gap-1"
            style={{ gridTemplateColumns: '3fr 5fr 3fr' }}
          >
            {SECTIONS.map((sec) => {
              const zone = ZONES.find((z) => z.section === sec && z.area === area)!;
              const isSelected = selectedKey === zoneKey(sec, area);

              return (
                <button
                  key={zoneKey(sec, area)}
                  type="button"
                  onClick={() => handleSelect(zone)}
                  className={`
                    relative py-2 rounded-xl text-xs font-semibold
                    flex flex-col items-center justify-center gap-0.5
                    transition-all active:scale-95 border-2
                    ${isSelected
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'}
                  `}
                  aria-pressed={isSelected}
                  aria-label={t('floorPlan.sectionArea', { section: t(SECTION_I18N[sec]), area: t(AREA_I18N[area]) })}
                >
                  {isSelected && (
                    <span className="absolute top-0.5 right-1 text-[9px] font-bold opacity-80">✓</span>
                  )}
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                    {t(AREA_I18N[area])}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Entrance label — bottom-left corner */}
      <div className="text-left text-gray-400 text-[11px] font-medium pl-1">
        🚪 {t('floorPlan.entrance')}
      </div>

      {/* Selection summary */}
      {value && (
        <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-1.5">
          <span className="text-primary text-sm">📍</span>
          <span className="text-sm font-semibold text-primary">
            {t('floorPlan.sectionArea', { section: t(SECTION_I18N[value.section]), area: t(AREA_I18N[value.area]) })}
          </span>
        </div>
      )}
    </div>
  );
};
