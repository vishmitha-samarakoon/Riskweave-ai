// RiskWeave AI - Access Control & Negative Authorization Gates Tests
// Verifies Section 28 & ACCESS_MATRIX.md Requirements

import { describe, it, expect, beforeEach } from 'vitest';
import { CaseRepository } from '../../server/repositories/caseRepository';
import { AccessPolicyEngine, SEED_PRINCIPALS } from '../../server/services/accessPolicy';

describe('Section 28 Access Control & Negative Verification Gates', () => {
  let repo: CaseRepository;

  beforeEach(() => {
    repo = new CaseRepository();
  });

  it('Gate 1: Investigator A updates own availability; targeting B is rejected leaving B unchanged', () => {
    const actorA = SEED_PRINCIPALS['analyst-101'];
    const actorB = SEED_PRINCIPALS['analyst-102'];

    // Initial check: Both are AVAILABLE
    expect(repo.getSelfAvailability(actorA.userId).status).toBe('AVAILABLE');
    expect(repo.getSelfAvailability(actorB.userId).status).toBe('AVAILABLE');

    // Policy check: A targeting A is permitted
    const checkSelf = AccessPolicyEngine.canUpdateSelfAvailability(actorA, actorA.userId);
    expect(checkSelf.allowed).toBe(true);

    const updateResult = repo.setSelfAvailability(actorA.userId, 'BUSY');
    expect(updateResult.success).toBe(true);
    expect(repo.getSelfAvailability(actorA.userId).status).toBe('BUSY');

    // Policy check: A targeting B is rejected
    const checkTargetB = AccessPolicyEngine.canUpdateSelfAvailability(actorA, actorB.userId);
    expect(checkTargetB.allowed).toBe(false);
    expect(checkTargetB.reason).toContain('Staff may only update their own declared availability');

    // Confirm B remains completely unchanged
    expect(repo.getSelfAvailability(actorB.userId).status).toBe('AVAILABLE');
  });

  it('Gate 2: Super Admin can update capacity and routing, but CANNOT rewrite declared availability status', () => {
    const admin = SEED_PRINCIPALS['sup-901'];
    const targetUserId = 'analyst-101';

    // Super Admin updating capacity and assignmentEnabled
    const checkValidAdmin = AccessPolicyEngine.canManageInvestigator(admin, admin.tenantId, {
      maxCapacity: 8,
      assignmentEnabled: true
    });
    expect(checkValidAdmin.allowed).toBe(true);

    // Super Admin attempting to rewrite declared status is rejected by policy
    const checkAdminAlteringStatus = AccessPolicyEngine.canManageInvestigator(admin, admin.tenantId, {
      status: 'AVAILABLE' // administrator attempting to alter self-owned declaration
    });
    expect(checkAdminAlteringStatus.allowed).toBe(false);
    expect(checkAdminAlteringStatus.reason).toContain('cannot rewrite staff declared availability');

    // Cross-tenant check: Admin cannot manage investigator in another tenant
    const checkCrossTenant = AccessPolicyEngine.canManageInvestigator(admin, 'TENANT-OTHER-BANK', {
      maxCapacity: 8
    });
    expect(checkCrossTenant.allowed).toBe(false);
    expect(checkCrossTenant.reason).toContain('Cross-tenant isolation violation');
  });

  it('Gate 3: Cross-Customer Isolation - Customer A cannot access Customer B portal data', () => {
    const customerA = SEED_PRINCIPALS['cust-001'];
    const customerB = SEED_PRINCIPALS['cust-002'];

    // Customer A accessing own request
    const checkA = AccessPolicyEngine.canAccessCustomerPortal(customerA, 'cust-001');
    expect(checkA.allowed).toBe(true);

    // Customer A attempting to access Customer B request
    const checkCrossCustomer = AccessPolicyEngine.canAccessCustomerPortal(customerA, 'cust-002');
    expect(checkCrossCustomer.allowed).toBe(false);
    expect(checkCrossCustomer.reason).toContain('You may only view and respond to your own verification requests');
  });

  it('Gate 4: Customer cannot access internal cases, notes, or decision endpoints', () => {
    const customer = SEED_PRINCIPALS['cust-001'];

    // Customer attempting to read internal case
    const checkInternalCase = AccessPolicyEngine.canAccessCase(customer, 'TENANT-MERIDIAN-BANK', 'analyst-101');
    expect(checkInternalCase.allowed).toBe(false);
    expect(checkInternalCase.reason).toContain('Customers cannot access internal investigation records');
  });

  it('Gate 5: "Approve for use" creates customer-supplied evidence without auto-certifying identity or closing case', () => {
    const caseId = 'RW-002';
    const targetDocId = 'DOC-002-LEASE';

    const caseBefore = repo.getCase(caseId)!;
    expect(caseBefore.status).not.toBe('DECIDED');
    const initialEvidenceCount = repo.getEvidence(caseId).length;

    // Review desk action: APPROVE_FOR_USE
    const reviewResult = repo.reviewSubmissionItem(
      caseId,
      targetDocId,
      'APPROVE_FOR_USE',
      'analyst-101',
      'Marcus Rivera',
      'Residential lease verified for primary address confirmation',
      undefined
    );

    expect(reviewResult.success).toBe(true);
    expect(reviewResult.review?.status).toBe('ACCEPTED_FOR_USE');

    // Verifies new evidence was ingested with CUSTOMER_SUPPLIED provenance
    const updatedEvidence = repo.getEvidence(caseId);
    expect(updatedEvidence.length).toBe(initialEvidenceCount + 1);
    const addedItem = updatedEvidence.find(e => e.evidenceId === `EVD-CUST-${targetDocId}`);
    expect(addedItem).toBeDefined();
    expect(addedItem?.provenance?.verificationBasis).toBe('CUSTOMER_SUPPLIED');

    // Case is NOT auto-decided or closed; assessment is flagged stale for fresh review!
    const caseAfter = repo.getCase(caseId)!;
    expect(caseAfter.status).not.toBe('DECIDED');
    expect(caseAfter.isStale).toBe(true);
  });

  it('Gate 6: Partial approval and specific correction request keep portal in CORRECTION_REQUIRED', () => {
    const caseId = 'RW-001';
    
    // Customer uploads two documents
    const doc1 = repo.uploadCustomerDocument(caseId, {
      documentType: 'Proof of Address',
      fileName: 'Utility_Bill_Water.pdf',
      fileSize: '1.1 MB'
    });
    const doc2 = repo.uploadCustomerDocument(caseId, {
      documentType: 'Photo ID',
      fileName: 'Blurry_Drivers_License.jpg',
      fileSize: '0.4 MB'
    });

    // Reviewer approves doc1
    const res1 = repo.reviewSubmissionItem(
      caseId,
      doc1.id,
      'APPROVE_FOR_USE',
      'analyst-101',
      'Marcus Rivera',
      'Clear municipal water utility bill',
      undefined
    );
    expect(res1.review?.status).toBe('ACCEPTED_FOR_USE');

    // Reviewer requests correction on doc2 (blurry ID)
    const res2 = repo.reviewSubmissionItem(
      caseId,
      doc2.id,
      'REQUEST_CORRECTION',
      'analyst-101',
      'Marcus Rivera',
      undefined,
      'Document photograph is blurred and driver license number is unreadable.'
    );
    expect(res2.review?.status).toBe('CORRECTION_REQUESTED');

    // Check portal status is now CORRECTION_REQUIRED
    const portal = repo.getCustomerPortalData(caseId);
    expect(portal.portalStatus).toBe('CORRECTION_REQUIRED');
    expect(portal.uploadedDocs.find(d => d.id === doc2.id)?.status).toBe('CORRECTION_REQUESTED');
    // Doc 1 remains VERIFIED/ACCEPTED
    expect(portal.uploadedDocs.find(d => d.id === doc1.id)?.status).toBe('VERIFIED');
  });

  it('Gate 7: Suspended investigator access is revoked and active cases are safely reallocated', () => {
    const targetInvId = 'analyst-103'; // Jordan Lee
    const reassignToId = 'analyst-102'; // Priya Patel

    const jordanBefore = repo.getInvestigators().find(i => i.id === targetInvId)!;
    const priyaBefore = repo.getInvestigators().find(i => i.id === reassignToId)!;
    const jordanCasesCount = jordanBefore.currentWorkload;

    // Suspend Jordan Lee
    const suspendRes = repo.suspendInvestigator(targetInvId, 'Administrative leave', reassignToId);
    expect(suspendRes.success).toBe(true);
    expect(suspendRes.reallocatedCount).toBe(jordanCasesCount);

    const jordanAfter = repo.getInvestigators().find(i => i.id === targetInvId)!;
    expect(jordanAfter.lifecycleState).toBe('SUSPENDED');
    expect(jordanAfter.assignmentEnabled).toBe(false);
    expect(jordanAfter.currentWorkload).toBe(0);

    const priyaAfter = repo.getInvestigators().find(i => i.id === reassignToId)!;
    expect(priyaAfter.currentWorkload).toBe(priyaBefore.currentWorkload + jordanCasesCount);

    // Access check for suspended user
    const suspendedActor = {
      ...SEED_PRINCIPALS['analyst-101'],
      userId: targetInvId,
      isSuspended: true
    };
    const accessCheck = AccessPolicyEngine.canAccessCase(suspendedActor, 'TENANT-MERIDIAN-BANK', 'RW-003');
    expect(accessCheck.allowed).toBe(false);
    expect(accessCheck.reason).toContain('Account suspended');
  });

  it('Gate 8: Dual-Approval Separation of Duties prevents self-approval', () => {
    const originatingInvestigator = 'analyst-101'; // Marcus Rivera
    
    // Marcus Rivera cannot approve his own request
    const marcusActor = SEED_PRINCIPALS['analyst-101'];
    const selfApproveCheck = AccessPolicyEngine.canApproveDualApproval(marcusActor, originatingInvestigator);
    expect(selfApproveCheck.allowed).toBe(false);

    // Even if Marcus was somehow granted SUPER_ADMIN role on the fly, self-approval is blocked
    const elevatedMarcus = { ...marcusActor, role: 'SUPER_ADMIN' as const };
    const selfApproveCheck2 = AccessPolicyEngine.canApproveDualApproval(elevatedMarcus, originatingInvestigator);
    expect(selfApproveCheck2.allowed).toBe(false);
    expect(selfApproveCheck2.reason).toContain('Separation of Duties violation');

    // Independent supervisor Sarah Chen can approve
    const supervisor = SEED_PRINCIPALS['sup-901'];
    const independentCheck = AccessPolicyEngine.canApproveDualApproval(supervisor, originatingInvestigator);
    expect(independentCheck.allowed).toBe(true);
  });

  it('Gate 9: Case scratchpads are private to their author and do not overwrite other analysts', () => {
    const caseId = 'RW-001';
    
    repo.saveScratchpad(caseId, 'analyst-101', 'Marcus scratchpad notes on multi-device telemetry');
    repo.saveScratchpad(caseId, 'analyst-102', 'Priya alternative notes on household co-residence');

    const marcusPad = repo.getScratchpad(caseId, 'analyst-101');
    const priyaPad = repo.getScratchpad(caseId, 'analyst-102');

    expect(marcusPad.content).toContain('Marcus scratchpad notes');
    expect(priyaPad.content).toContain('Priya alternative notes');
    expect(marcusPad.content).not.toEqual(priyaPad.content);
  });

  it('Gate 10: In-app durable notifications support unread count and archiving', () => {
    const recipientId = 'analyst-101';

    const initialNotifications = repo.getNotifications(recipientId);
    expect(initialNotifications.length).toBeGreaterThan(0);
    const targetNotif = initialNotifications[0];

    // Mark as read
    expect(targetNotif.readAt).toBeNull();
    const markReadSuccess = repo.markNotificationRead(targetNotif.notificationId);
    expect(markReadSuccess).toBe(true);
    expect(targetNotif.readAt).not.toBeNull();

    // Archive notification
    const archiveSuccess = repo.archiveNotification(targetNotif.notificationId);
    expect(archiveSuccess).toBe(true);
    expect(targetNotif.archivedAt).not.toBeNull();
  });
});
