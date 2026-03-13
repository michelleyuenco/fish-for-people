import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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

// Decorative seat row dots for visual clarity
const SeatRows: React.FC<{ count: number }> = ({ count }) => (
  <div className="flex flex-col gap-[3px] items-center py-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex gap-[2px]">
        {Array.from({ length: 3 }).map((_, j) => (
          <div key={j} className="w-[3px] h-[3px] rounded-full bg-current opacity-25" />
        ))}
      </div>
    ))}
  </div>
);

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
    <motion.div
      className="space-y-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Floor plan container — styled to look like an architectural diagram */}
      <div className="relative border-2 border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">
        {/* Stage — wide bar at the top */}
        <div className="relative bg-accent/15 border-b-2 border-accent/30 py-2.5 text-center">
          <span className="text-accent font-bold text-xs tracking-widest uppercase">
            {t('floorPlan.stage')}
          </span>
          {/* Stage platform indicator */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-[3px] bg-accent/40 rounded-t-full" />
        </div>

        {/* Section headers */}
        <div className="grid px-1 pt-2 pb-1" style={{ gridTemplateColumns: '3fr 2px 5fr 2px 3fr' }}>
          <div className="text-center text-[10px] font-bold text-primary/60 uppercase tracking-wider">
            {t(SECTION_I18N.left)}
          </div>
          <div />
          <div className="text-center text-[10px] font-bold text-primary/60 uppercase tracking-wider">
            {t(SECTION_I18N.middle)}
          </div>
          <div />
          <div className="text-center text-[10px] font-bold text-primary/60 uppercase tracking-wider">
            {t(SECTION_I18N.right)}
          </div>
        </div>

        {/* Seating zones — with aisle dividers */}
        <div className="px-1 pb-1">
          {AREAS.map((area, areaIdx) => (
            <motion.div
              key={area}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: areaIdx * 0.06, ease: 'easeOut' }}
            >
              <div
                className="grid"
                style={{ gridTemplateColumns: '3fr 2px 5fr 2px 3fr' }}
              >
                {SECTIONS.map((sec, secIdx) => {
                  const zone = ZONES.find((z) => z.section === sec && z.area === area)!;
                  const isSelected = selectedKey === zoneKey(sec, area);

                  return (
                    <React.Fragment key={zoneKey(sec, area)}>
                      {/* Aisle divider before middle and right sections */}
                      {secIdx > 0 && (
                        <div className="flex items-stretch justify-center">
                          <div className="w-[2px] bg-gray-200 my-0.5 rounded-full" />
                        </div>
                      )}
                      <motion.button
                        type="button"
                        onClick={() => handleSelect(zone)}
                        whileTap={{ scale: 0.93 }}
                        animate={isSelected
                          ? { backgroundColor: '#1B2B5E', scale: 1.02 }
                          : { backgroundColor: 'transparent', scale: 1 }
                        }
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`
                          relative py-2.5 mx-0.5 my-0.5 rounded-lg
                          flex flex-col items-center justify-center gap-0
                          ${isSelected
                            ? 'text-white shadow-lg ring-2 ring-primary/30'
                            : 'text-gray-500 hover:bg-gray-100'}
                        `}
                        aria-pressed={isSelected}
                        aria-label={t('floorPlan.sectionArea', { section: t(SECTION_I18N[sec]), area: t(AREA_I18N[area]) })}
                      >
                        {/* Decorative seat dots */}
                        <SeatRows count={area === 'front' ? 2 : area === 'mid' ? 3 : 2} />
                        {/* Area label */}
                        <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          {t(AREA_I18N[area])}
                        </span>
                        {/* Selection check */}
                        {isSelected && (
                          <motion.span
                            className="absolute top-1 right-1.5 text-[10px] font-bold"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </motion.button>
                    </React.Fragment>
                  );
                })}
              </div>
              {/* Row separator between areas (not after last) */}
              {areaIdx < AREAS.length - 1 && (
                <div className="mx-3 border-t border-dashed border-gray-200" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Entrance — bottom of the diagram */}
        <div className="relative border-t-2 border-gray-200 py-1.5 text-center bg-white/60">
          <span className="text-gray-400 text-[10px] font-semibold tracking-wide">
            🚪 {t('floorPlan.entrance')}
          </span>
        </div>
      </div>

      {/* Selection summary */}
      {value && (
        <motion.div
          className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-1.5 mt-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span className="text-primary text-sm">📍</span>
          <span className="text-sm font-semibold text-primary">
            {t('floorPlan.sectionArea', { section: t(SECTION_I18N[value.section]), area: t(AREA_I18N[value.area]) })}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
