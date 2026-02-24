import React, { useState } from 'react';
import { useHeadcount } from '../../application/hooks/useHeadcount';
import { CountInput } from '../components/CountInput';
import { ZONE_NAMES, type ZoneCounts } from '../../domain/models/Headcount';
import { calculateTotal } from '../../domain/rules/headcountRules';

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

// ─── Counter Form ─────────────────────────────────────────────────────────────
const CounterForm: React.FC<{
  onSubmit: (name: string, counts: ZoneCounts) => Promise<{ success: boolean; errors: string[] }>;
  submitting: boolean;
  existingCounterNames: string[];
}> = ({ onSubmit, submitting, existingCounterNames }) => {
  const [name, setName] = useState('');
  const [counts, setCounts] = useState<ZoneCounts>({ ...EMPTY_COUNTS });
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const total = calculateTotal(counts);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormErrors(['Please enter your name.']);
      return;
    }
    setFormErrors([]);
    const result = await onSubmit(name.trim(), counts);
    if (result.success) {
      setSubmitted(true);
    } else {
      setFormErrors(result.errors);
    }
  };

  if (submitted) {
    return (
      <div className="card text-center py-8">
        <div className="text-3xl mb-3">✅</div>
        <h3 className="font-bold text-primary text-lg">Submitted!</h3>
        <p className="text-gray-500 text-sm mt-1">Your count has been recorded.</p>
        <p className="text-2xl font-bold text-primary mt-3">{total}</p>
        <p className="text-gray-400 text-xs">total counted</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setCounts({ ...EMPTY_COUNTS });
            setName('');
          }}
          className="btn-outline mt-5 w-full"
        >
          Submit Again
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-bold text-primary text-base mb-4">Enter Your Count</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Counter name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Your Name / Counter ID
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Counter A, Jason..."
            className="input-field"
            list="counter-names"
          />
          {existingCounterNames.length > 0 && (
            <datalist id="counter-names">
              {existingCounterNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          )}
        </div>

        {/* Zone counts */}
        <div className="space-y-2">
          {ZONE_NAMES.map(({ key, label }) => (
            <CountInput
              key={key}
              label={label}
              value={counts[key]}
              onChange={(val) => setCounts((c) => ({ ...c, [key]: val }))}
              disabled={submitting}
            />
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary/10 rounded-xl">
          <span className="font-semibold text-primary text-sm">Total</span>
          <span className="font-bold text-primary text-xl">{total}</span>
        </div>

        {/* Errors */}
        {formErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl space-y-1">
            {formErrors.map((e, i) => (
              <p key={i}>⚠ {e}</p>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? 'Submitting...' : 'Submit Count'}
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
        return (
          <div
            key={key}
            className={`grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl text-center ${
              hasDisc ? 'bg-warning/10 border border-warning' : 'bg-gray-50'
            }`}
          >
            <div className={`text-sm font-medium text-left ${hasDisc ? 'text-warning' : 'text-gray-700'}`}>
              {label}
              {hasDisc && <span className="ml-1">⚠</span>}
            </div>
            <div className={`font-bold text-sm ${hasDisc ? 'text-warning' : 'text-gray-800'}`}>
              {counterA ? counterA.counts[key] : '—'}
            </div>
            <div className={`font-bold text-sm ${hasDisc ? 'text-warning' : 'text-gray-800'}`}>
              {counterB ? counterB.counts[key] : '—'}
            </div>
          </div>
        );
      })}

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-primary/10 text-center">
        <div className="text-sm font-bold text-primary text-left">Total</div>
        <div className="font-bold text-primary text-base">{counterA?.total ?? '—'}</div>
        <div className="font-bold text-primary text-base">{counterB?.total ?? '—'}</div>
      </div>

      {/* Discrepancy message */}
      {discrepancies.length > 0 && (
        <div className="bg-warning/10 border border-warning text-warning text-sm px-4 py-3 rounded-xl">
          ⚠ {discrepancies.length} zone{discrepancies.length > 1 ? 's' : ''} differ by more than 5.
          Please recount before confirming.
        </div>
      )}

      {/* Confirm button */}
      {counterA && counterB && (
        <button
          onClick={onConfirm}
          disabled={!canConfirm || confirming}
          className="btn-primary w-full"
        >
          {confirming ? 'Confirming...' : canConfirm ? '✓ Confirm Attendance' : 'Resolve Discrepancies First'}
        </button>
      )}
    </div>
  );
};

// ─── History Panel ────────────────────────────────────────────────────────────
const HistoryPanel: React.FC<{
  confirmedCounts: ReturnType<typeof useHeadcount>['confirmedCounts'];
}> = ({ confirmedCounts }) => {
  if (confirmedCounts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-primary text-base">Recent Services</h3>
      {confirmedCounts.map((entry) => (
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
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {entry.totals ? calculateTotal(entry.totals) : '—'}
              </div>
              <div className="text-xs text-gray-400">confirmed</div>
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
      ))}
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
