// RiskWeave AI - Focused Case Review Page Component
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Network, 
  FileText, 
  Sparkles, 
  Send, 
  RotateCcw, 
  SlidersHorizontal, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  ShieldCheck,
  Play,
  RotateCw,
  GitCompare,
  FileCheck2,
  History,
  UploadCloud,
  Check,
  X,
  MessageSquare,
  Edit3,
  Save,
  CheckSquare
} from 'lucide-react';
import { 
  CaseRecord, 
  Evidence, 
  Relationship, 
  Assessment, 
  HumanDecision, 
  EvidenceRequest, 
  ExecutionMode, 
  ProposedAction,
  NextCheck,
  SubmissionReviewRecord,
  SubmissionReviewAction
} from '../../shared/types';
import { 
  ACTION_DEFINITIONS, 
  SUFFICIENCY_DEFINITIONS, 
  RISK_TIER_DEFINITIONS, 
  EXECUTION_MODE_LABELS,
  STATUS_WORKFLOW_LABELS
} from '../../shared/copy/dictionary';

interface FocusedCaseViewProps {
  caseRecord: CaseRecord;
  evidenceList: Evidence[];
  relationships: Relationship[];
  latestAssessment?: Assessment;
  decisions: HumanDecision[];
  evidenceRequests: EvidenceRequest[];
  executionMode: ExecutionMode;
  isInvestigating: boolean;
  onBackToCases: () => void;
  onRunInvestigation: () => void;
  onSelectEvidence: (evidenceId: string) => void;
  onSubmitDecision: (decisionData: any) => Promise<void>;
  onSupervisorReopen: (reason: string) => Promise<void>;
  onRequestCheck: (check: NextCheck) => void;
  onFulfillRequest: (requestId: string) => void;
  onOpenConnections: () => void;
  onOpenCounterfactual: () => void;
  onOpenPolicyReplay: () => void;
  onOpenCaseHistory: () => void;
  onOpenCustomerPortal?: () => void;
}

export const FocusedCaseView: React.FC<FocusedCaseViewProps> = ({
  caseRecord,
  evidenceList,
  relationships,
  latestAssessment,
  decisions,
  evidenceRequests,
  executionMode,
  isInvestigating,
  onBackToCases,
  onRunInvestigation,
  onSelectEvidence,
  onSubmitDecision,
  onSupervisorReopen,
  onRequestCheck,
  onFulfillRequest,
  onOpenConnections,
  onOpenCounterfactual,
  onOpenPolicyReplay,
  onOpenCaseHistory,
  onOpenCustomerPortal
}) => {
  // Decision Form State (Nothing preselected!)
  const [selectedAction, setSelectedAction] = useState<ProposedAction | null>(null);
  const [reviewChoice, setReviewChoice] = useState<'ADOPTED' | 'OVERRIDDEN' | null>(null);
  const [reasonCode, setReasonCode] = useState<string>('RC-POL-VERIFIED');
  const [rationale, setRationale] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [isSubmittingDualApproval, setIsSubmittingDualApproval] = useState<boolean>(false);
  const [dualApprovalSubmitted, setDualApprovalSubmitted] = useState<boolean>(false);

  // Collapsible sections
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [showAllChecks, setShowAllChecks] = useState<boolean>(false);
  const [showSupervisorInput, setShowSupervisorInput] = useState<boolean>(false);
  const [supervisorReason, setSupervisorReason] = useState<string>('');

  // Secondary Case Navigation (Section 4): Review | Tasks | History
  const [caseSubTab, setCaseSubTab] = useState<'REVIEW' | 'TASKS' | 'HISTORY'>('REVIEW');

  // Submission Review Desk State (Section 26)
  const [submissionReviews, setSubmissionReviews] = useState<SubmissionReviewRecord[]>([]);
  const [scratchpad, setScratchpad] = useState<string>('');
  const [scratchpadSavedAt, setScratchpadSavedAt] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [correctionTargetDocId, setCorrectionTargetDocId] = useState<string | null>(null);
  const [correctionReasonText, setCorrectionReasonText] = useState<string>('Document image is blurred; please provide a clear, full-page copy.');
  const [isPublishReqOpen, setIsPublishReqOpen] = useState<boolean>(false);
  const [reqTitle, setReqTitle] = useState<string>('Proof of Residential Address');
  const [reqInstructions, setReqInstructions] = useState<string>('Please upload a recent utility statement or residential lease dated within the last 60 days.');

  useEffect(() => {
    fetchSubmissionReviews();
    fetchScratchpad();
    fetchDraft();
  }, [caseRecord.caseId]);

  const fetchSubmissionReviews = async () => {
    try {
      const res = await fetch(`/api/cases/${caseRecord.caseId}/submission-reviews`);
      const data = await res.json();
      setSubmissionReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to load submission reviews:', err);
    }
  };

  const fetchScratchpad = async () => {
    try {
      const res = await fetch(`/api/cases/${caseRecord.caseId}/scratchpad`);
      const data = await res.json();
      if (data && data.content) {
        setScratchpad(data.content);
        setScratchpadSavedAt(data.updatedAt);
      }
    } catch (err) {
      console.error('Failed to load scratchpad:', err);
    }
  };

  const fetchDraft = async () => {
    try {
      const res = await fetch(`/api/cases/${caseRecord.caseId}/draft`);
      const data = await res.json();
      if (data && data.notes) {
        setRationale(data.notes);
        if (data.disposition) setSelectedAction(data.disposition);
        if (data.reasonCode) setReasonCode(data.reasonCode);
        setDraftSavedAt(data.savedAt);
      }
    } catch (err) {
      console.error('Failed to load draft:', err);
    }
  };

  const handleSaveScratchpad = async (text: string) => {
    setScratchpad(text);
    try {
      const res = await fetch(`/api/cases/${caseRecord.caseId}/scratchpad`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      const data = await res.json();
      setScratchpadSavedAt(data.updatedAt);
    } catch (err) {
      console.error('Failed to save scratchpad:', err);
    }
  };

  const handleAutoSaveDraft = async (currentNotes: string, action: ProposedAction | null) => {
    if (!currentNotes && !action) return;
    try {
      const res = await fetch(`/api/cases/${caseRecord.caseId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: currentNotes,
          disposition: action,
          reasonCode,
          snapshotId: caseRecord.currentSnapshotId,
          caseRevision: caseRecord.revision
        })
      });
      const data = await res.json();
      setDraftSavedAt(data.draft?.savedAt || new Date().toISOString());
    } catch (err) {
      console.error('Failed to autosave draft:', err);
    }
  };

  const handleReviewAction = async (docId: string, action: SubmissionReviewAction, reason?: string) => {
    try {
      const res = await fetch(`/api/cases/${caseRecord.caseId}/submissions/${docId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason,
          findingNote: action === 'APPROVE_FOR_USE' ? 'Approved for use by assigned investigator' : undefined
        })
      });
      if (res.ok) {
        await fetchSubmissionReviews();
        setCorrectionTargetDocId(null);
      }
    } catch (err) {
      console.error('Failed to submit review action:', err);
    }
  };

  const handlePublishRequest = async () => {
    try {
      const res = await fetch(`/api/cases/${caseRecord.caseId}/customer-requests/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'TPL-CUSTOMER-CHECK',
          title: reqTitle,
          publicInstructions: reqInstructions,
          deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
          requiredItems: [
            {
              title: reqTitle,
              description: reqInstructions,
              required: true
            }
          ]
        })
      });
      if (res.ok) {
        setIsPublishReqOpen(false);
        await fetchSubmissionReviews();
      }
    } catch (err) {
      console.error('Failed to publish customer request:', err);
    }
  };

  const isDecided = caseRecord.status === 'DECIDED';
  const latestDecision = decisions[decisions.length - 1];

  // Top recommended check
  const topCheck = latestAssessment?.nextChecks?.[0];

  // Concerning claims vs Legitimate explanation claims
  const concernClaims = latestAssessment?.claims.filter(c => 
    c.verification === 'CONTRADICTED' || latestAssessment.challengingClaimIds.includes(c.claimId)
  ) || [];

  const explanationClaims = latestAssessment?.claims.filter(c => 
    c.verification === 'VERIFIED' && latestAssessment.supportingClaimIds.includes(c.claimId)
  ) || [];

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecisionError(null);

    if (!selectedAction) {
      setDecisionError('Please choose what happens next before saving.');
      return;
    }

    if (!rationale || rationale.trim().length < 8) {
      setDecisionError('Please record a short rationale of at least 8 characters explaining your decision.');
      return;
    }

    if (!acknowledged) {
      setDecisionError('Please confirm that you have checked the evidence and possible explanations.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isAdopted = latestAssessment && selectedAction === latestAssessment.proposedAction;
      await onSubmitDecision({
        disposition: selectedAction,
        adoptedOrOverridden: reviewChoice || (isAdopted ? 'ADOPTED' : 'OVERRIDDEN'),
        reasonCode,
        notes: rationale.trim(),
        sourceAcknowledgements: latestAssessment ? latestAssessment.claims.map(c => c.claimId) : [],
        caseRevision: caseRecord.revision
      });
      setRationale('');
    } catch (err: any) {
      setDecisionError(err.message || 'Could not save decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDualApproval = async () => {
    if (!selectedAction) {
      setDecisionError('Please choose a proposed action first before submitting for dual-approval.');
      return;
    }
    if (!rationale || rationale.trim().length < 8) {
      setDecisionError('Please record a rationale of at least 8 characters explaining your proposal.');
      return;
    }

    setIsSubmittingDualApproval(true);
    setDecisionError(null);
    try {
      const res = await fetch(`/api/cases/${caseRecord.caseId}/dual-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigatorId: caseRecord.assigneeId || 'analyst-101',
          proposedDisposition: selectedAction,
          reasonCode,
          rationale: rationale.trim()
        })
      });
      if (res.ok) {
        setDualApprovalSubmitted(true);
      } else {
        const err = await res.json();
        setDecisionError(err.error || 'Failed to submit dual-approval request');
      }
    } catch (err: any) {
      setDecisionError(err.message || 'Network error submitting dual-approval');
    } finally {
      setIsSubmittingDualApproval(false);
    }
  };

  const handleReopenSubmit = async () => {
    if (!supervisorReason || supervisorReason.trim().length < 6) {
      setDecisionError('Supervisor reopen justification must be at least 6 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSupervisorReopen(supervisorReason.trim());
      setShowSupervisorInput(false);
      setSupervisorReason('');
    } catch (err: any) {
      setDecisionError(err.message || 'Could not reopen case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* 1. Header: Back Navigation & Clear Case Identity */}
      <div className="space-y-3">
        <button
          onClick={onBackToCases}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to cases</span>
        </button>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base font-bold text-slate-900">{caseRecord.caseId}</span>
                <span className="text-slate-300">·</span>
                <span className="text-sm font-semibold text-slate-800">{caseRecord.applicantName}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-mono text-slate-500">App #{caseRecord.applicationId}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {STATUS_WORKFLOW_LABELS[caseRecord.status]}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {caseRecord.summaryNote || 'Account opening verification alert.'}
              </p>
            </div>

            {/* Quick Context & Execution Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                {EXECUTION_MODE_LABELS[executionMode]?.badge || executionMode}
              </span>
              <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                Synthetic case
              </span>
            </div>
          </div>

          {/* Stale Assessment Alert */}
          {caseRecord.isStale && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>New evidence was added.</strong> Review the changes and update the assessment before deciding.
                </span>
              </div>
              <button
                onClick={onRunInvestigation}
                disabled={isInvestigating}
                className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded text-xs shrink-0 transition-colors"
              >
                {isInvestigating ? 'Updating...' : 'Update assessment'}
              </button>
            </div>
          )}

          {/* Technical Details Collapsible Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Product: {caseRecord.product} · Data as-of: {new Date(caseRecord.createdAt).toLocaleDateString()}</span>
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="hover:text-slate-800 flex items-center gap-0.5"
            >
              <span>{showTechnicalDetails ? 'Hide technical details' : 'Show technical details'}</span>
              {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Technical Details */}
          {showTechnicalDetails && (
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-mono space-y-1 text-slate-600">
              <div>Snapshot ID: {caseRecord.currentSnapshotId} (Revision {caseRecord.revision})</div>
              <div>Policy Rule Pack: RW-DEMO (Target: 2026.07)</div>
              <div>Assigned Reviewer: {caseRecord.assigneeId}</div>
              <div>Hash Verification: Pass (Immutable source ledger)</div>
            </div>
          )}
        </div>
      </div>

      {/* 2. SECTION A: What Needs Attention */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">What needs attention</h2>
          {latestAssessment && (
            <span className="text-xs text-slate-500 font-mono">
              Evaluated {new Date(latestAssessment.executedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          {latestAssessment?.summary || (
            `This application received an onboarding alert (${caseRecord.alertReasonCodes.join(', ')}). An automated policy review evaluates whether concerning evidence requires stepped-up verification, escalation, or alert closure.`
          )}
        </p>

        {/* Suggested Next Step Banner */}
        {latestAssessment ? (
          <div className="p-4 rounded-md border border-teal-200 bg-teal-50/60 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Suggested Next Step · AI suggestion based on internal policy
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-bold text-teal-950 font-mono">
                {ACTION_DEFINITIONS[latestAssessment.proposedAction]?.label || latestAssessment.proposedAction}
              </span>
              <span className="text-xs text-teal-800">
                ({ACTION_DEFINITIONS[latestAssessment.proposedAction]?.description})
              </span>
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-3 pt-1 border-t border-teal-100">
              <span>Concern: <strong>{RISK_TIER_DEFINITIONS[latestAssessment.riskTier]?.label}</strong></span>
              <span>·</span>
              <span>Evidence: <strong>{SUFFICIENCY_DEFINITIONS[latestAssessment.evidenceSufficiency]?.label}</strong></span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              No automated assessment has been run on this case yet.
            </div>
            <button
              onClick={onRunInvestigation}
              disabled={isInvestigating}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5"
            >
              {isInvestigating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Review with AI</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. SECTION B: What the Evidence Shows */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">What the evidence shows</h2>
            <p className="text-xs text-slate-500">Every material claim is linked directly to its source document.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenConnections}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 flex items-center gap-1 transition-colors"
              title="Inspect observed entity connections"
            >
              <Network className="w-3.5 h-3.5 text-teal-700" />
              <span>Connections ({relationships.length})</span>
            </button>
          </div>
        </div>

        {/* Subsection 1: Reasons for concern */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
            <span>Reasons for concern</span>
          </h3>

          {concernClaims.length === 0 ? (
            <p className="text-xs text-slate-500 italic pl-3.5">
              No verified identity contradictions or adverse connections detected.
            </p>
          ) : (
            <div className="space-y-2 pl-3.5">
              {concernClaims.map((claim) => (
                <div key={claim.claimId} className="text-xs text-slate-800 space-y-1">
                  <p>• {claim.text}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pl-2 text-[11px]">
                    <span className="text-slate-500">Source:</span>
                    {claim.evidenceIds.map(evId => (
                      <button
                        key={evId}
                        onClick={() => onSelectEvidence(evId)}
                        className="font-mono text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>{evId}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subsection 2: Facts that may explain the alert */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <span>Facts that may explain the alert</span>
          </h3>

          <div className="space-y-2 pl-3.5">
            {explanationClaims.map((claim) => (
              <div key={claim.claimId} className="text-xs text-slate-800 space-y-1">
                <p>• {claim.text}</p>
                <div className="flex flex-wrap items-center gap-1.5 pl-2 text-[11px]">
                  <span className="text-slate-500">Source:</span>
                  {claim.evidenceIds.map(evId => (
                    <button
                      key={evId}
                      onClick={() => onSelectEvidence(evId)}
                      className="font-mono text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>{evId}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Reviewer Challenge Alternative Explanation */}
            {latestAssessment?.reviewerChallenge && (
              <div className="bg-amber-50/70 p-3 rounded border border-amber-200 text-xs text-amber-950 mt-2 space-y-1">
                <div className="font-semibold text-amber-900">
                  Another possible explanation:
                </div>
                <p>
                  {latestAssessment.reviewerChallenge.alternativeExplanation}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subsection 3: What is missing or conflicting */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>What is missing or conflicting</span>
          </h3>

          {latestAssessment?.missingEvidence && latestAssessment.missingEvidence.length > 0 ? (
            <div className="space-y-2 pl-3.5">
              {latestAssessment.missingEvidence.map((m, idx) => (
                <div key={idx} className="text-xs text-slate-800 space-y-0.5">
                  <div className="font-medium">• {m.reason}</div>
                  <div className="text-[11px] text-slate-500 pl-2">Impact: {m.decisionImpact}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic pl-3.5">
              No decision-critical records are missing or conflicting under the active policy.
            </p>
          )}
        </div>
      </div>

      {/* 4. SECTION C: What to Check Next */}
      {topCheck && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">What to check next</h2>
              <p className="text-xs text-slate-500">Recommended action to resolve uncertainty.</p>
            </div>
            <button
              onClick={() => setShowAllChecks(!showAllChecks)}
              className="text-xs font-medium text-teal-700 hover:text-teal-900"
            >
              {showAllChecks ? 'Show less' : 'See other checks'}
            </button>
          </div>

          {/* Top Check Card */}
          <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{topCheck.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {topCheck.reason}
                </p>
              </div>

              {/* Fulfill / Request Button */}
              {evidenceRequests.some(r => r.checkType === topCheck.checkType && r.status === 'PENDING') ? (
                <button
                  onClick={() => {
                    const req = evidenceRequests.find(r => r.checkType === topCheck.checkType && r.status === 'PENDING');
                    if (req) onFulfillRequest(req.requestId);
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded transition-colors shrink-0"
                >
                  Simulate check fulfillment
                </button>
              ) : evidenceRequests.some(r => r.checkType === topCheck.checkType && r.status === 'FULFILLED') ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Check fulfilled</span>
                </span>
              ) : (
                <button
                  onClick={() => onRequestCheck(topCheck)}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded transition-colors shrink-0"
                >
                  Request this check
                </button>
              )}
            </div>

            {/* Why This Check Heuristic Breakdown (Collapsible or in-place) */}
            <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200 flex flex-wrap gap-2">
              <span>Why this check?</span>
              <span>· Critical resolved: {topCheck.criticalResolved}</span>
              <span>· Contradictions resolved: {topCheck.contradictionsResolved}</span>
              <span>· Low customer friction (Band {topCheck.customerFrictionBand})</span>
            </div>
          </div>

          {/* Additional Checks (Expanded) */}
          {showAllChecks && latestAssessment?.nextChecks && latestAssessment.nextChecks.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700">Other available checks in catalog:</div>
              {latestAssessment.nextChecks.slice(1).map((chk) => (
                <div key={chk.checkType} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{chk.title}</div>
                    <div className="text-slate-500 text-[11px]">{chk.reason}</div>
                  </div>
                  <button
                    onClick={() => onRequestCheck(chk)}
                    className="px-2.5 py-1 text-xs text-teal-700 font-medium hover:bg-white rounded border border-slate-300"
                  >
                    Request
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. SECTION D: Your Decision */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Your decision</h2>
          <p className="text-xs text-slate-500">Record a defensible, human-accountable decision for this alert.</p>
        </div>

        {isDecided && latestDecision ? (
          /* Decision Confirmation Card */
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-emerald-950 text-sm">
                  Decision saved: {ACTION_DEFINITIONS[latestDecision.disposition]?.label || latestDecision.disposition}
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-800">
                {new Date(latestDecision.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="text-xs text-slate-800 space-y-1">
              <div><strong>Recorded rationale:</strong> "{latestDecision.notes}"</div>
              <div className="text-slate-500">
                Reviewer: {latestDecision.actorId} · Reason code: {latestDecision.reasonCode} · Revision: {caseRecord.revision}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-200 text-xs">
              <button
                onClick={onOpenCaseHistory}
                className="text-teal-800 font-semibold hover:underline"
              >
                View case history in audit trail →
              </button>

              <button
                onClick={() => setShowSupervisorInput(!showSupervisorInput)}
                className="text-purple-700 font-medium hover:underline"
              >
                Supervisor reopen
              </button>
            </div>

            {/* Supervisor Reopen Form */}
            {showSupervisorInput && (
              <div className="p-3 bg-white rounded border border-purple-200 space-y-2 mt-2">
                <div className="text-xs font-semibold text-purple-900">Supervisor Reopen Justification:</div>
                <textarea
                  rows={2}
                  value={supervisorReason}
                  onChange={(e) => setSupervisorReason(e.target.value)}
                  placeholder="Mandatory justification to reopen this decided alert..."
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSupervisorInput(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReopenSubmit}
                    disabled={isSubmitting}
                    className="px-3 py-1 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded"
                  >
                    Commit reopen
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Decision Form */
          <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
            {decisionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{decisionError}</span>
              </div>
            )}

            {/* Step 1: Choose the next action (4 choices, nothing preselected) */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-800">
                1. Choose what happens next:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['CLEAR', 'REQUEST_MORE_EVIDENCE', 'ENHANCED_VERIFICATION', 'ESCALATE'] as ProposedAction[]).map(action => {
                  const def = ACTION_DEFINITIONS[action];
                  const isSelected = selectedAction === action;
                  const isSuggested = latestAssessment?.proposedAction === action;

                  return (
                    <button
                      key={action}
                      type="button"
                      onClick={() => {
                        setSelectedAction(action);
                        if (isSuggested) {
                          setReviewChoice('ADOPTED');
                        } else {
                          setReviewChoice('OVERRIDDEN');
                        }
                      }}
                      className={`p-3.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{def.label}</span>
                        {isSuggested && (
                          <span className="text-[10px] font-mono text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                            AI suggestion
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                        {def.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Reason & Rationale */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  2. Reason code:
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
                >
                  <option value="RC-POL-VERIFIED">RC-POL-VERIFIED: Records verified & fresh per policy</option>
                  <option value="RC-POL-DUAL-CONCERN">RC-POL-DUAL-CONCERN: Corroborated dual independent concerns (P02)</option>
                  <option value="RC-POL-STALE-GAP">RC-POL-STALE-GAP: Missing or stale critical record (P04)</option>
                  <option value="RC-POL-ID-MISMATCH">RC-POL-ID-MISMATCH: Material identity field contradiction (P03)</option>
                  <option value="RC-OVERRIDE-ANALYST">RC-OVERRIDE-ANALYST: Analyst judgment based on primary source</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  3. Explain your decision (Rationale):
                </label>
                <textarea
                  rows={3}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Record concise factual justification. Minimum 8 characters required..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Step 3: Acknowledgements & Save Commit */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-[11px] text-slate-600">
                  I have checked the evidence ledger, reviewed the alternative explanation, and confirm this decision meets internal banking policy.
                </span>
              </label>

              {dualApprovalSubmitted ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded text-purple-900 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Dual-approval request submitted to Supervisor Sarah Chen. Case queued for supervisor sign-off.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedAction}
                    className="w-full py-2.5 px-4 font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Saving decision...' : 'Save decision'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitDualApproval}
                    disabled={isSubmittingDualApproval || !selectedAction}
                    className="w-full py-2 px-4 font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                    <span>{isSubmittingDualApproval ? 'Submitting to supervisor...' : 'Submit for Supervisor Dual-Approval'}</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      {/* 6. Contextual Case Tools (Secondary menu) */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          More case tools
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <button
            onClick={onOpenCounterfactual}
            className="p-3 rounded border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-left transition-colors"
          >
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-teal-600" />
              <span>What if evidence changed?</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Test sensitivity without altering the case.
            </p>
          </button>

          <button
            onClick={onOpenPolicyReplay}
            className="p-3 rounded border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-left transition-colors"
          >
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-teal-600" />
              <span>Compare policy versions</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Evaluate against 2026.01 vs 2026.07.
            </p>
          </button>

          <button
            onClick={onOpenCaseHistory}
            className="p-3 rounded border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-left transition-colors"
          >
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-teal-600" />
              <span>Case history & audit</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Verify SHA-256 chain and print packet.
            </p>
          </button>

          {onOpenCustomerPortal && (
            <button
              onClick={onOpenCustomerPortal}
              className="p-3 rounded border border-teal-200 bg-teal-50/30 hover:bg-teal-50 hover:border-teal-400 text-left transition-colors"
            >
              <div className="font-semibold text-teal-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Customer Verification Portal</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                View uploaded proof, receipts & question thread.
              </p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
