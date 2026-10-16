// RiskWeave AI - Synthetic Policy Pack RW-DEMO (v2026.01 & v2026.07)
import { PolicyVersion, PolicyClause, ProposedAction, Evidence, DerivedFact, PolicyFinding } from '../types';

export const POLICY_V1_2026_01: PolicyVersion = {
  policyId: 'RW-DEMO',
  version: '2026.01',
  effectiveFrom: '2026-01-01T00:00:00Z',
  effectiveTo: '2026-06-30T23:59:59Z',
  product: 'Retail Banking Onboarding',
  jurisdictionTag: 'DEMO-US-RETAIL',
  status: 'SUPERSEDED',
  hash: 'sha256-pol-v1-849302194a',
  clauses: [
    {
      clauseId: 'P01',
      title: 'Prohibition on Sole Association Escalation',
      text: 'A shared device, shared IP, shared address, or a similar name alone cannot establish fraud or justify escalation.',
      sourceLocator: 'RW-DEMO-2026.01 §2.1(a)',
      predicateType: 'NO_SOLE_DEVICE_ESCALATION',
      actionConstraints: ['REQUEST_MORE_EVIDENCE', 'ENHANCED_VERIFICATION', 'CLEAR'],
      notes: 'Weak links without corroborating verified concern must not escalate.'
    },
    {
      clauseId: 'P02',
      title: 'Corroborated Dual Independent Concern Escalation',
      text: 'ESCALATE when two verified, independent concern classes are present: a verified identity-field contradiction AND (a verified account-ownership inconsistency OR a strong recorded link to a prior case with a confirmed adverse outcome). A prior unresolved alert is not a confirmed outcome. Duplicates sharing an independenceGroup do not satisfy the two-source requirement.',
      sourceLocator: 'RW-DEMO-2026.01 §3.2(b)',
      predicateType: 'TWO_INDEPENDENT_CONCERN_CLASSES',
      actionConstraints: ['ESCALATE'],
      notes: 'Requires strict dual independence. Unresolved prior alerts cannot satisfy the second concern.'
    },
    {
      clauseId: 'P03',
      title: 'Enhanced Verification for Isolated Identity Contradictions',
      text: 'ENHANCED_VERIFICATION for a verified material identity contradiction that does not satisfy P02; define the missing verification in the explanation.',
      sourceLocator: 'RW-DEMO-2026.01 §3.4(a)',
      predicateType: 'ENHANCED_VERIFICATION_CONTRADICTION',
      actionConstraints: ['ENHANCED_VERIFICATION'],
      notes: 'Directs to stepped-up identity check (e.g., biometric or verified document re-check).'
    },
    {
      clauseId: 'P04',
      title: 'Request More Evidence for Stale, Missing, or Ambiguous Facts',
      text: 'REQUEST_MORE_EVIDENCE when decision-critical evidence is missing, materially stale (exceeding 90 days in v2026.01), conflicted, or unresolved and P02/P03 do not already require stronger review. Absence of a returned record is not evidence that an adverse event did not occur.',
      sourceLocator: 'RW-DEMO-2026.01 §4.1(c)',
      predicateType: 'REQUEST_MORE_EVIDENCE',
      actionConstraints: ['REQUEST_MORE_EVIDENCE'],
      notes: 'Identifies specific gaps without escalating.'
    },
    {
      clauseId: 'P05',
      title: 'Clear Criteria for Fresh, Verified, Benign Records',
      text: 'CLEAR is available only when required identity and account evidence is fresh (within 90 days in v2026.01) and verified, no unresolved material concern remains, and all applicable onboarding checks pass. A verified household-sharing explanation may resolve a device-only alert.',
      sourceLocator: 'RW-DEMO-2026.01 §5.0(a)',
      predicateType: 'CLEAR_CRITERIA',
      actionConstraints: ['CLEAR'],
      notes: 'Closure of alert only. Does not certify global innocence or approve external credit.'
    },
    {
      clauseId: 'P06',
      title: 'Isolation of Candidate Matches',
      text: 'Suspected entity relationships remain candidates until verified; never propagate an adverse label to every neighbor.',
      sourceLocator: 'RW-DEMO-2026.01 §6.2(a)',
      predicateType: 'CANDIDATE_LINK_ISOLATION',
      actionConstraints: ['REQUEST_MORE_EVIDENCE', 'CLEAR', 'ENHANCED_VERIFICATION'],
      notes: 'Graph candidate edges cannot justify automatic adverse propagation.'
    },
    {
      clauseId: 'P07',
      title: 'Accountable Human Record Mandatory',
      text: 'Every disposition requires an accountable human record with recorded rationale; a model recommendation alone cannot change an external account.',
      sourceLocator: 'RW-DEMO-2026.01 §7.1(a)',
      predicateType: 'HUMAN_DECISION_MANDATORY',
      actionConstraints: ['CLEAR', 'REQUEST_MORE_EVIDENCE', 'ENHANCED_VERIFICATION', 'ESCALATE'],
      notes: 'No automated account changes permitted.'
    },
    {
      clauseId: 'P08',
      title: 'Policy Conflict Escalation to Supervisor',
      text: 'Material unresolved policy conflict returns POLICY_CONFLICT and requires supervisor review; no invented reconciliation.',
      sourceLocator: 'RW-DEMO-2026.01 §8.0',
      predicateType: 'SUPERVISOR_CONFLICT',
      actionConstraints: ['ESCALATE'],
      notes: 'Contradictory policy mandates require escalation.'
    }
  ]
};

export const POLICY_V2_2026_07: PolicyVersion = {
  policyId: 'RW-DEMO',
  version: '2026.07',
  effectiveFrom: '2026-07-01T00:00:00Z',
  product: 'Retail Banking Onboarding',
  jurisdictionTag: 'DEMO-US-RETAIL',
  status: 'ACTIVE',
  hash: 'sha256-pol-v2-910248571b',
  clauses: [
    {
      clauseId: 'P01',
      title: 'Prohibition on Sole Association Escalation (Clarified for Shared Networks)',
      text: 'A shared device, shared IP, shared residential address, or a similar name alone cannot establish fraud or justify escalation. Telemetry from public Wi-Fi or multi-occupant dwellings constitutes weak association.',
      sourceLocator: 'RW-DEMO-2026.07 §2.1(a)',
      predicateType: 'NO_SOLE_DEVICE_ESCALATION',
      actionConstraints: ['REQUEST_MORE_EVIDENCE', 'ENHANCED_VERIFICATION', 'CLEAR'],
      notes: 'Clarified with explicit shared-dwelling provisions.'
    },
    {
      clauseId: 'P02',
      title: 'Corroborated Dual Independent Concern Escalation',
      text: 'ESCALATE when two verified, independent concern classes are present: a verified identity-field contradiction AND (a verified account-ownership inconsistency OR a strong recorded link to a prior case with a confirmed adverse outcome). A prior unresolved alert is not a confirmed outcome. Duplicates sharing an independenceGroup do not satisfy the two-source requirement.',
      sourceLocator: 'RW-DEMO-2026.07 §3.2(b)',
      predicateType: 'TWO_INDEPENDENT_CONCERN_CLASSES',
      actionConstraints: ['ESCALATE'],
      notes: 'Identical to v1 standard.'
    },
    {
      clauseId: 'P03',
      title: 'Enhanced Verification for Isolated Identity Contradictions',
      text: 'ENHANCED_VERIFICATION for a verified material identity contradiction that does not satisfy P02; define the missing verification in the explanation.',
      sourceLocator: 'RW-DEMO-2026.07 §3.4(a)',
      predicateType: 'ENHANCED_VERIFICATION_CONTRADICTION',
      actionConstraints: ['ENHANCED_VERIFICATION'],
      notes: 'Stepped-up verification required.'
    },
    {
      clauseId: 'P04',
      title: 'Request More Evidence for Stale, Missing, or Ambiguous Facts (Tightened 60-Day Freshness)',
      text: 'REQUEST_MORE_EVIDENCE when decision-critical evidence is missing, materially stale (exceeding 60 days in v2026.07), conflicted, or unresolved and P02/P03 do not already require stronger review. Absence of a returned record is not evidence that an adverse event did not occur.',
      sourceLocator: 'RW-DEMO-2026.07 §4.1(c)',
      predicateType: 'REQUEST_MORE_EVIDENCE',
      actionConstraints: ['REQUEST_MORE_EVIDENCE'],
      notes: 'Freshness window tightened from 90 days to 60 days.'
    },
    {
      clauseId: 'P05',
      title: 'Clear Criteria with Household Device Exception (Tightened 60-Day Freshness)',
      text: 'CLEAR is available only when required identity and account evidence is fresh (within 60 days in v2026.07) and verified, no unresolved material concern remains, and all applicable onboarding checks pass. A verified household-sharing explanation explicitly resolves a device-only alert when verified via co-resident utility or declared relation.',
      sourceLocator: 'RW-DEMO-2026.07 §5.0(a)',
      predicateType: 'CLEAR_CRITERIA',
      actionConstraints: ['CLEAR'],
      notes: '60-day freshness + codified household sharing resolution.'
    },
    {
      clauseId: 'P06',
      title: 'Isolation of Candidate Matches',
      text: 'Suspected entity relationships remain candidates until verified; never propagate an adverse label to every neighbor.',
      sourceLocator: 'RW-DEMO-2026.07 §6.2(a)',
      predicateType: 'CANDIDATE_LINK_ISOLATION',
      actionConstraints: ['REQUEST_MORE_EVIDENCE', 'CLEAR', 'ENHANCED_VERIFICATION'],
      notes: 'Identical standard.'
    },
    {
      clauseId: 'P07',
      title: 'Accountable Human Record Mandatory',
      text: 'Every disposition requires an accountable human record with recorded rationale; a model recommendation alone cannot change an external account.',
      sourceLocator: 'RW-DEMO-2026.07 §7.1(a)',
      predicateType: 'HUMAN_DECISION_MANDATORY',
      actionConstraints: ['CLEAR', 'REQUEST_MORE_EVIDENCE', 'ENHANCED_VERIFICATION', 'ESCALATE'],
      notes: 'No automated account action.'
    },
    {
      clauseId: 'P08',
      title: 'Policy Conflict Escalation to Supervisor',
      text: 'Material unresolved policy conflict returns POLICY_CONFLICT and requires supervisor review; no invented reconciliation.',
      sourceLocator: 'RW-DEMO-2026.07 §8.0',
      predicateType: 'SUPERVISOR_CONFLICT',
      actionConstraints: ['ESCALATE'],
      notes: 'Strict policy escalation.'
    }
  ]
};

export const AVAILABLE_POLICIES: Record<string, PolicyVersion> = {
  '2026.01': POLICY_V1_2026_01,
  '2026.07': POLICY_V2_2026_07
};

export interface PolicyGateEvaluation {
  allowedActions: ProposedAction[];
  requiredAction?: ProposedAction;
  policyFindings: PolicyFinding[];
  evaluatedAt: string;
  reasons: string[];
}

/**
 * Deterministically evaluates policy clauses against case facts and evidence.
 */
export function evaluatePolicyGates(
  evidenceList: Evidence[],
  derivedFacts: DerivedFact[],
  policyVersion: PolicyVersion,
  asOfTimestamp: string
): PolicyGateEvaluation {
  const asOfDate = new Date(asOfTimestamp).getTime();
  const freshnessThresholdDays = policyVersion.version === '2026.07' ? 60 : 90;
  const thresholdMs = freshnessThresholdDays * 24 * 60 * 60 * 1000;

  // 1. Check for verified identity contradictions
  const idContradictionEvidence = evidenceList.filter(e => 
    e.verificationStatus === 'CONTRADICTED' || 
    (e.structuredFacts.hasContradiction === true)
  );
  const hasVerifiedIdContradiction = idContradictionEvidence.length > 0;

  // 2. Check for account ownership concern or confirmed adverse outcome link
  const accountOwnershipConcern = evidenceList.some(e => 
    e.evidenceType === 'ACCOUNT_OWNERSHIP' && 
    (e.verificationStatus === 'CONTRADICTED' || e.structuredFacts.ownershipMatch === false)
  );

  const priorCaseAdverseLink = evidenceList.some(e => 
    e.evidenceType === 'PRIOR_CASE_LINK' && 
    e.structuredFacts.confirmedAdverseOutcome === true
  );

  // Group evidence by independenceGroup to avoid counting duplicate telemetry
  const distinctConcernGroups = new Set<string>();
  if (hasVerifiedIdContradiction) {
    idContradictionEvidence.forEach(e => distinctConcernGroups.add(e.independenceGroup));
  }
  if (accountOwnershipConcern) {
    evidenceList
      .filter(e => e.evidenceType === 'ACCOUNT_OWNERSHIP' && (e.verificationStatus === 'CONTRADICTED' || e.structuredFacts.ownershipMatch === false))
      .forEach(e => distinctConcernGroups.add(e.independenceGroup));
  }
  if (priorCaseAdverseLink) {
    evidenceList
      .filter(e => e.evidenceType === 'PRIOR_CASE_LINK' && e.structuredFacts.confirmedAdverseOutcome === true)
      .forEach(e => distinctConcernGroups.add(e.independenceGroup));
  }

  // P02 Condition: Verified ID contradiction AND (account concern OR prior confirmed adverse outcome)
  // MUST have at least 2 distinct independent concern groups!
  const p02Satisfied = hasVerifiedIdContradiction && 
    (accountOwnershipConcern || priorCaseAdverseLink) && 
    distinctConcernGroups.size >= 2;

  // Check for device-only alerts
  const hasSharedDeviceAlert = evidenceList.some(e => 
    e.evidenceType === 'DEVICE_FINGERPRINT' && e.structuredFacts.deviceShared === true
  );
  const hasHouseholdSharingVerification = evidenceList.some(e => 
    (e.evidenceType === 'HOUSEHOLD_VERIFICATION' || e.structuredFacts.verifiedHouseholdMember === true) &&
    e.verificationStatus === 'VERIFIED'
  );

  // Check freshness of decision-critical ID evidence
  const idEvidenceList = evidenceList.filter(e => e.evidenceType === 'ID_DOCUMENT' || e.evidenceType === 'ID_VERIFIER');
  const staleIdEvidence = idEvidenceList.filter(e => {
    const obsTime = new Date(e.observedAt).getTime();
    return (asOfDate - obsTime) > thresholdMs;
  });

  // Check for missing critical evidence
  const hasIdEvidence = idEvidenceList.length > 0;
  const hasStaleCriticalEvidence = staleIdEvidence.length > 0;

  const findings: PolicyFinding[] = [];
  const reasons: string[] = [];

  // Evaluate P01
  if (hasSharedDeviceAlert && !hasVerifiedIdContradiction && !accountOwnershipConcern && !priorCaseAdverseLink) {
    findings.push({
      policyId: policyVersion.policyId,
      version: policyVersion.version,
      clauseId: 'P01',
      result: 'SATISFIED',
      evidenceIds: evidenceList.filter(e => e.evidenceType === 'DEVICE_FINGERPRINT').map(e => e.evidenceId),
      explanation: 'Shared device or network alone is insufficient to justify escalation under P01.'
    });
  }

  // Evaluate P02
  if (p02Satisfied) {
    findings.push({
      policyId: policyVersion.policyId,
      version: policyVersion.version,
      clauseId: 'P02',
      result: 'SATISFIED',
      evidenceIds: Array.from(distinctConcernGroups).flatMap(grp => 
        evidenceList.filter(e => e.independenceGroup === grp).map(e => e.evidenceId)
      ),
      explanation: 'Corroborated dual independent concern classes verified. Escalation required under P02.'
    });
    reasons.push('P02 Corroborated dual concern classes: Verified identity contradiction and independent adverse link.');
    return {
      allowedActions: ['ESCALATE'],
      requiredAction: 'ESCALATE',
      policyFindings: findings,
      evaluatedAt: new Date().toISOString(),
      reasons
    };
  } else {
    findings.push({
      policyId: policyVersion.policyId,
      version: policyVersion.version,
      clauseId: 'P02',
      result: 'NOT_SATISFIED',
      evidenceIds: [],
      explanation: 'Dual independent concern classes not established or duplicate telemetry detected.'
    });
  }

  // Evaluate P03: Isolated verified identity contradiction
  if (hasVerifiedIdContradiction && !p02Satisfied) {
    findings.push({
      policyId: policyVersion.policyId,
      version: policyVersion.version,
      clauseId: 'P03',
      result: 'SATISFIED',
      evidenceIds: idContradictionEvidence.map(e => e.evidenceId),
      explanation: 'Isolated verified identity contradiction present without second independent concern. Requires Enhanced Verification.'
    });
    reasons.push('P03 Verified identity contradiction requires enhanced stepped-up verification.');
    return {
      allowedActions: ['ENHANCED_VERIFICATION'],
      requiredAction: 'ENHANCED_VERIFICATION',
      policyFindings: findings,
      evaluatedAt: new Date().toISOString(),
      reasons
    };
  }

  // Evaluate P04: Stale or missing evidence or ambiguous device link
  if (!hasIdEvidence || hasStaleCriticalEvidence || (hasSharedDeviceAlert && !hasHouseholdSharingVerification)) {
    findings.push({
      policyId: policyVersion.policyId,
      version: policyVersion.version,
      clauseId: 'P04',
      result: 'SATISFIED',
      evidenceIds: staleIdEvidence.map(e => e.evidenceId),
      explanation: `Critical evidence is ${hasStaleCriticalEvidence ? 'materially stale (> ' + freshnessThresholdDays + ' days)' : !hasIdEvidence ? 'missing' : 'unresolved device association'}. Request more evidence under P04.`
    });
    reasons.push(`P04 Critical evidence requirement unmet: ${hasStaleCriticalEvidence ? 'Record exceeds ' + freshnessThresholdDays + '-day threshold' : 'Requires verification'}.`);
    return {
      allowedActions: ['REQUEST_MORE_EVIDENCE'],
      requiredAction: 'REQUEST_MORE_EVIDENCE',
      policyFindings: findings,
      evaluatedAt: new Date().toISOString(),
      reasons
    };
  }

  // Evaluate P05: Clear allowed
  const allVerifiedBenign = evidenceList.every(e => e.verificationStatus !== 'CONTRADICTED');
  if (allVerifiedBenign && (!hasSharedDeviceAlert || hasHouseholdSharingVerification)) {
    findings.push({
      policyId: policyVersion.policyId,
      version: policyVersion.version,
      clauseId: 'P05',
      result: 'SATISFIED',
      evidenceIds: evidenceList.map(e => e.evidenceId),
      explanation: 'All required evidence is fresh, verified, and benign. Household resolution confirmed if applicable.'
    });
    reasons.push('P05 All prerequisites satisfied: Fresh identity, no contradictions, resolved device context.');
    return {
      allowedActions: ['CLEAR', 'REQUEST_MORE_EVIDENCE'],
      requiredAction: 'CLEAR',
      policyFindings: findings,
      evaluatedAt: new Date().toISOString(),
      reasons
    };
  }

  return {
    allowedActions: ['REQUEST_MORE_EVIDENCE'],
    policyFindings: findings,
    evaluatedAt: new Date().toISOString(),
    reasons: ['Unresolved prerequisites under standard onboarding flow.']
  };
}
