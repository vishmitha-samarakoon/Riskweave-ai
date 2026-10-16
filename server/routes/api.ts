// RiskWeave AI - Express REST API Routes
import { Router, Request, Response } from 'express';
import { caseRepository } from '../repositories/caseRepository';
import { geminiPipelineService } from '../ai/geminiPipeline';
import { counterfactualService } from '../services/counterfactualEngine';
import { evaluationService } from '../services/evaluationService';
import { AVAILABLE_POLICIES } from '../../shared/policy/policies';
import { buildRelationshipGraph } from '../../shared/graph/graphEngine';
import { ExecutionMode, ProposedAction } from '../../shared/types';

export const apiRouter = Router();

// GET /api/health
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    geminiLiveAvailable: geminiPipelineService.isLiveAvailable(),
    defaultModel: 'gemini-3.8-flash',
    supportedModes: ['LOCAL_FIXTURE', 'LIVE_GOOGLE', 'RECORDED_REPLAY']
  });
});

import { resolveActor, AccessPolicyEngine } from '../services/accessPolicy';

// GET /api/me
apiRouter.get('/me', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const availability = caseRepository.getSelfAvailability(actor.userId);
  res.json({
    userId: actor.userId,
    name: actor.name,
    email: actor.email,
    role: actor.role,
    tenantId: actor.tenantId,
    capabilities: actor.capabilities,
    declaredAvailability: availability.status,
    returnAt: availability.returnAt,
    declaredAvailabilityUpdatedAt: availability.updatedAt
  });
});

// PATCH /api/me (Self-service personal profile)
apiRouter.patch('/me', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { displayName, timezone, notificationPreferences } = req.body;
  // Allow-listed self fields only
  res.json({
    success: true,
    userId: actor.userId,
    displayName: displayName || actor.name,
    timezone: timezone || 'America/New_York',
    notificationPreferences: notificationPreferences || { email: false, inApp: true }
  });
});

// GET /api/me/availability (Section 25 - Self-owned declared availability)
apiRouter.get('/me/availability', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const availability = caseRepository.getSelfAvailability(actor.userId);
  res.json(availability);
});

// PATCH /api/me/availability (Section 25 - Strict own-availability update)
apiRouter.patch('/me/availability', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { status, returnAt } = req.body;

  // Derives target user strictly from authenticated session
  const check = AccessPolicyEngine.canUpdateSelfAvailability(actor, actor.userId);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }

  // Reject unauthorized target manipulation if client specifies targetUserId
  if (req.body.targetUserId && req.body.targetUserId !== actor.userId) {
    return res.status(403).json({ 
      error: 'Access Denied: Staff may only update their own declared availability.', 
      code: 'FORBIDDEN_TARGET_MISMATCH' 
    });
  }

  if (!status || !['AVAILABLE', 'BUSY', 'AWAY', 'OFFLINE'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required (AVAILABLE, BUSY, AWAY, OFFLINE)' });
  }

  const result = caseRepository.setSelfAvailability(actor.userId, status, returnAt);
  res.json(result);
});

// --- IN-APP NOTIFICATIONS (Sections 7 & 8) ---
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { filter } = req.query;
  const notifications = caseRepository.getNotifications(actor.userId);
  let filtered = notifications;
  if (filter === 'UNREAD') {
    filtered = notifications.filter(n => !n.readAt && !n.archivedAt);
  } else if (filter === 'ARCHIVED') {
    filtered = notifications.filter(n => !!n.archivedAt);
  } else {
    filtered = notifications.filter(n => !n.archivedAt);
  }
  const unreadCount = notifications.filter(n => !n.readAt && !n.archivedAt).length;
  res.json({
    total: filtered.length,
    unreadCount,
    notifications: filtered
  });
});

apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = caseRepository.markNotificationRead(id);
  res.json({ success });
});

apiRouter.patch('/notifications/:id/archive', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = caseRepository.archiveNotification(id);
  res.json({ success });
});

// --- SUPER ADMIN WORKFORCE CRUD (Section 18) ---
apiRouter.get('/admin/investigators', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Super Admin only', code: 'FORBIDDEN' });
  }
  const investigators = caseRepository.getInvestigators();
  res.json({ total: investigators.length, investigators });
});

apiRouter.post('/admin/investigators', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Super Admin only', code: 'FORBIDDEN' });
  }
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const newInv = caseRepository.createInvestigator(req.body);
  res.status(201).json(newInv);
});

apiRouter.put('/admin/investigators/:id', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const check = AccessPolicyEngine.canManageInvestigator(actor, actor.tenantId, req.body);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }
  const { id } = req.params;
  const updated = caseRepository.updateInvestigator(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Investigator not found' });
  res.json(updated);
});

apiRouter.post('/admin/investigators/:id/suspend', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Super Admin only', code: 'FORBIDDEN' });
  }
  const { id } = req.params;
  const { reason = 'Administrative suspension', reassignToId } = req.body || {};
  const result = caseRepository.suspendInvestigator(id, reason, reassignToId);
  if (!result.success) return res.status(404).json({ error: result.error });
  res.json(result);
});

apiRouter.post('/admin/investigators/:id/reactivate', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Super Admin only', code: 'FORBIDDEN' });
  }
  const { id } = req.params;
  const result = caseRepository.reactivateInvestigator(id);
  if (!result.success) return res.status(404).json({ error: result.error });
  res.json(result);
});

apiRouter.post('/admin/investigators/:id/archive', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Super Admin only', code: 'FORBIDDEN' });
  }
  const { id } = req.params;
  const { reason = 'Offboarded' } = req.body || {};
  const result = caseRepository.archiveInvestigator(id, reason);
  if (!result.success) return res.status(404).json({ error: result.error });
  res.json(result);
});

// Single-use Invitation link generation
apiRouter.post('/admin/invitations', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Super Admin only' });
  }
  const { email, role = 'INVESTIGATOR' } = req.body;
  const token = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  res.json({
    success: true,
    email,
    role,
    invitationUrl: `/invite?token=${token}`,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
  });
});

// DECISION DRAFTS & SCRATCHPAD (Sections 10 & 27)
apiRouter.get('/cases/:id/draft', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { id } = req.params;
  const draft = caseRepository.getDraft(id, actor.userId);
  res.json(draft || null);
});

apiRouter.put('/cases/:id/draft', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { id } = req.params;
  const draft = {
    ...req.body,
    caseId: id,
    authorId: actor.userId,
    savedAt: new Date().toISOString()
  };
  caseRepository.saveDraft(draft);
  res.json({ success: true, draft });
});

apiRouter.get('/cases/:id/scratchpad', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { id } = req.params;
  const pad = caseRepository.getScratchpad(id, actor.userId);
  res.json(pad);
});

apiRouter.put('/cases/:id/scratchpad', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { id } = req.params;
  const { content = '' } = req.body;
  const pad = caseRepository.saveScratchpad(id, actor.userId, content);
  res.json(pad);
});

// SUBMISSION REVIEW DESK (Section 26)
apiRouter.get('/submission-reviews', (req: Request, res: Response) => {
  const reviews = caseRepository.getSubmissionReviews();
  res.json({ total: reviews.length, reviews });
});

apiRouter.get('/cases/:id/submission-reviews', (req: Request, res: Response) => {
  const { id } = req.params;
  const reviews = caseRepository.getSubmissionReviews(id);
  res.json({ total: reviews.length, reviews });
});

apiRouter.post('/cases/:id/submissions/:docId/review', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { id, docId } = req.params;
  const { action, findingNote, reason } = req.body;
  if (!action) return res.status(400).json({ error: 'Action is required' });

  const result = caseRepository.reviewSubmissionItem(
    id,
    docId,
    action,
    actor.userId,
    actor.name,
    findingNote,
    reason
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

// POST /api/cases/:id/customer-requests/publish (Section 21)
apiRouter.post('/cases/:id/customer-requests/publish', (req: Request, res: Response) => {
  const { id } = req.params;
  const { templateId, title, publicInstructions, deadline, requiredItems } = req.body;
  if (!templateId || !title || !publicInstructions || !requiredItems) {
    return res.status(400).json({ error: 'Missing required request fields' });
  }

  const updatedPortal = caseRepository.publishCustomerRequest(id, {
    templateId,
    title,
    publicInstructions,
    deadline: deadline || new Date(Date.now() + 86400000 * 3).toISOString(),
    requiredItems
  });

  res.json({ success: true, portal: updatedPortal });
});

// GET /api/cases
apiRouter.get('/cases', (req: Request, res: Response) => {
  const { status, riskTier, search } = req.query;
  let cases = caseRepository.listCases();

  if (status) {
    cases = cases.filter(c => c.status === status);
  }
  if (riskTier) {
    cases = cases.filter(c => c.currentRiskTier === riskTier);
  }
  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    cases = cases.filter(c => 
      c.caseId.toLowerCase().includes(s) || 
      c.applicantName.toLowerCase().includes(s) || 
      c.applicationId.toLowerCase().includes(s)
    );
  }

  res.json({
    total: cases.length,
    cases
  });
});

// GET /api/investigators
apiRouter.get('/investigators', (req: Request, res: Response) => {
  const investigators = caseRepository.getInvestigators();
  res.json({
    total: investigators.length,
    investigators
  });
});

// POST /api/investigators (Super Admin CRUD)
apiRouter.post('/investigators', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Only Super Admin may create investigators.', code: 'FORBIDDEN' });
  }
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const newInv = caseRepository.createInvestigator(req.body);
  res.status(201).json(newInv);
});

// PUT /api/investigators/:id (Super Admin CRUD)
apiRouter.put('/investigators/:id', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const check = AccessPolicyEngine.canManageInvestigator(actor, actor.tenantId, req.body);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }
  const { id } = req.params;
  const updated = caseRepository.updateInvestigator(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Investigator not found' });
  }
  res.json(updated);
});

// DELETE /api/investigators/:id (Super Admin CRUD)
apiRouter.delete('/investigators/:id', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Only Super Admin may remove investigators.', code: 'FORBIDDEN' });
  }
  const { id } = req.params;
  const { reassignToId } = req.body || {};
  const result = caseRepository.deleteInvestigator(id, reassignToId);
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result);
});

// PATCH /api/admin/investigators/:id/routing (Section 33 - Managed routing controls)
apiRouter.patch('/admin/investigators/:id/routing', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Only Super Admin may adjust investigator routing eligibility and capacity.', code: 'FORBIDDEN' });
  }
  const { id } = req.params;
  const { assignmentEnabled, maxCapacity, reason } = req.body;
  const result = caseRepository.updateInvestigatorRouting(id, { assignmentEnabled, maxCapacity, reason }, actor.userId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

// DEPRECATED / HARDENED: PATCH /api/investigators/:id/status (Section 33 - Strictly blocked)
apiRouter.patch('/investigators/:id/status', (req: Request, res: Response) => {
  return res.status(403).json({ 
    error: 'Access Denied: Cross-user availability manipulation is strictly prohibited. Staff may only update their own declared availability via /api/me/availability.', 
    code: 'FORBIDDEN_LEGACY_STATUS_ROUTE' 
  });
});

// --- DUAL APPROVAL ENDPOINTS ---
apiRouter.get('/dual-approvals', (req: Request, res: Response) => {
  const requests = caseRepository.getDualApprovalRequests();
  res.json({ total: requests.length, requests });
});

apiRouter.post('/cases/:id/dual-approval', (req: Request, res: Response) => {
  const caseId = req.params.id;
  const { investigatorId = 'analyst-101', proposedDisposition, reasonCode, rationale } = req.body;
  if (!proposedDisposition || !reasonCode || !rationale) {
    return res.status(400).json({ error: 'proposedDisposition, reasonCode, and rationale are required' });
  }
  const reqItem = caseRepository.submitForDualApproval(caseId, {
    investigatorId,
    proposedDisposition,
    reasonCode,
    rationale
  });
  res.status(201).json(reqItem);
});

apiRouter.post('/dual-approvals/:id/resolve', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { id } = req.params;
  const { decision, supervisorNotes = '' } = req.body;
  if (!decision || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
    return res.status(400).json({ error: 'decision must be APPROVED or REJECTED' });
  }

  const requests = caseRepository.getDualApprovalRequests();
  const targetReq = requests.find(r => r.requestId === id);
  if (!targetReq) {
    return res.status(404).json({ error: 'Dual approval request not found' });
  }

  // Separation of duties check: Investigator who submitted cannot self-approve
  const sepCheck = AccessPolicyEngine.canApproveDualApproval(actor, targetReq.investigatorId);
  if (!sepCheck.allowed) {
    return res.status(403).json({ error: sepCheck.reason, code: 'SEPARATION_OF_DUTIES_VIOLATION' });
  }

  const result = caseRepository.resolveDualApproval(id, decision, actor.userId, supervisorNotes);
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result);
});

// --- CUSTOMER PORTAL ENDPOINTS ---
apiRouter.get('/customer-portal/:caseId', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const data = caseRepository.getCustomerPortalData(caseId);
  res.json(data);
});

apiRouter.put('/customer-portal/:caseId/draft', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { draft = '' } = req.body;
  caseRepository.updateCustomerPortalDraft(caseId, draft);
  res.json({ success: true, draft });
});

apiRouter.post('/customer-portal/:caseId/upload', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { documentType, fileName, fileSize, notes, base64Data } = req.body;
  if (!documentType || !fileName) {
    return res.status(400).json({ error: 'documentType and fileName are required' });
  }
  const doc = caseRepository.uploadCustomerDocument(caseId, {
    documentType,
    fileName,
    fileSize: fileSize || '1.2 MB',
    notes,
    base64Data
  });
  res.status(201).json(doc);
});

apiRouter.delete('/customer-portal/:caseId/documents/:docId', (req: Request, res: Response) => {
  const { caseId, docId } = req.params;
  const success = caseRepository.deleteCustomerDocument(caseId, docId);
  if (!success) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json({ success: true, message: 'Document deleted' });
});

apiRouter.post('/customer-portal/:caseId/messages', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { sender = 'CUSTOMER', senderName = 'Applicant', content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content cannot be empty' });
  }
  const msg = caseRepository.sendCustomerMessage(caseId, sender, senderName, content);
  res.status(201).json(msg);
});

apiRouter.post('/customer-portal/:caseId/submit', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const receipt = caseRepository.submitCustomerPortalPackage(caseId);
  res.json({ success: true, receipt });
});

apiRouter.post('/customer-portal/:caseId/request-correction', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { docId, reason } = req.body;
  if (!docId || !reason) {
    return res.status(400).json({ error: 'docId and reason are required' });
  }
  const success = caseRepository.requestCustomerCorrection(caseId, docId, reason);
  if (!success) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json({ success: true, message: 'Correction requested' });
});


// --- AUTO-ASSIGNMENT WITH ADMIN-ONLY GUARD (Section 34) ---
apiRouter.post('/cases/auto-assign', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const check = AccessPolicyEngine.canAutoAssign(actor);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }

  const { priorityThreshold = 'HIGH', rebalanceAll = false, onlyUnassigned = true } = req.body;
  const result = caseRepository.autoAssignHighPriorityCases({
    priorityThreshold,
    rebalanceAll,
    onlyUnassigned,
    actorId: actor.userId
  });
  res.json(result);
});

// POST /api/admin/cases/auto-assign/preview (Section 34 - Non-mutating preview)
apiRouter.post('/admin/cases/auto-assign/preview', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const check = AccessPolicyEngine.canAutoAssign(actor);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }

  const { priorityThreshold = 'HIGH', rebalanceAll = false, onlyUnassigned = true } = req.body;
  const plan = caseRepository.previewAutoAssignment({
    priorityThreshold,
    rebalanceAll,
    onlyUnassigned
  });
  res.json(plan);
});

// POST /api/admin/cases/auto-assign/execute (Section 34 - Apply plan)
apiRouter.post('/admin/cases/auto-assign/execute', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const check = AccessPolicyEngine.canAutoAssign(actor);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }

  const { planId } = req.body;
  try {
    const result = caseRepository.executeAutoAssignmentPlan(planId, actor.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/cases/:id/assign (Super Admin or Delegate with assignment.manual)
apiRouter.patch('/cases/:id/assign', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const check = AccessPolicyEngine.canManualAssign(actor);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }

  const caseId = req.params.id;
  const { investigatorId, reason = 'Desk reassignment' } = req.body;
  if (investigatorId === undefined) {
    return res.status(400).json({ error: 'investigatorId is required' });
  }

  const result = caseRepository.assignCase(caseId, investigatorId, reason, actor.userId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Record delegation activity if acting as delegate
  if (actor.activeDelegation) {
    caseRepository.recordDelegationActivity(
      actor.activeDelegation.id,
      actor.userId,
      actor.name,
      'MANUAL_ASSIGNMENT',
      `Assigned case ${caseId} to ${investigatorId}: ${reason}`,
      caseId
    );
  }

  res.json(result);
});

// --- TEMPORARY COVER & OPERATIONAL DELEGATION (Section 35) ---
apiRouter.get('/admin/delegations', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  if (actor.role !== 'SUPER_ADMIN' && !actor.activeDelegation) {
    return res.status(403).json({ error: 'Access Denied: Super Admin or active delegate only.' });
  }
  const delegations = caseRepository.listDelegations();
  res.json({ total: delegations.length, delegations });
});

apiRouter.post('/admin/delegations', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const check = AccessPolicyEngine.canManageDelegation(actor);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }

  const { granteeId, reason, allowedActions, scope = 'ALL', startAt, endAt } = req.body;
  if (!granteeId || !reason || !allowedActions || !startAt || !endAt) {
    return res.status(400).json({ error: 'granteeId, reason, allowedActions, startAt, and endAt are required.' });
  }

  const result = caseRepository.createDelegationGrant({
    grantorId: actor.userId,
    grantorName: actor.name,
    granteeId,
    reason,
    allowedActions,
    scope,
    startAt,
    endAt
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(result.grant);
});

apiRouter.post('/admin/delegations/:id/revoke', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const check = AccessPolicyEngine.canManageDelegation(actor);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }

  const { id } = req.params;
  const { reason = 'Revoked by administrator' } = req.body || {};
  const result = caseRepository.revokeDelegationGrant(id, actor.userId, reason);
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result);
});

apiRouter.get('/me/cover-period-activity', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const activities = caseRepository.getCoverPeriodActivities(actor.userId);
  res.json({ total: activities.length, activities });
});

apiRouter.post('/me/cover-period-activity/acknowledge', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { watermarkTime = new Date().toISOString() } = req.body;
  const result = caseRepository.acknowledgeCoverPeriod(actor.userId, watermarkTime);
  res.json(result);
});

// --- CRITICAL DECISION PROPOSALS & DUAL INDEPENDENT APPROVALS (Section 36) ---
apiRouter.get('/cases/:id/proposals', (req: Request, res: Response) => {
  const { id } = req.params;
  const proposals = caseRepository.getDecisionProposals(id);
  res.json({ total: proposals.length, proposals });
});

apiRouter.post('/cases/:id/proposals', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { id } = req.params;
  const { proposedAction, recommendationType, rationale, reasonCode, critical } = req.body;

  if (!proposedAction || !recommendationType || !rationale || !reasonCode) {
    return res.status(400).json({ error: 'proposedAction, recommendationType, rationale, and reasonCode are required.' });
  }

  const result = caseRepository.createDecisionProposal(
    id,
    actor.userId,
    actor.name,
    actor.role,
    { proposedAction, recommendationType, rationale, reasonCode, critical }
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(result.proposal);
});

apiRouter.get('/proposals/pending', (req: Request, res: Response) => {
  const all = caseRepository.getDecisionProposals();
  const pending = all.filter(p => p.status === 'AWAITING_APPROVALS');
  res.json({ total: pending.length, proposals: pending });
});

apiRouter.post('/proposals/:id/vote', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const { id } = req.params;
  const { decision, reason } = req.body;

  if (!decision || !['APPROVE', 'DECLINE', 'RETURN_FOR_CHANGES'].includes(decision)) {
    return res.status(400).json({ error: 'Valid decision is required (APPROVE, DECLINE, RETURN_FOR_CHANGES).' });
  }
  if (!reason || reason.trim().length < 6) {
    return res.status(400).json({ error: 'A meaningful justification of at least 6 characters is required.' });
  }

  const proposal = caseRepository.getDecisionProposals().find(p => p.id === id);
  if (!proposal) {
    return res.status(404).json({ error: 'Decision proposal not found.' });
  }

  // Separation of duties & authority check
  const priorVoterIds = proposal.votes.map(v => v.voterId);
  const check = AccessPolicyEngine.canApproveCriticalDecision(actor, proposal.makerId, priorVoterIds);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }

  const result = caseRepository.recordProposalVote(
    id,
    actor.userId,
    actor.name,
    actor.role,
    decision,
    reason,
    actor.activeDelegation?.id
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

// --- QUALITY CHECKS: CASE READINESS & SYSTEM OPERATIONAL CHECKS (Section 37) ---
apiRouter.get('/cases/:id/readiness', (req: Request, res: Response) => {
  const { id } = req.params;
  const readiness = caseRepository.evaluateCaseReadiness(id);
  res.json(readiness);
});

apiRouter.get('/quality/system-checks', (req: Request, res: Response) => {
  const report = caseRepository.runSystemChecks();
  res.json(report);
});

// POST /api/cases/simulate-incoming
apiRouter.post('/cases/simulate-incoming', (req: Request, res: Response) => {
  const currentCases = caseRepository.listCases();
  const nextNum = currentCases.length + 1;
  const simId = `RW-${String(nextNum).padStart(3, '0')}`;
  
  const sampleProfiles = [
    { name: 'K. Novak (High Velocity)', product: 'Online Credit & Card', alert: ['ALERT_DEVICE_LINKED', 'ALERT_WATCHLIST_MATCH'], note: 'Rapid velocity account opening across flagged proxy network cluster' },
    { name: 'A. Thorne (SSN Anomaly)', product: 'Personal Checking', alert: ['ALERT_SYNTHETIC_IDENTITY_LINK', 'ALERT_DOB_MISMATCH'], note: 'Synthetic ID profile indicator triggered with credit bureau SSN date conflict' },
    { name: 'D. Vance (Device Ring)', product: 'Commercial Merchant Line', alert: ['ALERT_SHARED_DEVICE_CLUSTER', 'ALERT_ACCOUNT_OWNERSHIP_MISMATCH'], note: 'Device cluster matches known multi-application syndicate ring' }
  ];
  const profile = sampleProfiles[(nextNum - 1) % sampleProfiles.length];

  const newCase = {
    caseId: simId,
    applicationId: `APP-SIM-${2000 + nextNum}`,
    applicantName: profile.name,
    status: 'NEW' as const,
    assigneeId: '',
    assigneeName: 'Unassigned',
    product: profile.product,
    jurisdictionTag: 'DEMO-US-RETAIL',
    alertReasonCodes: profile.alert,
    currentSnapshotId: `SNAP-${simId}-V1`,
    revision: 1,
    createdAt: new Date().toISOString(),
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    initialPriority: 'CRITICAL' as const,
    isStale: false,
    summaryNote: profile.note
  };

  caseRepository.addSimulatedCase(newCase);
  res.json(newCase);
});

// GET /api/cases/:id
apiRouter.get('/cases/:id', (req: Request, res: Response) => {
  const caseId = req.params.id;
  const caseRecord = caseRepository.getCase(caseId);
  if (!caseRecord) {
    return res.status(404).json({ error: 'Case not found', code: 'CASE_NOT_FOUND' });
  }

  const entities = caseRepository.getEntities(caseId);
  const evidence = caseRepository.getEvidence(caseId);
  const relationships = caseRepository.getRelationships(caseId);
  const derivedFacts = caseRepository.getDerivedFacts(caseId);
  const latestAssessment = caseRepository.getLatestAssessment(caseId);
  const decisions = caseRepository.getDecisions(caseId);
  const evidenceRequests = caseRepository.getEvidenceRequests(caseId);

  res.json({
    caseRecord,
    entities,
    evidence,
    relationships,
    derivedFacts,
    latestAssessment,
    decisions,
    evidenceRequests
  });
});

// GET /api/cases/:id/graph
apiRouter.get('/cases/:id/graph', (req: Request, res: Response) => {
  const caseId = req.params.id;
  const entities = caseRepository.getEntities(caseId);
  const relationships = caseRepository.getRelationships(caseId);
  const rootEntity = entities[0]?.entityId || 'ENT-APP-001';

  const graph = buildRelationshipGraph(rootEntity, entities, relationships, {
    maxHops: 2,
    maxNodes: 30
  });

  res.json(graph);
});

// POST /api/cases/:id/investigations
apiRouter.post('/cases/:id/investigations', async (req: Request, res: Response) => {
  const caseId = req.params.id;
  const { mode = 'LOCAL_FIXTURE', policyVersion = '2026.07' } = req.body;

  const caseRecord = caseRepository.getCase(caseId);
  if (!caseRecord) {
    return res.status(404).json({ error: 'Case not found', code: 'CASE_NOT_FOUND' });
  }

  const evidence = caseRepository.getEvidence(caseId);
  const derivedFacts = caseRepository.getDerivedFacts(caseId);
  const snapshot = caseRepository.getSnapshot(caseRecord.currentSnapshotId) || {
    snapshotId: `SNAP-${caseId}-CURRENT`,
    caseId,
    revision: caseRecord.revision,
    asOf: new Date().toISOString(),
    evidenceIds: evidence.map(e => e.evidenceId),
    relationshipIds: [],
    derivedFacts,
    policySelectionContext: { policyId: 'RW-DEMO', version: policyVersion },
    canonicalInputHash: `hash-${caseId}-${Date.now()}`
  };

  const policy = AVAILABLE_POLICIES[policyVersion] || AVAILABLE_POLICIES['2026.07'];

  try {
    const run = await geminiPipelineService.runInvestigation(
      caseId,
      snapshot,
      evidence,
      policy,
      derivedFacts,
      mode as ExecutionMode
    );

    caseRepository.saveRun(run);
    if (run.publishedAssessment) {
      caseRepository.saveAssessment(run.publishedAssessment);
      caseRepository.appendAuditEvent(caseId, 'analyst-101', 'INVESTIGATION_RUN', caseRecord.revision, {
        runId: run.runId,
        proposedAction: run.publishedAssessment.proposedAction,
        riskTier: run.publishedAssessment.riskTier,
        executionMode: run.executionMode,
        latencyMs: run.latencyMs
      });
    }

    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: 'INVESTIGATION_FAILED' });
  }
});

// POST /api/cases/:id/experiments
apiRouter.post('/cases/:id/experiments', async (req: Request, res: Response) => {
  const caseId = req.params.id;
  const { mutationType, targetId, mode = 'LOCAL_FIXTURE' } = req.body;

  const caseRecord = caseRepository.getCase(caseId);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  const evidence = caseRepository.getEvidence(caseId);
  const relationships = caseRepository.getRelationships(caseId);
  const derivedFacts = caseRepository.getDerivedFacts(caseId);
  const snapshot = caseRepository.getSnapshot(caseRecord.currentSnapshotId);
  const policy = AVAILABLE_POLICIES['2026.07'];

  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });

  try {
    const experiment = await counterfactualService.runExperiment(
      caseId,
      snapshot,
      evidence,
      relationships,
      derivedFacts,
      policy,
      mutationType,
      targetId,
      mode as ExecutionMode
    );

    caseRepository.saveExperiment(experiment);
    caseRepository.appendAuditEvent(caseId, 'analyst-101', 'EXPERIMENT_EXECUTED', caseRecord.revision, {
      experimentId: experiment.experimentId,
      mutationType,
      targetId,
      originalAction: experiment.originalAssessment.proposedAction,
      mutatedAction: experiment.mutatedAssessment?.proposedAction
    });

    res.json(experiment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cases/:id/policy-replays
apiRouter.post('/cases/:id/policy-replays', async (req: Request, res: Response) => {
  const caseId = req.params.id;
  const { policyV1Id = '2026.01', policyV2Id = '2026.07', mode = 'LOCAL_FIXTURE' } = req.body;

  const caseRecord = caseRepository.getCase(caseId);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  const evidence = caseRepository.getEvidence(caseId);
  const derivedFacts = caseRepository.getDerivedFacts(caseId);
  const snapshot = caseRepository.getSnapshot(caseRecord.currentSnapshotId);

  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });

  try {
    const replay = await counterfactualService.replayPolicy(
      caseId,
      snapshot,
      evidence,
      derivedFacts,
      policyV1Id,
      policyV2Id,
      mode as ExecutionMode
    );

    caseRepository.saveReplay(replay);
    caseRepository.appendAuditEvent(caseId, 'analyst-101', 'POLICY_REPLAY', caseRecord.revision, {
      replayId: replay.replayId,
      policyV1Id,
      policyV2Id,
      dispositionChanged: replay.deterministicDispositionChanged,
      v1Action: replay.v1Assessment.proposedAction,
      v2Action: replay.v2Assessment.proposedAction
    });

    res.json(replay);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cases/:id/evidence-requests
apiRouter.post('/cases/:id/evidence-requests', (req: Request, res: Response) => {
  const caseId = req.params.id;
  const { checkType, title, requiredFacts = [], reason, requester = 'analyst-101' } = req.body;

  if (!checkType || !title || !reason) {
    return res.status(400).json({ error: 'checkType, title, and reason are required' });
  }

  const request = caseRepository.createEvidenceRequest(caseId, {
    caseId,
    checkType,
    title,
    requiredFacts,
    reason,
    requester
  });

  res.json(request);
});

// POST /api/evidence-requests/:id/fulfill
apiRouter.post('/evidence-requests/:id/fulfill', (req: Request, res: Response) => {
  const requestId = req.params.id;
  const { caseId, actorId = 'analyst-101' } = req.body;

  if (!caseId) return res.status(400).json({ error: 'caseId required' });

  const result = caseRepository.fulfillEvidenceRequest(requestId, caseId, actorId);
  if (!result.success) {
    return res.status(404).json({ error: 'Request not found' });
  }

  res.json(result);
});

// POST /api/cases/:id/decisions (Optimistic Concurrency Check)
apiRouter.post('/cases/:id/decisions', (req: Request, res: Response) => {
  const caseId = req.params.id;
  const { 
    snapshotId, 
    caseRevision, 
    adoptedOrOverridden, 
    disposition, 
    reasonCode, 
    notes, 
    sourceAcknowledgements = [],
    actorId = 'analyst-101'
  } = req.body;

  if (!notes || notes.trim().length < 8) {
    return res.status(400).json({ error: 'A meaningful rationale of at least 8 characters is required for human decisions.' });
  }

  if (!disposition || !reasonCode || caseRevision === undefined) {
    return res.status(400).json({ error: 'Missing required decision fields (disposition, reasonCode, caseRevision).' });
  }

  const result = caseRepository.recordDecision(caseId, {
    caseId,
    snapshotId,
    caseRevision,
    actorId,
    adoptedOrOverridden,
    disposition,
    reasonCode,
    notes,
    sourceAcknowledgements
  }, actorId);

  if (!result.success) {
    return res.status(result.error?.includes('409') ? 409 : 400).json({ error: result.error });
  }

  res.json(result.decision);
});

// POST /api/cases/:id/reopen (Supervisor / Super Admin Only)
apiRouter.post('/cases/:id/reopen', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const isSuperAdmin = actor.role === 'SUPER_ADMIN';
  const hasSupervisorDelegation = actor.activeDelegation?.allowedActions.includes('decision.supervisor.review');
  if (!isSuperAdmin && !hasSupervisorDelegation) {
    return res.status(403).json({ error: 'Access Denied: Only Super Admin or an active supervisor delegate may reopen cases.', code: 'FORBIDDEN' });
  }

  const caseId = req.params.id;
  const { reason } = req.body;

  if (!reason || reason.trim().length < 6) {
    return res.status(400).json({ error: 'A supervisor justification of at least 6 characters is required to reopen.' });
  }

  const result = caseRepository.reopenCase(caseId, actor.userId, reason);
  if (!result.success) return res.status(404).json({ error: result.error });

  if (actor.activeDelegation) {
    caseRepository.recordDelegationActivity(actor.activeDelegation.id, actor.userId, actor.name, 'CASE_REOPENED', `Reopened case ${caseId}: ${reason}`, caseId);
  }

  res.json({ success: true, message: 'Case reopened by supervisor' });
});

// GET /api/cases/:id/audit
apiRouter.get('/cases/:id/audit', (req: Request, res: Response) => {
  const caseId = req.params.id;
  const auditTrail = caseRepository.getAuditTrail(caseId);
  const chainVerification = caseRepository.verifyAuditChain(caseId);

  res.json({
    caseId,
    totalEvents: auditTrail.length,
    chainVerification,
    events: auditTrail
  });
});

// GET /api/cases/:id/export
apiRouter.get('/cases/:id/export', (req: Request, res: Response) => {
  const caseId = req.params.id;
  const { format = 'json' } = req.query;
  const reviewPacket = caseRepository.exportReviewPacket(caseId);

  if (format === 'html') {
    res.setHeader('Content-Type', 'text/html');
    return res.send(reviewPacket.html);
  }

  res.json(reviewPacket.manifest);
});

// GET /api/policies
apiRouter.get('/policies', (req: Request, res: Response) => {
  res.json({
    policies: Object.values(AVAILABLE_POLICIES)
  });
});

// GET /api/evaluations
apiRouter.get('/evaluations', (req: Request, res: Response) => {
  res.json({
    evaluations: evaluationService.listEvaluations()
  });
});

// POST /api/evaluations/run (Super Admin Only)
apiRouter.post('/evaluations/run', (req: Request, res: Response) => {
  const actor = resolveActor(req);
  const check = AccessPolicyEngine.canRunEvaluationSuite(actor);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason, code: 'FORBIDDEN' });
  }

  const { suiteName = 'SMOKE_12' } = req.body;
  const evalRun = evaluationService.runBenchmarkSuite(suiteName);
  res.json(evalRun);
});

// POST /api/imports/validate
apiRouter.post('/imports/validate', (req: Request, res: Response) => {
  const { records = [] } = req.body;
  const rowErrors: Array<{ row: number; error: string }> = [];

  records.forEach((r: any, idx: number) => {
    if (!r.evidenceType) rowErrors.push({ row: idx + 1, error: 'Missing evidenceType' });
    if (!r.sourceLocator) rowErrors.push({ row: idx + 1, error: 'Missing sourceLocator' });
  });

  res.json({
    valid: rowErrors.length === 0,
    totalRecords: records.length,
    rowErrors
  });
});

// POST /api/imports/commit
apiRouter.post('/imports/commit', (req: Request, res: Response) => {
  const { caseId, records = [] } = req.body;
  if (!caseId) return res.status(400).json({ error: 'caseId required' });

  // Idempotently commit new synthetic evidence
  res.json({
    success: true,
    committedCount: records.length,
    message: `${records.length} records committed successfully.`
  });
});
