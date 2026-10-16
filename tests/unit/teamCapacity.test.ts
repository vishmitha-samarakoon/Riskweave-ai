// RiskWeave AI - Team Capacity & D3 Stacking Unit Tests
import { describe, it, expect } from 'vitest';
import { Investigator, CaseRecord } from '../../shared/types';

interface CapacityMetrics {
  currentWorkload: number;
  maxCapacity: number;
  isAtCapacity: boolean;
  isOverCapacity: boolean;
  utilizationRate: number;
  remainingHeadroom: number;
}

export function calculateInvestigatorCapacity(
  inv: Investigator,
  assignedCases: CaseRecord[]
): CapacityMetrics {
  const activeCases = assignedCases.filter(c => c.assigneeId === inv.id && c.status !== 'DECIDED' && c.status !== 'CLOSED');
  const workload = activeCases.length;
  const isOver = workload > inv.maxCapacity;
  const isAt = workload === inv.maxCapacity;
  const utilization = inv.maxCapacity > 0 ? (workload / inv.maxCapacity) * 100 : 0;
  const headroom = Math.max(0, inv.maxCapacity - workload);

  return {
    currentWorkload: workload,
    maxCapacity: inv.maxCapacity,
    isAtCapacity: isAt,
    isOverCapacity: isOver,
    utilizationRate: utilization,
    remainingHeadroom: headroom
  };
}

export function aggregatePriorityStack(assignedCases: CaseRecord[]) {
  const active = assignedCases.filter(c => c.status !== 'DECIDED' && c.status !== 'CLOSED');
  return {
    critical: active.filter(c => c.initialPriority === 'CRITICAL').length,
    high: active.filter(c => c.initialPriority === 'HIGH').length,
    medium: active.filter(c => c.initialPriority === 'MEDIUM').length,
    low: active.filter(c => c.initialPriority === 'LOW').length,
    total: active.length
  };
}

describe('Team Capacity & Workload Stack Calculations', () => {
  const sampleInvestigator: Investigator = {
    id: 'analyst-101',
    name: 'Marcus Rivera',
    email: 'm.rivera@bank.internal',
    role: 'Senior Fraud Analyst',
    specialization: 'Corroborated Alerts',
    status: 'AVAILABLE',
    maxCapacity: 4,
    currentWorkload: 0,
    activeCaseIds: [],
    avatarColor: 'teal'
  };

  const createMockCase = (id: string, assigneeId: string, priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', status: any = 'IN_REVIEW'): CaseRecord => ({
    caseId: id,
    applicationId: `APP-${id}`,
    applicantName: `Applicant ${id}`,
    status,
    assigneeId,
    product: 'Checking',
    jurisdictionTag: 'DEMO-US',
    alertReasonCodes: ['GEO_VELOCITY'],
    currentSnapshotId: 'snap-1',
    revision: 1,
    createdAt: '2026-10-15T00:00:00Z',
    dueAt: '2026-10-16T00:00:00Z',
    initialPriority: priority,
    isStale: false
  });

  it('correctly calculates under-capacity metrics with headroom', () => {
    const cases: CaseRecord[] = [
      createMockCase('C-1', 'analyst-101', 'CRITICAL'),
      createMockCase('C-2', 'analyst-101', 'HIGH')
    ];

    const metrics = calculateInvestigatorCapacity(sampleInvestigator, cases);
    expect(metrics.currentWorkload).toBe(2);
    expect(metrics.isAtCapacity).toBe(false);
    expect(metrics.isOverCapacity).toBe(false);
    expect(metrics.remainingHeadroom).toBe(2);
    expect(metrics.utilizationRate).toBe(50);
  });

  it('accurately identifies when an investigator is at exact capacity (100%)', () => {
    const cases: CaseRecord[] = [
      createMockCase('C-1', 'analyst-101', 'CRITICAL'),
      createMockCase('C-2', 'analyst-101', 'HIGH'),
      createMockCase('C-3', 'analyst-101', 'MEDIUM'),
      createMockCase('C-4', 'analyst-101', 'LOW')
    ];

    const metrics = calculateInvestigatorCapacity(sampleInvestigator, cases);
    expect(metrics.currentWorkload).toBe(4);
    expect(metrics.isAtCapacity).toBe(true);
    expect(metrics.isOverCapacity).toBe(false);
    expect(metrics.remainingHeadroom).toBe(0);
    expect(metrics.utilizationRate).toBe(100);
  });

  it('accurately identifies when an investigator is over capacity (> 100%)', () => {
    const cases: CaseRecord[] = [
      createMockCase('C-1', 'analyst-101', 'CRITICAL'),
      createMockCase('C-2', 'analyst-101', 'CRITICAL'),
      createMockCase('C-3', 'analyst-101', 'HIGH'),
      createMockCase('C-4', 'analyst-101', 'MEDIUM'),
      createMockCase('C-5', 'analyst-101', 'LOW') // 5 cases > 4 capacity
    ];

    const metrics = calculateInvestigatorCapacity(sampleInvestigator, cases);
    expect(metrics.currentWorkload).toBe(5);
    expect(metrics.isAtCapacity).toBe(false);
    expect(metrics.isOverCapacity).toBe(true);
    expect(metrics.remainingHeadroom).toBe(0);
    expect(metrics.utilizationRate).toBe(125);
  });

  it('computes correct priority breakdown for D3 stacking', () => {
    const cases: CaseRecord[] = [
      createMockCase('C-1', 'analyst-101', 'CRITICAL'),
      createMockCase('C-2', 'analyst-101', 'CRITICAL'),
      createMockCase('C-3', 'analyst-101', 'HIGH'),
      createMockCase('C-4', 'analyst-101', 'MEDIUM'),
      createMockCase('C-5', 'analyst-101', 'LOW'),
      createMockCase('C-6', 'analyst-101', 'LOW', 'DECIDED') // DECIDED should be excluded from active stack
    ];

    const stack = aggregatePriorityStack(cases);
    expect(stack.critical).toBe(2);
    expect(stack.high).toBe(1);
    expect(stack.medium).toBe(1);
    expect(stack.low).toBe(1);
    expect(stack.total).toBe(5);
  });

  it('does not count decided or closed cases as active load', () => {
    const cases: CaseRecord[] = [
      createMockCase('C-1', 'analyst-101', 'CRITICAL', 'DECIDED'),
      createMockCase('C-2', 'analyst-101', 'HIGH', 'CLOSED')
    ];

    const metrics = calculateInvestigatorCapacity(sampleInvestigator, cases);
    expect(metrics.currentWorkload).toBe(0);
    expect(metrics.isAtCapacity).toBe(false);
    expect(metrics.isOverCapacity).toBe(false);
    expect(metrics.remainingHeadroom).toBe(4);
  });
});
