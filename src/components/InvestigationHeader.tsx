// RiskWeave AI - Investigation Case Header Component
import React from 'react';
import { 
  Play, 
  RotateCw, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { CaseRecord, ExecutionMode } from '../../shared/types';

interface InvestigationHeaderProps {
  caseRecord: CaseRecord;
  executionMode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
  onRunInvestigation: () => void;
  isInvestigating: boolean;
  policyVersion?: string;
}

export const InvestigationHeader: React.FC<InvestigationHeaderProps> = ({
  caseRecord,
  executionMode,
  onModeChange,
  onRunInvestigation,
  isInvestigating,
  policyVersion = '2026.07'
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Case Identity & Metadata */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-base font-bold text-slate-900">
              {caseRecord.caseId}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs font-mono text-slate-600">
              {caseRecord.applicationId}
            </span>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              Snapshot Rev {caseRecord.revision}
            </span>
            <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
              Policy v{policyVersion}
            </span>
            <span className="text-xs font-medium bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
              Synthetic Record
            </span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span><strong>Applicant:</strong> {caseRecord.applicantName}</span>
            <span>·</span>
            <span><strong>Product:</strong> {caseRecord.product}</span>
            <span>·</span>
            <span><strong>As-Of:</strong> {new Date(caseRecord.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Right: Mode Selector & Execution Button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Stale Warning Indicator */}
          {caseRecord.isStale && (
            <div className="px-2.5 py-1 bg-amber-50 border border-amber-300 rounded text-amber-800 text-xs font-medium flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Assessment Stale (New Evidence)</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center text-xs bg-slate-100 rounded border border-slate-200 p-0.5">
            <button
              onClick={() => onModeChange('LOCAL_FIXTURE')}
              className={`px-2.5 py-1 rounded transition-colors ${
                executionMode === 'LOCAL_FIXTURE'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Fixture
            </button>
            <button
              onClick={() => onModeChange('LIVE_GOOGLE')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                executionMode === 'LIVE_GOOGLE'
                  ? 'bg-teal-700 text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>Live AI</span>
            </button>
          </div>

          {/* Run Investigation Action */}
          <button
            type="button"
            onClick={onRunInvestigation}
            disabled={isInvestigating}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            {isInvestigating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{caseRecord.lastAssessedAction ? 'Re-Run Assessment' : 'Run Investigation'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
