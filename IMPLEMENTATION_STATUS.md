# RiskWeave AI - Implementation Status & Acceptance Tracking
Date: 14 October 2026
Competition: AI Builder Cup (BFSI Theme)

## Everyday Simple User Experience (14 October Update - 100% Implemented)

### 1. Plain-Language Presentation Layer (`shared/copy/dictionary.ts`)
- [x] Clear everyday labels mapped to internal enums:
  - `CLEAR` -> **Close this alert** (Closes alert; does not certify innocence or approve credit)
  - `REQUEST_MORE_EVIDENCE` -> **Request missing information** (Internal task; no customer outreach)
  - `ENHANCED_VERIFICATION` -> **Request additional verification** (Policy-mandated stepped-up check)
  - `ESCALATE` -> **Send for specialist review** (Referral to specialist; does not prove fraud)
- [x] Evidence sufficiency states:
  - `COMPLETE` -> **Enough for this assessment**
  - `PARTIAL` -> **Some evidence is missing**
  - `INSUFFICIENT` -> **Not enough evidence**
- [x] Execution mode badges:
  - `LOCAL_FIXTURE` -> **Demo response — no live AI call**
  - `LIVE_GOOGLE` -> **Live AI**
  - `RECORDED_REPLAY` -> **Saved run — not a new AI review**

### 2. Cases Home (`src/components/CaseQueue.tsx`)
- [x] Default landing home: Search, quick status filters (`All cases`, `Needs attention`, `Decided`), real counters.
- [x] Default columns: `Case | Why it needs review | Status | Next step | Last updated`
- [x] Alert reason formatted as plain observation (e.g. "Device used in more than one application").
- [x] Next step formatted as workflow instruction (e.g. "Review evidence", "Check missing details").
- [x] "More filters" drawer for specialist options (Priority, Concern level).
- [x] Responsive layout with compact card view for mobile screens (under 390px).

### 3. Focused Single-Column Case Review Page (`src/components/FocusedCaseView.tsx`)
- [x] Replaces three-column layout with one readable ~880–1040 CSS px wide centered column.
- [x] Header: "Back to cases", Case ID, status, alert observation, mode badge, and collapsible Technical Details.
- [x] Prominent out-of-date assessment warning when new evidence is added (`isStale`).
- [x] **Section A: What needs attention**: Alert summary + suggested next step labeled "AI suggestion".
- [x] **Section B: What the evidence shows**:
  - Reasons for concern (with clickable source links opening drawer in one click).
  - Facts that may explain the alert (including reviewer challenge alternative explanation).
  - What is missing or conflicting (decision-critical gaps).
- [x] **Section C: What to check next**: Top-ranked check, explanation of uncertainty resolved, simulated fulfillment.
- [x] **Section D: Your decision**: 4 plain-language action choices (nothing preselected), adopt vs override, mandatory rationale, source acknowledgements, and deliberate commit.

### 4. Contextual Case Tools & Modals
- [x] `SourceDrawerModal.tsx`: Slide-over drawer opening any cited claim's exact source record in one action without losing draft notes.
- [x] `ConnectionsModal.tsx`: Visual graph & accessible table alternative accessible in case context with P01/P06 policy reminder.
- [x] In-context access to "What if evidence changed?" (Counterfactual simulation) and "Compare policy versions" (Policy replay).
- [x] Dedicated "Quality checks" (Evaluation) and "Batch import" under Tools menu.

## Verified Test Matrix (Vitest Suite)
- **15/15 Tests Passing (Exit Code 0)**:
  - T01: Normalized exact device identifier creates observed sharing relationship.
  - T03: Shared IP/device alone never satisfies escalation policy under P01.
  - T04: Duplicate telemetry with same independenceGroup cannot count as two independent concern classes.
  - T08: Graph traversal terminates on cycles, honors filters, and reports cycle safety.
  - T09: Required complete verified benign facts permit CLEAR under P05.
  - T10: Missing critical evidence prevents CLEAR without falsely asserting HIGH risk.
  - T11: P02 corroborated dual concern classes require ESCALATE.
  - T12: Material identity contradiction routes to ENHANCED_VERIFICATION under P03.
  - T23: Adding verified household context resolves a device-only alert under P05.
  - T25: 80-day-old verification passes v1 90-day freshness and fails v2 60-day freshness.
  - T32/T33: Concurrency rejects stale revision with 409 and increments revision on valid decision.
  - T36: Cryptographic SHA-256 audit chain verification passes on untampered sequence.
  - T37: Plain-language dictionary maps all 4 internal actions to plain-language labels with defined meanings.
  - T38: Evidence sufficiency maps to transparent descriptions without using confidence as a synonym.
  - T39: Execution modes map to honest user-facing labels.
