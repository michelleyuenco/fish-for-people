import React, { useState, useEffect } from 'react';
import type { ServiceRequest } from '../../domain/models/Request';
import { formatTimeElapsed } from '../../domain/rules/requestRules';
import { REQUEST_TYPE_ICONS, REQUEST_TYPE_COLORS } from '../../domain/constants/requests';

function getUrgencyClass(createdAt: Date, isResolved: boolean): string {
  if (isResolved) return '';
  const ageMs = Date.now() - createdAt.getTime();
  const ageMin = ageMs / 60000;
  if (ageMin >= 10) return 'border-l-4 border-l-danger';
  if (ageMin >= 2) return 'border-l-4 border-l-warning';
  return 'border-l-4 border-l-success';
}

interface RequestCardProps {
  request: ServiceRequest;
  canResolve: boolean;
  isResolving: boolean;
  onResolve: (id: string) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  canResolve,
  isResolving,
  onResolve,
}) => {
  const [timeElapsed, setTimeElapsed] = useState(formatTimeElapsed(request.createdAt));
  const [noteExpanded, setNoteExpanded] = useState(false);

  // Update time elapsed every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(formatTimeElapsed(request.createdAt));
    }, 30000);
    return () => clearInterval(interval);
  }, [request.createdAt]);

  const isResolved = request.status === 'resolved';
  const icon = REQUEST_TYPE_ICONS[request.type];
  const colorClass = REQUEST_TYPE_COLORS[request.type];
  const sectionLabel = request.section.charAt(0).toUpperCase() + request.section.slice(1);
  const urgencyClass = getUrgencyClass(request.createdAt, isResolved);
  const isUrgent = !isResolved && (Date.now() - request.createdAt.getTime()) >= 600000;

  return (
    <div
      className={`card transition-all duration-300 overflow-hidden ${
        isResolved ? 'opacity-50' : urgencyClass
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Type badge — icon + text for colorblind-safe redundant encoding */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${colorClass}`}
          role="img"
          aria-label={`Request type: ${request.type}`}
        >
          <span className="text-base leading-none" aria-hidden="true">{icon}</span>
          <span>{request.type}</span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-800">
              {sectionLabel} • Row {request.row}
            </span>
            {isUrgent && (
              <span className="text-xs bg-danger text-white px-2 py-0.5 rounded-full font-bold tracking-wide">
                ⚡ URGENT
              </span>
            )}
            {isResolved && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ✓ Resolved
              </span>
            )}
          </div>

          {request.note && (
            <div className="mt-1">
              <p className={`text-sm text-gray-600 ${noteExpanded ? '' : 'truncate'}`}>{request.note}</p>
              {request.note.length > 40 && (
                <button
                  type="button"
                  onClick={() => setNoteExpanded((v) => !v)}
                  className="text-xs text-primary font-medium mt-0.5 hover:underline"
                >
                  {noteExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-1">
            <span>{timeElapsed}</span>
            <span className="mx-1">·</span>
            <span title="Absolute time">{request.createdAt.toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>

        {/* Resolve button */}
        {canResolve && !isResolved && (
          <button
            onClick={() => onResolve(request.id)}
            disabled={isResolving}
            className="flex-shrink-0 bg-primary text-white text-sm font-medium px-3 py-2 rounded-lg min-h-[40px] transition-all active:scale-95 disabled:opacity-50"
          >
            {isResolving ? '...' : 'Done'}
          </button>
        )}
      </div>
    </div>
  );
};
