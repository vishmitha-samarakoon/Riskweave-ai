// RiskWeave AI - Plain-Language Presentation Dictionary
// Maps internal domain and policy terms to user-facing everyday banking labels.

import { ProposedAction, RiskTier, EvidenceSufficiency, ExecutionMode, CaseStatus } from '../types';

export const UI_TERMS = {
  cases: 'Cases',
  evidence: 'Evidence',
  connections: 'Connections',
  counterfactual: 'What if the evidence changed?',
  policyReplay: 'Compare policy versions',
  suggestedCheck: 'Suggested check',
  reviewerChallenge: 'Another possible explanation',
  caseHistory: 'Case history',
  qualityChecks: 'Quality checks',
  evidenceVersion: 'Evidence version',
  provenance: 'Where this came from',
  evidenceSufficiency: 'Do we have enough evidence?',
} as const;

export interface ActionDefinition {
  label: string;
  description: string;
  meaning: string;
}

export const ACTION_DEFINITIONS: Record<ProposedAction, ActionDefinition> = {
  CLEAR: {
    label: 'Close this alert',
    description: 'No verified fraud concern remains under internal policy.',
    meaning: 'Record closure of this internal alert under the applicable policy. This does not approve an account or certify that a person is innocent.'
  },
  REQUEST_MORE_EVIDENCE: {
    label: 'Request missing information',
    description: 'Required identity or address records are missing or stale.',
    meaning: 'Create an internal task for specified evidence. The case remains waiting for information; this does not send a customer message.'
  },
  ENHANCED_VERIFICATION: {
    label: 'Request additional verification',
    description: 'A material identity contradiction requires stepped-up verification.',
    meaning: 'Route the case for the specific stronger verification required by policy. Explains the difference from simply supplying a missing record.'
  },
  ESCALATE: {
    label: 'Send for specialist review',
    description: 'Corroborated dual independent concerns require senior review.',
    meaning: 'Refer the case to the authorized specialist or supervisor. This does not establish fraud.'
  }
};

export interface SufficiencyDefinition {
  label: string;
  description: string;
}

export const SUFFICIENCY_DEFINITIONS: Record<EvidenceSufficiency, SufficiencyDefinition> = {
  COMPLETE: {
    label: 'Enough for this assessment',
    description: 'Required identity and account records are present and within freshness thresholds.'
  },
  PARTIAL: {
    label: 'Some evidence is missing',
    description: 'One or more required records are missing, expired, or pending resolution.'
  },
  INSUFFICIENT: {
    label: 'Not enough evidence',
    description: 'Critical decision records are unavailable to formulate a complete review.'
  }
};

export const RISK_TIER_DEFINITIONS: Record<RiskTier, { label: string; description: string }> = {
  LOW: {
    label: 'Low concern',
    description: 'Records are fresh, verified, and consistent with normal onboarding.'
  },
  REVIEW: {
    label: 'Review needed',
    description: 'Unresolved discrepancy, shared address, or stale document requires analyst inspection.'
  },
  HIGH: {
    label: 'Material concern',
    description: 'Multiple verified independent contradictions or confirmed prior adverse links detected.'
  }
};

export const EXECUTION_MODE_LABELS: Record<ExecutionMode, { badge: string; tooltip: string }> = {
  LOCAL_FIXTURE: {
    badge: 'Demo response — no live AI call',
    tooltip: 'Deterministic offline development response; no external model calls made.'
  },
  LIVE_GOOGLE: {
    badge: 'Live AI',
    tooltip: 'Evaluated by Google Gemini 3.8 Flash via server-side API.'
  },
  RECORDED_REPLAY: {
    badge: 'Saved run — not a new AI review',
    tooltip: 'Displays a previously recorded run with original hashes and timestamps.'
  }
};

export const STATUS_WORKFLOW_LABELS: Record<CaseStatus, string> = {
  NEW: 'New alert',
  IN_REVIEW: 'In review',
  WAITING_FOR_INFORMATION: 'Waiting for information',
  ADDITIONAL_VERIFICATION: 'Additional verification',
  AWAITING_SPECIALIST: 'Awaiting specialist',
  SUPERVISOR_REVIEW: 'Supervisor review needed',
  DECIDED: 'Decided',
  CLOSED: 'Closed',
  REOPENED: 'Reopened for review',
  ESCALATED: 'Sent for specialist review'
};
