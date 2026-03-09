import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequests } from '../../application/hooks/useRequests';
import { RequestCard } from '../components/RequestCard';
import { REQUEST_TYPES, QUANTIFIABLE_TYPES } from '../../domain/models/Request';
import type { RequestType, ServiceRequest } from '../../domain/models/Request';
import type { SectionName } from '../../domain/models/Seat';
import { REQUEST_TYPE_ICONS } from '../../domain/constants/requests';
import { FloorPlanPicker, type FloorPlanSelection } from '../components/FloorPlanPicker';

interface RequestsPageProps {
  serviceId: string;
  role: 'welcome-team' | 'congregation';
}

// ─── Congregation Submit Form ─────────────────────────────────────────────────

interface LastSubmission {
  section: SectionName;
  row: number;
  areaLabel?: string;
  type: RequestType;
  quantity: number;
  note: string;
  contactName?: string;
  contactPhone?: string;
}

interface SubmitFormState {
  location: FloorPlanSelection | null;
  type: RequestType | '';
  quantity: number;
  note: string;
  contactName: string;
  contactPhone: string;
}

/** Validate HK phone number: 8 digits, starts with 2-9 */
function isValidHKPhone(phone: string): boolean {
  return /^[2-9]\d{7}$/.test(phone.replace(/\s/g, ''));
}
const LOCATION_STORAGE_KEY = 'fish-for-people:last-location-v2';

function getSavedLocation(): FloorPlanSelection | null {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FloorPlanSelection;
    if (['left', 'middle', 'right'].includes(parsed.section) && typeof parsed.row === 'number' && parsed.areaLabel) {
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

const PRESET_KEYS = [
  'congregation.presetAccessibility',
  'congregation.presetTranslation',
  'congregation.presetMedical',
  'congregation.presetLostItem',
] as const;

const HANDEDNESS_KEY = 'fish-for-people:handedness';

const CongregationView: React.FC<{
  serviceId: string;
  onSubmit: (payload: { section: SectionName; row: number; areaLabel?: string; type: RequestType; quantity: number; note: string; contactName?: string; contactPhone?: string }) => Promise<{ success: boolean; requestId?: string }>;
  submitting: boolean;
  allRequests: ReturnType<typeof useRequests>['allRequests'];
}> = ({ onSubmit, submitting, allRequests }) => {
  const { t } = useTranslation();
  const isLeftHanded = localStorage.getItem(HANDEDNESS_KEY) === 'left';
  const savedLocation = getSavedLocation();
  const [form, setForm] = useState<SubmitFormState>({
    location: savedLocation,
    type: '',
    quantity: 1,
    note: '',
    contactName: '',
    contactPhone: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<LastSubmission | null>(null);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(!savedLocation);

  const isVoiceover = form.type === 'Voiceover Device';
  const phoneValid = !isVoiceover || isValidHKPhone(form.contactPhone);
  const nameValid = !isVoiceover || form.contactName.trim().length > 0;
  const canSubmit = !!form.location && !!form.type && (!isVoiceover || (phoneValid && nameValid));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const payload = {
      section: form.location!.section,
      row: form.location!.row,
      areaLabel: form.location!.areaLabel,
      type: form.type as RequestType,
      quantity: form.quantity,
      note: form.note,
      ...(isVoiceover ? { contactName: form.contactName.trim(), contactPhone: form.contactPhone.replace(/\s/g, '') } : {}),
    };
    const result = await onSubmit(payload);
    if (result.success) {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(form.location));
      setLastSubmission(payload);
      setSubmittedRequestId(result.requestId ?? null);
      setSubmitted(true);
      setForm((f) => ({ ...f, type: '', quantity: 1, note: '', contactName: '', contactPhone: '' }));
    }
  };

  if (submitted && lastSubmission) {
    const locationLabel = lastSubmission.areaLabel
      ? `${lastSubmission.areaLabel}`
      : `Row ${lastSubmission.row}`;
    const liveRequest = submittedRequestId ? allRequests.find((r) => r.id === submittedRequestId) : null;
    const isResolved = liveRequest?.status === 'resolved';

    return (
      <div className="card space-y-4">
        <div className="text-center py-4">
          <div className="text-5xl mb-3">{isResolved ? '✅' : REQUEST_TYPE_ICONS[lastSubmission.type]}</div>
          <h2 className="text-xl font-bold text-primary">
            {isResolved ? t('congregation.requestCompleted') : t('congregation.requestSent')}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isResolved ? t('congregation.teamAttended') : t('congregation.teamComingSoon')}
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
              {isResolved ? t('congregation.resolved') : t('congregation.pendingTeamNotified')}
            </p>
            {!isResolved && (
              <p className="text-xs text-gray-400">{t('congregation.stayInSeat')}</p>
            )}
          </div>
        </div>

        {/* Receipt */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('congregation.yourRequest')}</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('congregation.what')}</span>
            <span className="font-semibold text-gray-800">
              {lastSubmission.quantity > 1 ? `${lastSubmission.quantity}x ` : ''}
              {t(`requestTypes.${lastSubmission.type}`)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('congregation.where')}</span>
            <span className="font-semibold text-gray-800">{locationLabel}</span>
          </div>
          {lastSubmission.contactName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('congregation.contactName')}</span>
              <span className="font-semibold text-gray-800">{lastSubmission.contactName}</span>
            </div>
          )}
          {lastSubmission.contactPhone && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('congregation.contactPhone')}</span>
              <span className="font-semibold text-gray-800">{lastSubmission.contactPhone}</span>
            </div>
          )}
          {lastSubmission.note && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('congregation.note')}</span>
              <span className="font-semibold text-gray-800 text-right max-w-[60%]">{lastSubmission.note}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => { setSubmitted(false); setSubmittedRequestId(null); }}
          className="btn-primary w-full"
        >
          {t('congregation.submitAnother')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── Step 1: Location ─────────────────────────────────── */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            form.location ? 'bg-success text-white' : 'bg-primary text-white'
          }`}>
            {form.location ? '✓' : '1'}
          </span>
          <h2 className="font-bold text-gray-800 text-base flex-1">{t('congregation.step1Title')}</h2>
          {form.location && !showLocationPicker && (
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              className="text-xs text-primary underline font-medium"
            >
              {t('congregation.changeLocation')}
            </button>
          )}
        </div>

        {/* Show saved location summary OR the full picker */}
        {form.location && !showLocationPicker ? (
          <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2">
            <span className="text-primary text-sm">📍</span>
            <span className="text-sm font-semibold text-primary">{form.location.areaLabel}</span>
          </div>
        ) : (
          <FloorPlanPicker
            value={form.location}
            onChange={(loc) => {
              setForm((f) => ({ ...f, location: loc }));
              setShowLocationPicker(false);
            }}
          />
        )}
      </div>

      {/* ── Step 2: What you need ────────────────────────────── */}
      <div className={`card space-y-3 transition-opacity ${form.location ? '' : 'opacity-40 pointer-events-none'}`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            form.type ? 'bg-success text-white' : 'bg-primary text-white'
          }`}>
            {form.type ? '✓' : '2'}
          </span>
          <h2 className="font-bold text-gray-800 text-base">{t('congregation.step2Title')}</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {REQUEST_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm((f: SubmitFormState) => ({ ...f, type }))}
              aria-label={t(`requestTypes.${type}`)}
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
              <span className="leading-tight text-center">{t(`requestTypes.${type}`)}</span>
            </button>
          ))}
        </div>

        {/* Quantity stepper — aligned to dominant hand side */}
        {form.type && QUANTIFIABLE_TYPES.includes(form.type as typeof QUANTIFIABLE_TYPES[number]) && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('congregation.howMany')}
            </label>
            <div className={`flex items-center gap-3 ${isLeftHanded ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
              <button
                type="button"
                onClick={() => setForm((f: SubmitFormState) => ({ ...f, quantity: f.quantity + 1 }))}
                className="w-14 h-14 rounded-xl bg-primary text-white text-2xl font-bold flex items-center justify-center active:scale-90 transition-all shadow-md"
                aria-label="+"
              >+</button>
              <span className="text-2xl font-bold text-primary w-10 text-center">{form.quantity}</span>
              <button
                type="button"
                onClick={() => setForm((f: SubmitFormState) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                disabled={form.quantity <= 1}
                className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 text-xl font-bold flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all"
                aria-label="−"
              >−</button>
            </div>
          </div>
        )}

        {/* Contact info (for Voiceover Device) */}
        {isVoiceover && (
          <div className="space-y-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-teal-700">
              {t('congregation.voiceoverContactNote')}
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('congregation.contactName')}
              </label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => setForm((f: SubmitFormState) => ({ ...f, contactName: e.target.value }))}
                placeholder={t('congregation.contactNamePlaceholder')}
                className="input-field"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('congregation.contactPhone')}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={form.contactPhone}
                onChange={(e) => setForm((f: SubmitFormState) => ({ ...f, contactPhone: e.target.value }))}
                placeholder={t('congregation.contactPhonePlaceholder')}
                className={`input-field ${form.contactPhone && !phoneValid ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                autoComplete="tel"
              />
              {form.contactPhone && !phoneValid && (
                <p className="text-xs text-red-500 mt-1">{t('congregation.invalidPhone')}</p>
              )}
            </div>
          </div>
        )}

        {/* Prayer item (for Prayer requests) */}
        {form.type === 'Prayer' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('congregation.prayerItem')}
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f: SubmitFormState) => ({ ...f, note: e.target.value }))}
              placeholder={t('congregation.prayerItemPlaceholder')}
              rows={3}
              className="input-field resize-none"
            />
          </div>
        )}

        {/* Note (for "Other") */}
        {form.type === 'Other' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('congregation.pleaseDescribe')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_KEYS.map((key) => {
                const label = t(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f: SubmitFormState) => ({ ...f, note: label }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      form.note === label
                        ? 'bg-primary text-white border-primary'
                        : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-primary'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f: SubmitFormState) => ({ ...f, note: e.target.value }))}
              placeholder={t('congregation.orDescribe')}
              rows={2}
              className="input-field resize-none"
            />
          </div>
        )}
      </div>

      {/* ── Submit ────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="btn-primary w-full text-lg py-4"
      >
        {submitting ? t('congregation.callingForHelp') : t('congregation.callForHelp')}
      </button>
    </form>
  );
};

// ─── Service Wrap-Up Panel ───────────────────────────────────────────────────
interface ServiceWrapUpPanelProps {
  resolvedRequests: ServiceRequest[];
}

const ServiceWrapUpPanel: React.FC<ServiceWrapUpPanelProps> = ({ resolvedRequests }) => {
  const { t } = useTranslation();
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

  const typeCounts = REQUEST_TYPES.reduce<Record<string, number>>((acc, tp) => {
    acc[tp] = resolvedRequests.filter((r) => r.type === tp).length;
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
    REQUEST_TYPES.filter((tp) => typeCounts[tp] > 0).forEach((tp) => {
      lines.push(`  ${REQUEST_TYPE_ICONS[tp]} ${tp}: ${typeCounts[tp]}`);
    });
    lines.push(``, `BY SECTION:`);
    sectionCounts.filter((s) => s.count > 0).forEach((s) => {
      lines.push(`  ${s.label}: ${s.count}`);
    });
    lines.push(``, `— Welcome Team`);
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
        <h2 className="text-xl font-bold text-primary">{t('wrapUp.serviceComplete')}</h2>
        <p className="text-gray-600 text-sm">{t('wrapUp.allResolved', { count: resolvedRequests.length })}</p>
        <p className="text-xs text-accent font-semibold uppercase tracking-wide mt-1">{t('wrapUp.wellDone')} 🙌</p>
      </div>

      {/* Timeline summary */}
      {(firstRequest || lastResolved) && (
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('wrapUp.timeline')}</p>
          <div className="flex items-center gap-3">
            {firstRequest && (
              <div className="flex-1 bg-primary/5 rounded-xl p-3 text-center">
                <div className="text-base font-bold text-primary">{formatTime(firstRequest.createdAt)}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{t('wrapUp.firstRequest')}</div>
              </div>
            )}
            <div className="text-gray-300 text-xl">→</div>
            {lastResolved && (
              <div className="flex-1 bg-success/10 rounded-xl p-3 text-center">
                <div className="text-base font-bold text-success">
                  {formatTime(lastResolved.resolvedAt ?? lastResolved.createdAt)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{t('wrapUp.lastResolved')}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests by type */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('wrapUp.byType')}</p>
        <div className="space-y-2">
          {REQUEST_TYPES.filter((tp) => typeCounts[tp] > 0).map((tp) => {
            const pct = Math.round((typeCounts[tp] / resolvedRequests.length) * 100);
            return (
              <div key={tp} className="flex items-center gap-2">
                <span className="text-base w-6 text-center">{REQUEST_TYPE_ICONS[tp]}</span>
                <span className="text-xs text-gray-600 w-24 font-medium">{t(`requestTypes.${tp}`)}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-primary w-5 text-right">{typeCounts[tp]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By section */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('wrapUp.bySection')}</p>
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
        <span>{copied ? t('wrapUp.copied') : t('wrapUp.copyReport')}</span>
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
  onDeleteAll: () => Promise<void>;
  deleting: boolean;
  loading: boolean;
  error: Error | null;
}> = ({ pendingRequests, resolvedRequests, pendingCount, resolving, onResolve, onDeleteAll, deleting, loading, error }) => {
  const { t } = useTranslation();
  const [showResolved, setShowResolved] = useState(false);
  const [showAllResolved, setShowAllResolved] = useState(false);
  const [filterType, setFilterType] = useState<RequestType | 'all'>('all');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
          </div>
        </div>
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

  const typeCounts = REQUEST_TYPES.reduce<Record<string, number>>((acc, tp) => {
    acc[tp] = pendingRequests.filter((r) => r.type === tp).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-primary text-base">{t('welcomeTeam.activeRequests')}</h2>
            <p className="text-gray-500 text-xs mt-0.5">{t('welcomeTeam.realTimeTapDone')}</p>
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
              {t('welcomeTeam.all')} ({pendingCount})
            </button>
            {REQUEST_TYPES.filter((tp) => typeCounts[tp] > 0).map((tp) => (
              <button
                key={tp}
                onClick={() => setFilterType(filterType === tp ? 'all' : tp)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1 ${
                  filterType === tp ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>{REQUEST_TYPE_ICONS[tp]}</span>
                <span>{t(`requestTypes.${tp}`)} ({typeCounts[tp]})</span>
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
            {filterType === 'all'
              ? t('welcomeTeam.allClear')
              : t('welcomeTeam.noPending', { type: t(`requestTypes.${filterType}`) })}
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
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    {t('welcomeTeam.section', { name: sectionLabel })}
                  </span>
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

      {/* Wipe all requests */}
      {(pendingRequests.length > 0 || resolvedRequests.length > 0) && (
        <div className="card">
          {!confirmWipe ? (
            <button
              onClick={() => setConfirmWipe(true)}
              className="w-full text-sm text-red-500 font-medium py-2 flex items-center justify-center gap-2"
            >
              <span>🗑️</span>
              <span>{t('welcomeTeam.clearAll')}</span>
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-gray-600">
                {t('welcomeTeam.confirmDelete', { count: pendingRequests.length + resolvedRequests.length })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmWipe(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium"
                >
                  {t('welcomeTeam.cancel')}
                </button>
                <button
                  onClick={async () => {
                    setDeleteError(null);
                    try {
                      await onDeleteAll();
                      setConfirmWipe(false);
                    } catch (err) {
                      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
                    }
                  }}
                  disabled={deleting}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-50"
                >
                  {deleting ? t('welcomeTeam.deleting') : t('welcomeTeam.yesDeleteAll')}
                </button>
              </div>
            </div>
          )}
          {deleteError && (
            <p className="text-xs text-red-500 text-center mt-2">{deleteError}</p>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          ⚠ {error.message}
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
            <span>
              {showResolved
                ? t('welcomeTeam.hideResolved', { count: resolvedRequests.length })
                : t('welcomeTeam.showResolved', { count: resolvedRequests.length })}
            </span>
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
                  {showAllResolved
                    ? t('welcomeTeam.showFewer')
                    : t('welcomeTeam.showAll', { count: resolvedRequests.length })}
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
    error,
    resolving,
    submitting,
    deleting,
    allRequests,
    submitRequest,
    resolveRequest,
    deleteAllRequests,
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
      onDeleteAll={deleteAllRequests}
      deleting={deleting}
      loading={loading}
      error={error}
    />
  );
};
