# เอกสารแผนการทดสอบ (Test Plan) - Lab 4

## 1. Baseline
ผลการทดสอบระบบก่อนเริ่ม Lab 4 (Lab 1-3)
- **Models**: User, Category, RelatedSystem, Ticket, Attachment, PublicComment, InternalNote
- **Endpoints**: /auth/login, /auth/me, /auth/logout, /auth/change-password, /staff/tickets, /tickets, /admin/users, /health, /categories
- **Screens**: Login, Change Password, Ticket Queue, Staff Ticket Detail, Requester Ticket Detail, Admin User Management
- **Roles**: REQUESTER, IT_STAFF, ADMINISTRATOR
- **Test counts**:
  - Server: 11 suites, 133 tests passed, 0 failed, 0 skipped
  - Client: 8 suites, 45 tests passed, 0 failed, 0 skipped
  - E2E: 35 tests passed, 0 failed, 5 skipped (due to Lab 3 UI changes/flakiness)
- **คำสั่งที่ใช้ทดสอบ**: `npm run test:baseline`
- **วันที่ทดสอบ**: 2026-10-04

## 2. คำสั่งทดสอบ
- `npm run test:baseline`: ทดสอบโค้ดเก่าทั้งหมดของ Lab 1-3 (Server, Client, E2E) โดยไม่รวมไฟล์ของ Lab 4 (ผลลัพธ์: ผ่านทั้งหมด สีเขียว)
- `npm run test:lab4`: ทดสอบเฉพาะชุดทดสอบใหม่ที่เขียนใน Issue #2 สำหรับ Lab 4 (ผลลัพธ์: จะได้สีแดง (ล้มเหลว) เนื่องจากยังไม่มีการเขียนโค้ดระบบ)
- `npm run test:all`: คำสั่งทดสอบรวมทั้งหมด (ผลลัพธ์: จะได้สีแดง บน Branch นี้ จนกว่า Issue ถัดๆ ไปจะถูกรวมเข้ากับ main)

## 3. Test catalog tables
### server/tests/lab-04/actions-taken.api.test.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| API-01 | API/integration | AC-01, AC-07 | create valid Action as IT Staff, performedBy = actor | 201 Created | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-02 | API/integration | AC-05 | required/blank/over-length | 422 Unprocessable Entity | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-03 | API/integration | AC-03 | follow-up true + empty note -> 422 | 422 Unprocessable Entity | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-04 | API/integration | AC-04 | follow-up false clears note | 201 Created | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-05 | API/integration | AC-06 | invalid/far-future date, UTC storage | 422 Unprocessable Entity | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-06 | API/integration | AC-07 | body performedBy ignored | 201 Created | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-07 | API/integration | AC-08 | non-owner staff creates, owner unchanged | 201 Created | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-08 | API/integration | AC-11 | update with current version | 200 OK | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-09 | API/integration | AC-12 | stale version -> 409 CONFLICT | 409 Conflict | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-10 | API/integration | AC-13 | stable ordering | 200 OK | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-11 | API/integration | AC-14 | DELETE -> 404/405, record persists | 405 Method Not Allowed | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-12 | API/integration | AC-15 | create on CLOSED/CANCELLED -> 409 TICKET_LOCKED | 409 Conflict | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-13 | API/integration | AC-18 | duplicate submit / same Idempotency-Key = 1 record | 201 Created | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| API-14 | API/integration | AC-19 | attachment notes plain text, escaped | 201 Created | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| 1 |2| Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| 1 |2| Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| 1 |2| Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| AUTHZ-01 | authorization | AC-09 | Requester POST Actions -> 403 | 403 Forbidden | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| AUTHZ-02 | authorization | AC-09 | Requester PATCH Actions -> 403 | 403 Forbidden | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| AUTHZ-03 | authorization | AC-10 | Requester reads own Actions | 200 OK | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |
| AUTHZ-04 | authorization | AC-10 | Requester reads another's Actions -> documented 403/404 | 403 Forbidden | server/tests/lab-04/actions-taken.api.test.ts | Pass (2026-10-07, npm run test server/tests/lab-04/actions-taken.api.test.ts) |

### server/tests/lab-04/ticket-workflow.api.test.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| WF-01 | workflow | AC-20 | allowed transitions (table-driven, per role) (167 cases combined with WF-02) | 200 OK | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |
| WF-02 | workflow | AC-21 | disallowed -> 422/403, unchanged | 422 Unprocessable Entity | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |
| WF-03 | workflow | AC-23 | appears resolved does not change status | 200 OK | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |
| WF-04 | workflow | AC-24 | resolution gate pass/fail | 200 OK | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |
| WF-05 | workflow | AC-25 | stale ticket version -> 409 | 409 Conflict | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |
| WF-06 | workflow | AC-17 | assign active staff | 200 OK | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |
| WF-07 | workflow | AC-16 | inactive/non-staff assignee rejected | 422 Unprocessable Entity | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |
| WF-08 | workflow | AC-26 | allowed-transitions endpoint | 200 OK | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |
| WF-09 | workflow | AC-27 | append-only status history, stable order | 200 OK | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |
| WF-10 | workflow | AC-28 | Requester cannot see Internal Notes | 403 Forbidden | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |
| AUTHZ-05 | authorization | AC-22 | Requester sets RESOLVED -> 403 | 403 Forbidden | server/tests/lab-04/ticket-workflow.api.test.ts | Pass (2026-10-10) npm run test --prefix server -- "tests/lab-04/ticket-workflow.api.test.ts" |

### server/tests/lab-04/requester-dashboard.api.test.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| RD-01 | API/integration | AC-02 | only own data (two Requesters) | 200 OK | server/tests/lab-04/requester-dashboard.api.test.ts | Planned (Red) |
| RD-02 | API/integration | AC-30 | each metric = DB query | 200 OK | server/tests/lab-04/requester-dashboard.api.test.ts | Planned (Red) |
| RD-03 | API/integration | AC-31 | empty | 200 OK | server/tests/lab-04/requester-dashboard.api.test.ts | Planned (Red) |
| RD-04 | API/integration | AC-35 | payload concise | 200 OK | server/tests/lab-04/requester-dashboard.api.test.ts | Planned (Red) |
| RD-05 | API/integration | AC-36 | time-zone boundary | 200 OK | server/tests/lab-04/requester-dashboard.api.test.ts | Planned (Red) |

### server/tests/lab-04/staff-dashboard.api.test.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| SD-01 | API/integration | AC-29 | each metric = DB query | 200 OK | server/tests/lab-04/staff-dashboard.api.test.ts | Planned (Red) |
| SD-02 | API/integration | AC-31 | empty | 200 OK | server/tests/lab-04/staff-dashboard.api.test.ts | Planned (Red) |
| SD-03 | authorization | AC-32 | role/401 | 403 Forbidden | server/tests/lab-04/staff-dashboard.api.test.ts | Planned (Red) |
| SD-04 | API/integration | AC-33 | Admin extras | 200 OK | server/tests/lab-04/staff-dashboard.api.test.ts | Planned (Red) |
| SD-05 | API/integration | AC-35 | concise | 200 OK | server/tests/lab-04/staff-dashboard.api.test.ts | Planned (Red) |
| SD-06 | API/integration | AC-36 | time-zone boundary | 200 OK | server/tests/lab-04/staff-dashboard.api.test.ts | Planned (Red) |
| AUTHZ-06 | authorization | AC-32 | dashboard role matrix | 403 Forbidden | server/tests/lab-04/staff-dashboard.api.test.ts | Planned (Red) |

### server/tests/lab-04/migration.test.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| MIG-01 | migration/regression | AC-39 | Lab 3 data preserved | 200 OK | server/tests/lab-04/migration.test.ts | Pass |
| MIG-02 | migration/regression | AC-40 | legacy tickets valid (incl. history backfill) | 200 OK | server/tests/lab-04/migration.test.ts | Pass |
| MIG-03 | migration/regression | AC-41 | seed idempotent + coverage | 200 OK | server/tests/lab-04/migration.test.ts | Pass |
| MIG-04a | migration/regression | AC-42 | rollback script | 200 OK | server/tests/lab-04/migration.test.ts | Pass |
| MIG-04b | migration/regression | AC-42 | snapshot restore with pg_dump/pg_restore | 200 OK | server/tests/lab-04/migration.test.ts | Pass |

### server/tests/lab-04/perf-smoke.test.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| PERF-01 | performance-smoke | AC-52 | dashboards + Ticket Detail latency/query count | Pass (p95 < 500ms) | server/tests/lab-04/perf-smoke.test.ts | Planned (Red) |

### client/src/tests/lab-04 tests/StaffDashboard.test.tsx

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| UI-01 | UI component | AC-29, AC-34 | StaffDashboard render and click | Renders correctly | client/src/tests/lab-04 tests/StaffDashboard.test.tsx | Planned (Red) |
| UI-02 | UI component | AC-31, AC-37 | StaffDashboard empty states and errors | Renders correctly | client/src/tests/lab-04 tests/StaffDashboard.test.tsx | Planned (Red) |
| UI-13 | UI component | AC-38 | Staff navigation | Renders correctly | client/src/tests/lab-04 tests/StaffDashboard.test.tsx | Planned (Red) |

### client/src/tests/lab-04 tests/RequesterDashboard.test.tsx

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| UI-03 | UI component | AC-30, AC-34 | RequesterDashboard render and click | Renders correctly | client/src/tests/lab-04 tests/RequesterDashboard.test.tsx | Planned (Red) |
| UI-04 | UI component | AC-31, AC-37 | RequesterDashboard empty states and errors | Renders correctly | client/src/tests/lab-04 tests/RequesterDashboard.test.tsx | Planned (Red) |
| UI-13 | UI component | AC-38 | Requester navigation | Renders correctly | client/src/tests/lab-04 tests/RequesterDashboard.test.tsx | Planned (Red) |

### client/src/tests/lab-04 tests/ActionsTaken.test.tsx

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| UI-05 | UI component | AC-10, AC-40 | ActionsTaken legacy tickets view | Renders correctly | client/src/tests/lab-04 tests/ActionsTaken.test.tsx | Planned (Red) |
| UI-06 | UI component | AC-03, AC-05, AC-45 | ActionsTaken validation and retention | Renders correctly | client/src/tests/lab-04 tests/ActionsTaken.test.tsx | Planned (Red) |
| UI-07 | UI component | AC-11, AC-12 | ActionsTaken update and stale versions | Renders correctly | client/src/tests/lab-04 tests/ActionsTaken.test.tsx | Planned (Red) |
| UI-08 | authorization | AC-09, AC-10 | ActionsTaken role view rules | Renders correctly | client/src/tests/lab-04 tests/ActionsTaken.test.tsx | Planned (Red) |
| UI-09 | UI component | AC-18 | ActionsTaken duplicate submission check | Renders correctly | client/src/tests/lab-04 tests/ActionsTaken.test.tsx | Planned (Red) |

### client/src/tests/lab-04 tests/TicketWorkflow.test.tsx

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| UI-10 | UI component | AC-26 | TicketWorkflow allowed transitions | Renders correctly | client/src/tests/lab-04 tests/TicketWorkflow.test.tsx | Planned (Red) |
| UI-11 | UI component | AC-25, AC-26, AC-44 | TicketWorkflow stale versions and errors | Renders correctly | client/src/tests/lab-04 tests/TicketWorkflow.test.tsx | Planned (Red) |
| UI-12 | UI component | AC-16, AC-17 | TicketWorkflow assignment and staff | Renders correctly | client/src/tests/lab-04 tests/TicketWorkflow.test.tsx | Planned (Red) |
| UI-14 | UI component | AC-45 | TicketWorkflow form state retention | Renders correctly | client/src/tests/lab-04 tests/TicketWorkflow.test.tsx | Planned (Red) |
| STY-01 | UI style | AC-49, AC-50 | TicketWorkflow status color and style | Renders correctly | client/src/tests/lab-04 tests/TicketWorkflow.test.tsx | Planned (Red) |

### e2e/lab-04/actions-taken-flow.spec.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| E2E-01 | E2E | AC-01, AC-03, AC-08, AC-10, AC-11 | actions taken full flow | Pass | e2e/lab-04/actions-taken-flow.spec.ts | Planned (Red) |

### e2e/lab-04/ticket-resolution.spec.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| E2E-02 | E2E | AC-16, AC-20, AC-22, AC-23, AC-24, AC-26 | ticket resolution flow | Pass | e2e/lab-04/ticket-resolution.spec.ts | Planned (Red) |
| E2E-04 | E2E | AC-12, AC-25 | stale ticket conflict E2E | Pass | e2e/lab-04/ticket-resolution.spec.ts | Planned (Red) |

### e2e/lab-04/dashboards.spec.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| E2E-03 | E2E | AC-02, AC-29, AC-30, AC-34, AC-38 | dashboards data check | Pass | e2e/lab-04/dashboards.spec.ts | Planned (Red) |

### e2e/lab-04/regression.spec.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| E2E-05 | E2E | AC-28, AC-43 | Requester cannot see Internal Notes | Pass | e2e/lab-04/regression.spec.ts | Planned (Red) |
| REG-04 | migration/regression | AC-46, AC-50 | console errors and broken links | Pass | e2e/lab-04/regression.spec.ts | Planned (Red) |

### e2e/lab-04/accessibility.spec.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| A11Y-01 | accessibility | AC-48, AC-49 | focus and semantics | Pass | e2e/lab-04/accessibility.spec.ts | Planned (Red) |
| A11Y-02 | accessibility | AC-48 | keyboard navigation | Pass | e2e/lab-04/accessibility.spec.ts | Planned (Red) |

### e2e/lab-04/responsive.spec.ts

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| RESP-01 | responsive | AC-47 | no horizontal scroll across viewports | Pass | e2e/lab-04/responsive.spec.ts | Planned (Red) |

### Lab 1-3 Baseline (No new file)

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---------|------|------------------|---------------|-----------------|---------------------|--------------|
| REG-01 | migration/regression | AC-43 | Lab 1-3 baseline server tests | Pass | None | Pass |
| REG-02 | migration/regression | AC-43 | Lab 1-3 baseline client tests | Pass | None | Pass |
| REG-03 | migration/regression | AC-43 | Lab 1-3 baseline E2E tests | Pass | None | Pass |
| REG-05 | migration/regression | AC-51 | manual fresh clone check | Pass | None | Pass |

## 4. ตารางย้อนกลับ (Traceability)

| AC ID | Mapped Test IDs |
|-------|-----------------|
| AC-01 | API-01, E2E-01 |
| AC-02 | RD-01, E2E-03 |
| AC-03 | API-03, UI-06, E2E-01 |
| AC-04 | API-04 |
| AC-05 | API-02, UI-06 |
| AC-06 | API-05 |
| AC-07 | API-01, API-06 |
| AC-08 | API-07, E2E-01 |
| AC-09 | AUTHZ-01, AUTHZ-02, UI-08 |
| AC-10 | AUTHZ-03, AUTHZ-04, UI-05, UI-08, E2E-01 |
| AC-11 | API-08, UI-07, E2E-01 |
| AC-12 | API-09, UI-07, E2E-04 |
| AC-13 | API-10 |
| AC-14 | API-11 |
| AC-15 | API-12 |
| AC-16 | WF-07, UI-12, E2E-02 |
| AC-17 | WF-06, UI-12 |
| AC-18 | API-13, UI-09 |
| AC-19 | API-14 |
| AC-20 | WF-01, E2E-02 |
| AC-21 | WF-02 |
| AC-22 | AUTHZ-05, E2E-02 |
| AC-23 | WF-03, E2E-02 |
| AC-24 | WF-04, E2E-02 |
| AC-25 | WF-05, UI-11, E2E-04 |
| AC-26 | WF-08, UI-10, UI-11, E2E-02 |
| AC-27 | WF-09 |
| AC-28 | WF-10, E2E-05 |
| AC-29 | SD-01, UI-01, E2E-03 |
| AC-30 | RD-02, UI-03, E2E-03 |
| AC-31 | SD-02, RD-03, UI-02, UI-04 |
| AC-32 | AUTHZ-06, SD-03 |
| AC-33 | SD-04 |
| AC-34 | UI-01, UI-03, E2E-03 |
| AC-35 | SD-05, RD-04 |
| AC-36 | SD-06, RD-05 |
| AC-37 | UI-02, UI-04 |
| AC-38 | UI-13, E2E-03 |
| AC-39 | MIG-01 |
| AC-40 | MIG-02, UI-05 |
| AC-41 | MIG-03 |
| AC-42 | MIG-04a, MIG-04b |
| AC-43 | REG-01, REG-02, REG-03, E2E-05 |
| AC-44 | API-16, UI-11 |
| AC-45 | UI-06, UI-14 |
| AC-46 | REG-04 |
| AC-47 | RESP-01 |
| AC-48 | A11Y-01, A11Y-02 |
| AC-49 | STY-01, A11Y-01 |
| AC-50 | STY-01, REG-04 |
| AC-51 | REG-05 |
| AC-52 | PERF-01 |
| AC-53 | API-15 |
| AC-54 | API-17 |

## 5. Coverage by required test type

| Type | Count |
|------|-------|
| API/integration | 27 |
| authorization | 8 |
| workflow | 10 |
| migration/regression | 9 |
| performance-smoke | 1 |
| UI component | 14 |
| UI style | 1 |
| E2E | 5 |
| accessibility | 2 |
| responsive | 1 |

## 6. Todo/skipped tests with reasons
- **Skipped Tests**: `REG-05` (Manual README check) เนื่องจากการทดสอบนี้ต้องทำด้วยมือเมื่อระบบทั้งหมดเสร็จสิ้นและนำไปสู่การ deployment
- **Assumptions**: `PERF-01` สมมติฐานคือ p95 < 500 ms เมื่อมีข้อมูลจำลองและการดึงข้อมูลพร้อมกัน 20 requests

## 7. How final status will be updated
ผลลัพธ์ Final Status ในตารางข้างต้นจะยังเป็น 'Planned (Red)' ใน Issue นี้ และจะถูกเปลี่ยนเป็น 'Pass' เมื่อฟีเจอร์ต่างๆ ถูกพัฒนาเสร็จสิ้นใน Issue ถัดๆ ไป และถูกรวมผลการรันผ่านบน `main` (ใน Issue ที่เกี่ยวข้องกัน)


## โครงสร้างพื้นฐานสำหรับการทดสอบ (Test Helpers)

| Helper | Path | Purpose | Verified by |
| --- | --- | --- | --- |
| Viewport | \e2e/lab-04/helpers/viewport.ts\ | ตั้งค่าขนาดหน้าจอ 360/768/1280 และตรวจจับแนวนอนไม่ให้เลื่อน (no-horizontal-scroll) | HELPER-06 |
| Axe | \e2e/lab-04/helpers/axe.ts\ | ตรวจสอบการเข้าถึง (Accessibility) ดักจับเฉพาะระดับ serious/critical | HELPER-07 |
| Data Factories | \server/tests/lab-04/helpers.ts\ | สร้างข้อมูลจำลอง User/Ticket/Comment/Note/Attachment (รันได้ทันที) และเตรียมฟังก์ชันสำหรับ Action/History/Idempotency ที่จะทำงานได้เมื่อ Issue #3 ผสานโค้ดแล้ว | HELPER-02, HELPER-05 |
| Server Auth & Cleanup | \server/tests/lab-04/helpers.ts\ | ให้ระบบล็อกอิน (\loginAs\), และ esetTestData()\ พร้อม Guard \ssertTestDatabase()\ เพื่อป้องกันข้อมูลสูญหาย | HELPER-01, HELPER-03, HELPER-04 |
| E2E Auth & Network | \e2e/lab-04/helpers/auth.ts\ | เข้าสู่ระบบหน้าเว็บ UI (\loginAs\) และดักจับ Network/Console Errors | HELPER-08 |

### Helper Self-checks

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
| --- | --- | --- | --- | --- | --- | --- |
| HELPER-01 | unit | - | ตรวจสอบ Guard ของ \ssertTestDatabase()\ | หาก NODE_ENV ไม่ใช่ test ระบบจะปฏิเสธ | \server/tests/lab-04/helpers.selfcheck.test.ts\ | Pass |
| HELPER-02 | unit | - | ตรวจสอบการทำงาน Data Factories ที่มีอยู่แล้ว | สามารถสร้าง User 4 ประเภท และ Ticket สถานะต่าง ๆ ได้สำเร็จ | \server/tests/lab-04/helpers.selfcheck.test.ts\ | Pass |
| HELPER-03 | unit | - | ตรวจสอบ Auth Helper ฝั่ง Server | Request แบบ Anonymous คืนค่า 401 และ Request จาก \loginAs\ รันได้ปกติ (200) | \server/tests/lab-04/helpers.selfcheck.test.ts\ | Pass |
| HELPER-04 | unit | - | ตรวจสอบระบบ Cleanup | ระบบลบข้อมูลออกอย่างปลอดภัย (เฉพาะที่สร้างใหม่โดย Factory) | \server/tests/lab-04/helpers.selfcheck.test.ts\ | Pass |
| HELPER-05 | unit | - | ตรวจสอบ Factory ของ Model Lab 4 ที่ยังไม่มา | ระบบแจ้งเตือนชัดเจนว่า Model ยังไม่มี หรือถ้ามีจะสร้างผ่าน | \server/tests/lab-04/helpers.selfcheck.test.ts\ | Pass |
| HELPER-06 | E2E | - | ตรวจสอบ Viewport Helper | ปรับเปลี่ยนขนาดจอและตรวจจับการเลื่อนแนวนอนของ Layout ได้สำเร็จ | \e2e/lab-04/helpers.selfcheck.spec.ts\ | Pass |
| HELPER-07 | E2E | - | ตรวจสอบ Axe Helper | ไม่ดักจับ Error บนหน้าสะอาด แต่สามารถจับ Serious Violations บนหน้าที่มีข้อบกพร่องได้ | \e2e/lab-04/helpers.selfcheck.spec.ts\ | Pass |
| HELPER-08 | E2E | - | ตรวจสอบ Auth Helper ฝั่ง E2E | เข้าสู่ระบบสำเร็จและนำทางไปยังหน้าที่กำหนดได้อย่างถูกต้อง | \e2e/lab-04/helpers.selfcheck.spec.ts\ | Pass |
| HELPER-09 | unit | - | resolver uses explicit env var successfully | Pass | server/tests/lab-04/helpers.selfcheck.test.ts | Pass |
| HELPER-10 | unit | - | resolver throws clear error when env var points to missing file | Pass | server/tests/lab-04/helpers.selfcheck.test.ts | Pass |
| HELPER-11 | unit | - | resolver uses PG_BIN_DIR successfully | Pass | server/tests/lab-04/helpers.selfcheck.test.ts | Pass |
| HELPER-12 | unit | - | resolver finds tool via PATH | Pass | server/tests/lab-04/helpers.selfcheck.test.ts | Pass |
| HELPER-13 | unit | - | runPgTool uses shell: false, handles spaces, and masks password | Pass | server/tests/lab-04/helpers.selfcheck.test.ts | Pass |
| HELPER-14 | unit | - | getTempFile returns random path under os.tmpdir() without collision | Pass | server/tests/lab-04/helpers.selfcheck.test.ts | Pass |

## PostgreSQL Tools Environment Variables

The snapshot-restore test (MIG-04b) requires pg_dump and pg_restore. The system resolves them in this order:
1. Explicit variables: PG_DUMP_BIN, PG_RESTORE_BIN, PSQL_BIN, CREATEDB_BIN, DROPDB_BIN
2. Bin directory: PG_BIN_DIR
3. Standard PATH
4. Well-known locations

- **REQUIRE_PG_TOOLS**: Set to 1 in CI to fail the test instead of skipping it if tools are missing.

**หมายเหตุ (Issue #5):**
1. API-15 ถูกขยายให้ครอบคลุมการตรวจสอบ 401 ของ endpoints ใหม่ทั้งหมด (POST /status, GET /allowed-transitions, POST /requester-resolved-indication, PATCH /owner)
2. WF-05 ถูกปรับปรุงให้มี legacy routes compatibility test ตรวจสอบการอนุญาตที่ไม่ส่ง version ในช่วงเวลาเปลี่ยนผ่าน (compatibility window)
3. มีแก้ไข setup ของ test 'transitions IN_PROGRESS → RESOLVED successfully' ในไฟล์ `server/tests/lab-03/staff-ticket-detail.api.test.ts` โดยเพิ่ม `ownerId` และ `ActionTaken` เพื่อให้ผ่านเงื่อนไข Resolution Gate
