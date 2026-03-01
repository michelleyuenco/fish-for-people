import React, { useState, useCallback } from 'react';
import { useRequests } from '../../application/hooks/useRequests';
import { RequestCard } from '../components/RequestCard';
import { REQUEST_TYPES } from '../../domain/models/Request';
import type { RequestType, ServiceRequest } from '../../domain/models/Request';
import type { SectionName } from '../../domain/models/Seat';
import { SECTIONS } from '../../domain/constants/seating';
import { REQUEST_TYPE_ICONS } from '../../domain/constants/requests';

interface RequestsPageProps {
  serviceId: string;
  role: 'welcome-team' | 'congregation';
}

// ─── Congregation Submit Form ─────────────────────────────────────────────────
interface SubmitFormState {
  section: SectionName | '';
  row: number | '';
  type: RequestType | '';
  note: string;
}

interface LastSubmission {
  section: SectionName;
  row: number;
  type: RequestType;
  note: string;
}

const LOCATION_STORAGE_KEY = 'fish-for-people:last-location';

function getSavedLocation(): { section: SectionName; row: number } | null {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { section: string; row: number };
    if (['left', 'middle', 'right'].includes(parsed.section) && typeof parsed.row === 'number') {
      return { section: parsed.section as SectionName, row: parsed.row };
    }
  } catch { /* ignore */ }
  return null;
}

const CongregationView: React.FC<{
  serviceId: string;
  onSubmit: (payload: { section: SectionName; row: number; type: RequestType; note: string }) => Promise<{ success: boolean; requestId?: string }>;
  submitting: boolean;
  allRequests: ReturnType<typeof useRequests>['allRequests'];
}> = ({ onSubmit, submitting, allRequests }) => {
  const savedLocation = getSavedLocation();
  const [form, setForm] = useState<SubmitFormState>({
    section: savedLocation?.section ?? '',
    row: savedLocation?.row ?? '',
    type: '',
    note: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<LastSubmission | null>(null);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  const selectedSection = SECTIONS.find((s) => s.name === form.section);
  const maxRow = selectedSection ? selectedSection.rows : 14;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.section || !form.row || !form.type) return;
    const payload = {
      section: form.section as SectionName,
      row: form.row as number,
      type: form.type as RequestType,
      note: form.note,
    };
    const result = await onSubmit(payload);
    if (result.success) {
      // Save location for next time
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ section: payload.section, row: payload.row }));
      setLastSubmission(payload);
      setSubmittedRequestId(result.requestId ?? null);
      setSubmitted(true);
      setForm({ section: '', row: '', type: '', note: '' });
    }
  };

  if (submitted && lastSubmission) {
    const sectionLabel = lastSubmission.section.charAt(0).toUpperCase() + lastSubmission.section.slice(1);
    const liveRequest = submittedRequestId ? allRequests.find((r) => r.id === submittedRequestId) : null;
    const isResolved = liveRequest?.status === 'resolved';

    return (
      <div className="card space-y-4">
        <div className="text-center py-4">
          <div className="text-5xl mb-3">{isResolved ? '✅' : REQUEST_TYPE_ICONS[lastSubmission.type]}</div>
          <h2 className="text-xl font-bold text-primary">{isResolved ? 'Request Completed!' : 'Request Sent!'}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {isResolved ? 'A team member has attended to your request.' : 'A team member will come to you shortly.'}
          </p>
        </div>

        {/* Live status indicator */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          isResolved
            ? 'bg-success/10 border-success/30'
            : 'bg-primary/5 border-primary/20'
        }`}>
          <span className={`text-base ${isResolved ? '' : 'animate-pulse'}`}>
            {isResolved ? '✅' : '⏳'}
          </span>
          <div>
            <p className={`text-sm font-semibold ${isResolved ? 'text-success' : 'text-primary'}`}>
              {isResolved ? 'Resolved' : 'Pending — team notified'}
            </p>
            {!isResolved && (
              <p className="text-xs text-gray-400">Stay in your seat</p>
            )}
          </div>
        </div>

        {/* Receipt */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Your Request</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">What</span>
            <span className="font-semibold text-gray-800">{lastSubmission.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Where</span>
            <span className="font-semibold text-gray-800">{sectionLabel} • Row {lastSubmission.row}</span>
          </div>
          {lastSubmission.note && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Note</span>
              <span className="font-semibold text-gray-800 text-right max-w-[60%]">{lastSubmission.note}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => { setSubmitted(false); setSubmittedRequestId(null); }}
          className="btn-primary w-full"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  const hasSavedLocation = savedLocation !== null && form.section === (savedLocation?.section ?? '') && form.row === (savedLocation?.row ?? '');
  const currentSavedLoc = getSavedLocation();
  const isFirstVisit = currentSavedLoc === null;

  return (
    <div className="card space-y-4">
      <h2 className="font-bold text-primary text-lg">Get Help From Our Team</h2>
      <p className="text-gray-500 text-sm">Fill in your seat location and what you need — someone will come to you. Stay in your seat! 😊</p>

      {/* First-visit explainer */}
      {isFirstVisit && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-accent uppercase tracking-wide">How it works</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">1️⃣</span>
              <span>Tell us where you're sitting (section + row)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">2️⃣</span>
              <span>Choose what you need (pen, water, Bible…)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">3️⃣</span>
              <span>A Welcome Team member comes to you ✓</span>
            </div>
          </div>
        </div>
      )}

      {currentSavedLoc && hasSavedLocation && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-sm">
          <span>📍</span>
          <span className="text-primary font-medium flex-1">
            Using your last location: {currentSavedLoc.section.charAt(0).toUpperCase() + currentSavedLoc.section.slice(1)} Row {currentSavedLoc.row}
          </span>
          <button
            type="button"
            className="text-xs text-gray-400 underline"
            onClick={() => setForm((f) => ({ ...f, section: '', row: '' }))}
          >
            Change
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            🗺️ Where are you sitting?
          </label>
          {/* Mini visual map */}
          <div className="mb-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="text-center text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Stage / Screen ↓</div>
            <div className="flex gap-1 h-10">
              {SECTIONS.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, section: s.name, row: '' }))}
                  className={`flex-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                    form.section === s.name
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white border border-gray-300 text-gray-500'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="text-center text-[10px] text-gray-400 mt-2">← Entrance → Exit</div>
          </div>
          {/* Also allow tapping labels below for clarity */}
          <div className="grid grid-cols-3 gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setForm((f) => ({ ...f, section: s.name, row: '' }))}
                className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                  form.section === s.name
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row number */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Row Number
            {form.section && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                (1 = closest to stage, {maxRow} = back)
              </span>
            )}
          </label>
          <select
            value={form.row}
            onChange={(e) => setForm((f) => ({ ...f, row: parseInt(e.target.value) || '' }))}
            className="select-field"
            disabled={!form.section}
          >
            <option value="">Select row...</option>
            {Array.from({ length: maxRow }, (_, i) => i + 1).map((r) => {
              const position = r <= 3 ? ' · Front' : r >= maxRow - 2 ? ' · Back' : r === Math.ceil(maxRow / 2) ? ' · Middle' : '';
              return (
                <option key={r} value={r}>
                  Row {r}{position}
                </option>
              );
            })}
          </select>
          {/* Position hint */}
          {form.section && typeof form.row === 'number' && form.row > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/40 rounded-full"
                  style={{ width: `${((form.row as number) / maxRow) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">
                {form.row <= 3 ? '🎭 Near stage' : form.row >= maxRow - 2 ? '🚪 Near back' : '↔ Middle area'}
              </span>
            </div>
          )}
          {/* "Don't know row" shortcut */}
          {form.section && !form.row && (
            <button
              type="button"
              onClick={() => {
                const sectionLabel = (form.section as string).charAt(0).toUpperCase() + (form.section as string).slice(1);
                setForm((f) => ({
                  ...f,
                  row: 1,
                  note: f.note || `I'm in the ${sectionLabel} section but not sure of my row.`,
                }));
              }}
              className="mt-1.5 text-xs text-primary underline"
            >
              Not sure of my row number →
            </button>
          )}
        </div>

        {/* Request type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            🤲 What would you like?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {REQUEST_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type }))}
                aria-label={type}
                aria-pressed={form.type === type}
                className={`py-3 px-2 rounded-xl font-medium text-xs transition-all flex flex-col items-center justify-center gap-1 min-h-[72px] ${
                  form.type === type
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl leading-none" role="img" aria-hidden="true">
                  {REQUEST_TYPE_ICONS[type]}
                </span>
                <span className="leading-tight text-center">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note (for "Other") */}
        {form.type === 'Other' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Please describe
            </label>
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2 mb-2">
              {['Accessibility help', 'Translation needed', 'Medical assistance', 'Lost item'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, note: preset }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    form.note === preset
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-primary'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Or describe what you need..."
              rows={2}
              className="input-field resize-none"
            />
          </div>
        )}

        {/* Pre-submit summary */}
        {(form.section || form.row || form.type) && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Summary</p>
            <div className="flex items-center gap-2">
              <span className={form.section ? 'text-success' : 'text-gray-300'}>✓</span>
              <span className={form.section ? 'text-gray-700 font-medium' : 'text-gray-300'}>
                {form.section ? `${(form.section as string).charAt(0).toUpperCase() + (form.section as string).slice(1)} section` : 'Section not selected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={form.row ? 'text-success' : 'text-gray-300'}>✓</span>
              <span className={form.row ? 'text-gray-700 font-medium' : 'text-gray-300'}>
                {form.row ? `Row ${form.row}` : 'Row not selected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={form.type ? 'text-success' : 'text-gray-300'}>✓</span>
              <span className={form.type ? 'text-gray-700 font-medium' : 'text-gray-300'}>
                {form.type ? `${form.type}` : 'Need type not selected'}
              </span>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!form.section || !form.row || !form.type || submitting}
          className="btn-primary w-full text-lg py-4"
        >
          {submitting ? 'Calling for help...' : '🙋 Call for Help'}
        </button>
      </form>
    </div>
  );
};

// ─── Service Wrap-Up Panel ───────────────────────────────────────────────────
interface ServiceWrapUpPanelProps {
  resolvedRequests: ServiceRequest[];
}

const ServiceWrapUpPanel: React.FC<ServiceWrapUpPanelProps> = ({ resolvedRequests }) => {
  const [copied, setCopied] = useState(false);

  const firstRequest = resolvedRequests.length > 0
    ? resolvedRequests.reduce((a, b) => a.createdAt < b.createdAt ? a : b)
    : null;
  const lastResolved = resolvedRequests.length > 0
    ? resolvedRequests.reduce((a, b) => {
        const at = a.resolvedAt ?? a.createdAt;
        const bt = b.resolvedAt ?? b.createdAt;
        return at > bt ? a : b;
      })
    : null;

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' });

  const typeCounts = REQUEST_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = resolvedRequests.filter((r) => r.type === t).length;
    return acc;
  }, {});

  const sectionCounts = (['left', 'middle', 'right'] as const).map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    count: resolvedRequests.filter((r) => r.section === s).length,
  }));

  const copyReport = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-HK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const lines: string[] = [
      `🙏 Fish for People — Service Report`,
      `📅 ${dateStr}`,
      ``,
      `✅ SERVICE COMPLETE — All requests resolved`,
      ``,
      `📊 REQUESTS SUMMARY`,
      `Total handled: ${resolvedRequests.length}`,
    ];
    if (firstRequest) lines.push(`First request: ${formatTime(firstRequest.createdAt)}`);
    if (lastResolved) {
      const rt = lastResolved.resolvedAt ?? lastResolved.createdAt;
      lines.push(`Last resolved: ${formatTime(rt)}`);
    }
    lines.push(``, `BY TYPE:`);
    REQUEST_TYPES.filter((t) => typeCounts[t] > 0).forEach((t) => {
      lines.push(`  ${REQUEST_TYPE_ICONS[t]} ${t}: ${typeCounts[t]}`);
    });
    lines.push(``, `BY SECTION:`);
    sectionCounts.filter((s) => s.count > 0).forEach((s) => {
      lines.push(`  ${s.label}: ${s.count}`);
    });
    lines.push(``, `— Saddleback Church HK Welcome Team`);
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }, [resolvedRequests, firstRequest, lastResolved, typeCounts, sectionCounts]);

  return (
    <div className="space-y-4">
      {/* Celebration header */}
      <div className="card bg-gradient-to-br from-accent/10 to-primary/5 border-2 border-accent/30 text-center py-6 space-y-2">
        <div className="text-5xl mb-1">🎉</div>
        <h2 className="text-xl font-bold text-primary">Service Complete!</h2>
        <p className="text-gray-600 text-sm">All {resolvedRequests.length} request{resolvedRequests.length !== 1 ? 's' : ''} resolved.</p>
        <p className="text-xs text-accent font-semibold uppercase tracking-wide mt-1">Well done, Welcome Team! 🙌</p>
      </div>

      {/* Timeline summary */}
      {(firstRequest || lastResolved) && (
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Service Timeline</p>
          <div className="flex items-center gap-3">
            {firstRequest && (
              <div className="flex-1 bg-primary/5 rounded-xl p-3 text-center">
                <div className="text-base font-bold text-primary">{formatTime(firstRequest.createdAt)}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">First Request</div>
              </div>
            )}
            <div className="text-gray-300 text-xl">→</div>
            {lastResolved && (
              <div className="flex-1 bg-success/10 rounded-xl p-3 text-center">
                <div className="text-base font-bold text-success">
                  {formatTime(lastResolved.resolvedAt ?? lastResolved.createdAt)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Last Resolved</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests by type */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Requests by Type</p>
        <div className="space-y-2">
          {REQUEST_TYPES.filter((t) => typeCounts[t] > 0).map((t) => {
            const pct = Math.round((typeCounts[t] / resolvedRequests.length) * 100);
            return (
              <div key={t} className="flex items-center gap-2">
                <span className="text-base w-6 text-center">{REQUEST_TYPE_ICONS[t]}</span>
                <span className="text-xs text-gray-600 w-24 font-medium">{t}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-primary w-5 text-right">{typeCounts[t]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By section */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Requests by Section</p>
        <div className="flex gap-2">
          {sectionCounts.map((s) => (
            <div key={s.label} className="flex-1 bg-gray-50 rounded-xl py-3 text-center border border-gray-100">
              <div className="text-xl font-bold text-primary">{s.count}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Share report button */}
      <button
        onClick={copyReport}
        className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          copied
            ? 'bg-success text-white'
            : 'bg-primary text-white hover:bg-primary/90'
        }`}
      >
        <span>{copied ? '✅' : '📋'}</span>
        <span>{copied ? 'Copied! Paste into WhatsApp or Email' : 'Copy Service Report to Share'}</span>
      </button>
    </div>
  );
};

// ─── Welcome Team Dashboard ───────────────────────────────────────────────────
const WelcomeTeamView: React.FC<{
  pendingRequests: ReturnType<typeof useRequests>['pendingRequests'];
  resolvedRequests: ReturnType<typeof useRequests>['resolvedRequests'];
  pendingCount: number;
  resolving: Set<string>;
  onResolve: (id: string) => void;
  loading: boolean;
}> = ({ pendingRequests, resolvedRequests, pendingCount, resolving, onResolve, loading }) => {
  const [showResolved, setShowResolved] = useState(false);
  const [showAllResolved, setShowAllResolved] = useState(false);
  const [filterType, setFilterType] = useState<RequestType | 'all'>('all');

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {/* Stats skeleton */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
          </div>
        </div>
        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="card flex items-center gap-3">
            <div className="h-7 w-20 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-9 w-16 bg-gray-200 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  const filteredPending = filterType === 'all'
    ? pendingRequests
    : pendingRequests.filter((r) => r.type === filterType);

  // Compute type counts for the filter chips
  const typeCounts = REQUEST_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = pendingRequests.filter((r) => r.type === t).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-primary text-base">Active Requests</h2>
            <p className="text-gray-500 text-xs mt-0.5">Real-time • tap Done to resolve</p>
          </div>
          <div className="text-3xl font-bold text-primary">{pendingCount}</div>
        </div>

        {/* Filter chips */}
        {pendingCount > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`text-xs px-3 py-1 rounded-full font-semibold transition-all ${
                filterType === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              All ({pendingCount})
            </button>
            {REQUEST_TYPES.filter((t) => typeCounts[t] > 0).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(filterType === t ? 'all' : t)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1 ${
                  filterType === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>{REQUEST_TYPE_ICONS[t]}</span>
                <span>{t} ({typeCounts[t]})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {filteredPending.length === 0 ? (
        filterType === 'all' && resolvedRequests.length > 0 ? (
          <ServiceWrapUpPanel resolvedRequests={resolvedRequests} />
        ) : (
        <div className="card text-center py-6 space-y-3">
          <div className="text-3xl">✅</div>
          <p className="text-gray-500 text-sm">
            {filterType === 'all' ? 'All clear! No requests yet this service.' : `No pending ${filterType} requests.`}
          </p>
        </div>)
      ) : (
        <div className="space-y-3">
          {(['left', 'middle', 'right'] as const).map((section) => {
            const sectionRequests = filteredPending.filter((r) => r.section === section);
            if (sectionRequests.length === 0) return null;
            const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);
            return (
              <div key={section}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{sectionLabel} Section</span>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{sectionRequests.length}</span>
                </div>
                <div className="space-y-2">
                  {sectionRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      canResolve={true}
                      isResolving={resolving.has(request.id)}
                      onResolve={onResolve}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved history toggle */}
      {resolvedRequests.length > 0 && (
        <div>
          <button
            onClick={() => setShowResolved(!showResolved)}
            className="w-full text-sm text-gray-500 py-2 flex items-center justify-center gap-1"
          >
            <span>{showResolved ? '▲' : '▼'}</span>
            <span>{showResolved ? 'Hide' : 'Show'} resolved ({resolvedRequests.length})</span>
          </button>

          {showResolved && (
            <div className="space-y-2 mt-2">
              {(showAllResolved ? resolvedRequests : resolvedRequests.slice(0, 5)).map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  canResolve={false}
                  isResolving={false}
                  onResolve={() => {}}
                />
              ))}
              {resolvedRequests.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllResolved((v) => !v)}
                  className="w-full text-xs text-primary py-2 font-semibold underline"
                >
                  {showAllResolved ? 'Show fewer' : `Show all ${resolvedRequests.length} resolved`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const RequestsPage: React.FC<RequestsPageProps> = ({ serviceId, role }) => {
  const {
    pendingRequests,
    resolvedRequests,
    pendingCount,
    loading,
    resolving,
    submitting,
    allRequests,
    submitRequest,
    resolveRequest,
  } = useRequests(serviceId);

  if (role === 'congregation') {
    return (
      <CongregationView
        serviceId={serviceId}
        onSubmit={submitRequest}
        submitting={submitting}
        allRequests={allRequests}
      />
    );
  }

  return (
    <WelcomeTeamView
      pendingRequests={pendingRequests}
      resolvedRequests={resolvedRequests}
      pendingCount={pendingCount}
      resolving={resolving}
      onResolve={resolveRequest}
      loading={loading}
    />
  );
};
