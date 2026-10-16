// RiskWeave AI - Three-Minute Demo Walkthrough Guide Modal
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, Play, X, Compass, ExternalLink } from 'lucide-react';

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (caseId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  isOpen,
  onClose,
  onSelectCase,
  onNavigateTab
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Stage 1: Ambiguous Shared-Device Alert (0:00 - 0:25)',
      description: 'Start with RW-003 (Ambiguous Shared Device) or RW-005 (Household Device Sharing). An account opening alert flags a shared IP/device in a multi-tenant residential environment.',
      actionLabel: 'Load Case RW-003',
      action: () => {
        onSelectCase('RW-003');
        onNavigateTab('INVESTIGATION');
        onClose();
      }
    },
    {
      title: 'Stage 2: Graph Inspection & Source Provenance (0:25 - 0:55)',
      description: 'Switch to the "Relationship Graph" tab. Reveal that the shared device edge is an observed telemetry link, NOT an entity resolution confirmation or proof of common ownership. Open the "Evidence Ledger" to inspect the raw device telemetry source locator.',
      actionLabel: 'Inspect Graph',
      action: () => {
        onNavigateTab('INVESTIGATION');
        onClose();
      }
    },
    {
      title: 'Stage 3: Gemini Pipeline & Reviewer Challenge (0:55 - 1:25)',
      description: 'Run the investigation pipeline in Live AI or Fixture mode. Observe the recommendation (REQUEST_MORE_EVIDENCE under P01/P04). Inspect the independent Reviewer Challenge highlighting benign campus/household co-living explanations.',
      actionLabel: 'View AI Assessment',
      action: () => {
        onNavigateTab('INVESTIGATION');
        onClose();
      }
    },
    {
      title: 'Stage 4: Counterfactual Lab Sensitivity Test (1:25 - 1:55)',
      description: 'Switch to the Counterfactual Lab. Execute an experiment: "Add Household Sharing Explanation" or "Exclude One Observation". Watch the dependency DAG invalidate transitive edges and rerun on the clean cloned envelope, flipping the recommendation from REQUEST_MORE_EVIDENCE to CLEAR!',
      actionLabel: 'Open Counterfactual Lab',
      action: () => {
        onNavigateTab('COUNTERFACTUAL');
        onClose();
      }
    },
    {
      title: 'Stage 5: Accountable Human Decision & Audit Trail (1:55 - 2:20)',
      description: 'Return to Investigation and submit a defensible human decision with mandatory rationale. Switch to the Audit tab to verify the unbroken SHA-256 cryptographic hash chain, and export the formal Review Packet in JSON or print-ready HTML.',
      actionLabel: 'Inspect Audit Chain',
      action: () => {
        onNavigateTab('AUDIT');
        onClose();
      }
    },
    {
      title: 'Stage 6: Policy Replay & Evaluation Benchmarks (2:20 - 3:00)',
      description: 'Open Policy Replay to compare Case RW-012 under Policy v2026.01 (90-day freshness) vs v2026.07 (60-day freshness). Finally, open Evaluation to inspect the three-baseline controlled comparison (Rules vs Single-Call vs Full 3-Role Pipeline) with 95% Wilson confidence intervals.',
      actionLabel: 'Open Evaluation Center',
      action: () => {
        onNavigateTab('EVALUATION');
        onClose();
      }
    }
  ];

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">3-Minute Demonstration Script</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
            Step {currentStep + 1} of {steps.length}
          </div>
          <h4 className="text-sm font-bold text-slate-900">{current.title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            {current.description}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-200">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={current.action}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded shadow-xs flex items-center gap-1.5"
          >
            <span>{current.actionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
            disabled={currentStep === steps.length - 1}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded flex items-center gap-1"
          >
            <span>Next</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
