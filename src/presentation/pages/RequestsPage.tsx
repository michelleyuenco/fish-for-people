import React, { useState } from 'react';
import { useRequests } from '../../application/hooks/useRequests';
import { RequestCard } from '../components/RequestCard';
import { REQUEST_TYPES } from '../../domain/models/Request';
import type { RequestType } from '../../domain/models/Request';
import type { SectionName } from '../../domain/models/Seat';
import { SECTIONS } from '../../domain/constants/seating';

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

const CongregationView: React.FC<{
  serviceId: string;
  onSubmit: (payload: { section: SectionName; row: number; type: RequestType; note: string }) => Promise<boolean>;
  submitting: boolean;
}> = ({ onSubmit, submitting }) => {
  const [form, setForm] = useState<SubmitFormState>({
    section: '',
    row: '',
    type: '',
    note: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const selectedSection = SECTIONS.find((s) => s.name === form.section);
  const maxRow = selectedSection ? selectedSection.rows : 14;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.section || !form.row || !form.type) return;
    const success = await onSubmit({
      section: form.section as SectionName,
      row: form.row as number,
      type: form.type as RequestType,
      note: form.note,
    });
    if (success) {
      setSubmitted(true);
      setForm({ section: '', row: '', type: '', note: '' });
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  if (submitted) {
    return (
      <div className="card text-center py-10">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-primary">Request Sent!</h2>
        <p className="text-gray-500 text-sm mt-2">
          The Welcome Team will assist you shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="btn-primary mt-6 w-full"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-bold text-primary text-lg">Need Help?</h2>
      <p className="text-gray-500 text-sm">Let the Welcome Team know and they'll come to you.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Section
          </label>
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
          </label>
          <select
            value={form.row}
            onChange={(e) => setForm((f) => ({ ...f, row: parseInt(e.target.value) || '' }))}
            className="select-field"
            disabled={!form.section}
          >
            <option value="">Select row...</option>
            {Array.from({ length: maxRow }, (_, i) => i + 1).map((r) => (
              <option key={r} value={r}>
                Row {r}
              </option>
            ))}
          </select>
        </div>

        {/* Request type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            What do you need?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REQUEST_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type }))}
                className={`py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  form.type === type
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
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
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Tell us what you need..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!form.section || !form.row || !form.type || submitting}
          className="btn-primary w-full"
        >
          {submitting ? 'Sending...' : 'Send Request'}
        </button>
      </form>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
      </div>

      {/* Pending requests */}
      {pendingRequests.length === 0 ? (
        <div className="card text-center py-8">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-gray-500 text-sm">All clear! No pending requests.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendingRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              canResolve={true}
              isResolving={resolving.has(request.id)}
              onResolve={onResolve}
            />
          ))}
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
              {resolvedRequests.slice(0, 10).map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  canResolve={false}
                  isResolving={false}
                  onResolve={() => {}}
                />
              ))}
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
    submitRequest,
    resolveRequest,
  } = useRequests(serviceId);

  if (role === 'congregation') {
    return (
      <CongregationView
        serviceId={serviceId}
        onSubmit={submitRequest}
        submitting={submitting}
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
