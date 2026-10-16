// RiskWeave AI - Next Best Check Component
import React, { useState } from 'react';
import { ListChecks, ArrowRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { NextCheck, EvidenceRequest } from '../../shared/types';

interface NextBestCheckCardProps {
  nextChecks: NextCheck[];
  existingRequests: EvidenceRequest[];
  onRequestCheck: (check: NextCheck) => void;
  onFulfillRequest: (requestId: string) => void;
}

export const NextBestCheckCard: React.FC<NextBestCheckCardProps> = ({
  nextChecks,
  existingRequests,
  onRequestCheck,
  onFulfillRequest
}) => {
  const [loadingCheck, setLoadingCheck] = useState<string | null>(null);

  if (!nextChecks || nextChecks.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs text-slate-500">
        No additional verification checks currently required.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
          <ListChecks className="w-4 h-4 text-teal-600" />
          <span>Next Best Verification Checks</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">Heuristic Ranked</span>
      </div>

      <div className="p-3 space-y-3">
        {nextChecks.slice(0, 3).map(check => {
          const activeRequest = existingRequests.find(r => r.checkType === check.checkType);
          const isPending = activeRequest && activeRequest.status === 'PENDING';
          const isFulfilled = activeRequest && activeRequest.status === 'FULFILLED';

          return (
            <div 
              key={check.checkType} 
              className="p-3 rounded-md border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-slate-900">{check.title}</div>
                <div className="font-mono text-[11px] font-bold text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded shrink-0">
                  Priority: {check.priorityScore}
                </div>
              </div>

              <p className="text-slate-600 text-[11px]">
                {check.reason}
              </p>

              {/* Heuristic Formula Breakdown */}
              <div className="bg-white p-1.5 rounded border border-slate-200 text-[10px] font-mono text-slate-500 flex flex-wrap gap-2">
                <span>Crit: {check.criticalResolved}</span>
                <span>· Contra: {check.contradictionsResolved}</span>
                <span>· PolReq: {check.policyRequired ? 'Yes' : 'No'}</span>
                <span>· Effort: {check.analystEffortBand}</span>
                <span>· Friction: {check.customerFrictionBand}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                {isFulfilled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fulfilled with Supplemental Evidence</span>
                  </span>
                ) : isPending ? (
                  <button
                    onClick={() => onFulfillRequest(activeRequest.requestId)}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Simulate Fulfill & Import</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onRequestCheck(check)}
                    className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors flex items-center gap-1"
                  >
                    <span>Request Internal Check</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
