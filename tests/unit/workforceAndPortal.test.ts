// RiskWeave AI - Workforce Management, Dual-Approval & Customer Portal Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { CaseRepository } from '../../server/repositories/caseRepository';

describe('Workforce Management, Dual-Approval & Customer Portal Tests', () => {
  let repo: CaseRepository;

  beforeEach(() => {
    repo = new CaseRepository();
  });

  it('W01: Super Admin can create a new investigator with shift, languages, department, and dual-approval', () => {
    const created = repo.createInvestigator({
      name: 'Alex Morgan',
      email: 'a.morgan@bank.internal',
      role: 'Fraud Specialist',
      department: 'Special Investigations Unit (SIU)',
      shift: 'NIGHT',
      languages: ['English', 'French'],
      maxCapacity: 6,
      queue: 'Shared Device Rings',
      dualApprovalEnforced: true
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Alex Morgan');
    expect(created.shift).toBe('NIGHT');
    expect(created.languages).toContain('French');
    expect(created.dualApprovalEnforced).toBe(true);

    const roster = repo.getInvestigators();
    expect(roster.some(i => i.id === created.id)).toBe(true);
  });

  it('W02: Super Admin can update an investigator attributes and shift assignment', () => {
    const updated = repo.updateInvestigator('analyst-101', {
      shift: 'EVENING',
      maxCapacity: 7,
      specialization: 'Organized Syndicate Detection'
    });

    expect(updated).not.toBeNull();
    expect(updated?.shift).toBe('EVENING');
    expect(updated?.maxCapacity).toBe(7);
    expect(updated?.specialization).toBe('Organized Syndicate Detection');
  });

  it('W03: Deleting an investigator reallocates active cases to a designated colleague', () => {
    // Marcus Rivera (analyst-101) has active cases
    const marcus = repo.getInvestigators().find(i => i.id === 'analyst-101')!;
    const marcusCaseCount = marcus.currentWorkload;
    expect(marcusCaseCount).toBeGreaterThan(0);

    // Delete Marcus and reallocate to Priya (analyst-102)
    const priyaBefore = repo.getInvestigators().find(i => i.id === 'analyst-102')!;
    const priyaLoadBefore = priyaBefore.currentWorkload;

    const result = repo.deleteInvestigator('analyst-101', 'analyst-102');
    expect(result.success).toBe(true);
    expect(result.reallocatedCount).toBe(marcusCaseCount);

    const priyaAfter = repo.getInvestigators().find(i => i.id === 'analyst-102')!;
    expect(priyaAfter.currentWorkload).toBe(priyaLoadBefore + marcusCaseCount);

    // Marcus no longer in roster
    expect(repo.getInvestigators().some(i => i.id === 'analyst-101')).toBe(false);
  });

  it('W04: Dual-Approval workflow queues case for supervisor sign-off and finalizes on approval', () => {
    const targetCaseId = 'RW-002';
    
    // Investigator submits for dual approval
    const req = repo.submitForDualApproval(targetCaseId, {
      investigatorId: 'analyst-102',
      proposedDisposition: 'CLEAR',
      reasonCode: 'RC-POL-VERIFIED',
      rationale: 'Primary identity verified and household sharing explains multi-device login.'
    });

    expect(req.requestId).toBeDefined();
    expect(req.status).toBe('PENDING_SUPERVISOR');

    // Case is in SUPERVISOR_REVIEW
    const caseRecord = repo.getCase(targetCaseId);
    expect(caseRecord?.status).toBe('SUPERVISOR_REVIEW');

    // Supervisor resolves request
    const resolveResult = repo.resolveDualApproval(
      req.requestId,
      'APPROVED',
      'sup-901',
      'Co-approved after secondary KYC address check.'
    );

    expect(resolveResult.success).toBe(true);
    expect(resolveResult.request?.status).toBe('APPROVED');

    // Case is finalized
    const finalizedCase = repo.getCase(targetCaseId);
    expect(finalizedCase?.status).toBe('DECIDED');

    // Final decision was recorded with supervisor co-approval
    const decisions = repo.getDecisions(targetCaseId);
    const lastDecision = decisions[decisions.length - 1];
    expect(lastDecision.notes).toContain('Co-approved by Supervisor');
  });

  it('W05: Customer Portal supports draft saving, document upload, questions, and official receipts', () => {
    const caseId = 'RW-003';
    const portal = repo.getCustomerPortalData(caseId);

    expect(portal.caseId).toBe('RW-003');
    expect(portal.requestedItems.length).toBeGreaterThan(0);

    // Save draft explanation
    repo.updateCustomerPortalDraft(caseId, 'I shared this tablet with my spouse during tax filing.');
    const updatedPortal = repo.getCustomerPortalData(caseId);
    expect(updatedPortal.explanationDraft).toContain('shared this tablet');

    // Upload document
    const doc = repo.uploadCustomerDocument(caseId, {
      documentType: 'Proof of Residential Address',
      fileName: 'electric_bill_oct2026.pdf',
      fileSize: '340 KB',
      notes: 'Recent electric utility statement'
    });

    expect(doc.id).toBeDefined();
    expect(doc.fileName).toBe('electric_bill_oct2026.pdf');
    expect(doc.verificationCheckResult?.verified).toBe(true);

    // Exchange message
    const msg = repo.sendCustomerMessage(caseId, 'CUSTOMER', 'Sarah', 'Does the bill need to be notarized?');
    expect(msg.id).toBeDefined();
    expect(msg.content).toContain('notarized');

    // Submit package and verify receipt
    const receipt = repo.submitCustomerPortalPackage(caseId);
    expect(receipt.receiptId).toBeDefined();
    expect(receipt.status).toBe('CONFIRMED');
    expect(receipt.acknowledgementCode).toMatch(/^ACK-\d+$/);
    expect(receipt.checksum).toMatch(/^SHA256:[A-F0-9]+$/);
    expect(receipt.documentsCount).toBeGreaterThanOrEqual(1);

    // Portal status is updated
    const finalPortal = repo.getCustomerPortalData(caseId);
    expect(finalPortal.portalStatus).toBe('DOCUMENTS_SUBMITTED');
  });
});
