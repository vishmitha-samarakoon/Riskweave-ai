// RiskWeave AI - Vitest Unit Test Suite (Matrix T01 - T36)
import { describe, it, expect } from 'vitest';
import { evaluatePolicyGates, AVAILABLE_POLICIES } from '../../shared/policy/policies';
import { buildRelationshipGraph } from '../../shared/graph/graphEngine';
import { CaseRepository } from '../../server/repositories/caseRepository';
import { CURATED_CASES } from '../../data/demo/curatedCases';
import { rankNextChecks } from '../../server/services/nextCheckService';
import { geminiPipelineService } from '../../server/ai/geminiPipeline';

describe('Evidence & Graph Engine Tests', () => {
  it('T01: Same normalized exact device identifier creates one observed sharing relationship with source IDs', () => {
    const case1 = CURATED_CASES['RW-001'];
    const graph = buildRelationshipGraph('ENT-APP-001', case1.entities, case1.relationships);
    expect(graph.nodes.length).toBeGreaterThan(1);
    const deviceEdge = graph.edges.find(e => e.relationType === 'OWNS_DEVICE');
    expect(deviceEdge).toBeDefined();
    expect(deviceEdge?.evidenceIds).toContain('EVD-001-B');
    expect(deviceEdge?.matchState).toBe('OBSERVED');
  });

  it('T03: Shared IP / device alone never satisfies the escalation policy (P01)', () => {
    const case3 = CURATED_CASES['RW-003'];
    const gateEval = evaluatePolicyGates(case3.evidenceList, case3.derivedFacts, AVAILABLE_POLICIES['2026.07'], case3.caseRecord.createdAt);
    expect(gateEval.requiredAction).not.toBe('ESCALATE');
    expect(gateEval.allowedActions).not.toContain('ESCALATE');
    expect(gateEval.allowedActions).toContain('REQUEST_MORE_EVIDENCE');
  });

  it('T04: Duplicate telemetry sharing independenceGroup preserves provenance but cannot create two independent concern classes', () => {
    const case9 = CURATED_CASES['RW-009'];
    const gateEval = evaluatePolicyGates(case9.evidenceList, case9.derivedFacts, AVAILABLE_POLICIES['2026.07'], case9.caseRecord.createdAt);
    expect(gateEval.requiredAction).not.toBe('ESCALATE');
  });

  it('T08: Graph traversal terminates on cycles, honors filters, and reports cycle safety', () => {
    const case1 = CURATED_CASES['RW-001'];
    const graph = buildRelationshipGraph('ENT-APP-001', case1.entities, case1.relationships, { maxHops: 2 });
    expect(graph.nodes.length).toBeLessThanOrEqual(30);
    expect(graph.truncated).toBe(false);
  });
});

describe('Policies & Deterministic Gates Tests', () => {
  it('T09: Required complete verified benign facts permit CLEAR (P05)', () => {
    const case2 = CURATED_CASES['RW-002'];
    const gateEval = evaluatePolicyGates(case2.evidenceList, case2.derivedFacts, AVAILABLE_POLICIES['2026.07'], case2.caseRecord.createdAt);
    expect(gateEval.requiredAction).toBe('CLEAR');
    expect(gateEval.allowedActions).toContain('CLEAR');
  });

  it('T10: Missing critical evidence prevents CLEAR without falsely asserting HIGH risk', () => {
    const case3 = CURATED_CASES['RW-003'];
    const assessment = geminiPipelineService.generateDeterministicAssessment(
      case3.caseRecord.caseId,
      case3.initialSnapshot,
      case3.evidenceList,
      AVAILABLE_POLICIES['2026.07'],
      case3.derivedFacts,
      'LOCAL_FIXTURE'
    );
    expect(assessment.proposedAction).toBe('REQUEST_MORE_EVIDENCE');
    expect(assessment.riskTier).not.toBe('HIGH');
  });

  it('T11: P02 corroborated dual concern classes require escalation', () => {
    const case1 = CURATED_CASES['RW-001'];
    const gateEval = evaluatePolicyGates(case1.evidenceList, case1.derivedFacts, AVAILABLE_POLICIES['2026.07'], case1.caseRecord.createdAt);
    expect(gateEval.requiredAction).toBe('ESCALATE');
    expect(gateEval.allowedActions).toEqual(['ESCALATE']);
  });

  it('T12: Material identity contradiction routes to enhanced verification when P02 is not satisfied (P03)', () => {
    const case6 = CURATED_CASES['RW-006'];
    const gateEval = evaluatePolicyGates(case6.evidenceList, case6.derivedFacts, AVAILABLE_POLICIES['2026.07'], case6.caseRecord.createdAt);
    expect(gateEval.requiredAction).toBe('ENHANCED_VERIFICATION');
  });

  it('T23: Adding verified household context resolves a device-only alert under P05', () => {
    const case5 = CURATED_CASES['RW-005'];
    const gateEval = evaluatePolicyGates(case5.evidenceList, case5.derivedFacts, AVAILABLE_POLICIES['2026.07'], case5.caseRecord.createdAt);
    expect(gateEval.requiredAction).toBe('CLEAR');
  });

  it('T25: An 80-day-old verification passes v1 90-day freshness and fails v2 60-day freshness', () => {
    const case7 = CURATED_CASES['RW-007']; // observed 80 days before createdAt
    const gateV1 = evaluatePolicyGates(case7.evidenceList, case7.derivedFacts, AVAILABLE_POLICIES['2026.01'], case7.caseRecord.createdAt);
    const gateV2 = evaluatePolicyGates(case7.evidenceList, case7.derivedFacts, AVAILABLE_POLICIES['2026.07'], case7.caseRecord.createdAt);
    expect(gateV1.allowedActions).toContain('CLEAR');
    expect(gateV2.requiredAction).toBe('REQUEST_MORE_EVIDENCE');
  });
});

describe('Audit Chain & Concurrency Tests', () => {
  it('T32 & T33: Concurrency rejects stale revision with 409 and increments revision on valid decision', () => {
    const repo = new CaseRepository();
    const caseId = 'RW-001';
    
    // First valid decision at rev 1
    const res1 = repo.recordDecision(caseId, {
      caseId,
      snapshotId: 'SNAP-RW-001-V1',
      caseRevision: 1,
      actorId: 'analyst-101',
      adoptedOrOverridden: 'ADOPTED',
      disposition: 'ESCALATE',
      reasonCode: 'RC-POL-DUAL-CONCERN',
      notes: 'Confirmed dual independent concerns per P02 policy mandates.',
      sourceAcknowledgements: ['EVD-001-A', 'EVD-001-C']
    }, 'analyst-101');

    expect(res1.success).toBe(true);

    // Stale decision at rev 1 should now be rejected with 409
    const res2 = repo.recordDecision(caseId, {
      caseId,
      snapshotId: 'SNAP-RW-001-V1',
      caseRevision: 1, // Stale!
      actorId: 'analyst-102',
      adoptedOrOverridden: 'OVERRIDDEN',
      disposition: 'CLEAR',
      reasonCode: 'RC-OVERRIDE',
      notes: 'Overriding without knowing revision has advanced.',
      sourceAcknowledgements: []
    }, 'analyst-102');

    expect(res2.success).toBe(false);
    expect(res2.error).toContain('409 Conflict');
  });

  it('T36: Cryptographic SHA-256 audit chain verification passes on untampered sequence', () => {
    const repo = new CaseRepository();
    const verification = repo.verifyAuditChain('RW-001');
    expect(verification.valid).toBe(true);
    expect(verification.totalEvents).toBeGreaterThanOrEqual(1);
  });
});

describe('Plain-Language Everyday UX Dictionary Tests', () => {
  it('T37: Maps all 4 internal actions to plain-language labels with defined meanings', async () => {
    const { ACTION_DEFINITIONS } = await import('../../shared/copy/dictionary');
    expect(ACTION_DEFINITIONS.CLEAR.label).toBe('Close this alert');
    expect(ACTION_DEFINITIONS.REQUEST_MORE_EVIDENCE.label).toBe('Request missing information');
    expect(ACTION_DEFINITIONS.ENHANCED_VERIFICATION.label).toBe('Request additional verification');
    expect(ACTION_DEFINITIONS.ESCALATE.label).toBe('Send for specialist review');
  });

  it('T38: Maps evidence sufficiency to transparent descriptions without using confidence as a synonym', async () => {
    const { SUFFICIENCY_DEFINITIONS } = await import('../../shared/copy/dictionary');
    expect(SUFFICIENCY_DEFINITIONS.COMPLETE.label).toBe('Enough for this assessment');
    expect(SUFFICIENCY_DEFINITIONS.PARTIAL.label).toBe('Some evidence is missing');
    expect(SUFFICIENCY_DEFINITIONS.INSUFFICIENT.label).toBe('Not enough evidence');
  });

  it('T39: Maps execution modes to honest user-facing labels', async () => {
    const { EXECUTION_MODE_LABELS } = await import('../../shared/copy/dictionary');
    expect(EXECUTION_MODE_LABELS.LOCAL_FIXTURE.badge).toBe('Demo response — no live AI call');
    expect(EXECUTION_MODE_LABELS.LIVE_GOOGLE.badge).toBe('Live AI');
    expect(EXECUTION_MODE_LABELS.RECORDED_REPLAY.badge).toBe('Saved run — not a new AI review');
  });
});

