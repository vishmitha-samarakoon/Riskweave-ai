// RiskWeave AI - Auto-Assignment & Workload Balancer Unit Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { CaseRepository } from '../../server/repositories/caseRepository';

describe('Auto-Assignment & Workload Balancer Tests', () => {
  let repo: CaseRepository;

  beforeEach(() => {
    repo = new CaseRepository();
  });

  it('A01: Roster initializes with live workloads computed from open cases', () => {
    const investigators = repo.getInvestigators();
    expect(investigators.length).toBe(5);
    
    // Marcus Rivera, Priya Patel, Jordan Lee, Elena Rostova, Carlos Mendoza
    const marcus = investigators.find(i => i.id === 'analyst-101');
    const priya = investigators.find(i => i.id === 'analyst-102');
    const carlos = investigators.find(i => i.id === 'analyst-105');

    expect(marcus).toBeDefined();
    expect(priya).toBeDefined();
    expect(carlos).toBeDefined();
    expect(carlos?.status).toBe('BUSY');

    // Marcus has open cases assigned initially
    expect(marcus!.currentWorkload).toBeGreaterThan(0);
  });

  it('A02: Auto-assignment targets high-priority unassigned alerts and routes to least-loaded available investigators', () => {
    // RW-004, RW-008, and RW-012 start unassigned (CRITICAL priority)
    const initialCases = repo.listCases();
    const unassignedCritical = initialCases.filter(c => 
      (!c.assigneeId || c.assigneeId === '' || c.assigneeName === 'Unassigned') && 
      c.initialPriority === 'CRITICAL'
    );
    expect(unassignedCritical.length).toBeGreaterThanOrEqual(1);

    const initialInvestigators = repo.getInvestigators();
    const available = initialInvestigators.filter(i => i.status === 'AVAILABLE');
    const lowestLoadBefore = Math.min(...available.map(i => i.currentWorkload));

    // Run auto-assignment
    const result = repo.autoAssignHighPriorityCases({
      priorityThreshold: 'HIGH',
      onlyUnassigned: true
    });

    expect(result.assignedCount).toBeGreaterThanOrEqual(1);
    expect(result.assignments.length).toBe(result.assignedCount);

    // Verify assigned investigator was among lowest loaded
    const firstAssignment = result.assignments[0];
    expect(firstAssignment.previousWorkload).toBeLessThanOrEqual(lowestLoadBefore + 1);

    // Verify case record now has assignee
    const updatedCase = repo.getCase(firstAssignment.caseId);
    expect(updatedCase?.assigneeId).toBe(firstAssignment.investigatorId);
    expect(updatedCase?.assigneeName).toBe(firstAssignment.investigatorName);
    expect(updatedCase?.status).toBe('IN_REVIEW');
  });

  it('A03: Busy or Away investigators are bypassed during auto-assignment', () => {
    // Carlos Mendoza (analyst-105) is BUSY
    const carlos = repo.getInvestigators().find(i => i.id === 'analyst-105');
    expect(carlos?.status).toBe('BUSY');

    const result = repo.autoAssignHighPriorityCases({
      priorityThreshold: 'HIGH',
      onlyUnassigned: true
    });

    // Carlos should have received 0 assignments
    const carlosAssignments = result.assignments.filter(a => a.investigatorId === 'analyst-105');
    expect(carlosAssignments.length).toBe(0);
  });

  it('A04: Manual individual case assignment updates case, logs audit event, and sends notification', () => {
    const caseId = 'RW-002';
    const res = repo.assignCase(caseId, 'analyst-103', 'Specialist re-routing', 'supervisor-001');
    expect(res.success).toBe(true);
    expect(res.caseRecord?.assigneeId).toBe('analyst-103');
    expect(res.caseRecord?.assigneeName).toBe('Jordan Lee');

    // Audit trail verification
    const auditEvents = repo.getAuditTrail(caseId);
    const assignEvent = auditEvents.find(e => e.eventType === 'CASE_ASSIGNED');
    expect(assignEvent).toBeDefined();
    expect(assignEvent?.payload.newAssigneeId).toBe('analyst-103');

    // Notification verification
    const notifications = repo.getNotifications('analyst-103');
    const assignNotif = notifications.find(n => n.caseId === caseId && n.category === 'ASSIGNMENT');
    expect(assignNotif).toBeDefined();
  });

  it('A05: Status toggling updates availability dynamically', () => {
    const updated = repo.setInvestigatorStatus('analyst-105', 'AVAILABLE');
    expect(updated?.status).toBe('AVAILABLE');

    const list = repo.getInvestigators();
    const carlos = list.find(i => i.id === 'analyst-105');
    expect(carlos?.status).toBe('AVAILABLE');
  });
});
