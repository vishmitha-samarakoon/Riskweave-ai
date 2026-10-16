// RiskWeave AI - Next Best Check Catalog & Ranking Service
import { NextCheck, Evidence, CaseSnapshot, PolicyVersion } from '../../shared/types';

export interface CatalogCheckDef {
  checkType: string;
  title: string;
  description: string;
  defaultEffortBand: 1 | 2 | 3; // 1=Low (Internal query), 2=Medium (Analyst outreach), 3=High (Manual audit)
  defaultFrictionBand: 1 | 2 | 3; // 1=Zero (No customer contact), 2=Low, 3=High (Customer document upload)
  targetRequirementTypes: string[];
}

export const CHECK_CATALOG: CatalogCheckDef[] = [
  {
    checkType: 'VERIFY_HOUSEHOLD_SHARING',
    title: 'Verify Household Device Sharing',
    description: 'Query co-resident utility accounts or joint customer records to confirm legitimate multi-user household.',
    defaultEffortBand: 1,
    defaultFrictionBand: 1,
    targetRequirementTypes: ['DEVICE_SHARED', 'RESIDENCE_CONTEXT']
  },
  {
    checkType: 'OBTAIN_FRESH_IDENTITY',
    title: 'Obtain Fresh Identity Verification',
    description: 'Re-poll State DMV or biometric liveness provider to renew identity validity within freshness window.',
    defaultEffortBand: 1,
    defaultFrictionBand: 2,
    targetRequirementTypes: ['STALE_ID', 'ID_VERIFICATION']
  },
  {
    checkType: 'VERIFY_ACCOUNT_OWNERSHIP',
    title: 'Verify External Account Ownership',
    description: 'Execute micro-deposit or Real-Time ACH ownership inquiry against funding account depository institution.',
    defaultEffortBand: 2,
    defaultFrictionBand: 1,
    targetRequirementTypes: ['ACCOUNT_OWNERSHIP', 'NAME_MISMATCH']
  },
  {
    checkType: 'CONFIRM_PRIOR_CASE_OUTCOME',
    title: 'Confirm Prior Case Final Outcome',
    description: 'Retrieve sealed case notes to verify whether prior alert was closed false-positive or confirmed adverse fraud.',
    defaultEffortBand: 2,
    defaultFrictionBand: 1,
    targetRequirementTypes: ['PRIOR_CASE_LINK', 'ADVERSE_OUTCOME']
  },
  {
    checkType: 'RESOLVE_CONFLICTING_SOURCES',
    title: 'Resolve Conflicting Source Records',
    description: 'Cross-reference conflicting data points against authoritative postal registry or primary vital statistics.',
    defaultEffortBand: 2,
    defaultFrictionBand: 2,
    targetRequirementTypes: ['RESIDENCE_CONFLICT', 'DOB_CONFLICT', 'IDENTITY_CONTRADICTION']
  },
  {
    checkType: 'VERIFY_CANDIDATE_ENTITY_MATCH',
    title: 'Verify Candidate Entity Resolution Match',
    description: 'Manually review entity resolution linkage criteria to confirm or reject fuzzy match hypothesis.',
    defaultEffortBand: 2,
    defaultFrictionBand: 1,
    targetRequirementTypes: ['CANDIDATE_MATCH', 'SHARED_TELEMETRY']
  }
];

/**
 * Computes deterministic heuristic priority score for next checks:
 * priority = 3 * criticalResolved + 2 * contradictionsResolved + 2 * policyRequired - analystEffortBand - customerFrictionBand
 */
export function rankNextChecks(
  evidenceList: Evidence[],
  snapshot: CaseSnapshot,
  policy: PolicyVersion
): NextCheck[] {
  const ranked: NextCheck[] = [];

  const hasSharedDevice = evidenceList.some(e => e.evidenceType === 'DEVICE_FINGERPRINT' && e.structuredFacts.deviceShared === true);
  const hasHouseholdResolved = evidenceList.some(e => e.evidenceType === 'HOUSEHOLD_VERIFICATION');
  const hasIdContradiction = evidenceList.some(e => e.verificationStatus === 'CONTRADICTED');
  const hasAccountConcern = evidenceList.some(e => e.evidenceType === 'ACCOUNT_OWNERSHIP' && e.verificationStatus === 'CONTRADICTED');
  const hasStaleEvidence = evidenceList.some(e => e.freshnessClass === 'STALE');
  const hasPriorCase = evidenceList.some(e => e.evidenceType === 'PRIOR_CASE_LINK');

  for (const cat of CHECK_CATALOG) {
    let criticalResolved = 0;
    let contradictionsResolved = 0;
    let policyRequired = false;
    let applicable = false;
    const relevantEvidenceIds: string[] = [];
    const resolvesRequirementIds: string[] = [];

    if (cat.checkType === 'VERIFY_HOUSEHOLD_SHARING' && hasSharedDevice && !hasHouseholdResolved) {
      applicable = true;
      criticalResolved = 1;
      resolvesRequirementIds.push('REQ-HOUSEHOLD-CONTEXT');
      evidenceList.filter(e => e.evidenceType === 'DEVICE_FINGERPRINT').forEach(e => relevantEvidenceIds.push(e.evidenceId));
    }

    if (cat.checkType === 'OBTAIN_FRESH_IDENTITY' && hasStaleEvidence) {
      applicable = true;
      criticalResolved = 1;
      policyRequired = true; // Required by P04
      resolvesRequirementIds.push('REQ-FRESH-ID');
      evidenceList.filter(e => e.freshnessClass === 'STALE').forEach(e => relevantEvidenceIds.push(e.evidenceId));
    }

    if (cat.checkType === 'VERIFY_ACCOUNT_OWNERSHIP' && hasAccountConcern) {
      applicable = true;
      criticalResolved = 1;
      contradictionsResolved = 1;
      policyRequired = true; // P02 check
      resolvesRequirementIds.push('REQ-ACH-OWNERSHIP');
      evidenceList.filter(e => e.evidenceType === 'ACCOUNT_OWNERSHIP').forEach(e => relevantEvidenceIds.push(e.evidenceId));
    }

    if (cat.checkType === 'CONFIRM_PRIOR_CASE_OUTCOME' && hasPriorCase) {
      applicable = true;
      criticalResolved = 1;
      policyRequired = true;
      resolvesRequirementIds.push('REQ-PRIOR-CASE-STATUS');
      evidenceList.filter(e => e.evidenceType === 'PRIOR_CASE_LINK').forEach(e => relevantEvidenceIds.push(e.evidenceId));
    }

    if (cat.checkType === 'RESOLVE_CONFLICTING_SOURCES' && hasIdContradiction) {
      applicable = true;
      criticalResolved = 1;
      contradictionsResolved = 1;
      resolvesRequirementIds.push('REQ-ID-CONTRADICTION');
      evidenceList.filter(e => e.verificationStatus === 'CONTRADICTED').forEach(e => relevantEvidenceIds.push(e.evidenceId));
    }

    if (cat.checkType === 'VERIFY_CANDIDATE_ENTITY_MATCH' && snapshot.relationshipIds.length > 0) {
      applicable = true;
      criticalResolved = 0;
      contradictionsResolved = 0;
      resolvesRequirementIds.push('REQ-ENTITY-RESOLVE');
    }

    if (applicable) {
      const priorityScore = 
        3 * criticalResolved + 
        2 * contradictionsResolved + 
        (policyRequired ? 2 : 0) - 
        cat.defaultEffortBand - 
        cat.defaultFrictionBand;

      ranked.push({
        checkType: cat.checkType,
        title: cat.title,
        resolvesRequirementIds,
        reason: cat.description,
        evidenceIds: relevantEvidenceIds,
        criticalResolved,
        contradictionsResolved,
        policyRequired,
        analystEffortBand: cat.defaultEffortBand,
        customerFrictionBand: cat.defaultFrictionBand,
        priorityScore
      });
    }
  }

  // Sort by priorityScore desc, then lower effort, then stable checkType ID
  ranked.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    if (a.analystEffortBand !== b.analystEffortBand) return a.analystEffortBand - b.analystEffortBand;
    return a.checkType.localeCompare(b.checkType);
  });

  return ranked;
}
