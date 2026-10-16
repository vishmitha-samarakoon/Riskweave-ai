// RiskWeave AI - Shared Domain Types & Contracts

export type RiskTier = 'LOW' | 'REVIEW' | 'HIGH';
export type ProposedAction = 'CLEAR' | 'REQUEST_MORE_EVIDENCE' | 'ENHANCED_VERIFICATION' | 'ESCALATE';
export type EvidenceSufficiency = 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED';
export type FreshnessClass = 'FRESH' | 'AGING' | 'STALE';
export type ExecutionMode = 'LOCAL_FIXTURE' | 'LIVE_GOOGLE' | 'RECORDED_REPLAY';
export type CaseStatus = 
  | 'NEW' 
  | 'IN_REVIEW' 
  | 'WAITING_FOR_INFORMATION' 
  | 'ADDITIONAL_VERIFICATION' 
  | 'AWAITING_SPECIALIST' 
  | 'SUPERVISOR_REVIEW' 
  | 'DECIDED' 
  | 'CLOSED' 
  | 'REOPENED' 
  | 'ESCALATED';

export type EntityType = 'PERSON' | 'APPLICATION' | 'DEVICE' | 'ACCOUNT' | 'PHONE' | 'EMAIL' | 'PRIOR_CASE';
export type RelationType = 
  | 'OWNS_DEVICE' 
  | 'USES_PHONE' 
  | 'USES_EMAIL' 
  | 'OPENED_ACCOUNT' 
  | 'LINKED_TO_CASE' 
  | 'SHARED_IP' 
  | 'CO_RESIDENT' 
  | 'DEVICE_SHARED_WITH';

export type MatchState = 'OBSERVED' | 'CANDIDATE_MATCH' | 'REJECTED_MATCH' | 'VERIFIED_MATCH';
export type ClaimKind = 'FACT' | 'INFERENCE' | 'HYPOTHESIS';
export type PolicyFindingResult = 'SATISFIED' | 'NOT_SATISFIED' | 'UNKNOWN' | 'CONFLICT';

export interface Entity {
  entityId: string;
  type: EntityType;
  maskedDisplayLabel: string;
  normalizedIdentifiers: Record<string, string>;
  sourceIds: string[];
  matchState: MatchState;
  metadata?: Record<string, any>;
}

export interface StructuredFacts {
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export interface Evidence {
  evidenceId: string;
  caseId: string;
  evidenceType: string;
  observedAt: string; // ISO 8601 UTC
  ingestedAt: string; // ISO 8601 UTC
  validFrom?: string;
  validTo?: string;
  sourceType: 'CORE_BANKING' | 'DEVICE_TELEMETRY' | 'ID_VERIFIER' | 'CREDIT_BUREAU' | 'WATCHLIST' | 'INTERNAL_ALERT' | 'SYNTHETIC_REQUEST';
  sourceRecordId: string;
  sourceHash: string;
  sourceLocator: string;
  structuredFacts: StructuredFacts;
  optionalUntrustedText?: string;
  verificationStatus: VerificationStatus;
  freshnessClass: FreshnessClass;
  supersedesEvidenceId?: string;
  independenceGroup: string; // duplicate telemetry shares independenceGroup
  synthetic: boolean;
  collectedAt?: string;
  description?: string;
  relevance?: string;
  provenance?: {
    sourceLocator?: string;
    reliabilityScore?: number;
    verificationBasis?: string;
    [key: string]: any;
  };
  contradictionIds?: string[];
}

export interface Relationship {
  edgeId: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: RelationType;
  observedAt: string;
  validFrom?: string;
  validTo?: string;
  evidenceIds: string[];
  method: 'EXACT_IDENTIFIER' | 'TELEMETRY_LINK' | 'DECLARED' | 'CANDIDATE_RULE';
  matchState: MatchState;
  confidence?: 'CONFIRMED' | 'CANDIDATE';
}

export interface DerivedFact {
  factId: string;
  type: string;
  value: string | number | boolean;
  units?: string;
  methodVersion: string;
  inputEvidenceIds: string[];
  inputFactIds?: string[];
  asOf: string;
}

export interface PolicyClause {
  clauseId: string; // e.g. P01, P02
  title: string;
  text: string;
  sourceLocator: string;
  predicateType: 'NO_SOLE_DEVICE_ESCALATION' | 'TWO_INDEPENDENT_CONCERN_CLASSES' | 'ENHANCED_VERIFICATION_CONTRADICTION' | 'REQUEST_MORE_EVIDENCE' | 'CLEAR_CRITERIA' | 'CANDIDATE_LINK_ISOLATION' | 'HUMAN_DECISION_MANDATORY' | 'SUPERVISOR_CONFLICT';
  requiredEvidenceTypes?: string[];
  actionConstraints: ProposedAction[];
  notes?: string;
}

export interface PolicyVersion {
  policyId: string;
  version: string; // e.g. "2026.01", "2026.07"
  effectiveFrom: string;
  effectiveTo?: string;
  product: string;
  jurisdictionTag: string; // synthetic demo routing tag
  status: 'ACTIVE' | 'SUPERSEDED' | 'DRAFT';
  hash: string;
  clauses: PolicyClause[];
}

export interface CaseSnapshot {
  snapshotId: string;
  caseId: string;
  revision: number;
  asOf: string;
  evidenceIds: string[];
  relationshipIds: string[];
  derivedFacts: DerivedFact[];
  policySelectionContext: {
    policyId: string;
    version: string;
  };
  canonicalInputHash: string;
}

export interface Claim {
  claimId: string;
  kind: ClaimKind;
  text: string;
  evidenceIds: string[];
  derivedFactIds?: string[];
  relationshipIds?: string[];
  policyClauseRefs: string[];
  sourceLocators: string[];
  verification: VerificationStatus;
}

export interface Contradiction {
  contradictionId: string;
  claimIds: string[];
  evidenceIds: string[];
  description: string;
  resolutionNeeded: string;
}

export interface MissingEvidence {
  requirementId: string;
  checkType: string;
  reason: string;
  decisionImpact: string;
}

export interface PolicyFinding {
  policyId: string;
  version: string;
  clauseId: string;
  result: PolicyFindingResult;
  evidenceIds: string[];
  explanation: string;
}

export interface ReviewerChallenge {
  alternativeExplanation: string;
  evidenceIds: string[];
  unresolvedIssues: string[];
  suggestedExperimentIds: string[];
}

export interface NextCheck {
  checkType: string;
  title: string;
  resolvesRequirementIds: string[];
  reason: string;
  evidenceIds: string[];
  criticalResolved: number;
  contradictionsResolved: number;
  policyRequired: boolean;
  analystEffortBand: 1 | 2 | 3; // 1=low, 2=med, 3=high
  customerFrictionBand: 1 | 2 | 3;
  priorityScore: number; // 3*crit + 2*contra + 2*polReq - effort - friction
}

export interface Assessment {
  assessmentId: string;
  caseId: string;
  snapshotId: string;
  riskTier: RiskTier;
  proposedAction: ProposedAction;
  evidenceSufficiency: EvidenceSufficiency;
  summary: string;
  claims: Claim[];
  supportingClaimIds: string[];
  challengingClaimIds: string[];
  contradictions: Contradiction[];
  missingEvidence: MissingEvidence[];
  policyFindings: PolicyFinding[];
  reviewerChallenge: ReviewerChallenge;
  nextChecks: NextCheck[];
  limitations: string[];
  // Metadata added by server
  modelRequested?: string;
  modelReturned?: string;
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs?: number;
  executedAt: string;
  executionMode: ExecutionMode;
  publishedAssessmentHash: string;
  validationStatus: 'PASSED' | 'REPAIRED' | 'BLOCKED';
}

export interface InvestigationRun {
  runId: string;
  caseId: string;
  snapshotId: string;
  policyVersionIds: string[];
  pipelineVersion: string;
  promptVersion: string;
  modelRequested: string;
  modelReturned: string;
  generationConfig: Record<string, any>;
  executionMode: ExecutionMode;
  startedAt: string;
  finishedAt: string;
  stageStates: {
    investigator: 'PENDING' | 'COMPLETED' | 'FAILED';
    policyAnalyst: 'PENDING' | 'COMPLETED' | 'FAILED';
    counterfactualReviewer: 'PENDING' | 'COMPLETED' | 'FAILED';
    validationGate: 'PENDING' | 'PASSED' | 'FAILED';
  };
  candidateAssessment?: Assessment;
  validationResult?: {
    valid: boolean;
    errors: string[];
    repaired: boolean;
  };
  publishedAssessment?: Assessment;
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
  retries: number;
  cacheStatus: 'HIT' | 'MISS';
  errorCode?: string;
}

export interface HumanDecision {
  decisionId: string;
  caseId: string;
  runId?: string;
  snapshotId: string;
  caseRevision: number;
  actorId: string;
  adoptedOrOverridden: 'ADOPTED' | 'OVERRIDDEN';
  disposition: ProposedAction;
  reasonCode: string;
  notes: string;
  sourceAcknowledgements: string[];
  timestamp: string; // UTC ISO
}

export interface EvidenceRequest {
  requestId: string;
  caseId: string;
  checkType: string;
  title: string;
  requiredFacts: string[];
  reason: string;
  requester: string;
  status: 'PENDING' | 'FULFILLED' | 'CANCELLED';
  suppliedEvidenceIds?: string[];
  createdAt: string;
  fulfilledAt?: string;
}

export interface CaseRecord {
  caseId: string;
  applicationId: string;
  applicantName: string;
  status: CaseStatus;
  assigneeId: string;
  assigneeName?: string;
  product: string; // e.g. "Personal Checking"
  jurisdictionTag: string; // "DEMO-US-RETAIL"
  alertReasonCodes: string[];
  currentSnapshotId: string;
  revision: number;
  createdAt: string;
  dueAt: string;
  lastActivityAt?: string;
  lastSeenRevisionByUser?: Record<string, number>;
  initialPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  currentRiskTier?: RiskTier;
  currentSufficiency?: EvidenceSufficiency;
  lastAssessedAction?: ProposedAction;
  isStale: boolean;
  summaryNote?: string;
}

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'RESULT_SUBMITTED' | 'COMPLETED' | 'CANCELLED';

export interface TaskRecord {
  taskId: string;
  caseId: string;
  type: 'EVIDENCE_REQUEST' | 'ADDITIONAL_VERIFICATION' | 'SUPERVISOR_APPROVAL' | 'SPECIALIST_REVIEW';
  title: string;
  purpose: string;
  status: TaskStatus;
  requesterId: string;
  requesterName?: string;
  assigneeId: string;
  assigneeName: string;
  dueAt?: string;
  linkedEvidenceIds: string[];
  resolutionNote?: string;
  cancellationReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CaseNote {
  noteId: string;
  caseId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  mentions?: string[];
}

export interface DecisionDraft {
  caseId: string;
  authorId: string;
  baseRevision?: number;
  caseRevision?: number;
  baseSnapshotId?: string;
  snapshotId?: string;
  disposition?: ProposedAction | null;
  reviewChoice?: 'ADOPTED' | 'OVERRIDDEN' | null;
  adoptedOrOverridden?: 'ADOPTED' | 'OVERRIDDEN';
  reasonCode?: string;
  notes?: string;
  sourceAcknowledgements?: string[];
  savedAt: string;
  expiresAt?: string;
}

export interface NotificationItem {
  notificationId: string;
  tenantId: string;
  recipientId: string;
  caseId: string;
  category: 'ASSIGNMENT' | 'TASK' | 'EVIDENCE_ADDED' | 'AI_REVIEW' | 'SUPERVISOR' | 'DUE_SOON' | 'MENTION' | 'CASE_REOPENED';
  title: string;
  message: string;
  actionLabel: string;
  actionTarget: 'CASE_REVIEW' | 'TASKS' | 'EVIDENCE' | 'AUDIT';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
  snoozedUntil: string | null;
}

export interface SupervisorReviewRequest {
  requestId: string;
  caseId: string;
  type: 'HIGH_RISK_CLEAR_OVERRIDE' | 'SPECIALIST_REFERRAL' | 'REOPEN_REVIEW';
  analystId: string;
  analystName: string;
  proposedAction: ProposedAction;
  analystRationale: string;
  status: 'PENDING' | 'APPROVED' | 'RETURNED_FOR_CLARIFICATION' | 'OVERRIDDEN';
  supervisorId?: string;
  supervisorRationale?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditEvent {
  sequence: number;
  eventId: string;
  tenantId: string;
  caseId: string;
  actorId: string;
  eventType: 
    | 'CASE_CREATED' 
    | 'SNAPSHOT_FROZEN' 
    | 'EVIDENCE_INGESTED' 
    | 'INVESTIGATION_RUN' 
    | 'EXPERIMENT_EXECUTED' 
    | 'POLICY_REPLAY' 
    | 'EVIDENCE_REQUESTED' 
    | 'EVIDENCE_FULFILLED' 
    | 'DECISION_RECORDED' 
    | 'SUPERVISOR_REOPEN' 
    | 'CASE_ASSIGNED' 
    | 'AUTO_ASSIGNMENT_EXECUTED'
    | 'INVESTIGATOR_CREATED'
    | 'INVESTIGATOR_UPDATED'
    | 'INVESTIGATOR_DELETED'
    | 'INVESTIGATOR_ROUTING_UPDATED'
    | 'DUAL_APPROVAL_SUBMITTED'
    | 'DUAL_APPROVAL_RESOLVED'
    | 'DUAL_APPROVAL_FINALIZED'
    | 'DECISION_PROPOSAL_SUBMITTED'
    | 'DELEGATION_CREATED'
    | 'DELEGATION_REVOKED'
    | 'CUSTOMER_DOCUMENTS_SUBMITTED';
  objectVersion: number;
  serverTimestamp: string;
  previousHash: string;
  payloadHash: string;
  eventHash: string;
  payload: Record<string, any>;
}

export interface CounterfactualExperiment {
  experimentId: string;
  caseId: string;
  originalSnapshotId: string;
  mutationType: 
    | 'EXCLUDE_OBSERVATION' 
    | 'EXCLUDE_INDEPENDENT_SOURCE_GROUP' 
    | 'REJECT_CANDIDATE_ENTITY_MATCH' 
    | 'SUPERSEDE_WITH_HYPOTHETICAL_VERIFIED' 
    | 'ADD_HOUSEHOLD_SHARING_EXPLANATION'
    | 'UNCHANGED_CONTROL';
  targetId?: string; // target evidenceId, groupId, or edgeId
  description: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  originalAssessment: Assessment;
  mutatedAssessment?: Assessment;
  transitiveInvalidatedFactIds: string[];
  transitiveInvalidatedEdgeIds: string[];
  executedAt: string;
  executionMode: ExecutionMode;
}

export interface PolicyReplayResult {
  replayId: string;
  caseId: string;
  snapshotId: string;
  policyV1Id: string;
  policyV2Id: string;
  clauseDifferences: {
    clauseId: string;
    v1Text: string;
    v2Text: string;
    changedRequirement: string;
  }[];
  gateV1AllowedActions: ProposedAction[];
  gateV2AllowedActions: ProposedAction[];
  deterministicDispositionChanged: boolean;
  v1Assessment: Assessment;
  v2Assessment: Assessment;
  executedAt: string;
}

export interface EvaluationMetricReport {
  metricId: string;
  name: string;
  description: string;
  numerator: number;
  denominator: number;
  sampleNumerator?: number;
  sampleDenominator?: number;
  value: number; // percentage or ratio
  target?: number;
  targetMet?: boolean;
  status?: string;
  confidenceInterval?: [number, number]; // 95% Wilson
  unit: '%' | 'ms' | 'count';
}

export interface BaselineComparison {
  baselineName: 'BASELINE_A_RULES_ONLY' | 'BASELINE_B_SINGLE_CALL' | 'BASELINE_C_FULL_PIPELINE';
  displayName: string;
  name?: string;
  description?: string;
  agreementRate?: number;
  actionSetAgreement: number;
  unsafeClearRate: number;
  unnecessaryReviewRate: number;
  citationPrecision: number;
  unsupportedClaimRate: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  tokensPerCase: number;
  callsPerCase: number;
  costPer100Cases?: string;
}

export type InvestigatorStatus = 'AVAILABLE' | 'BUSY' | 'AWAY' | 'OFFLINE';
export type WorkShift = 'MORNING' | 'EVENING' | 'NIGHT' | 'WEEKEND';

export interface Investigator {
  id: string;
  name: string;
  email: string;
  role: string;
  specialization: string;
  department?: string;
  shift?: WorkShift;
  languages?: string[];
  status: InvestigatorStatus;
  lifecycleState?: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'ARCHIVED';
  assignmentEnabled?: boolean;
  declaredAvailabilityUpdatedAt?: string;
  returnAt?: string;
  maxCapacity: number;
  currentWorkload: number;
  activeCaseIds: string[];
  avatarColor: string;
  supervisorId?: string;
  supervisorName?: string;
  queue?: string;
  dualApprovalEnforced?: boolean;
  skills?: string[];
}

export interface DualApprovalRequest {
  requestId: string;
  caseId: string;
  applicantName: string;
  investigatorId: string;
  investigatorName: string;
  proposedDisposition: ProposedAction;
  reasonCode: string;
  rationale: string;
  submittedAt: string;
  status: 'PENDING_SUPERVISOR' | 'APPROVED' | 'REJECTED';
  supervisorId?: string;
  supervisorName?: string;
  supervisorNotes?: string;
  reviewedAt?: string;
}

export interface CustomerMessage {
  id: string;
  caseId: string;
  sender: 'CUSTOMER' | 'INVESTIGATOR';
  senderName: string;
  content: string;
  timestamp: string;
}

export interface CustomerUploadedDoc {
  id: string;
  caseId: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'UPLOADED' | 'VERIFIED' | 'REJECTED' | 'CORRECTION_REQUESTED';
  verificationCheckResult?: {
    verified: boolean;
    confidence: number;
    message: string;
  };
  notes?: string;
  base64Data?: string;
}

export interface CustomerSubmissionReceipt {
  receiptId: string;
  caseId: string;
  customerName: string;
  submittedAt: string;
  documentsCount: number;
  documentNames: string[];
  checksum: string;
  acknowledgementCode: string;
  status: 'CONFIRMED' | 'PENDING_REVIEW';
}

export interface CustomerPortalData {
  caseId: string;
  applicationId: string;
  customerName: string;
  portalStatus: 'PENDING_CUSTOMER_ACTION' | 'DOCUMENTS_SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED_COMPLETED' | 'CORRECTION_REQUIRED';
  requestedItems: Array<{
    id: string;
    title: string;
    description: string;
    required: boolean;
    fulfilled: boolean;
    documentId?: string;
  }>;
  explanationDraft: string;
  uploadedDocs: CustomerUploadedDoc[];
  messages: CustomerMessage[];
  receipt?: CustomerSubmissionReceipt;
  lastUpdatedAt: string;
}

// In-App Notification Center
export type NotificationCategory = 
  | 'CASE_ASSIGNED'
  | 'CASE_REASSIGNED'
  | 'TASK_ASSIGNED'
  | 'EVIDENCE_ACCEPTED'
  | 'MATERIAL_EVIDENCE_ADDED'
  | 'AI_REVIEW_READY'
  | 'AI_REVIEW_FAILED'
  | 'SUPERVISOR_REVIEW_REQUESTED'
  | 'SUPERVISOR_REVIEW_RESOLVED'
  | 'CUSTOMER_RESPONSE_RECEIVED'
  | 'TASK_DUE_SOON'
  | 'MENTION'
  | 'CASE_REOPENED';

export interface NotificationRecord {
  id: string;
  recipientId: string;
  tenantId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  caseId?: string;
  resourceRef?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
  actionUrl?: string;
  actionLabel?: string;
}

// Case Scratchpad (Section 27)

export interface CaseScratchpad {
  caseId: string;
  authorId: string;
  content: string;
  updatedAt: string;
}

// Submission Review Desk (Section 26)
export type SubmissionReviewAction = 
  | 'APPROVE_FOR_USE'
  | 'REQUEST_CORRECTION'
  | 'NEEDS_INTERNAL_VERIFICATION'
  | 'REFER_FOR_SECOND_REVIEW'
  | 'MARK_DUPLICATE';

export interface SubmissionReviewRecord {
  id: string;
  caseId: string;
  docId: string;
  documentType: string;
  fileName: string;
  submittedByCustomerName: string;
  submittedAt: string;
  fileChecksPassed: boolean;
  status: 'SUBMITTED_BY_CUSTOMER' | 'FILE_CHECKS_PASSED' | 'ACCEPTED_FOR_USE' | 'VERIFIED_FACT' | 'CORRECTION_REQUESTED' | 'REJECTED';
  reviewAction?: SubmissionReviewAction;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  findingNote?: string;
  correctionReason?: string;
  policyRequirementRef?: string;
  createdEvidenceId?: string;
}

export interface PublicRequestItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  fulfilled: boolean;
  accepted?: boolean;
  correctionRequested?: boolean;
  correctionNote?: string;
  documentId?: string;
  fileName?: string;
}

export interface PublicRequestView {
  publicId: string;
  caseId: string;
  applicationId: string;
  applicantName: string;
  title: string;
  status: 'ACTION_NEEDED' | 'DRAFT_SAVED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CORRECTION_REQUESTED' | 'COMPLETED' | 'CANCELLED';
  instructions: string;
  deadline: string;
  requestedItems: PublicRequestItem[];
  uploadedDocs: CustomerUploadedDoc[];
  messages: CustomerMessage[];
  receipt?: CustomerSubmissionReceipt;
  lastUpdatedAt: string;
}

export interface CaseAssignmentRecord {
  caseId: string;
  applicantName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  investigatorId: string;
  investigatorName: string;
  previousWorkload: number;
  newWorkload: number;
  reason: string;
}

export interface AutoAssignmentResult {
  assignedCount: number;
  unassignedRemaining: number;
  assignments: CaseAssignmentRecord[];
  investigators: Investigator[];
}

// --- TEMPORARY COVER & DELEGATION (Section 35) ---
export type DelegableAction = 
  | 'case.view' 
  | 'assignment.manual' 
  | 'submission.review' 
  | 'decision.supervisor.review' 
  | 'decision.critical.approve';

export interface DelegationGrant {
  id: string;
  tenantId: string;
  grantorId: string;
  grantorName: string;
  granteeId: string;
  granteeName: string;
  reason: string;
  allowedActions: DelegableAction[];
  scope: string; // e.g. "ALL" or specific queue tag
  startAt: string;
  endAt: string;
  acceptedAt?: string;
  status: 'SCHEDULED' | 'AWAITING_ACCEPTANCE' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  authorityVersion: number;
  createdAt: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface CoverPeriodActivity {
  activityId: string;
  delegationId: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  caseId?: string;
  details: string;
}

// --- CRITICAL DECISIONS & DUAL INDEPENDENT APPROVALS (Section 36) ---
export type RecommendationType = 
  | 'CLEAR' 
  | 'REQUEST_MORE_EVIDENCE' 
  | 'ENHANCED_VERIFICATION' 
  | 'ESCALATE' 
  | 'RECOMMEND_APPLICATION_REJECTION';

export interface ApprovalVote {
  voteId: string;
  proposalId: string;
  voterId: string;
  voterName: string;
  voterRole: string;
  delegationId?: string;
  decision: 'APPROVE' | 'DECLINE' | 'RETURN_FOR_CHANGES';
  reason: string;
  votedAt: string;
  authorityVersion: number;
}

export interface DecisionProposal {
  id: string;
  caseId: string;
  makerId: string;
  makerName: string;
  makerRole: string;
  proposedAction: ProposedAction;
  recommendationType: RecommendationType;
  rationale: string;
  reasonCode: string;
  critical: boolean;
  requiredApprovalsCount: number; // 2 if critical, 1 if supervisor review
  snapshotId: string;
  caseRevision: number;
  status: 'DRAFT' | 'AWAITING_APPROVALS' | 'APPROVED_INTERNALLY' | 'RETURNED_FOR_CHANGES' | 'DECLINED' | 'STALE' | 'WITHDRAWN';
  votes: ApprovalVote[];
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  finalizedBy?: string;
}

// --- QUALITY CHECKS: CASE READINESS & SYSTEM CHECKS (Section 37) ---
export type QualityCheckStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'NOT_RUN' | 'NOT_APPLICABLE' | 'STALE';

export interface CaseReadinessCheckItem {
  checkId: string;
  category: 'EVIDENCE_COMPLETENESS' | 'VERIFICATION_BASIS' | 'CONTRADICTION_REVIEW' | 'CUSTOMER_SUBMISSION' | 'ASSESSMENT_FRESHNESS' | 'DUAL_APPROVAL_REQUIREMENT';
  title: string;
  status: QualityCheckStatus;
  severity: 'CRITICAL_BLOCKER' | 'WARNING' | 'INFORMATIONAL';
  observedCondition: string;
  expectedCondition: string;
  plainLanguageReason: string;
  responsibleActionOrRole: string;
  remediationPath?: string;
}

export interface CaseReadinessResult {
  caseId: string;
  checkedAt: string;
  snapshotId: string;
  canSubmitProposal: boolean;
  canFinalizeDecision: boolean;
  stage: 'INITIAL_INTAKE' | 'READY_FOR_PROPOSAL' | 'AWAITING_INDEPENDENT_APPROVALS' | 'READY_TO_FINALIZE' | 'BLOCKED';
  checks: CaseReadinessCheckItem[];
  summaryMessage: string;
}

export interface SystemCheckItem {
  checkId: string;
  service: 'API_GATEWAY' | 'DATASTORE_ISOLATION' | 'STORAGE_INTAKE_GATE' | 'GEMINI_PIPELINE' | 'OUTBOX_NOTIFICATIONS';
  status: 'PASSED' | 'FAILED' | 'BLOCKED';
  latencyMs: number;
  details: string;
  checkedAt: string;
  remediationInstructions?: string;
}

export interface SystemChecksReport {
  timestamp: string;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  checks: SystemCheckItem[];
}

// --- AUTO-ASSIGNMENT PREVIEW & EXECUTION (Section 34) ---
export interface AutoAssignProposalItem {
  caseId: string;
  applicationId: string;
  applicantName: string;
  initialPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  proposedAssigneeId: string;
  proposedAssigneeName: string;
  currentWorkload: number;
  maxCapacity: number;
  eligibilityReason: string;
}

export interface AutoAssignBlockedItem {
  caseId: string;
  reason: string;
}

export interface AutoAssignPlan {
  planId: string;
  generatedAt: string;
  expiresAt: string;
  proposals: AutoAssignProposalItem[];
  blockedCases: AutoAssignBlockedItem[];
  totalEligible: number;
  totalBlocked: number;
  policyVersion: string;
}


