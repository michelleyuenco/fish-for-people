import React, { useState, useEffect } from 'react';
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
  const people = Math.max(0, capacity - net);
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
          {capacity} − {net} net = <strong className="text-primary">{people}</strong> people
        </p>
      </div>
      {/* +/− stepper — extra large for eyes-free tapping */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          type="button"
          onPointerDown={() => !disabled && net > 0 && onChange(net - 1)}
          disabled={disabled || net <= 0}
          className="w-20 h-24 rounded-2xl bg-gray-100 text-gray-600 text-4xl font-bold flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all select-none touch-none flex-none"
          aria-label={`Decrease net in ${label}`}
        >−</button>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-4xl font-bold text-primary tabular-nums">{net}</span>
          <span className="text-xs text-gray-400">net</span>
        </div>
        <button
          type="button"
          onPointerDown={() => !disabled && onChange(net + 1)}
          disabled={disabled}
          className="w-20 h-24 rounded-2xl bg-primary text-white text-4xl font-bold flex items-center justify-center active:scale-90 transition-all disabled:opacity-40 select-none touch-none flex-none"
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
        <h3 className="font-bold text-primary text-base">Review Your Count</h3>
        <p className="text-gray-500 text-sm">Double-check before submitting.</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Counter</span>
            <span className="font-semibold text-gray-800">{autoName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Mode</span>
            <span className="font-semibold text-gray-800">{mode === 'capacity' ? '🪑 Capacity mode' : '👥 People mode'}</span>
          </div>
          {ZONE_NAMES.map(({ key, label }) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-bold text-gray-800">{finalCounts[key]}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
            <span className="font-bold text-primary">Total</span>
            <span className="font-bold text-primary text-lg">{total}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setReviewing(false)} className="btn-outline flex-1">← Edit</button>
          <button type="button" onClick={handleConfirmSubmit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Confirm & Submit ✓'}
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
          <h3 className="font-bold text-primary text-lg">Count Submitted!</h3>
          <p className="text-gray-500 text-sm mt-1">Counter: <strong>{autoName}</strong></p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Count</p>
          {ZONE_NAMES.map(({ key, label }) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-bold text-gray-800">{finalCounts[key]}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
            <span className="text-primary">Total</span>
            <span className="text-primary text-xl">{total}</span>
          </div>
        </div>
        <p className="text-xs text-center text-gray-400">Waiting for the second counter to submit...</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setCounts({ ...EMPTY_COUNTS });
            setAdj({ ...EMPTY_ADJUSTMENTS });
          }}
          className="btn-outline w-full"
        >
          Submit Again (correction)
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header + mode toggle */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-primary text-base">Enter Your Count</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-all"
          >
            {showHelp ? '✕ Close' : '? Help'}
          </button>
        </div>
      </div>

      {/* Help */}
      {showHelp && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 mb-4 space-y-1.5 text-xs text-gray-600">
          <p className="font-bold text-accent">Two-counter system:</p>
          <p>🔢 Two team members count independently to catch mistakes.</p>
          <p>📊 After both submit, the app compares counts zone by zone.</p>
          <p>✅ If counts match, the coordinator confirms the total.</p>
          <p>⚠️ If they differ, both counters recount the flagged zones.</p>
          <p className="text-gray-400 mt-1">Use a different name from the other counter.</p>
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
          <span>People Mode</span>
          <span className={`text-[10px] ${mode === 'people' ? 'text-white/70' : 'text-gray-400'}`}>Count each person</span>
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
          <span>Capacity Mode</span>
          <span className={`text-[10px] ${mode === 'capacity' ? 'text-white/70' : 'text-gray-400'}`}>Count empty seats</span>
        </button>
      </div>

      <form onSubmit={handleReview} className="space-y-4">
        {/* Auto-assigned counter ID */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
          <span className="text-xs text-gray-500">Counter ID</span>
          <span className="text-sm font-bold text-primary">{autoName}</span>
        </div>

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
              <p className="font-bold">How capacity mode works:</p>
              <p>Tap <strong>+</strong> each time you spot an empty seat. We subtract the net from capacity to get the people count.</p>
              <p className="text-blue-500">Formula: <em>capacity − net = people</em></p>
            </div>

            <div className="space-y-3">
              {(['left', 'middle', 'right'] as const).map((key) => {
                const labels: Record<string, string> = { left: 'Left', middle: 'Middle', right: 'Right' };
                return (
                  <CapacityBlock
                    key={key}
                    label={labels[key]}
                    capacity={SECTION_TOTALS[key]}
                    net={adj[key]}
                    onChange={(v) => setAdj((a) => ({ ...a, [key]: v }))}
                    disabled={submitting}
                  />
                );
              })}
            </div>

            {/* Production + Outside still as direct count */}
            <p className="text-xs text-gray-400 text-center">Production Room &amp; Outside: count directly</p>
            <div className="grid grid-cols-2 gap-3">
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
            <span className="font-semibold text-primary text-sm">Total</span>
            {mode === 'capacity' && (
              <span className="block text-[10px] text-primary/60">calculated from capacity</span>
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
          Review Count →
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={submitting}
          className="w-full text-xs font-semibold py-2 text-gray-400 hover:text-danger transition-all"
        >
          Clear All / Reset to Zero
        </button>
      </form>
    </div>
  );
};

// ─── Comparison Panel ─────────────────────────────────────────────────────────
const ComparisonPanel: React.FC<{
  counterA: ReturnType<typeof useHeadcount>['counterA'];
  counterB: ReturnType<typeof useHeadcount>['counterB'];
  discrepancies: ReturnType<typeof useHeadcount>['discrepancies'];
  canConfirm: boolean;
  confirming: boolean;
  onConfirm: () => void;
}> = ({ counterA, counterB, discrepancies, canConfirm, confirming, onConfirm }) => {
  const [serviceNote, setServiceNote] = useState('');

  if (!counterA && !counterB) {
    return (
      <div className="card text-center py-8">
        <div className="text-3xl mb-2">🔢</div>
        <p className="text-gray-500 text-sm">Waiting for counters to submit...</p>
      </div>
    );
  }

  const discrepancyZones = new Set(discrepancies.map((d) => d.zone));

  return (
    <div className="card space-y-4">
      <h3 className="font-bold text-primary text-base">Comparison</h3>

      {/* Header */}
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 text-center">
        <div>Zone</div>
        <div>{counterA?.counterName || '—'}</div>
        <div>{counterB?.counterName || '—'}</div>
      </div>

      {/* Zone rows */}
      {ZONE_NAMES.map(({ key, label }) => {
        const hasDisc = discrepancyZones.has(key);
        const valA = counterA ? counterA.counts[key] : 0;
        const valB = counterB ? counterB.counts[key] : 0;
        const maxVal = Math.max(valA, valB, 1);
        const pctA = Math.round((valA / maxVal) * 100);
        const pctB = Math.round((valB / maxVal) * 100);
        return (
          <div
            key={key}
            className={`py-2.5 px-3 rounded-xl ${
              hasDisc ? 'bg-warning/10 border border-warning' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className={`text-xs font-semibold ${hasDisc ? 'text-warning' : 'text-gray-600'}`}>
                {label}{hasDisc && <span className="ml-1">⚠</span>}
              </div>
              <div className="flex gap-3 text-xs font-bold">
                <span className={hasDisc ? 'text-warning' : 'text-gray-700'}>{counterA ? valA : '—'}</span>
                <span className="text-gray-300">vs</span>
                <span className={hasDisc ? 'text-warning' : 'text-gray-700'}>{counterB ? valB : '—'}</span>
              </div>
            </div>
            {/* Bar visualization */}
            {counterA && counterB && (
              <div className="space-y-0.5">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${hasDisc ? 'bg-warning' : 'bg-primary'}`}
                    style={{ width: `${pctA}%` }}
                  />
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${hasDisc ? 'bg-warning/60' : 'bg-primary/50'}`}
                    style={{ width: `${pctB}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-primary/10 text-center">
        <div className="text-sm font-bold text-primary text-left">Total</div>
        <div className="font-bold text-primary text-base">{counterA?.total ?? '—'}</div>
        <div className="font-bold text-primary text-base">{counterB?.total ?? '—'}</div>
      </div>

      {/* Discrepancy message + next steps */}
      {discrepancies.length > 0 && (
        <div className="bg-warning/10 border border-warning rounded-xl p-4 space-y-2">
          <p className="text-warning font-bold text-sm">
            ⚠ {discrepancies.length} zone{discrepancies.length > 1 ? 's' : ''} have significant discrepancy
          </p>
          <div className="space-y-1.5 text-xs text-gray-700">
            <p className="font-semibold text-gray-600">What to do next:</p>
            <p>1️⃣ Tell both counters which zones are flagged</p>
            <p>2️⃣ Both counters recount those zones only</p>
            <p>3️⃣ Re-submit using the same names</p>
            <p>4️⃣ If counts still differ, use the average</p>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {discrepancies.map((d) => {
              const zoneConfig = ZONE_NAMES.find((z) => z.key === d.zone);
              return (
                <span key={d.zone} className="text-xs bg-warning text-white px-2 py-0.5 rounded-full font-bold">
                  {zoneConfig?.label ?? d.zone} (Δ{d.diff})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Service note */}
      {canConfirm && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            📝 Service Note <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={serviceNote}
            onChange={(e) => setServiceNote(e.target.value)}
            placeholder="e.g. Special offering, Overflow used, Guest speaker..."
            className="input-field text-sm"
          />
        </div>
      )}

      {/* Action buttons */}
      {counterA && counterB && (
        <div className="space-y-2">
          <button
            onClick={onConfirm}
            disabled={!canConfirm || confirming}
            className="btn-primary w-full"
          >
            {confirming ? 'Confirming...' : canConfirm ? '✓ Confirm Attendance' : 'Resolve Discrepancies First'}
          </button>
          {canConfirm && (
            <button
              type="button"
              onClick={() => {
                const totalA = counterA.total;
                const totalB = counterB.total;
                const avg = Math.round((totalA + totalB) / 2);
                const lines = [
                  `📊 Attendance Summary — ${new Date().toLocaleDateString('en-HK')}`,
                  `Counter A (${counterA.counterName}): ${totalA}`,
                  `Counter B (${counterB.counterName}): ${totalB}`,
                  `Average: ${avg}`,
                ];
                ZONE_NAMES.forEach(({ key, label }) => {
                  const a = counterA.counts[key];
                  const b = counterB.counts[key];
                  lines.push(`  ${label}: ${Math.round((a + b) / 2)}`);
                });
                navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
              }}
              className="btn-outline w-full text-sm"
            >
              📋 Copy Summary to Share
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── History Panel ────────────────────────────────────────────────────────────
const HistoryPanel: React.FC<{
  confirmedCounts: ReturnType<typeof useHeadcount>['confirmedCounts'];
}> = ({ confirmedCounts }) => {
  if (confirmedCounts.length === 0) return null;

  const totals = confirmedCounts
    .map((e) => (e.totals ? calculateTotal(e.totals) : null))
    .filter((t): t is number => t !== null);
  const average = totals.length > 0 ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : null;
  const highestTotal = totals.length > 0 ? Math.max(...totals) : null;

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-primary text-base">Recent Services</h3>

      {/* Stats summary */}
      {totals.length >= 2 && (
        <div className="card bg-primary/5 border-primary/20">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{totals.length}</div>
              <div className="text-xs text-gray-500">Services</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{average}</div>
              <div className="text-xs text-gray-500">Avg Attendance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{highestTotal}</div>
              <div className="text-xs text-gray-500">Record High</div>
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
                  <div className="text-xs text-gray-400">confirmed</div>
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
    counterA,
    counterB,
    counterNames,
    discrepancies,
    canConfirm,
    submitting,
    confirming,
    submitHeadcount,
    confirmHeadcount,
  } = useHeadcount(serviceId);

  const [activeTab, setActiveTab] = useState<'count' | 'compare'>('count');

  const handleConfirm = () => {
    if (counterA && counterB) {
      confirmHeadcount(counterA, counterB);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {(['count', 'compare'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
            }`}
          >
            {tab === 'count' ? '📝 Enter Count' : `📊 Compare${discrepancies.length > 0 ? ' ⚠' : ''}`}
          </button>
        ))}
      </div>

      {activeTab === 'count' ? (
        <CounterForm
          onSubmit={submitHeadcount}
          submitting={submitting}
          existingCounterNames={counterNames}
        />
      ) : (
        <ComparisonPanel
          counterA={counterA}
          counterB={counterB}
          discrepancies={discrepancies}
          canConfirm={canConfirm}
          confirming={confirming}
          onConfirm={handleConfirm}
        />
      )}

      {/* History */}
      <HistoryPanel confirmedCounts={confirmedCounts} />
    </div>
  );
};
