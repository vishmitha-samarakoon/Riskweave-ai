// RiskWeave AI - Assessment Panel Component
import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  FileCheck2, 
  HelpCircle, 
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { Assessment, ProposedAction, RiskTier, EvidenceSufficiency } from '../../shared/types';

interface AssessmentPanelProps {
  assessment: Assessment;
  onSelectClaimEvidence?: (evidenceId: string) => void;
  onOpenExperiment?: (experimentId: string) => void;
}

export const AssessmentPanel: React.FC<AssessmentPanelProps> = ({
  assessment,
  onSelectClaimEvidence,
  onOpenExperiment
}) => {
  const getActionBannerStyle = (action: ProposedAction) => {
    switch (action) {
      case 'CLEAR':
        return 'bg-emerald-50 border-emerald-300 text-emerald-900';
      case 'ESCALATE':
        return 'bg-red-50 border-red-300 text-red-900';
      case 'ENHANCED_VERIFICATION':
        return 'bg-amber-50 border-amber-300 text-amber-900';
      case 'REQUEST_MORE_EVIDENCE':
        return 'bg-sky-50 border-sky-300 text-sky-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Recommendation Banner */}
      <div className={`p-4 rounded-lg border ${getActionBannerStyle(assessment.proposedAction)} flex flex-col md:flex-row gap-4 items-start md:items-center justify-between`}>
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Validated Assessment Recommendation
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black font-mono tracking-tight">
              {assessment.proposedAction}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-300 text-slate-800">
              Risk: {assessment.riskTier}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-300 text-slate-800">
              Sufficiency: {assessment.evidenceSufficiency}
            </span>
          </div>
          <p className="text-xs text-slate-700 max-w-2xl mt-1">
            {assessment.summary}
          </p>
        </div>

        <div className="text-right text-[11px] text-slate-500 font-mono shrink-0">
          <div>Executed: {new Date(assessment.executedAt).toLocaleTimeString()}</div>
          <div>Mode: {assessment.executionMode}</div>
          {assessment.latencyMs && <div>Latency: {assessment.latencyMs}ms</div>}
        </div>
      </div>

      {/* Reviewer Challenge (Adversarial Alternative Hypothesis) */}
      <div className="bg-amber-50/70 p-4 rounded-lg border border-amber-200 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Independent Reviewer Challenge & Alternative Hypothesis</span>
        </div>
        <p className="text-xs text-amber-950 font-medium">
          {assessment.reviewerChallenge.alternativeExplanation}
        </p>
        <div className="text-[11px] text-amber-800 flex flex-wrap gap-2 pt-1">
          <span className="font-semibold">Unresolved Questions:</span>
          {assessment.reviewerChallenge.unresolvedIssues.map((issue, idx) => (
            <span key={idx} className="bg-white/80 px-1.5 py-0.5 rounded border border-amber-200">
              · {issue}
            </span>
          ))}
        </div>
      </div>

      {/* Structured Claims Ledger */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Structured Claim Support ({assessment.claims.length} Claims)
          </h4>
          <div className="text-xs text-slate-500">
            <span className="text-emerald-700 font-semibold">{assessment.supportingClaimIds.length} Supporting</span>
            {' · '}
            <span className="text-red-700 font-semibold">{assessment.challengingClaimIds.length} Challenging</span>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {assessment.claims.map(claim => (
            <div key={claim.claimId} className="p-3 text-xs space-y-1.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-900">{claim.claimId}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    claim.kind === 'FACT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    claim.kind === 'INFERENCE' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {claim.kind}
                  </span>
                  <span className={`font-semibold text-[11px] ${
                    claim.verification === 'VERIFIED' ? 'text-emerald-700' :
                    claim.verification === 'CONTRADICTED' ? 'text-red-700' :
                    'text-amber-700'
                  }`}>
                    · {claim.verification}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  Clauses: {claim.policyClauseRefs.join(', ')}
                </div>
              </div>

              <p className="text-slate-800">{claim.text}</p>

              {/* Clickable Citations */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 font-medium">Source Evidence:</span>
                {claim.evidenceIds.map(evId => (
                  <button
                    key={evId}
                    onClick={() => onSelectClaimEvidence?.(evId)}
                    className="font-mono text-[11px] text-teal-700 hover:text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 hover:border-teal-300 inline-flex items-center gap-0.5"
                  >
                    <span>{evId}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Findings Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 p-3 bg-slate-50 border-b border-slate-200">
          Policy Predicate Gate Evaluation
        </h4>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="py-2 px-3">Clause ID</th>
              <th className="py-2 px-3">Policy Finding Result</th>
              <th className="py-2 px-3">Deterministic Explanation</th>
              <th className="py-2 px-3">Evidence Cited</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {assessment.policyFindings.map((finding, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-2 px-3 font-mono font-bold text-slate-900">{finding.clauseId}</td>
                <td className="py-2 px-3 font-mono">
                  <span className={`inline-flex items-center gap-1 font-semibold ${
                    finding.result === 'SATISFIED' ? 'text-emerald-700' :
                    finding.result === 'CONFLICT' ? 'text-red-700' :
                    'text-slate-600'
                  }`}>
                    {finding.result === 'SATISFIED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    {finding.result === 'NOT_SATISFIED' && <XCircle className="w-3 h-3 text-slate-400" />}
                    <span>{finding.result}</span>
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-800">{finding.explanation}</td>
                <td className="py-2 px-3 font-mono text-slate-500">{finding.evidenceIds.join(', ') || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Limitations Disclaimer */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
        <div className="font-semibold text-slate-800 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Operational Boundaries & Limitations</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
          {assessment.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
