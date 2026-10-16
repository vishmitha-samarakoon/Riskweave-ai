// RiskWeave AI - Defensible Human Decision Panel
import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  Send, 
  FileSignature, 
  Lock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { ProposedAction, HumanDecision, Assessment } from '../../shared/types';

interface DecisionPanelProps {
  caseId: string;
  caseRevision: number;
  currentStatus: string;
  latestAssessment?: Assessment;
  decisions: HumanDecision[];
  onSubmitDecision: (decisionData: {
    disposition: ProposedAction;
    adoptedOrOverridden: 'ADOPTED' | 'OVERRIDDEN';
    reasonCode: string;
    notes: string;
    sourceAcknowledgements: string[];
    caseRevision: number;
  }) => Promise<void>;
  onSupervisorReopen: (reason: string) => Promise<void>;
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({
  caseId,
  caseRevision,
  currentStatus,
  latestAssessment,
  decisions,
  onSubmitDecision,
  onSupervisorReopen
}) => {
  const [disposition, setDisposition] = useState<ProposedAction>(
    latestAssessment?.proposedAction || 'REQUEST_MORE_EVIDENCE'
  );
  const [adoptedOrOverridden, setAdoptedOrOverridden] = useState<'ADOPTED' | 'OVERRIDDEN'>('ADOPTED');
  const [reasonCode, setReasonCode] = useState<string>('RC-POL-VERIFIED');
  const [notes, setNotes] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [showReopenInput, setShowReopenInput] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isDecided = currentStatus === 'DECIDED';
  const latestDecision = decisions[decisions.length - 1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!notes || notes.trim().length < 8) {
      setSubmitError('A defensible rationale of at least 8 characters is strictly required.');
      return;
    }

    if (!acknowledged) {
      setSubmitError('You must acknowledge review of cited evidence and the reviewer challenge.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitDecision({
        disposition,
        adoptedOrOverridden,
        reasonCode,
        notes: notes.trim(),
        sourceAcknowledgements: latestAssessment ? latestAssessment.claims.map(c => c.claimId) : [],
        caseRevision
      });
      setNotes('');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason || reopenReason.trim().length < 6) {
      setSubmitError('Supervisor reopen justification must be at least 6 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSupervisorReopen(reopenReason.trim());
      setShowReopenInput(false);
      setReopenReason('');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to reopen case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
          <FileSignature className="w-4 h-4 text-teal-600" />
          <span>Accountable Human Decision</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">Rev {caseRevision}</span>
      </div>

      <div className="p-4 space-y-4">
        {isDecided && latestDecision ? (
          /* Persisted Human Decision View */
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Adjudicated Disposition: {latestDecision.disposition}</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-800">
                  {new Date(latestDecision.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-slate-700">
                <strong>Mode:</strong> {latestDecision.adoptedOrOverridden} AI Recommendation
              </div>
              <div className="text-slate-700">
                <strong>Reason Code:</strong> {latestDecision.reasonCode}
              </div>
              <div className="text-slate-800 italic bg-white p-2 rounded border border-emerald-200">
                "{latestDecision.notes}"
              </div>
              <div className="text-[10px] text-slate-500">
                Actor: {latestDecision.actorId} · Persisted with SHA-256 hash chaining
              </div>
            </div>

            {/* Supervisor Reopen Controls */}
            {showReopenInput ? (
              <div className="p-3 rounded-md bg-purple-50 border border-purple-200 space-y-2 text-xs">
                <div className="font-semibold text-purple-900">Supervisor Reopen Justification</div>
                <textarea
                  rows={2}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Record mandatory supervisory justification to reopen this decided alert..."
                  className="w-full p-2 border border-purple-300 rounded text-xs bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReopenInput(false)}
                    className="px-2 py-1 text-xs text-slate-600 hover:bg-purple-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReopen}
                    disabled={isSubmitting}
                    className="px-3 py-1 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded transition-colors"
                  >
                    Commit Reopen
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowReopenInput(true)}
                className="w-full py-1.5 text-xs font-medium text-purple-800 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Supervisor Reopen Case</span>
              </button>
            )}
          </div>
        ) : (
          /* Active Decision Submission Form */
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {submitError && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Adopt vs Override */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Human Review Choice</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdoptedOrOverridden('ADOPTED');
                    if (latestAssessment) setDisposition(latestAssessment.proposedAction);
                  }}
                  className={`py-1.5 px-3 rounded text-center border font-medium transition-colors ${
                    adoptedOrOverridden === 'ADOPTED'
                      ? 'bg-teal-50 border-teal-600 text-teal-900 font-semibold shadow-xs'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Adopt AI Proposal
                </button>
                <button
                  type="button"
                  onClick={() => setAdoptedOrOverridden('OVERRIDDEN')}
                  className={`py-1.5 px-3 rounded text-center border font-medium transition-colors ${
                    adoptedOrOverridden === 'OVERRIDDEN'
                      ? 'bg-amber-50 border-amber-600 text-amber-900 font-semibold shadow-xs'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Override Proposal
                </button>
              </div>
            </div>

            {/* Disposition Selector */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Select Human Disposition</label>
              <select
                value={disposition}
                onChange={(e) => setDisposition(e.target.value as ProposedAction)}
                className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-900 bg-white"
              >
                <option value="CLEAR">CLEAR (Close Alert - No Fraud Finding)</option>
                <option value="REQUEST_MORE_EVIDENCE">REQUEST_MORE_EVIDENCE (Missing/Stale Facts)</option>
                <option value="ENHANCED_VERIFICATION">ENHANCED_VERIFICATION (Stepped-Up ID Check)</option>
                <option value="ESCALATE">ESCALATE (Refer to Senior Reviewer)</option>
              </select>
            </div>

            {/* Reason Code */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Standard Reason Code</label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-slate-800 bg-white"
              >
                <option value="RC-POL-VERIFIED">RC-POL-VERIFIED: All identity & account records fresh & verified</option>
                <option value="RC-POL-DUAL-CONCERN">RC-POL-DUAL-CONCERN: Corroborated dual independent concerns (P02)</option>
                <option value="RC-POL-STALE-GAP">RC-POL-STALE-GAP: Verification age exceeds policy threshold (P04)</option>
                <option value="RC-POL-ID-MISMATCH">RC-POL-ID-MISMATCH: Material field contradiction requiring stepped-up check</option>
                <option value="RC-OVERRIDE-ANALYST">RC-OVERRIDE-ANALYST: Analyst judgment based on external primary record</option>
              </select>
            </div>

            {/* Mandatory Notes */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Accountable Decision Rationale <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain the factual rationale for this human disposition. Minimum 8 characters required..."
                className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>

            {/* Source Acknowledgements */}
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-[11px] text-slate-600">
                I have inspected the evidence ledger, reviewed the alternative reviewer challenge, and verify this disposition adheres to internal policy pack RW-DEMO.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 rounded shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Recording Event...' : 'Record Human Decision'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
