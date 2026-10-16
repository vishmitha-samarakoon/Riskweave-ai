// RiskWeave AI - Connections (Graph) Modal Component
import React from 'react';
import { Network, X, Info } from 'lucide-react';
import { RelationshipGraphView } from './RelationshipGraphView';
import { BoundedGraph } from '../../shared/graph/graphEngine';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: BoundedGraph | null;
  caseId: string;
}

export const ConnectionsModal: React.FC<ConnectionsModalProps> = ({
  isOpen,
  onClose,
  graph,
  caseId
}) => {
  if (!isOpen || !graph) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">Entity Relationships</div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Network className="w-4 h-4 text-teal-600" />
              <span>Observed Connections · Case {caseId}</span>
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
            title="Return to case"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reminder Callout */}
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Policy Reminder (P01/P06):</strong> A shared device or address indicates observed telemetry, not common ownership or wrongdoing. Candidate entity matches remain isolated until verified.
          </span>
        </div>

        {/* Content Body: Graph + Accessible Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <RelationshipGraphView graph={graph} />
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
          >
            Back to case
          </button>
        </div>
      </div>
    </div>
  );
};
