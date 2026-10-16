// RiskWeave AI - Evidence Ledger & Source Drawer Component
import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  ShieldAlert, 
  X,
  Filter
} from 'lucide-react';
import { Evidence, VerificationStatus, FreshnessClass } from '../../shared/types';

interface EvidenceLedgerProps {
  evidenceList: Evidence[];
  activeEvidenceId?: string;
  onSelectEvidence?: (evidenceId: string) => void;
}

export const EvidenceLedger: React.FC<EvidenceLedgerProps> = ({
  evidenceList,
  activeEvidenceId,
  onSelectEvidence
}) => {
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<Evidence | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredEvidence = evidenceList.filter(e => {
    if (statusFilter === 'ALL') return true;
    return e.verificationStatus === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">Filter Verification:</span>
          <div className="flex items-center gap-1">
            {['ALL', 'VERIFIED', 'UNVERIFIED', 'CONTRADICTED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  statusFilter === status 
                    ? 'bg-slate-800 text-white font-medium' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <span className="font-mono tabular-nums">{filteredEvidence.length} / {evidenceList.length} Records</span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-2.5 px-3">Evidence ID</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Source Locator & Register</th>
              <th className="py-2.5 px-3">Verification</th>
              <th className="py-2.5 px-3">Freshness</th>
              <th className="py-2.5 px-3">Independence Group</th>
              <th className="py-2.5 px-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredEvidence.map(item => {
              const isSelected = activeEvidenceId === item.evidenceId;
              return (
                <tr
                  key={item.evidenceId}
                  onClick={() => {
                    setSelectedDrawerItem(item);
                    onSelectEvidence?.(item.evidenceId);
                  }}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-teal-50' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                    {item.evidenceId}
                  </td>

                  <td className="py-2.5 px-3 text-slate-700">
                    {item.evidenceType}
                  </td>

                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={item.sourceLocator}>
                    {item.sourceLocator}
                  </td>

                  <td className="py-2.5 px-3 font-medium">
                    <span className={`inline-flex items-center gap-1 ${
                      item.verificationStatus === 'VERIFIED' ? 'text-emerald-700' :
                      item.verificationStatus === 'CONTRADICTED' ? 'text-red-700' :
                      'text-amber-700'
                    }`}>
                      {item.verificationStatus === 'VERIFIED' && <CheckCircle className="w-3 h-3" />}
                      {item.verificationStatus === 'CONTRADICTED' && <XCircle className="w-3 h-3" />}
                      {item.verificationStatus === 'UNVERIFIED' && <AlertTriangle className="w-3 h-3" />}
                      <span>{item.verificationStatus}</span>
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                      item.freshnessClass === 'FRESH' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      item.freshnessClass === 'AGING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-red-50 text-red-700 border border-red-200 font-semibold'
                    }`}>
                      {item.freshnessClass}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {item.independenceGroup}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawerItem(item);
                      }}
                      className="text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-0.5"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-over Source Drawer Modal */}
      {selectedDrawerItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-mono text-slate-500">Evidence Source Record</div>
                  <h3 className="text-base font-bold text-slate-900 font-mono">{selectedDrawerItem.evidenceId}</h3>
                </div>
                <button
                  onClick={() => setSelectedDrawerItem(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Provenance Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Source Locator:</span>
                  <span className="font-medium text-slate-800 text-right">{selectedDrawerItem.sourceLocator}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Observed Timestamp:</span>
                  <span className="font-mono text-slate-800">{new Date(selectedDrawerItem.observedAt).toUTCString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Ingested Timestamp:</span>
                  <span className="font-mono text-slate-800">{new Date(selectedDrawerItem.ingestedAt).toUTCString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Verification Status:</span>
                  <span className="font-semibold text-slate-900">{selectedDrawerItem.verificationStatus}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Freshness Class:</span>
                  <span className="font-mono text-slate-900">{selectedDrawerItem.freshnessClass}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Independence Group:</span>
                  <span className="font-mono text-slate-900">{selectedDrawerItem.independenceGroup}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Source SHA-256 Hash:</span>
                  <span className="font-mono text-[11px] text-slate-600 truncate max-w-[200px]" title={selectedDrawerItem.sourceHash}>
                    {selectedDrawerItem.sourceHash}
                  </span>
                </div>
              </div>

              {/* Structured Facts */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">Structured Record Facts</h4>
                <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
                  <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedDrawerItem.structuredFacts, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Optional Untrusted Text Snippet */}
              {selectedDrawerItem.optionalUntrustedText && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-800">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    <span>Untrusted Document Extract (Prompt Isolation Guard)</span>
                  </div>
                  <p className="text-xs text-red-700 italic">
                    "{selectedDrawerItem.optionalUntrustedText}"
                  </p>
                  <p className="text-[11px] text-red-600">
                    Note: Embedded text cannot override pipeline instructions or bypass policy rules.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedDrawerItem(null)}
                className="w-full py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
