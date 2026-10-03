# Lab 4 System Specification

## 1 Sprint Goal
The goal of Sprint 4 is to complete the core IT support workflow by implementing the Actions Taken feature, finalizing the Ticket status lifecycle (including a strict resolution gate), and delivering tailored, role-specific dashboards for Requesters, IT Staff, and Administrators. This sprint also focuses on final system hardening, ensuring robust security, optimistic concurrency control, and a polished Zen Green user interface.

## 2 Stakeholder Request
Stakeholders require a structured way for IT Staff to document their work on a Ticket via "Actions Taken," while retaining a single primary Ticket Owner. To improve visibility, each role needs a dedicated dashboard summarizing their actionable work and key metrics. Furthermore, the process of resolving a Ticket must be strictly enforced on the server, preventing unauthorized or premature closures, while allowing Requesters to signal when they believe their problem is fixed.

## 3 Scope
**In Scope:**
- Actions Taken entity and lifecycle (create, update, view).
- Ticket workflow finalization (strict role-based transition matrix, resolution gate).
- Role-specific dashboards (Requester, IT Staff, Administrator) with backend-calculated metrics.
- Optimistic concurrency control using a version token to prevent lost updates.
- Hardening (duplicate submission protection, safe error envelopes, full Lab 1-3 regression).
- Zen Green UI polish, accessibility improvements, and responsive design.

**Explicitly Excluded:**
- SLA clocks, escalation rules, on-call schedules, or breach notifications.
- Email, SMS, LINE, push, or any other external notifications.
- Inventory, spare parts, purchasing, or service cost accounting.
- Time-sheet billing, payroll, or labor cost tracking.
- Multi-level approvals and e-signatures.
- Advanced BI, custom report builders, or export data warehouses.
- Multi-tenancy and production-scale cloud operations.
- Any feature not explicitly approved in this contract.

## 4 Functional Requirements
- **FR-01 (Actions Taken - IT Staff/Admin):** IT Staff and Administrators can create and update Actions Taken on accessible Tickets.
- **FR-02 (Actions Taken - Requester):** Requesters can view all Actions Taken on their own Tickets (read-only) but cannot create or change them.
- **FR-03 (Action Fields):** Each Action Taken includes: Action Date/Time, Action Description, Result, Performed by (auto-populated), Follow-Up Required? (boolean), Follow-up Note (required if follow-up is needed), and Attachment Notes.
- **FR-04 (Performed By):** The "Performed by" field is set automatically by the backend from the authenticated user's session; clients cannot set or spoof it.
- **FR-05 (Ticket Ownership vs Performers):** A Ticket maintains one primary Ticket Owner, but Actions Taken can be recorded by different IT Staff members.
- **FR-06 (Status Controls):** Ticket status controls must dynamically show only the transitions permitted for the user's role and the Ticket's current status, with the backend rejecting any forbidden transitions.
- **FR-07 (Requester Resolution Indication):** A Requester's "appears resolved" indication is advisory only, visible to staff, and never changes the Ticket status.
- **FR-08 (Resolution Gate):** Moving a Ticket to `RESOLVED` is strictly gated on the backend; it requires the actor to be IT Staff/Admin, the Ticket to have an Owner, and at least one Action Taken to exist with a non-empty Result.
- **FR-09 (Requester Dashboard):** Requesters have a dashboard showing metrics and recent Tickets scoped strictly to the authenticated Requester.
- **FR-10 (IT Staff Dashboard):** IT Staff have a dashboard displaying operational metrics (e.g., unassigned, owned, by status, by priority) and a list of recently updated or urgent Tickets, with drill-down links.
- **FR-11 (Admin Dashboard):** Administrators reuse the IT Staff dashboard layout but may optionally see concise user-account metrics.
- **FR-12 (Navigation):** Dashboard navigation must clearly indicate the active page per role.
- **FR-13 (Concurrency):** Stale or concurrent updates on Ticket workflow changes and Actions Taken edits are detected via a version token and rejected with a conflict error.
- **FR-14 (Idempotency):** The system protects against duplicate submissions (e.g., double clicks or network retries) using UI disabling and backend idempotency handling.
- **FR-15 (Feedback & Hardening):** The UI provides consistent loading, validation, success, empty, forbidden, conflict, not-found, and safe-failure feedback without exposing internal errors. Remove obsolete placeholder or broken UI.
- **FR-16 (Documentation):** The README must be kept current with setup, seed, migration, test, and demo instructions.

## 5 Business Rules
- **BR-01:** An Action Taken belongs to exactly one Ticket.
- **BR-02:** The Ticket Owner coordinates the Ticket, but an Action Taken may be performed by a different IT Staff member.
- **BR-03:** "Performed by" is derived strictly from the authenticated session; it is never accepted from the request body.
- **BR-04:** If Follow-Up Required is true, Follow-up Note is mandatory (non-empty after trim). If false, the Follow-up Note is cleared and stored as null.
- **BR-05:** Action Description and Result are required. Maximum lengths: Description (2000 chars), Result (2000 chars), Follow-up Note (1000 chars), Attachment Notes (1000 chars).
- **BR-06:** Action Date/Time must be stored in UTC, must be a valid ISO-8601 date, and cannot be more than 5 minutes in the future. It is displayed in the user's local time zone (Asia/Bangkok).
- **BR-07:** Actions Taken are append-only. They cannot be hard-deleted. They are listed in a stable order (by Action Date/Time ascending, then `createdAt`, then `id`). Edits increment the Action's version token and update `updatedAt` and `updatedBy`.
- **BR-08:** Requesters can see all Actions Taken on their own tickets but cannot create, edit, or access other users' Tickets.
- **BR-09:** Actions Taken can be created and edited on tickets in any status except `CLOSED` and `CANCELLED`.
- **BR-10:** The assigned Ticket Owner must be an active user with the IT Staff or Administrator role. Inactive users are rejected.
- **BR-11:** Ticket status must remain in: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
- **BR-12:** Transitions are allowed strictly according to the transition matrix defined in Section 8.
- **BR-13:** A Ticket can move to `RESOLVED` only if: the actor is IT Staff/Admin, the Ticket has an Owner, at least one Action Taken exists with a non-empty Result, and the request carries the correct version token.
- **BR-14:** The Requester "appears resolved" flag is advisory and does not alter the Ticket status.
- **BR-15:** Ticket workflow changes and Action Taken edits must include a version token. A mismatch results in a `409 Conflict` response with a safe message.
- **BR-16:** Dashboard metrics are computed by the backend from authoritative data. Each metric has a defined query, empty behavior (returns 0/empty list), and drill-down link.
- **BR-17:** Dashboard date boundaries use the `Asia/Bangkok` time zone. "Recent" is defined as the last 7 days.
- **BR-18:** Legacy Tickets with zero Actions Taken remain valid, display an empty state in the UI, and are treated normally by dashboards.
- **BR-19:** Repeated clicks or network retries must not create duplicate Actions Taken or repeat a status change (handled via client disabled states and server idempotency keys).

## 6 UI Specification Summary
The UI adheres to the Zen Green design system.
- **IT Staff / Admin Dashboard:** Displays metric cards (Unassigned, My Owned, By Status, By IT Priority) and a "Recently Updated" list. Features Quick Actions (Create Ticket, Search, My Queue).
- **Requester Dashboard:** Displays metric cards (My Open Tickets, Waiting for Me, Recently Resolved) and a "Recently Updated" list of their own tickets. Features Quick Actions.
- **Ticket Detail - Actions Taken:** For staff, a table/list view with a create form mode and view/edit modes for each action. For Requesters, a read-only list.
- **Feedback & Controls:** Status controls are dynamically rendered based on allowed transitions fetched from the API. The UI displays clear safe-error banners for 409 Conflicts (with a Reload option), 403 Forbidden, and 400 Validation errors (inline).
- **Responsive & A11Y:** Screens must adapt gracefully to 360px, 768px, and 1280px without horizontal scrolling. Semantic HTML, visible focus states, and ARIA labels are required.
- See `docs/lab-04/ui-spec.md` for complete details.

## 7 Data Changes
- **ActionTaken Model:** Added with `id`, `ticketId` (FK), `actionAt` (DateTime, UTC), `description`, `result`, `performedById` (FK), `followUpRequired` (Boolean), `followUpNote` (String, nullable), `attachmentNotes` (String, nullable), `version` (Int), `createdAt`, `updatedAt`, `updatedById` (String, nullable).
- **Ticket Model:** Added `version` (Int, default 1) for optimistic concurrency and `requesterMarkedResolvedAt` (DateTime, nullable) for the advisory flag.
- **Relationships:** `Ticket` has many `ActionTaken` (`onDelete: Restrict`).
- **Indexes:** Composite index on `ActionTaken` (`ticketId, actionAt, createdAt, id`) for stable sorting. Index on `performedById`.
- **Database Design Decisions:**
  1. **Integer Version Token for Concurrency:** Chosen over `updatedAt` timestamps to avoid precision loss or clock synchronization issues across distributed environments, ensuring robust strict equality checks for optimistic locking.
  2. **`onDelete: Restrict` for Actions:** Chosen to strictly enforce the append-only and auditability requirement. Deleting a ticket should be blocked if actions exist, preventing accidental loss of critical IT audit trails.
- **Migration & Backfill:** Migration is additive. Legacy tickets will have zero actions and a default version of 1. Rollback involves restoring a pre-migration DB snapshot and applying a down-migration script.
- **Seed Requirements:** Idempotent upserts. Covers all statuses, priorities, assigned/unassigned, 0/1/many actions, an inactive staff user, and scenarios producing both zero and non-zero metrics.

## 8 API Contract (Summary)
- **Actions Taken:** `GET`, `POST`, `PATCH` at `/api/tickets/:ticketId/actions-taken`. Protected by role. No `DELETE` endpoint.
- **Ticket Status Transition Matrix:**
  | From \ To | Permitted Roles | New Status |
  |---|---|---|
  | `NEW` | IT Staff, Admin | `OPEN` |
  | `NEW` | Requester (own), IT Staff, Admin | `CANCELLED` |
  | `OPEN` | IT Staff, Admin | `IN_PROGRESS`, `WAITING_FOR_REQUESTER` |
  | `OPEN` | Requester (own), IT Staff, Admin | `CANCELLED` |
  | `IN_PROGRESS` | IT Staff, Admin | `WAITING_FOR_REQUESTER`, `RESOLVED` (gated) |
  | `IN_PROGRESS` | IT Staff, Admin | `CANCELLED` |
  | `WAITING_FOR_REQUESTER` | IT Staff, Admin | `IN_PROGRESS`, `RESOLVED` (gated) |
  | `WAITING_FOR_REQUESTER` | IT Staff, Admin | `CANCELLED` |
  | `RESOLVED` | IT Staff, Admin | `CLOSED` |
  | `RESOLVED` | Requester (own), IT Staff, Admin | `REOPENED` |
  | `CLOSED` | IT Staff, Admin | `REOPENED` |
  | `REOPENED` | IT Staff, Admin | `OPEN`, `IN_PROGRESS`, `CANCELLED` |
  | `CANCELLED` | (Terminal state) | None |
- **Status Transition:** `POST` at `/api/tickets/:ticketId/status` requiring the version token.
- **Allowed Transitions:** `GET` at `/api/tickets/:ticketId/allowed-transitions` to drive UI controls safely.
- **Advisory Flag:** `POST` at `/api/tickets/:ticketId/requester-resolved-indication` for Requesters.
- **Dashboards:** `GET` at `/api/dashboard/requester` and `/api/dashboard/staff`.
- **Conflicts & Errors:** Standardized safe error envelope. 409 Conflict includes the current version state.
- **Legacy Compatibility:** All Lab 2-3 endpoints continue to function as specified previously.
- See `docs/lab-04/api-spec.md` for complete details.

## 9 Acceptance Criteria

| ID | Criterion (Given / When / Then) |
|---|---|
| AC-01 | Given a permitted IT Staff user and valid data, when an Action Taken is created, then it is saved under the correct Ticket with the authenticated user as Performed by. (API-01, E2E-01) |
| AC-02 | Given an authenticated Requester, when dashboard data is retrieved, then only metrics and recent Tickets owned by that Requester are returned. (RD-01, E2E-03) |
| AC-03 | Given Follow-Up Required = true and an empty Follow-up Note, when saving, then the API returns a 400/422 validation error and nothing is saved. (API-03, UI-06, E2E-01) |
| AC-04 | Given Follow-Up Required = false, when saving with a note, then the note is cleared and stored as null. (API-04) |
| AC-05 | Given a missing/blank Action Description or Result, or text over the max length, when saving, then the request is rejected with field-level errors. (API-02, UI-06) |
| AC-06 | Given an invalid or far-future Action Date/Time, when saving, then it is rejected; valid values are stored in UTC. (API-05) |
| AC-07 | Given a request body containing `performedBy`, when an Action is created, then the value is ignored and the authenticated user is recorded. (API-01, API-06) |
| AC-08 | Given an IT Staff user who is not the Ticket Owner, when creating an Action, then it succeeds and Performed by is that user. (API-07, E2E-01) |
| AC-09 | Given a Requester, when POST/PATCH is sent to Actions Taken, then 403 is returned and no data changes. (AUTHZ-01, AUTHZ-02, UI-08) |
| AC-10 | Given a Requester viewing their own Ticket, then all Actions Taken are visible read-only; for a foreign Ticket the API returns 403. (AUTHZ-03, AUTHZ-04, UI-05, UI-08, E2E-01) |
| AC-11 | Given IT Staff/Admin and the current version token, when an Action is updated, then fields change, `version` increments, and immutables are preserved. (API-08, UI-07, E2E-01) |
| AC-12 | Given a stale version token, when an Action is updated, then 409 is returned and the earlier change is preserved. (API-09, UI-07, E2E-04) |
| AC-13 | Given multiple Actions on a Ticket, when listed, then order is deterministic (actionAt, createdAt, id). (API-10) |
| AC-14 | Given any client, when attempting to delete an Action Taken, then no delete route exists (404/405) and records persist. (API-11) |
| AC-15 | Given a Ticket in a Closed/Cancelled state, when creating an Action, then it is rejected with a clear message. (API-12) |
| AC-16 | Given an inactive user, when selected as Ticket Owner, then the request is rejected. (WF-07, UI-12, E2E-02) |
| AC-17 | Given an active IT Staff/Admin user, when assigned as Ticket Owner, then the owner changes; Requester targets are rejected. (WF-06, UI-12) |
| AC-18 | Given a double click or network retry, when creating an Action, then exactly one record exists. (API-13, UI-09) |
| AC-19 | Given Attachment Notes, when saved, then they are optional, length-limited, and escaped on output. (API-14) |
| AC-20 | Given each allowed transition in the matrix and permitted role, when requested, then the status changes and `version` increments. (WF-01, E2E-02) |
| AC-21 | Given a transition not in the matrix, when requested, then 409/422 is returned and status is unchanged. (WF-02) |
| AC-22 | Given a Requester, when attempting to set Resolved via API, then 403 is returned. (AUTHZ-05, E2E-02) |
| AC-23 | Given a Requester's "appears resolved" indication, then Ticket status is unchanged and IT Staff see the flag. (WF-03, E2E-02) |
| AC-24 | Given the resolution gate rules, when IT Staff attempts to Resolve a Ticket that fails the gate, then it is rejected. (WF-04, E2E-02) |
| AC-25 | Given a stale Ticket version, when a status change is submitted, then 409 is returned. (WF-05, UI-11, E2E-04) |
| AC-26 | Given any Ticket and user, then status controls show only permitted transitions from the server. (WF-08, UI-10, UI-11, E2E-02) |
| AC-27 | Given status changes, then each is recorded append-only with actor and time. (WF-09) |
| AC-28 | Given a Requester, then staff-only content (Internal Notes) remains hidden. (WF-10, E2E-05) |
| AC-29 | Given the seeded dataset, when the IT Staff dashboard is retrieved, then every count equals the DB query result. (SD-01, UI-01, E2E-03) |
| AC-30 | Given the seeded dataset, when the Requester dashboard is retrieved, then every count equals the DB query result for that Requester. (RD-02, UI-03, E2E-03) |
| AC-31 | Given no matching records, then dashboards return zeros/empty lists without errors. (SD-02, RD-03, UI-02, UI-04) |
| AC-32 | Given a Requester calling the staff dashboard, then 403 is returned. (AUTHZ-06, SD-03) |
| AC-33 | Given an Administrator, then the dashboard reuses staff metrics and adds user-account counts. (SD-04) |
| AC-34 | Given a metric card, when activated, then the user lands on the correct filtered view. (UI-01, UI-03, E2E-03) |
| AC-35 | Given any dashboard endpoint, then the response is concise and never returns whole Ticket collections. (SD-05, RD-04) |
| AC-36 | Given Tickets updated near midnight, then date boundaries follow the documented time zone. (SD-06, RD-05) |
| AC-37 | Given loading, error, forbidden, and success states, then the dashboard UI renders specified feedback. (UI-02, UI-04) |
| AC-38 | Given each role, then navigation shows the role-appropriate Dashboard item with active indication. (UI-13, E2E-03) |
| AC-39 | Given a populated Lab 3 database, when the Lab 4 migration is applied, then existing data is unchanged. (MIG-01) |
| AC-40 | Given legacy Tickets without Actions Taken, then Ticket Detail shows an empty state and no errors. (MIG-02, UI-05) |
| AC-41 | Given the seed is run twice, then row counts are identical and coverage is met. (MIG-03) |
| AC-42 | Given a failed migration, then rollback steps restore the Lab 3 state. (MIG-04) |
| AC-43 | Given the Lab 1-3 suites and E2E paths, then all pass on main. (REG-01, REG-02, REG-03, E2E-05) |
| AC-44 | Given any server failure, then responses use the documented envelope with no stack traces. (API-16, UI-11) |
| AC-45 | Given a recoverable failure on a form, then entered data is preserved. (UI-06, UI-14) |
| AC-46 | Given a walk through all screens, then there are no console errors or broken links. (REG-04) |
| AC-47 | Given 360/768/1280 px viewports, then no Lab 4 screen has horizontal scroll or clipping. (RESP-01) |
| AC-48 | Given keyboard-only use, then controls are reachable and focus is visible. (A11Y-01, A11Y-02) |
| AC-49 | Given status and priority, then each is conveyed by text/icon in addition to color. (STY-01, A11Y-01) |
| AC-50 | Given the final app, then Zen Green tokens are used consistently. (STY-01, REG-04) |
| AC-51 | Given a fresh clone, then README instructions work end-to-end. (REG-05) |
| AC-52 | Given seeded data, then dashboard endpoints respond within threshold with no N+1 queries. (PERF-01) |
| AC-53 | Given an unauthenticated request to any new endpoint, then 401 is returned. (API-15) |
| AC-54 | Given the health endpoint, then it reports status without sensitive details. (API-17) |

## 10 Definition of Done
- [ ] All FR/BR/AC implemented and traceable to tests in `tests.md`.
- [ ] All planned tests pass on `main` (unit, API, UI, authz, workflow, migration, perf, E2E).
- [ ] Lab 1-3 regression tests pass.
- [ ] Prisma migration applies cleanly to a populated Lab 3 DB; rollback procedure tested.
- [ ] Seed is idempotent and covers all specified metrics/states.
- [ ] Backend authorization is enforced on every write and verified bypassing the UI.
- [ ] No console errors, broken links, placeholder text, or unfinished controls.
- [ ] Responsive and accessibility checklists complete.
- [ ] Screenshots captured in `artifacts/lab-04/screenshots/`.
- [ ] README is current, `.gitignore` is correct, no secrets committed.
- [ ] All Issues in Done, PRs reviewed and merged by reviewer, `reviewer.md` complete.
- [ ] `ai-use.md` is complete with student reflections.

## 11 Assumptions and Decisions
1. **Actions on Closed/Cancelled Tickets:** Rejected. Modifying a completed or discarded ticket breaks audit trails.
2. **Action-level State:** No Action-level state machine. "Complete/cancel" refer to Ticket-level transitions. Actions are append-only work logs.
3. **Requester Access to Staff Dashboard:** Returns `403 Forbidden`.
4. **Staff Access to Requester Dashboard:** Returns `403 Forbidden`. Staff should use the Staff dashboard.
5. **Foreign Ticket Access (Requester):** Returns `403 Forbidden` rather than `404`, to maintain consistency with Lab 3's explicit prohibition mechanism while not leaking data.
6. **Follow-up Note when Required is False:** Cleared (stored as null) to maintain data consistency.
7. **Action Date/Time Constraints:** Stored in UTC. Allowed future tolerance is 5 minutes to account for minor client clock drift. Displayed in `Asia/Bangkok`.
8. **Dashboard Time Zone & Window:** `Asia/Bangkok` is used for date boundary calculations. "Recent" is defined as the last 7 days. "From yesterday" deltas are omitted to keep scope manageable.
9. **Concurrency Token:** Integer `version` token on Ticket and ActionTaken for optimistic locking.
10. **Idempotency:** Utilizes an `Idempotency-Key` header on create requests alongside UI disabled-while-pending states.
11. **Status History:** The system will append a history record for each transition (reusing or extending Lab 3 logic if present, else a minimal append-only mechanism).
12. **Resolution Gate Rule:** Actor is IT Staff/Admin AND Ticket has an owner AND at least one Action Taken exists with a non-empty Result. Unresolved follow-ups do not block resolution.
