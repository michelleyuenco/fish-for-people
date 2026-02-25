import React, { useState, useEffect } from 'react';
import type { ServiceRequest } from '../../domain/models/Request';
import { formatTimeElapsed } from '../../domain/rules/requestRules';
import { REQUEST_TYPE_ICONS, REQUEST_TYPE_COLORS } from '../../domain/constants/requests';

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

  return (
    <div
      className={`card transition-all duration-300 ${
        isResolved ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Type badge */}
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${colorClass}`}>
          <span>{icon}</span>
          <span>{request.type}</span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-800">
              {sectionLabel} •{' '}
              {request.areaLabel
                ? `${request.areaLabel} area`
                : `Row ${request.row}`}
            </span>
            {isResolved && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ✓ Resolved
              </span>
            )}
          </div>

          {request.note && (
            <p className="text-sm text-gray-600 mt-1 truncate">{request.note}</p>
          )}

          <p className="text-xs text-gray-400 mt-1">{timeElapsed}</p>
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
