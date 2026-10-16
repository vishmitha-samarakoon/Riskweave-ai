// RiskWeave AI - Policy Replay Component
import React, { useState } from 'react';
import { FileCheck2, GitCompare, Play, ArrowRight, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { CaseRecord, Evidence, CaseSnapshot, PolicyReplayResult, ExecutionMode } from '../../shared/types';
import { AVAILABLE_POLICIES } from '../../shared/policy/policies';

interface PolicyReplayViewProps {
  caseRecord: CaseRecord;
  evidenceList: Evidence[];
  executionMode: ExecutionMode;
  onRunReplay: (policyV1Id: string, policyV2Id: string) => Promise<PolicyReplayResult>;
}

export const PolicyReplayView: React.FC<PolicyReplayViewProps> = ({
  caseRecord,
  evidenceList,
  executionMode,
  onRunReplay
}) => {
  const [policyV1Id, setPolicyV1Id] = useState<string>('2026.01');
  const [policyV2Id, setPolicyV2Id] = useState<string>('2026.07');
  const [replayResult, setReplayResult] = useState<PolicyReplayResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await onRunReplay(policyV1Id, policyV2Id);
      setReplayResult(res);
    } catch (err: any) {
      setError(err.message || 'Policy replay failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Replay Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">Governance & Simulation</div>
            <h2 className="text-xl font-bold text-slate-900">Deterministic Policy Replay</h2>
          </div>
          <div className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
            Case: {caseRecord.caseId} (Snapshot As-Of: {new Date(caseRecord.createdAt).toLocaleDateString()})
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-md border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Audit Guarantee:</strong> Replay evaluates the identical immutable evidence snapshot against two explicitly dated policy versions. It does not overwrite historical case records or live audit events.
          </div>
        </div>
      </div>

      {/* Version Selector & Diffs */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          1. Select Policy Versions to Compare
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
            <label className="font-semibold text-slate-800">Historical Policy Version (Baseline):</label>
            <select
              value={policyV1Id}
              onChange={(e) => setPolicyV1Id(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
            >
              <option value="2026.01">RW-DEMO v2026.01 (90-Day Freshness Ceiling)</option>
            </select>
            <div className="text-[11px] text-slate-500">
              Effective Jan 1, 2026 · Superseded July 1, 2026
            </div>
          </div>

          <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/40 space-y-2">
            <label className="font-semibold text-teal-900">Current / Target Policy Version:</label>
            <select
              value={policyV2Id}
              onChange={(e) => setPolicyV2Id(e.target.value)}
              className="w-full p-2 border border-teal-300 rounded bg-white font-mono"
            >
              <option value="2026.07">RW-DEMO v2026.07 (60-Day Freshness + Household Exception)</option>
            </select>
            <div className="text-[11px] text-teal-700">
              Effective July 1, 2026 · Active Corporate Policy
            </div>
          </div>
        </div>

        {/* Clause Diffs Table */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Clause Amendments Between Versions
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-3 w-16">Clause</th>
                  <th className="py-2 px-3 w-1/3">v2026.01 Text</th>
                  <th className="py-2 px-3 w-1/3">v2026.07 Amended Text</th>
                  <th className="py-2 px-3">Operational Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-3 font-mono font-bold">P01</td>
                  <td className="py-2 px-3 text-slate-600">Shared device alone cannot escalate.</td>
                  <td className="py-2 px-3 text-slate-900 font-medium">Shared device or multi-occupant dwelling Wi-Fi constitutes weak association.</td>
                  <td className="py-2 px-3 text-teal-800">Explicit safe harbor for dorms/apartments</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold">P04</td>
                  <td className="py-2 px-3 text-slate-600">Evidence stale after 90 days.</td>
                  <td className="py-2 px-3 text-slate-900 font-medium">Evidence stale after 60 days.</td>
                  <td className="py-2 px-3 text-amber-800">Tightens verification renewal window</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold">P05</td>
                  <td className="py-2 px-3 text-slate-600">CLEAR requires fresh verified facts within 90 days.</td>
                  <td className="py-2 px-3 text-slate-900 font-medium">CLEAR requires facts within 60 days; verified household member resolves device alert.</td>
                  <td className="py-2 px-3 text-teal-800">Codifies household sharing exception</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleExecute}
          disabled={isRunning}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-2"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{isRunning ? 'Replaying Deterministic Gates...' : 'Run Side-by-Side Policy Replay'}</span>
        </button>
      </div>

      {/* Replay Results */}
      {replayResult && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Policy Replay Evaluated</div>
              <h3 className="text-base font-bold text-slate-900">
                {replayResult.deterministicDispositionChanged
                  ? 'Policy Change Alters Case Disposition!'
                  : 'Disposition Invariant Under Both Policy Versions'}
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-500">{replayResult.replayId}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Version 1 Outcome */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="font-bold text-slate-600 uppercase tracking-wider">
                Under Policy v{replayResult.policyV1Id}
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                {replayResult.v1Assessment.proposedAction}
              </div>
              <div className="text-slate-600">
                Allowed Actions: {replayResult.gateV1AllowedActions.join(', ')}
              </div>
              <p className="text-slate-700">
                {replayResult.v1Assessment.summary}
              </p>
            </div>

            {/* Version 2 Outcome */}
            <div className={`p-4 rounded-lg border space-y-2 text-xs ${
              replayResult.deterministicDispositionChanged
                ? 'border-teal-400 bg-teal-50/60'
                : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="font-bold text-teal-900 uppercase tracking-wider">
                Under Policy v{replayResult.policyV2Id}
              </div>
              <div className={`text-xl font-black font-mono ${
                replayResult.deterministicDispositionChanged ? 'text-teal-900 underline' : 'text-slate-900'
              }`}>
                {replayResult.v2Assessment.proposedAction}
              </div>
              <div className="text-slate-700">
                Allowed Actions: {replayResult.gateV2AllowedActions.join(', ')}
              </div>
              <p className="text-slate-800">
                {replayResult.v2Assessment.summary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
