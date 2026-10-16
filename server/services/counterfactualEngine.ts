// RiskWeave AI - Counterfactual Sensitivity Lab & Policy Replay Engine
import { 
  Evidence, 
  CaseSnapshot, 
  PolicyVersion, 
  Assessment, 
  CounterfactualExperiment, 
  PolicyReplayResult,
  Relationship,
  DerivedFact,
  ExecutionMode
} from '../../shared/types';
import { AVAILABLE_POLICIES, evaluatePolicyGates } from '../../shared/policy/policies';
import { geminiPipelineService } from '../ai/geminiPipeline';

export class CounterfactualService {
  /**
   * Executes a controlled evidence perturbation experiment with transitive DAG invalidation.
   */
  public async runExperiment(
    caseId: string,
    originalSnapshot: CaseSnapshot,
    evidenceList: Evidence[],
    relationships: Relationship[],
    derivedFacts: DerivedFact[],
    policy: PolicyVersion,
    mutationType: CounterfactualExperiment['mutationType'],
    targetId?: string,
    mode: ExecutionMode = 'LOCAL_FIXTURE'
  ): Promise<CounterfactualExperiment> {
    const experimentId = `EXP-${caseId}-${Date.now()}`;
    const invalidatedFactIds: string[] = [];
    const invalidatedEdgeIds: string[] = [];

    // Clone evidence and relationship lists
    let mutatedEvidence = [...evidenceList];
    let mutatedRelationships = [...relationships];
    let description = '';

    if (mutationType === 'EXCLUDE_OBSERVATION' && targetId) {
      mutatedEvidence = mutatedEvidence.filter(e => e.evidenceId !== targetId);
      description = `Exclusion of single observation [${targetId}].`;
      // Invalidate dependent relationships
      relationships.forEach(rel => {
        if (rel.evidenceIds.includes(targetId)) {
          invalidatedEdgeIds.push(rel.edgeId);
        }
      });
      // Invalidate dependent derived facts
      derivedFacts.forEach(df => {
        if (df.inputEvidenceIds.includes(targetId)) {
          invalidatedFactIds.push(df.factId);
        }
      });
    } else if (mutationType === 'EXCLUDE_INDEPENDENT_SOURCE_GROUP' && targetId) {
      const removedEv = mutatedEvidence.filter(e => e.independenceGroup === targetId);
      const removedIds = removedEv.map(e => e.evidenceId);
      mutatedEvidence = mutatedEvidence.filter(e => e.independenceGroup !== targetId);
      description = `Exclusion of entire independent source group [${targetId}] (${removedIds.length} observations).`;
      relationships.forEach(rel => {
        if (rel.evidenceIds.some(id => removedIds.includes(id))) {
          invalidatedEdgeIds.push(rel.edgeId);
        }
      });
      derivedFacts.forEach(df => {
        if (df.inputEvidenceIds.some(id => removedIds.includes(id))) {
          invalidatedFactIds.push(df.factId);
        }
      });
    } else if (mutationType === 'REJECT_CANDIDATE_ENTITY_MATCH' && targetId) {
      mutatedRelationships = mutatedRelationships.filter(r => r.edgeId !== targetId);
      invalidatedEdgeIds.push(targetId);
      description = `Rejected candidate entity match on edge [${targetId}].`;
    } else if (mutationType === 'SUPERSEDE_WITH_HYPOTHETICAL_VERIFIED' && targetId) {
      mutatedEvidence = mutatedEvidence.map(e => {
        if (e.evidenceId === targetId) {
          return {
            ...e,
            observedAt: new Date().toISOString(), // fresh
            verificationStatus: 'VERIFIED' as const,
            freshnessClass: 'FRESH' as const,
            structuredFacts: { ...e.structuredFacts, hasContradiction: false, dobMatch: true }
          };
        }
        return e;
      });
      description = `Hypothetically superseded record [${targetId}] with fresh verified document.`;
    } else if (mutationType === 'ADD_HOUSEHOLD_SHARING_EXPLANATION') {
      const mockHouseholdEvidence: Evidence = {
        evidenceId: `EVD-HYPO-HOUSEHOLD-${Date.now()}`,
        caseId,
        evidenceType: 'HOUSEHOLD_VERIFICATION',
        observedAt: new Date().toISOString(),
        ingestedAt: new Date().toISOString(),
        sourceType: 'SYNTHETIC_REQUEST',
        sourceRecordId: 'HYPO-HOUSEHOLD-UTIL',
        sourceHash: 'sha256-hypo-household',
        sourceLocator: 'Hypothetical Verified Joint Utility Account Record',
        structuredFacts: {
          verifiedHouseholdMember: true,
          sharedAddress: 'Confirmed shared household residential address',
          cohabitantVerified: true
        },
        verificationStatus: 'VERIFIED',
        freshnessClass: 'FRESH',
        independenceGroup: 'GRP-HYPO-HOUSEHOLD',
        synthetic: true
      };
      mutatedEvidence.push(mockHouseholdEvidence);
      description = 'Added hypothetical verified household sharing explanation.';
    } else if (mutationType === 'UNCHANGED_CONTROL') {
      description = 'Unchanged-input control rerun to observe stochastic model baseline variability.';
    }

    // Filter surviving relationships & derived facts
    const survivingRelationships = mutatedRelationships.filter(r => !invalidatedEdgeIds.includes(r.edgeId));
    const survivingDerivedFacts = derivedFacts.filter(df => !invalidatedFactIds.includes(df.factId));

    // Create mutated cloned snapshot
    const mutatedSnapshot: CaseSnapshot = {
      snapshotId: `SNAP-MUTATED-${experimentId}`,
      caseId,
      revision: originalSnapshot.revision + 1,
      asOf: originalSnapshot.asOf,
      evidenceIds: mutatedEvidence.map(e => e.evidenceId),
      relationshipIds: survivingRelationships.map(r => r.edgeId),
      derivedFacts: survivingDerivedFacts,
      policySelectionContext: originalSnapshot.policySelectionContext,
      canonicalInputHash: `hash-mutated-${experimentId}`
    };

    // Obtain baseline assessment on original snapshot
    const originalAssessment = geminiPipelineService.generateDeterministicAssessment(
      caseId,
      originalSnapshot,
      evidenceList,
      policy,
      derivedFacts,
      mode
    );

    // Run investigation pipeline on mutated envelope
    const mutatedRun = await geminiPipelineService.runInvestigation(
      caseId,
      mutatedSnapshot,
      mutatedEvidence,
      policy,
      survivingDerivedFacts,
      mode
    );

    return {
      experimentId,
      caseId,
      originalSnapshotId: originalSnapshot.snapshotId,
      mutationType,
      targetId,
      description,
      status: 'COMPLETED',
      originalAssessment,
      mutatedAssessment: mutatedRun.publishedAssessment,
      transitiveInvalidatedFactIds: invalidatedFactIds,
      transitiveInvalidatedEdgeIds: invalidatedEdgeIds,
      executedAt: new Date().toISOString(),
      executionMode: mode
    };
  }

  /**
   * Deterministic Policy Replay comparing two explicit policy versions (e.g. 2026.01 vs 2026.07)
   */
  public async replayPolicy(
    caseId: string,
    snapshot: CaseSnapshot,
    evidenceList: Evidence[],
    derivedFacts: DerivedFact[],
    policyV1Id: string = '2026.01',
    policyV2Id: string = '2026.07',
    mode: ExecutionMode = 'LOCAL_FIXTURE'
  ): Promise<PolicyReplayResult> {
    const replayId = `REPLAY-${caseId}-${Date.now()}`;
    const policyV1 = AVAILABLE_POLICIES[policyV1Id] || AVAILABLE_POLICIES['2026.01'];
    const policyV2 = AVAILABLE_POLICIES[policyV2Id] || AVAILABLE_POLICIES['2026.07'];

    // Evaluate deterministic policy gates under both versions
    const gateV1 = evaluatePolicyGates(evidenceList, derivedFacts, policyV1, snapshot.asOf);
    const gateV2 = evaluatePolicyGates(evidenceList, derivedFacts, policyV2, snapshot.asOf);

    // Clause differences between v1 and v2
    const clauseDifferences = [
      {
        clauseId: 'P01',
        v1Text: 'A shared device, shared IP, shared address, or a similar name alone cannot establish fraud or justify escalation.',
        v2Text: 'A shared device, shared IP, shared residential address, or a similar name alone cannot establish fraud or justify escalation. Telemetry from public Wi-Fi or multi-occupant dwellings constitutes weak association.',
        changedRequirement: 'Clarification explicitly codifies multi-occupant dwellings as weak association.'
      },
      {
        clauseId: 'P04',
        v1Text: 'REQUEST_MORE_EVIDENCE when decision-critical evidence is missing, materially stale (exceeding 90 days in v2026.01)...',
        v2Text: 'REQUEST_MORE_EVIDENCE when decision-critical evidence is missing, materially stale (exceeding 60 days in v2026.07)...',
        changedRequirement: 'Freshness window tightened from 90 days to 60 days.'
      },
      {
        clauseId: 'P05',
        v1Text: 'CLEAR is available only when required identity and account evidence is fresh (within 90 days)...',
        v2Text: 'CLEAR is available only when required identity and account evidence is fresh (within 60 days) and verified... A verified household-sharing explanation explicitly resolves a device-only alert...',
        changedRequirement: '60-day freshness ceiling + codified household sharing resolution.'
      }
    ];

    const v1Assessment = geminiPipelineService.generateDeterministicAssessment(
      caseId,
      snapshot,
      evidenceList,
      policyV1,
      derivedFacts,
      mode
    );

    const v2Assessment = geminiPipelineService.generateDeterministicAssessment(
      caseId,
      snapshot,
      evidenceList,
      policyV2,
      derivedFacts,
      mode
    );

    const deterministicDispositionChanged = v1Assessment.proposedAction !== v2Assessment.proposedAction;

    return {
      replayId,
      caseId,
      snapshotId: snapshot.snapshotId,
      policyV1Id: policyV1.version,
      policyV2Id: policyV2.version,
      clauseDifferences,
      gateV1AllowedActions: gateV1.allowedActions,
      gateV2AllowedActions: gateV2.allowedActions,
      deterministicDispositionChanged,
      v1Assessment,
      v2Assessment,
      executedAt: new Date().toISOString()
    };
  }
}

export const counterfactualService = new CounterfactualService();
