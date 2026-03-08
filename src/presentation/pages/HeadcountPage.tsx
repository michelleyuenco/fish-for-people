import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHeadcount } from '../../application/hooks/useHeadcount';
import { CountInput } from '../components/CountInput';
import { ZONE_NAMES, type ZoneCounts } from '../../domain/models/Headcount';
import { calculateTotal } from '../../domain/rules/headcountRules';
import { SECTION_TOTALS } from '../../domain/constants/seating';

interface HeadcountPageProps {
  serviceId: string;
}


const EMPTY_COUNTS: ZoneCounts = {
  left: 0,
  middle: 0,
  right: 0,
  production: 0,
  outside: 0,
};


/**
 * Zones with fixed seat capacity (main hall sections).
 * In empty-seat mode, the counter enters vacant seats; we derive occupied count.
 */


// ─── Counter Form ─────────────────────────────────────────────────────────────

/**
 * Capacity mode: for each hall section, user counts empty seats.
 * Occupied people = capacity - emptySeats
 */
interface CapacityAdjustments {
  left: number;
  middle: number;
  right: number;
}

const EMPTY_ADJUSTMENTS: CapacityAdjustments = {
  left: 0,
  middle: 0,
  right: 0,
};

function capacityToPeople(adj: CapacityAdjustments): Pick<ZoneCounts, 'left' | 'middle' | 'right'> {
  return {
    left:   Math.max(0, SECTION_TOTALS.left   - adj.left),
    middle: Math.max(0, SECTION_TOTALS.middle  - adj.middle),
    right:  Math.max(0, SECTION_TOTALS.right   - adj.right),
  };
}

/** One hall-section block in capacity mode — single +/− net adjustment counter */
const CapacityBlock: React.FC<{
  label: string;
  capacity: number;
  net: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}> = ({ label, capacity, net, onChange, disabled }) => {
  const { t } = useTranslation();
  const people = Math.max(0, capacity - net);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const startEditing = () => {
    if (disabled) return;
    setDraft(String(net));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-2.5 pb-2 bg-primary/5 flex items-center justify-between">
        <span className="text-base font-extrabold tracking-wide uppercase text-primary">{label}</span>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{people}</span>
          <span className="text-xs text-gray-400 ml-1">/ {capacity}</span>
        </div>
      </div>
      {/* Formula hint */}
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          {capacity} − {net} {t('headcount.net')} = <strong className="text-primary">{people}</strong> {t('common.people')}
        </p>
      </div>
      {/* +/− stepper — extra large for eyes-free tapping */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          type="button"
          onPointerDown={() => !disabled && net > 0 && onChange(net - 1)}
          disabled={disabled || net <= 0}
          className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-600 text-2xl font-bold flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all select-none touch-none flex-none"
          aria-label={`Decrease net in ${label}`}
        >−</button>
        <div className="flex-1 flex flex-col items-center" onClick={startEditing}>
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
              className="w-20 text-center text-4xl font-bold tabular-nums bg-transparent border-b-2 border-primary outline-none text-primary"
            />
          ) : (
            <span className="text-4xl font-bold text-primary tabular-nums">{net}</span>
          )}
          <span className="text-xs text-gray-400">{t('headcount.net')}</span>
        </div>
        <button
          type="button"
          onPointerDown={() => !disabled && onChange(net + 1)}
          disabled={disabled}
          className="w-28 h-28 rounded-2xl bg-primary text-white text-5xl font-bold flex items-center justify-center active:scale-90 transition-all disabled:opacity-40 select-none touch-none flex-none"
          aria-label={`Increase net in ${label}`}
        >+</button>
      </div>
    </div>
  );
};

const CounterForm: React.FC<{
  onSubmit: (name: string, counts: ZoneCounts) => Promise<{ success: boolean; errors: string[] }>;
  submitting: boolean;
  existingCounterNames: string[];
}> = ({ onSubmit, submitting, existingCounterNames }) => {
  const { t } = useTranslation();
  const COUNTS_KEY = 'fish-for-people:headcount-counts';
  const ADJ_KEY = 'fish-for-people:headcount-adj';
  const MODE_KEY = 'fish-for-people:headcount-mode';

  const [counts, setCounts] = useState<ZoneCounts>(() => {
    try {
      const saved = localStorage.getItem(COUNTS_KEY);
      return saved ? JSON.parse(saved) : { ...EMPTY_COUNTS };
    } catch { return { ...EMPTY_COUNTS }; }
  });
  const [adj, setAdj] = useState<CapacityAdjustments>(() => {
    try {
      const saved = localStorage.getItem(ADJ_KEY);
      return saved ? JSON.parse(saved) : { ...EMPTY_ADJUSTMENTS };
    } catch { return { ...EMPTY_ADJUSTMENTS }; }
  });
  const [submitted, setSubmitted] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [mode, setMode] = useState<'people' | 'capacity'>(() => {
    const saved = localStorage.getItem(MODE_KEY);
    return saved === 'capacity' ? 'capacity' : 'people';
  });
  const [showHelp, setShowHelp] = useState(false);

  // Persist counts, adj, and mode to localStorage
  useEffect(() => { localStorage.setItem(COUNTS_KEY, JSON.stringify(counts)); }, [counts]);
  useEffect(() => { localStorage.setItem(ADJ_KEY, JSON.stringify(adj)); }, [adj]);
  useEffect(() => { localStorage.setItem(MODE_KEY, mode); }, [mode]);

  const handleClearAll = () => {
    setCounts({ ...EMPTY_COUNTS });
    setAdj({ ...EMPTY_ADJUSTMENTS });
  };

  // Auto-generate counter name: YYYY-MM-DD-01, -02, etc.
  const autoName = (() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = existingCounterNames.filter((n) => n.startsWith(today));
    const nextNum = String(todayEntries.length + 1).padStart(2, '0');
    return `${today}-${nextNum}`;
  })();

  // Derive final ZoneCounts depending on mode
  const finalCounts: ZoneCounts = mode === 'capacity'
    ? {
        ...counts,  // production + outside stay as direct people counts
        ...capacityToPeople(adj),
      }
    : counts;

  const total = calculateTotal(finalCounts);

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setReviewing(true);
  };

  const handleConfirmSubmit = async () => {
    const result = await onSubmit(autoName, finalCounts);
    if (result.success) {
      setReviewing(false);
      setSubmitted(true);
    } else {
      setReviewing(false);
      setFormErrors(result.errors);
    }
  };

  if (reviewing) {
    return (
      <div className="card space-y-4">
        <h3 className="font-bold text-primary text-base">{t('headcount.reviewYourCount')}</h3>
        <p className="text-gray-500 text-sm">{t('headcount.doubleCheck')}</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('common.mode')}</span>
            <span className="font-semibold text-gray-800">{mode === 'capacity' ? `🪑 ${t('headcount.capacityMode')}` : `👥 ${t('headcount.peopleMode')}`}</span>
          </div>
          {ZONE_NAMES.map(({ key, label }) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-bold text-gray-800">{finalCounts[key]}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
            <span className="font-bold text-primary">{t('common.total')}</span>
            <span className="font-bold text-primary text-lg">{total}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setReviewing(false)} className="btn-outline flex-1">{t('headcount.editBack')}</button>
          <button type="button" onClick={handleConfirmSubmit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? t('common.submitting') : t('headcount.confirmSubmit')}
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="card space-y-4">
        <div className="text-center py-3">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="font-bold text-primary text-lg">{t('headcount.countSubmitted')}</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('headcount.yourCount')}</p>
          {ZONE_NAMES.map(({ key, label }) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-bold text-gray-800">{finalCounts[key]}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
            <span className="text-primary">{t('common.total')}</span>
            <span className="text-primary text-xl">{total}</span>
          </div>
        </div>
        <button
          onClick={() => {
            setSubmitted(false);
            setCounts({ ...EMPTY_COUNTS });
            setAdj({ ...EMPTY_ADJUSTMENTS });
          }}
          className="btn-outline w-full"
        >
          {t('headcount.submitAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header + mode toggle */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-primary text-base">{t('headcount.enterYourCount')}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-all"
          >
            {showHelp ? `✕ ${t('common.close')}` : `? ${t('common.help')}`}
          </button>
        </div>
      </div>

      {/* Help */}
      {showHelp && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 mb-4 space-y-1.5 text-xs text-gray-600">
          <p className="font-bold text-accent">{t('headcount.howToCount')}</p>
          <p>{t('headcount.helpCountZones')}</p>
          <p>{t('headcount.helpReviewTotals')}</p>
          <p>{t('headcount.helpShowPhone')}</p>
        </div>
      )}

      {/* Mode toggle — prominent */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setMode('people')}
          className={`flex-1 py-3 text-sm font-semibold flex flex-col items-center gap-0.5 transition-all ${
            mode === 'people' ? 'bg-primary text-white' : 'bg-white text-gray-500'
          }`}
        >
          <span className="text-lg">👥</span>
          <span>{t('headcount.peopleMode')}</span>
          <span className={`text-[10px] ${mode === 'people' ? 'text-white/70' : 'text-gray-400'}`}>{t('headcount.countEachPerson')}</span>
        </button>
        <div className="w-px bg-gray-200" />
        <button
          type="button"
          onClick={() => setMode('capacity')}
          className={`flex-1 py-3 text-sm font-semibold flex flex-col items-center gap-0.5 transition-all ${
            mode === 'capacity' ? 'bg-primary text-white' : 'bg-white text-gray-500'
          }`}
        >
          <span className="text-lg">🪑</span>
          <span>{t('headcount.capacityMode')}</span>
          <span className={`text-[10px] ${mode === 'capacity' ? 'text-white/70' : 'text-gray-400'}`}>{t('headcount.countEmptySeats')}</span>
        </button>
      </div>

      <form onSubmit={handleReview} className="space-y-4">
        {/* ── PEOPLE MODE ── */}
        {mode === 'people' && (
          <>
            <div className="space-y-2">
              {(['left', 'middle', 'right', 'production', 'outside'] as const).map((key) => {
                const zoneInfo = ZONE_NAMES.find((z) => z.key === key)!;
                const accent = key === 'left' ? 'blue' : key === 'middle' ? 'emerald' : key === 'right' ? 'violet' : key === 'production' ? 'amber' : 'slate';
                return (
                  <CountInput
                    key={key}
                    label={zoneInfo.label}
                    value={counts[key]}
                    onChange={(val) => setCounts((c) => ({ ...c, [key]: val }))}
                    disabled={submitting}
                    colorAccent={accent}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* ── CAPACITY MODE ── */}
        {mode === 'capacity' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-700 space-y-0.5">
              <p className="font-bold">{t('headcount.howCapacityWorks')}</p>
              <p dangerouslySetInnerHTML={{ __html: t('headcount.capacityInstruction') }} />
              <p className="text-blue-500" dangerouslySetInnerHTML={{ __html: t('headcount.capacityFormula') }} />
            </div>

            <div className="space-y-3">
              {(['left', 'middle', 'right'] as const).map((key) => {
                const zoneInfo = ZONE_NAMES.find((z) => z.key === key)!;
                return (
                  <CapacityBlock
                    key={key}
                    label={zoneInfo.label}
                    capacity={SECTION_TOTALS[key]}
                    net={adj[key]}
                    onChange={(v) => setAdj((a) => ({ ...a, [key]: v }))}
                    disabled={submitting}
                  />
                );
              })}
            </div>

            {/* Production + Outside still as direct count */}
            <p className="text-xs text-gray-400 text-center">{t('headcount.prodOutsideDirect')}</p>
            <div className="space-y-2">
              {(['production', 'outside'] as const).map((key) => {
                const zoneInfo = ZONE_NAMES.find((z) => z.key === key)!;
                return (
                  <CountInput
                    key={key}
                    label={zoneInfo.label}
                    value={counts[key]}
                    onChange={(val) => setCounts((c) => ({ ...c, [key]: val }))}
                    disabled={submitting}
                    colorAccent={key === 'production' ? 'amber' : 'slate'}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Total */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary/10 rounded-xl">
          <div>
            <span className="font-semibold text-primary text-sm">{t('common.total')}</span>
            {mode === 'capacity' && (
              <span className="block text-[10px] text-primary/60">{t('headcount.calculatedFromCapacity')}</span>
            )}
          </div>
          <span className="font-bold text-primary text-xl">{total}</span>
        </div>

        {/* Errors */}
        {formErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl space-y-1">
            {formErrors.map((e, i) => <p key={i}>⚠ {e}</p>)}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {t('headcount.reviewCount')}
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={submitting}
          className="w-full text-xs font-semibold py-2 text-gray-400 hover:text-danger transition-all"
        >
          {t('headcount.clearAll')}
        </button>
      </form>
    </div>
  );
};

// ─── History Panel ────────────────────────────────────────────────────────────
const HistoryPanel: React.FC<{
  confirmedCounts: ReturnType<typeof useHeadcount>['confirmedCounts'];
}> = ({ confirmedCounts }) => {
  const { t } = useTranslation();
  if (confirmedCounts.length === 0) return null;

  const totals = confirmedCounts
    .map((e) => (e.totals ? calculateTotal(e.totals) : null))
    .filter((t): t is number => t !== null);
  const average = totals.length > 0 ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : null;
  const highestTotal = totals.length > 0 ? Math.max(...totals) : null;

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-primary text-base">{t('headcount.recentServices')}</h3>

      {/* Stats summary */}
      {totals.length >= 2 && (
        <div className="card bg-primary/5 border-primary/20">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{totals.length}</div>
              <div className="text-xs text-gray-500">{t('headcount.services')}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{average}</div>
              <div className="text-xs text-gray-500">{t('headcount.avgAttendance')}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{highestTotal}</div>
              <div className="text-xs text-gray-500">{t('headcount.recordHigh')}</div>
            </div>
          </div>
        </div>
      )}

      {confirmedCounts.map((entry, idx) => {
        const currentTotal = entry.totals ? calculateTotal(entry.totals) : null;
        const prevEntry = confirmedCounts[idx + 1];
        const prevTotal = prevEntry?.totals ? calculateTotal(prevEntry.totals) : null;
        const diff = currentTotal !== null && prevTotal !== null ? currentTotal - prevTotal : null;
        const trendIcon = diff === null ? null : diff > 0 ? '▲' : diff < 0 ? '▼' : '→';
        const trendColor = diff === null ? '' : diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : 'text-gray-400';

        return (
          <div key={entry.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-sm text-gray-800">{entry.date}</div>
                <div className="text-xs text-gray-400">
                  {entry.confirmedAt
                    ? new Date(entry.confirmedAt).toLocaleTimeString('en-HK', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
              <div className="text-right flex items-baseline gap-2">
                {trendIcon && (
                  <span className={`text-sm font-bold ${trendColor}`}>
                    {trendIcon} {Math.abs(diff!)}
                  </span>
                )}
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {currentTotal ?? '—'}
                  </div>
                  <div className="text-xs text-gray-400">{t('common.confirmed')}</div>
                </div>
              </div>
            </div>
            {entry.totals && (
              <div className="grid grid-cols-5 gap-1 text-center">
                {ZONE_NAMES.map(({ key, label }) => (
                  <div key={key} className="bg-gray-50 rounded-lg py-1">
                    <div className="text-xs font-bold text-gray-700">{entry.totals![key]}</div>
                    <div className="text-[9px] text-gray-400">{label.slice(0, 4)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const HeadcountPage: React.FC<HeadcountPageProps> = ({ serviceId }) => {
  const {
    confirmedCounts,
    counterNames,
    submitting,
    submitHeadcount,
  } = useHeadcount(serviceId);

  return (
    <div className="space-y-4">
      <CounterForm
        onSubmit={submitHeadcount}
        submitting={submitting}
        existingCounterNames={counterNames}
      />

      {/* History */}
      <HistoryPanel confirmedCounts={confirmedCounts} />
    </div>
  );
};
