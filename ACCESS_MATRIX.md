# RiskWeave AI - Access Control & Capability Matrix
Date: 15 October 2026
Standard: NIST 800-53 AC / ISO 27001 / OWASP Top 10 API Security

This document formalizes the authorization contract, field-level access, and boundary enforcement for RiskWeave AI across all three principal experiences: **Super Admin**, **Investigator**, and **Customer**.

---

## 1. Actor Principals & Roles

| Principal | Role Code | Tenant Boundary | Description |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `SUPER_ADMIN` | Scoped to 1 institution (`tenantId`) | Lead fraud supervisor and workforce administrator. Full administrative authority over investigators, queue routing, and independent second approvals. Cannot investigate and self-approve the same case. Cannot rewrite staff personal availability declarations. |
| **Investigator** | `INVESTIGATOR` | Scoped to 1 institution (`tenantId`) | Fraud analyst. Reviews evidence, inspects discrepancies, runs bounded AI assessments, drafts/publishes customer requests, reviews customer submissions at the review desk, and records human decisions. May update own availability only. |
| **Customer** | `CUSTOMER` | Scoped to bound application (`customerId`, `applicationId`) | External retail banking applicant. Strictly limited to their own published information requests, safe upload intake, draft savings, questions, and receipts. Zero access to internal evidence ledgers, risk scores, policies, notes, or cases. |

---

## 2. Core Capabilities & Permission Dictionary

| Capability Code | Description | Default Role Grants |
| :--- | :--- | :--- |
| `investigator.manage` | Create, list, edit, suspend, reactivate, archive investigators | Super Admin only |
| `assignment.manage` | Assign or reassign cases across active team queues | Super Admin only |
| `availability.update.self` | Read and update personal declared availability (`AVAILABLE`, `BUSY`, `AWAY`, `OFF_DUTY`) | All staff (Derives target from authenticated identity; cannot specify another user ID) |
| `case.read` | View case alert, timeline, status, and summary | Super Admin (all org cases), Investigator (assigned or granted scope) |
| `evidence.read` | Inspect source documents, telemetry, entity connections, and audit chain | Super Admin, Investigator |
| `submission.review` | Review customer upload items, approve for use, or request correction | Super Admin, Investigator (on assigned cases) |
| `evidence.verify` | Record verified fact status with explicit policy verification basis | Investigator with `evidence.verify` capability |
| `customerRequest.publish` | Draft and publish approved customer information request | Super Admin, Investigator |
| `case.decide` | Record human decision (`CLEAR`, `REQUEST_MORE_EVIDENCE`, `ENHANCED_VERIFICATION`, `ESCALATE`) | Super Admin, Investigator |
| `case.approve` | Provide independent supervisor dual-approval | Super Admin (must NOT be the original case decider) |
| `attachment.preview` | Render sandboxed, sanitized document preview | Super Admin, Investigator, Customer (own documents only) |
| `attachment.download` | Download raw file attachment | Explicitly restricted staff capability |
| `portal.request.read` | View published customer request DTO (`PublicRequestView`) | Owning Customer only |
| `portal.response.submit` | Upload file, save response draft, submit package, and generate receipt | Owning Customer only |
| `portal.message.send` | Send customer-facing question message | Owning Customer, Assigned Investigator |

---

## 3. Explicit Endpoint Enforcement Matrix

| Endpoint | Method | Required Capability / Predicate | Allowed Body Fields | Customer Visible? |
| :--- | :--- | :--- | :--- | :--- |
| `/api/me/availability` | `GET` | Authenticated staff | None | No |
| `/api/me/availability` | `PATCH` | `availability.update.self` (target user derived from auth session only) | `status`, `returnAt`, `expectedRevision` | No |
| `/api/admin/investigators` | `GET` | `investigator.manage` + same `tenantId` | None | No |
| `/api/admin/investigators` | `POST` | `investigator.manage` + same `tenantId` | `name`, `email`, `role`, `department`, `shift`, `languages`, `maxCapacity`, `specialization`, `queue`, `dualApprovalEnforced` | No |
| `/api/admin/investigators/:id` | `PUT` | `investigator.manage` + same `tenantId` | `name`, `role`, `department`, `shift`, `languages`, `maxCapacity`, `specialization`, `queue`, `dualApprovalEnforced`, `assignmentEnabled` (CANNOT edit `status`/declared availability) | No |
| `/api/admin/investigators/:id/suspend` | `POST` | `investigator.manage` + same `tenantId` | `reason`, `reassignToId` | No |
| `/api/admin/investigators/:id/reactivate` | `POST` | `investigator.manage` + same `tenantId` | None | No |
| `/api/admin/investigators/:id/archive` | `POST` | `investigator.manage` + same `tenantId` | `reason` | No |
| `/api/cases/:id/assignments` | `POST` | `assignment.manage` + same `tenantId` | `investigatorId`, `reason` | No |
| `/api/cases` | `GET` | `case.read` (filtered by tenant and role scope) | None | No |
| `/api/cases/:id` | `GET` | `case.read` + case assignment / supervisor scope | None | No |
| `/api/cases/:id/draft` | `GET`, `PUT` | Private to author: `actorId === draft.authorId` | `disposition`, `reasonCode`, `notes`, `sourceAcknowledgements` | No |
| `/api/cases/:id/scratchpad` | `GET`, `PUT` | Private to investigator on assigned case | `content` | No |
| `/api/cases/:id/customer-requests` | `POST` | `customerRequest.publish` + assigned case | `templateId`, `title`, `publicInstructions`, `deadline`, `requiredItems` | Only after deliberate publication |
| `/api/cases/:id/submissions/:docId/review` | `POST` | `submission.review` + assigned case | `action` (`APPROVE_FOR_USE`, `REQUEST_CORRECTION`, `NEEDS_INTERNAL_VERIFICATION`, `MARK_DUPLICATE`), `finding`, `reason` | Filtered update only |
| `/api/cases/:id/dual-approval` | `POST` | `case.decide` (creates pending supervisor request) | `proposedDisposition`, `reasonCode`, `rationale` | No |
| `/api/dual-approvals/:id/resolve` | `POST` | `case.approve` (Supervisor ID must != investigator ID) | `decision` (`APPROVED`, `REJECTED`), `supervisorNotes` | No |
| `/api/portal/requests` | `GET` | `portal.request.read` + `customerId` matches session | None | Yes |
| `/api/portal/requests/:publicId` | `GET` | `portal.request.read` + `customerId` matches session | None | Yes |
| `/api/portal/requests/:publicId/draft` | `PUT` | `portal.response.submit` + `customerId` matches session | `draft` | Yes |
| `/api/portal/requests/:publicId/upload` | `POST` | `portal.response.submit` + valid file signature & MIME | `documentType`, `fileName`, `fileSize`, `base64Data` | Yes |
| `/api/portal/requests/:publicId/submit` | `POST` | `portal.response.submit` + `customerId` matches session | None | Yes |
| `/api/portal/requests/:publicId/questions` | `POST` | `portal.message.send` + `customerId` matches session | `content` | Yes |
| `/api/notifications` | `GET` | Recipient matches authenticated `userId` | None | No |
| `/api/notifications/:id/read` | `PATCH` | Recipient matches authenticated `userId` | `read` | No |

---

## 4. Negative Verification Gates (Mandatory Test Cases)

1. **Self-Availability Integrity**: Investigator A (`analyst-101`) can update own availability to `BUSY`. Attempting to target Investigator B (`analyst-102`) via body or path is rejected with `403 Forbidden`, leaving B unchanged.
2. **Admin-Routing Separation**: Super Admin (`sup-901`) can update Investigator A's `maxCapacity` and `assignmentEnabled`, but sending `status` (declared availability) is rejected or ignored.
3. **Cross-Customer Isolation**: Customer 1 (`cust-001`) can fetch request for application `APP-2026-8812`. Attempting to fetch Customer 2 (`cust-002`)'s request or files returns `403 Forbidden` / `404 Not Found`.
4. **Internal Leakage Prevention**: Customer requests return only `PublicRequestView` DTO. No risk scores, entity links, policy hashes, or internal investigator notes are ever transmitted.
5. **Separation of Duties (Dual-Approval)**: If Sarah Chen is recorded as the decider of case X, Sarah Chen cannot approve her own dual-approval request; requires a distinct authorized supervisor.
6. **Submission Approval Discipline**: Clicking "Approve for use" on a customer bank statement transitions item to `ACCEPTED_FOR_USE` and appends customer-supplied evidence. It does NOT assert identity verified (`VERIFIED_FACT`) or close the case.
7. **Suspended Account Access**: Suspending Investigator A immediately invalidates active tokens; subsequent API requests with A's credentials return `403 Forbidden: Account suspended`.
8. **Draft Privacy**: Investigator A's decision drafts and case scratchpad cannot be read or overwritten by Investigator B.
