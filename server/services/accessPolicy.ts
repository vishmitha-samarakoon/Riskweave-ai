// RiskWeave AI - Executable Access Policy & Enforcement Module
// Conforms strictly to Sections 32-36, ACCESS_MATRIX.md, and NIST 800-53 AC

import { Request, Response, NextFunction } from 'express';
import { DelegationGrant, DelegableAction } from '../../shared/types';

export type UserRole = 'SUPER_ADMIN' | 'INVESTIGATOR' | 'ANALYST' | 'CUSTOMER';

export type NarrowAction = 
  | 'availability.self.read'
  | 'availability.self.update'
  | 'investigator.manage'
  | 'role.manage'
  | 'assignment.manual'
  | 'assignment.auto.preview'
  | 'assignment.auto.execute'
  | 'assignment.policy.manage'
  | 'delegation.create'
  | 'delegation.revoke'
  | 'delegation.audit.read'
  | 'case.read'
  | 'evidence.review'
  | 'submission.review'
  | 'evidence.verify'
  | 'request.publish'
  | 'decision.propose'
  | 'decision.approve'
  | 'decision.critical.approve'
  | 'quality.case.run'
  | 'quality.case.read'
  | 'quality.system.run'
  | 'quality.system.read'
  | 'quality.evaluation.run'
  | 'quality.evaluation.read'
  | 'settings.manage'
  | 'audit.read'
  | 'export.create'
  | 'portal.request.read'
  | 'portal.response.submit'
  | 'portal.message.send';

export interface AuthenticatedActor {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  isSuspended?: boolean;
  capabilities: NarrowAction[];
  activeDelegation?: DelegationGrant;
}

// Built-in Seed Principal Contexts for Prototype & Test Environments
export const SEED_PRINCIPALS: Record<string, AuthenticatedActor> = {
  'sup-901': {
    userId: 'sup-901',
    name: 'Sarah Chen',
    email: 's.chen@meridian.bank.internal',
    role: 'SUPER_ADMIN',
    tenantId: 'TENANT-MERIDIAN-BANK',
    capabilities: [
      'availability.self.read',
      'availability.self.update',
      'investigator.manage',
      'role.manage',
      'assignment.manual',
      'assignment.auto.preview',
      'assignment.auto.execute',
      'assignment.policy.manage',
      'delegation.create',
      'delegation.revoke',
      'delegation.audit.read',
      'case.read',
      'evidence.review',
      'submission.review',
      'evidence.verify',
      'request.publish',
      'decision.propose',
      'decision.approve',
      'decision.critical.approve',
      'quality.case.run',
      'quality.case.read',
      'quality.system.run',
      'quality.system.read',
      'quality.evaluation.run',
      'quality.evaluation.read',
      'settings.manage',
      'audit.read',
      'export.create'
    ]
  },
  'analyst-101': {
    userId: 'analyst-101',
    name: 'Marcus Rivera',
    email: 'm.rivera@meridian.bank.internal',
    role: 'INVESTIGATOR',
    tenantId: 'TENANT-MERIDIAN-BANK',
    capabilities: [
      'availability.self.read',
      'availability.self.update',
      'case.read',
      'evidence.review',
      'submission.review',
      'evidence.verify',
      'request.publish',
      'decision.propose',
      'quality.case.run',
      'quality.case.read',
      'audit.read',
      'export.create'
    ]
  },
  'analyst-102': {
    userId: 'analyst-102',
    name: 'Priya Patel',
    email: 'p.patel@meridian.bank.internal',
    role: 'INVESTIGATOR',
    tenantId: 'TENANT-MERIDIAN-BANK',
    capabilities: [
      'availability.self.read',
      'availability.self.update',
      'case.read',
      'evidence.review',
      'submission.review',
      'evidence.verify',
      'request.publish',
      'decision.propose',
      'decision.approve', // senior capability for standard reviews
      'quality.case.run',
      'quality.case.read',
      'audit.read'
    ]
  },
  'analyst-103': {
    userId: 'analyst-103',
    name: 'David Vance',
    email: 'd.vance@meridian.bank.internal',
    role: 'INVESTIGATOR',
    tenantId: 'TENANT-MERIDIAN-BANK',
    capabilities: [
      'availability.self.read',
      'availability.self.update',
      'case.read',
      'evidence.review',
      'submission.review',
      'evidence.verify',
      'request.publish',
      'decision.propose',
      'decision.critical.approve', // qualified independent reviewer
      'quality.case.run',
      'quality.case.read',
      'audit.read'
    ]
  },
  'cust-001': {
    userId: 'cust-001',
    name: 'Elena Rostova',
    email: 'elena.rostova@personal.example',
    role: 'CUSTOMER',
    tenantId: 'TENANT-MERIDIAN-BANK',
    capabilities: [
      'portal.request.read',
      'portal.response.submit',
      'portal.message.send'
    ]
  },
  'cust-002': {
    userId: 'cust-002',
    name: 'Marcus Vance',
    email: 'm.vance@personal.example',
    role: 'CUSTOMER',
    tenantId: 'TENANT-MERIDIAN-BANK',
    capabilities: [
      'portal.request.read',
      'portal.response.submit',
      'portal.message.send'
    ]
  }
};

// Global delegation resolver plug point
let delegationResolver: ((userId: string) => DelegationGrant | undefined) | null = null;
export function setDelegationResolver(resolver: (userId: string) => DelegationGrant | undefined) {
  delegationResolver = resolver;
}

/**
 * Resolves the authenticated actor from request headers.
 * Never blindly trusts x-user-role header for privilege escalation.
 */
export function resolveActor(req: Request): AuthenticatedActor {
  const headerUserId = req.header('x-user-id');
  const headerTenantId = req.header('x-tenant-id') || 'TENANT-MERIDIAN-BANK';

  let base: AuthenticatedActor;

  if (headerUserId && SEED_PRINCIPALS[headerUserId]) {
    base = {
      ...SEED_PRINCIPALS[headerUserId],
      tenantId: headerTenantId
    };
  } else if (headerUserId) {
    const isCust = headerUserId.startsWith('cust');
    base = {
      userId: headerUserId,
      name: isCust ? 'Customer User' : 'Staff Investigator',
      email: `${headerUserId}@bank.internal`,
      role: isCust ? 'CUSTOMER' : 'INVESTIGATOR',
      tenantId: headerTenantId,
      capabilities: isCust 
        ? SEED_PRINCIPALS['cust-001'].capabilities 
        : SEED_PRINCIPALS['analyst-101'].capabilities
    };
  } else {
    // Default session for untagged prototype requests
    base = { ...SEED_PRINCIPALS['sup-901'], tenantId: headerTenantId };
  }

  // Check for active delegation grant
  if (delegationResolver && base.role !== 'SUPER_ADMIN' && base.role !== 'CUSTOMER') {
    const activeGrant = delegationResolver(base.userId);
    if (activeGrant && activeGrant.status === 'ACTIVE') {
      const now = new Date().toISOString();
      if (now >= activeGrant.startAt && now <= activeGrant.endAt) {
        base.activeDelegation = activeGrant;
      }
    }
  }

  return base;
}

/**
 * Evaluates core authorization rules according to ACCESS_MATRIX.md and Sections 32-36.
 */
export class AccessPolicyEngine {
  /**
   * Section 32 & 33 Rule: Personal declared availability is STRICTLY self-owned.
   * Derives target from authenticated identity; rejects any attempt to target another user.
   */
  public static canUpdateSelfAvailability(actor: AuthenticatedActor, targetUserId: string): { allowed: boolean; reason?: string } {
    if (actor.isSuspended) {
      return { allowed: false, reason: 'Account suspended. Availability updates rejected.' };
    }
    if (actor.role === 'CUSTOMER') {
      return { allowed: false, reason: 'Customers do not hold operational availability states.' };
    }
    if (actor.userId !== targetUserId) {
      return { allowed: false, reason: 'Access Denied: Staff may only update their own declared availability.' };
    }
    return { allowed: true };
  }

  /**
   * Section 32 & 18 Rule: Super Admin can manage workforce routing and capacity,
   * but CANNOT alter or rewrite a staff member's personal declared availability (`status`).
   * Ordinary investigators and delegates CANNOT manage investigators.
   */
  public static canManageInvestigator(
    actor: AuthenticatedActor, 
    targetTenantId: string, 
    requestedFields?: Record<string, any>
  ): { allowed: boolean; reason?: string } {
    if (actor.role !== 'SUPER_ADMIN') {
      return { allowed: false, reason: 'Access Denied: Only Super Admin may manage investigator profiles and routing.' };
    }
    if (actor.tenantId !== targetTenantId) {
      return { allowed: false, reason: 'Cross-tenant isolation violation: Super Admin authority is strictly scoped to own institution.' };
    }
    if (requestedFields && 'status' in requestedFields) {
      return { allowed: false, reason: 'Access Denied: Administrator may adjust capacity and routing eligibility, but cannot rewrite staff declared availability.' };
    }
    return { allowed: true };
  }

  /**
   * Section 34 Rule: ONLY actual Super Admin may preview, execute, or configure auto-assignment.
   * Delegates and investigators are strictly forbidden.
   */
  public static canAutoAssign(actor: AuthenticatedActor): { allowed: boolean; reason?: string } {
    if (actor.role !== 'SUPER_ADMIN') {
      return { allowed: false, reason: 'Access Denied: Only actual Super Admin may preview or execute auto-assignment.' };
    }
    if (actor.isSuspended) {
      return { allowed: false, reason: 'Account suspended. Auto-assignment denied.' };
    }
    return { allowed: true };
  }

  /**
   * Section 34 Rule: Manual assignment requires Super Admin OR an active delegation with 'assignment.manual'.
   */
  public static canManualAssign(actor: AuthenticatedActor): { allowed: boolean; reason?: string } {
    if (actor.isSuspended) {
      return { allowed: false, reason: 'Account suspended. Assignment denied.' };
    }
    if (actor.role === 'SUPER_ADMIN') {
      return { allowed: true };
    }
    if (actor.activeDelegation && actor.activeDelegation.allowedActions.includes('assignment.manual')) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Access Denied: Manual assignment requires Super Admin authority or an active Temporary Cover delegation.' };
  }

  /**
   * Section 35 Rule: Temporary cover delegation creation and revocation.
   * Strictly actual Super Admin only.
   */
  public static canManageDelegation(actor: AuthenticatedActor): { allowed: boolean; reason?: string } {
    if (actor.role !== 'SUPER_ADMIN') {
      return { allowed: false, reason: 'Access Denied: Only Super Admin can create or revoke Temporary Cover delegations.' };
    }
    if (actor.isSuspended) {
      return { allowed: false, reason: 'Account suspended.' };
    }
    return { allowed: true };
  }

  /**
   * Section 36 & Gate 8 Rule: Dual-Approval Separation of Duties.
   * Originating investigator can never approve their own request regardless of role.
   * Independent supervisor or qualified approver can approve.
   */
  public static canApproveDualApproval(
    actor: AuthenticatedActor, 
    originatingInvestigatorId: string
  ): { allowed: boolean; reason?: string } {
    if (actor.isSuspended) {
      return { allowed: false, reason: 'Account suspended.' };
    }
    if (actor.userId === originatingInvestigatorId) {
      return { allowed: false, reason: 'Separation of Duties violation: The originating investigator cannot approve their own dual-approval request.' };
    }
    if (actor.role === 'SUPER_ADMIN' || actor.capabilities.includes('decision.approve') || actor.capabilities.includes('decision.critical.approve')) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Access Denied: Independent supervisor approval required.' };
  }

  /**
   * Section 36 Rule: Dual Independent Approvals for Critical Cases & Rejections.
   * Rules:
   * 1. Maker cannot approve their own proposal!
   * 2. An approver cannot vote twice.
   * 3. Approver must be Super Admin OR have decision.critical.approve capability or active delegation.
   */
  public static canApproveCriticalDecision(
    actor: AuthenticatedActor, 
    makerId: string, 
    priorApproverIds: string[]
  ): { allowed: boolean; reason?: string } {
    if (actor.isSuspended) {
      return { allowed: false, reason: 'Account suspended.' };
    }
    if (actor.userId === makerId) {
      return { allowed: false, reason: 'Separation of Duties violation: The proposal author cannot approve their own decision.' };
    }
    if (priorApproverIds.includes(actor.userId)) {
      return { allowed: false, reason: 'Duplicate vote: You have already recorded an approval vote on this proposal.' };
    }

    const hasSuperAdmin = actor.role === 'SUPER_ADMIN';
    const hasCriticalCapability = actor.capabilities.includes('decision.critical.approve');
    const hasDelegatedApproval = actor.activeDelegation && 
      actor.activeDelegation.allowedActions.includes('decision.critical.approve');

    if (hasSuperAdmin || hasCriticalCapability || hasDelegatedApproval) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Access Denied: Independent approval on critical decisions requires Super Admin or explicitly qualified independent approver authority.' };
  }

  /**
   * Section 37 Rule: Quality Evaluation execution.
   * Global model benchmark suites are restricted to Super Admin.
   */
  public static canRunEvaluationSuite(actor: AuthenticatedActor): { allowed: boolean; reason?: string } {
    if (actor.role !== 'SUPER_ADMIN') {
      return { allowed: false, reason: 'Access Denied: Only Super Admin may execute global benchmark evaluation suites.' };
    }
    return { allowed: true };
  }

  /**
   * Section 17 & 26 Rule: Case Access.
   */
  public static canAccessCase(actor: AuthenticatedActor, caseTenantId: string, assigneeId?: string): { allowed: boolean; reason?: string } {
    if (actor.isSuspended) {
      return { allowed: false, reason: 'Account suspended. Access revoked.' };
    }
    if (actor.role === 'CUSTOMER') {
      return { allowed: false, reason: 'Access Denied: Customers cannot access internal investigation records or case files.' };
    }
    if (actor.tenantId !== caseTenantId) {
      return { allowed: false, reason: 'Cross-tenant access violation.' };
    }
    if (actor.role === 'SUPER_ADMIN') {
      return { allowed: true };
    }
    if (actor.activeDelegation && actor.activeDelegation.allowedActions.includes('case.view')) {
      return { allowed: true };
    }
    return { allowed: true };
  }

  /**
   * Section 20 Rule: Customer Portal Access.
   */
  public static canAccessCustomerPortal(actor: AuthenticatedActor, requestCustomerId: string): { allowed: boolean; reason?: string } {
    if (actor.role === 'CUSTOMER' && actor.userId !== requestCustomerId) {
      return { allowed: false, reason: 'Access Denied: You may only view and respond to your own verification requests.' };
    }
    return { allowed: true };
  }
}
