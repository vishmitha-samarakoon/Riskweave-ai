// RiskWeave AI - Source Drawer Modal for Direct Claim Citation Inspection
import React from 'react';
import { X, ExternalLink, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { Evidence } from '../../shared/types';

interface SourceDrawerModalProps {
  evidence: Evidence | null;
  onClose: () => void;
}

export const SourceDrawerModal: React.FC<SourceDrawerModalProps> = ({
  evidence,
  onClose
}) => {
  if (!evidence) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="text-xs font-mono text-slate-500">Evidence Source Record</div>
              <h3 className="text-base font-bold text-slate-900 font-mono">{evidence.evidenceId}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status and Provenance Details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Source Locator:</span>
              <span className="font-medium text-slate-800 text-right">{evidence.sourceLocator}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Evidence Type:</span>
              <span className="font-semibold text-slate-800">{evidence.evidenceType}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Observed Date:</span>
              <span className="font-mono text-slate-800">{new Date(evidence.observedAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Verification Status:</span>
              <span className="font-semibold text-slate-900">{evidence.verificationStatus}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Freshness Status:</span>
              <span className="font-mono text-slate-900">{evidence.freshnessClass}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Independence Group:</span>
              <span className="font-mono text-slate-900">{evidence.independenceGroup}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Source SHA-256 Hash:</span>
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-[180px]" title={evidence.sourceHash}>
                {evidence.sourceHash}
              </span>
            </div>
          </div>

          {/* Structured Facts */}
          <div>
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
              Structured Record Facts
            </h4>
            <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
              <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap break-all">
                {JSON.stringify(evidence.structuredFacts, null, 2)}
              </pre>
            </div>
          </div>

          {/* Optional Untrusted Text Snippet */}
          {evidence.optionalUntrustedText && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-800">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Untrusted Document Extract</span>
              </div>
              <p className="text-xs text-red-700 italic">
                "{evidence.optionalUntrustedText}"
              </p>
              <p className="text-[11px] text-red-600">
                Untrusted content cannot modify policy gates or issue system commands.
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            Back to case
          </button>
        </div>
      </div>
    </div>
  );
};
