import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useHeadcount } from '../../application/hooks/useHeadcount';
import { useSession } from '../../application/hooks/useSession';
import { useFullDaySummary } from '../../application/hooks/useFullDaySummary';
import { CountInput } from '../components/CountInput';
import { ZONE_KEYS, type ZoneCounts } from '../../domain/models/Headcount';
import { calculateTotal } from '../../domain/rules/headcountRules';
import { SECTION_TOTALS } from '../../domain/constants/seating';
import { useHandedness } from '../../application/hooks/useHandedness';
import { STORAGE_KEYS } from '../../domain/constants/storageKeys';
import { SESSION_NAMES, type SessionName } from '../../domain/constants/sessions';
import { formatSessionTimeRange, isLastSession } from '../../domain/rules/sessionRules';

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

// ─── Counter Label ───────────────────────────────────────────────────────────

function getOrAssignCounterLabel(existingLabels: string[]): string {
  const stored = localStorage.getItem(STORAGE_KEYS.HEADCOUNT_COUNTER_LABEL);
  if (stored) return stored;

  const candidates = ['Counter A', 'Counter B', 'Counter C'];
  const label = candidates.find((c) => !existingLabels.includes(c)) ?? `Counter ${String.fromCharCode(65 + existingLabels.length)}`;
  localStorage.setItem(STORAGE_KEYS.HEADCOUNT_COUNTER_LABEL, label);
  return label;
}

// ─── Capacity helpers ────────────────────────────────────────────────────────

interface CapacityAdjustments {
  left: number;
  middle: number;
  right: number;
}

const EMPTY_ADJUSTMENTS: CapacityAdjustments = { left: 0, middle: 0, right: 0 };

function capacityToPeople(adj: CapacityAdjustments): Pick<ZoneCounts, 'left' | 'middle' | 'right'> {
  return {
    left:   Math.max(0, SECTION_TOTALS.left   - adj.left),
    middle: Math.max(0, SECTION_TOTALS.middle  - adj.middle),
    right:  Math.max(0, SECTION_TOTALS.right   - adj.right),
  };
}

// ─── Session Tab Bar ─────────────────────────────────────────────────────────

const SessionTabBar: React.FC<{
  selected: SessionName;
  onSelect: (s: SessionName) => void;
  isActive: (s: SessionName) => boolean;
  isLocked: (s: SessionName) => boolean;
  isBeforeStart: (s: SessionName) => boolean;
  isConfirmed: (s: SessionName) => boolean;
}> = ({ selected, onSelect, isActive, isLocked, isBeforeStart, isConfirmed }) => {
  const { t } = useTranslation();

  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
      {SESSION_NAMES.map((name) => {
        const active = isActive(name);
        const locked = isLocked(name);
        const confirmed = isConfirmed(name);
        const before = isBeforeStart(name);
        const isSel = name === selected;

        let statusIcon = '';
        let statusColor = 'text-gray-400';
        if (confirmed) { statusIcon = '✓'; statusColor = 'text-success'; }
        else if (locked) { statusIcon = '⏳'; statusColor = 'text-amber-500'; }
        else if (active) { statusIcon = '●'; statusColor = 'text-primary'; }
        else if (before) { statusIcon = '○'; statusColor = 'text-gray-300'; }

        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            className={`
              flex-1 py-2.5 px-1 text-center text-xs font-semibold transition-all relative
              ${isSel ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}
              ${name !== 'morning' ? 'border-l border-gray-200' : ''}
            `}
          >
            <div className="flex items-center justify-center gap-1">
              <span className={isSel ? 'text-white' : statusColor}>{statusIcon}</span>
              <span>{t(`sessions.${name}`)}</span>
            </div>
            <div className={`text-[10px] mt-0.5 ${isSel ? 'text-white/70' : 'text-gray-400'}`}>
              {formatSessionTimeRange(name)}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ─── Capacity Block ──────────────────────────────────────────────────────────

const CapacityBlock: React.FC<{
  label: string;
  capacity: number;
  net: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}> = ({ label, capacity, net, onChange, disabled }) => {
  const { t } = useTranslation();
  const isLeftHanded = useHandedness();
  const people = Math.max(0, capacity - net);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setDraft(String(net));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
  };

  const decrement = () => { if (!disabled && net > 0) onChange(net - 1); };
  const handleCardClick = () => { if (disabled || editing) return; onChange(net + 1); };

  const minusSide = isLeftHanded ? 'order-last' : 'order-first';
  const mainSide = isLeftHanded ? 'order-first' : 'order-last';

  return (
    <div
      className={`rounded-xl overflow-hidden select-none bg-primary flex
        ${!disabled && !editing ? 'cursor-pointer active:bg-primary/90 active:scale-[0.98] transition-all' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${label}: ${net} ${t('headcount.net')}. ${t('common.tapToAdd')}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
    >
      <div className={`flex flex-col items-center justify-between py-3 px-2 gap-2 ${minusSide}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={startEditing} disabled={disabled} aria-label={t('common.tapToEdit')}
          className="w-10 h-10 rounded-lg bg-white/20 text-white/70 text-[10px] font-semibold flex items-center justify-center active:scale-90 transition-all touch-none"
        >{t('common.edit')}</button>
        <button type="button" onClick={decrement} disabled={disabled || net <= 0} aria-label={`Decrease net in ${label}`}
          className="w-10 h-10 rounded-lg bg-white text-primary ring-1 ring-primary/30 text-xl font-bold flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all touch-none"
        >−</button>
      </div>
      <div className={`flex-1 flex flex-col items-center justify-center py-3 px-3 ${mainSide}`}>
        <span className="text-sm font-extrabold tracking-wide uppercase text-white/90 mb-0.5">{label}</span>
        {editing ? (
          <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <input ref={inputRef} type="number" inputMode="numeric" value={draft}
              onChange={(e) => setDraft(e.target.value)} onBlur={commitEdit}
              onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
              className="w-24 text-center text-5xl font-bold tabular-nums bg-transparent border-b-2 border-white/50 outline-none text-white"
            />
            <span className="text-xs text-white/60 mt-1">{t('headcount.net')}</span>
          </div>
        ) : (
          <>
            <span className="text-5xl font-bold text-white tabular-nums">{net}</span>
            <span className="text-xs text-white/60">{t('headcount.net')}</span>
            <div className="text-[10px] text-white/40 mt-0.5">
              {capacity} − {net} = <strong className="text-white/60">{people}</strong> {t('common.people')}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Zone-by-Zone Confirmation Panel ─────────────────────────────────────────

const ConfirmationPanel: React.FC<{
  entries: ReturnType<typeof useHeadcount>['entries'];
  counterNames: string[];
  myLabel: string;
  onConfirm: (totals: ZoneCounts) => void;
  confirming: boolean;
}> = ({ entries, counterNames, myLabel, onConfirm, confirming }) => {
  const { t } = useTranslation();

  // For each zone, pick which counter's number to use
  const [picked, setPicked] = useState<Record<string, Record<string, string>>>(() => {
    // Default: pick the higher count per zone
    const init: Record<string, string> = {};
    for (const zone of ZONE_KEYS) {
      let bestLabel = counterNames[0] || myLabel;
      let bestVal = -1;
      for (const name of counterNames) {
        const entry = entries.find((e) => e.counterName === name);
        const val = entry ? entry.counts[zone] : 0;
        if (val > bestVal) { bestVal = val; bestLabel = name; }
      }
      init[zone] = bestLabel;
    }
    return { default: init };
  });

  const selections = picked.default || {};

  const getOfficialTotals = (): ZoneCounts => {
    const totals: ZoneCounts = { ...EMPTY_COUNTS };
    for (const zone of ZONE_KEYS) {
      const pickedName = selections[zone];
      const entry = entries.find((e) => e.counterName === pickedName);
      totals[zone] = entry ? entry.counts[zone] : 0;
    }
    return totals;
  };

  const officialTotal = calculateTotal(getOfficialTotals());

  const handlePick = (zone: string, counterName: string) => {
    setPicked((prev) => ({
      ...prev,
      default: { ...prev.default, [zone]: counterName },
    }));
  };

  if (counterNames.length <= 1) {
    // Single counter — simplified confirmation
    const singleEntry = entries[0];
    const totals = singleEntry ? singleEntry.counts : { ...EMPTY_COUNTS };
    const total = calculateTotal(totals);
    return (
      <div className="card space-y-3">
        <h3 className="font-bold text-primary text-base">{t('headcount.confirmSession')}</h3>
        <p className="text-xs text-gray-500">{t('headcount.singleCounterConfirm')}</p>
        <div className="bg-gray-50 rounded-xl p-3 space-y-1">
          {ZONE_KEYS.map((zone) => (
            <div key={zone} className="flex justify-between text-sm">
              <span className="text-gray-500">{t(`zones.${zone}`)}</span>
              <span className="font-bold">{totals[zone]}</span>
            </div>
          ))}
          <div className="border-t pt-1 flex justify-between text-sm font-bold text-primary">
            <span>{t('common.total')}</span>
            <span className="text-lg">{total}</span>
          </div>
        </div>
        <button
          type="button"
          disabled={confirming}
          onClick={() => onConfirm(totals)}
          className="btn-primary w-full"
        >
          {confirming ? '...' : `${t('headcount.confirmSession')} ✓`}
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-bold text-primary text-base">{t('headcount.confirmSession')}</h3>
      <p className="text-xs text-gray-500">{t('headcount.pickPerZone')}</p>

      <div className="space-y-2">
        {ZONE_KEYS.map((zone) => (
          <div key={zone} className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs font-bold text-gray-600 mb-2">{t(`zones.${zone}`)}</div>
            <div className="flex gap-2 flex-wrap">
              {counterNames.map((name) => {
                const entry = entries.find((e) => e.counterName === name);
                const val = entry ? entry.counts[zone] : 0;
                const isPicked = selections[zone] === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handlePick(zone, name)}
                    className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg text-center transition-all
                      ${isPicked
                        ? 'bg-primary text-white ring-2 ring-primary/30'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-primary/30'}`}
                  >
                    <div className="text-[10px] opacity-70">{name}</div>
                    <div className="text-lg font-bold tabular-nums">{val}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-xl">
        <span className="text-xs font-semibold text-primary/70 uppercase tracking-wide shrink-0">{t('headcount.officialTotal')}</span>
        <span className="flex-1 text-right text-3xl font-extrabold text-primary tabular-nums">{officialTotal}</span>
      </div>

      <button
        type="button"
        disabled={confirming}
        onClick={() => onConfirm(getOfficialTotals())}
        className="btn-primary w-full"
      >
        {confirming ? '...' : `${t('headcount.confirmSession')} ✓`}
      </button>
    </div>
  );
};

// ─── Live Other Counters Bar ─────────────────────────────────────────────────

const OtherCountersBar: React.FC<{
  entries: ReturnType<typeof useHeadcount>['entries'];
  myLabel: string;
}> = ({ entries, myLabel }) => {
  const { t } = useTranslation();
  const others = entries.filter((e) => e.counterName !== myLabel);
  if (others.length === 0) return null;

  return (
    <div className="space-y-1">
      {others.map((entry) => (
        <div key={entry.counterName} className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600">
          <span className="font-semibold">{entry.counterName}:</span>{' '}
          {ZONE_KEYS.map((z) => `${t(`zones.${z}`).slice(0, 1)}:${entry.counts[z]}`).join(' ')}{' '}
          = <span className="font-bold text-gray-800">{calculateTotal(entry.counts)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Full Day Share Panel ────────────────────────────────────────────────────

const FullDaySharePanel: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const { t } = useTranslation();
  const {
    confirmedCounts,
    allSessionsConfirmed,
    grandTotal,
    loading,
    cleaning,
    buildShareText,
    handleShare,
    handleConfirmSent,
    refresh: _refresh,
  } = useFullDaySummary(serviceId);
  const [shared, setShared] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);

  if (loading) return <div className="text-center text-gray-400 text-sm py-4">...</div>;

  if (!allSessionsConfirmed) {
    const missing = SESSION_NAMES.filter((s) => !confirmedCounts.some((c) => c.session === s));
    return (
      <div className="card bg-amber-50 border-amber-200 space-y-2">
        <h3 className="font-bold text-amber-700 text-sm">{t('headcount.waitingAllSessions')}</h3>
        <p className="text-xs text-amber-600">
          {t('headcount.missingSessionsHint')}: {missing.map((s) => t(`sessions.${s}`)).join(', ')}
        </p>
      </div>
    );
  }

  const previewText = buildShareText();

  return (
    <div className="card space-y-3">
      <h3 className="font-bold text-primary text-base">{t('headcount.fullDaySummary')}</h3>

      {/* Preview */}
      <pre className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
        {previewText}
      </pre>

      <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-xl">
        <span className="text-xs font-semibold text-primary/70 uppercase">{t('headcount.grandTotal')}</span>
        <span className="flex-1 text-right text-3xl font-extrabold text-primary tabular-nums">{grandTotal}</span>
      </div>

      <button type="button" onClick={async () => { const ok = await handleShare(); if (ok) setShared(true); }} className="btn-primary w-full">
        {`📤 ${t('headcount.copyAndShare')}`}
      </button>

      {shared && !confirmingSend && (
        <button type="button" onClick={() => setConfirmingSend(true)}
          className="w-full text-sm text-gray-500 underline py-1">
          {t('headcount.confirmSentQuestion')}
        </button>
      )}

      {/* Confirm send dialog */}
      {confirmingSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" onClick={() => setConfirmingSend(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-700 text-center">{t('headcount.confirmSentBody')}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmingSend(false)} className="btn-outline flex-1 text-sm">
                {t('headcount.notYet')}
              </button>
              <button type="button" disabled={cleaning}
                onClick={async () => { await handleConfirmSent(); setConfirmingSend(false); }}
                className="flex-1 text-sm font-semibold py-2.5 rounded-lg bg-danger text-white active:scale-95 transition-all"
              >
                {cleaning ? '...' : t('headcount.yesDeleteData')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── History Snapshot & Undo/Redo ────────────────────────────────────────────

interface HistorySnapshot {
  counts: ZoneCounts;
  adj: CapacityAdjustments;
}

// ─── Counter Form (with auto-save) ──────────────────────────────────────────

const CounterForm: React.FC<{
  serviceId: string;
  session: SessionName;
  entries: ReturnType<typeof useHeadcount>['entries'];
  counterNames: string[];
  saveCount: ReturnType<typeof useHeadcount>['saveCount'];
  saving: boolean;
  disabled: boolean;
}> = ({ entries, counterNames, saveCount, saving, disabled }) => {
  const { t } = useTranslation();
  const [myLabel] = useState(() => getOrAssignCounterLabel(counterNames));

  const [counts, setCounts] = useState<ZoneCounts>(() => {
    // Restore from Firestore entry if exists, otherwise localStorage
    const myEntry = entries.find((e) => e.counterName === myLabel);
    if (myEntry) return { ...myEntry.counts };
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HEADCOUNT_COUNTS);
      return saved ? JSON.parse(saved) : { ...EMPTY_COUNTS };
    } catch { return { ...EMPTY_COUNTS }; }
  });
  const [adj, setAdj] = useState<CapacityAdjustments>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HEADCOUNT_ADJ);
      return saved ? JSON.parse(saved) : { ...EMPTY_ADJUSTMENTS };
    } catch { return { ...EMPTY_ADJUSTMENTS }; }
  });
  const [mode, setMode] = useState<'people' | 'capacity'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HEADCOUNT_MODE);
    return saved === 'capacity' ? 'capacity' : 'people';
  });
  const [showHelp, setShowHelp] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  // Undo / Redo
  const [history, setHistory] = useState<HistorySnapshot[]>([{ counts: { ...counts }, adj: { ...adj } }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback((newCounts: ZoneCounts, newAdj: CapacityAdjustments) => {
    setHistory((prev) => {
      const truncated = prev.slice(0, historyIndex + 1);
      return [...truncated, { counts: newCounts, adj: newAdj }];
    });
    setHistoryIndex((i) => i + 1);
  }, [historyIndex]);

  const updateCounts = useCallback((updater: (prev: ZoneCounts) => ZoneCounts) => {
    setCounts((prev) => {
      const next = updater(prev);
      pushHistory(next, adj);
      return next;
    });
  }, [adj, pushHistory]);

  const updateAdj = useCallback((updater: (prev: CapacityAdjustments) => CapacityAdjustments) => {
    setAdj((prev) => {
      const next = updater(prev);
      pushHistory(counts, next);
      return next;
    });
  }, [counts, pushHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const prev = history[historyIndex - 1];
    setHistoryIndex((i) => i - 1);
    setCounts(prev.counts);
    setAdj(prev.adj);
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const next = history[historyIndex + 1];
    setHistoryIndex((i) => i + 1);
    setCounts(next.counts);
    setAdj(next.adj);
  }, [canRedo, history, historyIndex]);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HEADCOUNT_COUNTS, JSON.stringify(counts)); }, [counts]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HEADCOUNT_ADJ, JSON.stringify(adj)); }, [adj]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HEADCOUNT_MODE, mode); }, [mode]);

  // Derive final counts & auto-save
  const finalCounts: ZoneCounts = mode === 'capacity'
    ? { ...counts, ...capacityToPeople(adj) }
    : counts;

  const total = calculateTotal(finalCounts);

  // Auto-save to Firestore on every change
  const prevFinalRef = useRef<string>('');
  useEffect(() => {
    const key = JSON.stringify(finalCounts);
    if (key !== prevFinalRef.current && !disabled) {
      prevFinalRef.current = key;
      saveCount(myLabel, finalCounts);
    }
  }, [finalCounts, disabled, myLabel, saveCount]);

  const handleClearAll = () => setConfirmingClear(true);
  const handleConfirmClear = () => {
    pushHistory({ ...EMPTY_COUNTS }, { ...EMPTY_ADJUSTMENTS });
    setCounts({ ...EMPTY_COUNTS });
    setAdj({ ...EMPTY_ADJUSTMENTS });
    setConfirmingClear(false);
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-primary text-base">{t('headcount.enterYourCount')}</h3>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {myLabel} {saving && <span className="text-amber-500">· {t('headcount.autoSaving')}</span>}
          </div>
        </div>
        <button type="button" onClick={() => setShowHelp((v) => !v)}
          className="text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-all">
          {showHelp ? `✕ ${t('common.close')}` : `? ${t('common.help')}`}
        </button>
      </div>

      {showHelp && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 mb-4 space-y-1.5 text-xs text-gray-600">
          <p className="font-bold text-accent">{t('headcount.howToCount')}</p>
          <p>{t('headcount.helpCountZones')}</p>
          <p>{t('headcount.helpReviewTotals')}</p>
          <p>{t('headcount.helpShowPhone')}</p>
        </div>
      )}

      {/* Other counters' live totals */}
      <OtherCountersBar entries={entries} myLabel={myLabel} />

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 mt-2">
        <button type="button" onClick={handleUndo} disabled={!canUndo || disabled}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 text-sm transition-all disabled:opacity-30 active:scale-90 bg-white hover:bg-gray-50"
          aria-label={t('headcount.undo')}>↩</button>
        <button type="button" onClick={handleRedo} disabled={!canRedo || disabled}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 text-sm transition-all disabled:opacity-30 active:scale-90 bg-white hover:bg-gray-50"
          aria-label={t('headcount.redo')}>↪</button>
        <button type="button" onClick={handleClearAll} disabled={disabled}
          className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-danger/20 bg-danger/5 text-danger/70 text-xs font-semibold whitespace-nowrap transition-all active:scale-90 hover:bg-danger/10 hover:text-danger disabled:opacity-30"
          aria-label={t('headcount.clearAll')}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
          </svg>
          {t('headcount.clearAll')}
        </button>
        <div className="flex-1" />
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button type="button" onClick={() => setMode('people')}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all ${mode === 'people' ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}>
            👥 {t('headcount.peopleMode')}
          </button>
          <div className="w-px bg-gray-200" />
          <button type="button" onClick={() => setMode('capacity')}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all ${mode === 'capacity' ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}>
            🪑 {t('headcount.capacityMode')}
          </button>
        </div>
      </div>

      {/* Count inputs */}
      <div className="space-y-4">
        {mode === 'people' && (
          <div className="space-y-2">
            {ZONE_KEYS.map((key) => {
              const accent = key === 'left' ? 'blue' : key === 'middle' ? 'emerald' : key === 'right' ? 'violet' : key === 'production' ? 'amber' : 'slate';
              return (
                <CountInput key={key} label={t(`zones.${key}`)} value={counts[key]}
                  onChange={(val) => updateCounts((c) => ({ ...c, [key]: val }))}
                  colorAccent={accent} disabled={disabled} />
              );
            })}
          </div>
        )}

        {mode === 'capacity' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-700 space-y-0.5">
              <p className="font-bold">{t('headcount.howCapacityWorks')}</p>
              <p><Trans i18nKey="headcount.capacityInstruction" components={{ 1: <strong /> }} /></p>
              <p className="text-blue-500"><Trans i18nKey="headcount.capacityFormula" components={{ 1: <em /> }} /></p>
            </div>
            <div className="space-y-3">
              {(['left', 'middle', 'right'] as const).map((key) => (
                <CapacityBlock key={key} label={t(`zones.${key}`)} capacity={SECTION_TOTALS[key]}
                  net={adj[key]} onChange={(v) => updateAdj((a) => ({ ...a, [key]: v }))} disabled={disabled} />
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">{t('headcount.prodOutsideDirect')}</p>
            <div className="space-y-2">
              {(['production', 'outside'] as const).map((key) => (
                <CountInput key={key} label={t(`zones.${key}`)} value={counts[key]}
                  onChange={(val) => updateCounts((c) => ({ ...c, [key]: val }))}
                  colorAccent={key === 'production' ? 'amber' : 'slate'} disabled={disabled} />
              ))}
            </div>
          </>
        )}

        {/* Total */}
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-xl">
          <span className="text-xs font-semibold text-primary/70 uppercase tracking-wide shrink-0">{t('common.total')}</span>
          <span className="flex-1 text-right text-4xl font-extrabold text-primary tabular-nums tracking-tight">{total}</span>
          {mode === 'capacity' && (
            <span className="text-[10px] text-primary/50 shrink-0 max-w-[5rem] leading-tight">{t('headcount.calculatedFromCapacity')}</span>
          )}
        </div>
      </div>

      {/* Clear All confirmation modal */}
      {confirmingClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" onClick={() => setConfirmingClear(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-700 text-center">{t('headcount.confirmClearAll')}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmingClear(false)} className="btn-outline flex-1 text-sm">
                {t('headcount.cancel')}
              </button>
              <button type="button" onClick={handleConfirmClear}
                className="flex-1 text-sm font-semibold py-2.5 rounded-lg bg-danger text-white active:scale-95 transition-all">
                {t('headcount.confirmClear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Session Content ─────────────────────────────────────────────────────────

const SessionContent: React.FC<{
  serviceId: string;
  session: SessionName;
  isActive: boolean;
  isLocked: boolean;
  isBefore: boolean;
}> = ({ serviceId, session, isLocked, isBefore }) => {
  const { t } = useTranslation();
  const {
    entries,
    counterNames,
    isConfirmed,
    sessionConfirmedCount,
    loading,
    saving,
    confirming,
    saveCount,
    confirmSession,
  } = useHeadcount(serviceId, session);

  const [myLabel] = useState(() =>
    getOrAssignCounterLabel(counterNames)
  );

  const handleConfirm = useCallback(async (totals: ZoneCounts) => {
    await confirmSession(myLabel, totals);
  }, [confirmSession, myLabel]);

  if (loading) {
    return <div className="text-center text-gray-400 text-sm py-8">{t('common.connecting')}</div>;
  }

  // Before session starts
  if (isBefore) {
    return (
      <div className="card text-center py-8 space-y-2">
        <div className="text-4xl">⏳</div>
        <h3 className="font-bold text-gray-600">{t('headcount.notStartedYet')}</h3>
        <p className="text-sm text-gray-400">
          {t('headcount.startsAt', { time: formatSessionTimeRange(session).split('–')[0] })}
        </p>
      </div>
    );
  }

  // Already confirmed
  if (isConfirmed && sessionConfirmedCount) {
    const confirmedTotal = calculateTotal(sessionConfirmedCount.totals);

    // If this is the last session (afternoon), show the share panel
    if (isLastSession(session)) {
      return (
        <div className="space-y-4">
          <div className="card bg-success/10 border-success/20 text-center py-4 space-y-1">
            <div className="text-2xl">✓</div>
            <h3 className="font-bold text-success">{t('headcount.sessionConfirmed')}</h3>
            <p className="text-sm text-gray-500">{t('common.total')}: <strong>{confirmedTotal}</strong></p>
          </div>
          <FullDaySharePanel serviceId={serviceId} />
        </div>
      );
    }

    return (
      <div className="card bg-success/10 border-success/20 text-center py-6 space-y-2">
        <div className="text-3xl">✓</div>
        <h3 className="font-bold text-success text-lg">{t('headcount.sessionConfirmed')}</h3>
        <div className="grid grid-cols-5 gap-1 text-center max-w-sm mx-auto">
          {ZONE_KEYS.map((zone) => (
            <div key={zone} className="bg-white/60 rounded-lg py-1">
              <div className="text-sm font-bold text-gray-700">{sessionConfirmedCount.totals[zone]}</div>
              <div className="text-[9px] text-gray-400">{t(`zones.${zone}`).slice(0, 4)}</div>
            </div>
          ))}
        </div>
        <p className="text-lg font-bold text-success">{t('common.total')}: {confirmedTotal}</p>
        <p className="text-xs text-gray-400">{t('headcount.sessionDone')}</p>
      </div>
    );
  }

  // Session is locked (past end time) but not confirmed yet — show confirmation panel
  if (isLocked) {
    return (
      <ConfirmationPanel
        entries={entries}
        counterNames={counterNames}
        myLabel={myLabel}
        onConfirm={handleConfirm}
        confirming={confirming}
      />
    );
  }

  // Active session — counting form
  return (
    <CounterForm
      serviceId={serviceId}
      session={session}
      entries={entries}
      counterNames={counterNames}
      saveCount={saveCount}
      saving={saving}
      disabled={false}
    />
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export const HeadcountPage: React.FC<HeadcountPageProps> = ({ serviceId }) => {
  const { currentSession, isLocked, isActive, isBeforeStart } = useSession();

  // Track which sessions are confirmed via full-day summary hook
  const { confirmedCounts } = useFullDaySummary(serviceId);
  const isSessionConfirmed = useCallback(
    (s: SessionName) => confirmedCounts.some((c) => c.session === s),
    [confirmedCounts]
  );

  // Default selected tab: current active session, or the first unconfirmed one
  const [selectedSession, setSelectedSession] = useState<SessionName>(() => {
    if (currentSession) return currentSession.name;
    // Find first unconfirmed session
    for (const s of SESSION_NAMES) {
      if (!isSessionConfirmed(s)) return s;
    }
    return 'afternoon';
  });

  return (
    <div className="space-y-4">
      <SessionTabBar
        selected={selectedSession}
        onSelect={setSelectedSession}
        isActive={isActive}
        isLocked={isLocked}
        isBeforeStart={isBeforeStart}
        isConfirmed={isSessionConfirmed}
      />

      <SessionContent
        serviceId={serviceId}
        session={selectedSession}
        isActive={isActive(selectedSession)}
        isLocked={isLocked(selectedSession)}
        isBefore={isBeforeStart(selectedSession)}
      />
    </div>
  );
};
