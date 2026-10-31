
# TokTickIT - IT Service Desk (Lab 4)

IT Service Desk web application for reporting, tracking, and resolving IT service requests and incidents. Built with Express, TypeScript, Prisma ORM, PostgreSQL backend and React, Vite, Bootstrap frontend following the Zen Green design system.

## ขอบเขตการทำงานของ Lab 4 (Lab 4 Scope)
1. **Actions Taken:** Tracking operational actions on tickets with optimistic locking concurrency (`version`) and idempotency.
2. **Workflow Rules & State Machine:** Strict ticket status transitions with Resolution Gate enforcement and role permissions.
3. **Role-Based Dashboards:** Operational metrics and drill-down ticket lists for Requester, IT Staff, and Administrator.
4. **Hardening & Quality:** Normalized error envelopes, accessibility (WCAG AA), responsive design, and robust API contracts.

---

## 1. ข้อกำหนดเบื้องต้น (Prerequisites)
- **Node.js:** >= 20.x (verified on v24.14.0)
- **npm:** >= 10.x (verified on 11.9.0)
- **PostgreSQL:** >= 15.x (verified on PostgreSQL 18.4)
- **PostgreSQL Client Tools:** Snapshot and rollback testing requires `pg_dump`, `pg_restore`, `psql`, `createdb`, `dropdb`.
  - The repository includes an automatic tool resolver searching PATH and well-known installation paths.
  - If tools are installed in custom locations, set the environment variable:
    - **PowerShell (Windows):**
      ```powershell
      $env:PG_BIN_DIR = "C:\Program Files\PostgreSQL\18\bin"
      $env:REQUIRE_PG_TOOLS = "1"
      ```
    - **Bash (Linux / macOS):**
      ```bash
      export PG_BIN_DIR="/usr/local/opt/postgresql@16/bin"
      export REQUIRE_PG_TOOLS="1"
      ```
    - Or specify individual tool paths: `PG_DUMP_BIN`, `PG_RESTORE_BIN`, `PSQL_BIN`, `CREATEDB_BIN`, `DROPDB_BIN`.
- **Playwright Browsers:** Required for E2E testing and screenshot automation:
  ```bash
  npx playwright install chromium
  ```

---

## 2. ขั้นตอนการติดตั้งและการรันระบบ (Getting Started)

### 2.1 ติดตั้ง Dependencies (Install Dependencies)
```bash
# Root dependencies (Playwright, E2E test runners)
npm install

# Backend dependencies (Express, Prisma, Vitest)
npm install --prefix server

# Frontend dependencies (React, Vite, Bootstrap)
npm install --prefix client
```

### 2.2 การตั้งค่าสภาพแวดล้อม (Environment Setup)
1. **การตั้งค่าระบบหลังบ้าน (Backend Setup):**
   - Copy `server/.env.example` to `server/.env`
     - PowerShell: `Copy-Item server/.env.example server/.env`
     - Bash: `cp server/.env.example server/.env`
   - Set `DATABASE_URL` to point to your PostgreSQL instance (e.g. `postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public`).
   - **คำเตือนความปลอดภัย:** ห้าม Commit ไฟล์ `.env` หรือไฟล์ความลับใดๆ ขึ้น GitHub เด็ดขาด (Never commit real credentials).
2. **การตั้งค่าระบบหน้าบ้าน (Frontend Setup):**
   - Copy `client/.env.example` to `client/.env` if custom overrides are needed (Vite proxies API calls to port 3000 automatically).

### 2.3 การตั้งค่าฐานข้อมูล (Database Setup)
```bash
# 1. Create development database in PostgreSQL (if not already existing)
# Example: createdb -U postgres toktickit

# 2. Generate Prisma Client
npx --prefix server prisma generate --schema=server/prisma/schema.prisma

# 3. Apply database migrations
npx --prefix server prisma migrate deploy --schema=server/prisma/schema.prisma

# 4. Seed initial database data (idempotent seed)
npm run prisma:seed --prefix server
```
*Note: The seed script is idempotent and safe to run multiple times without duplicating data.*

### 2.4 การเริ่มทำงานระบบ (Run Application)
Run the backend and frontend in separate terminals:
```bash
# Terminal 1: Backend Server (runs on port 3000)
npm run dev --prefix server
# API accessible at: http://localhost:3000

# Terminal 2: Frontend Client (runs on port 5173)
npm run dev --prefix client
# Web UI accessible at: http://localhost:5173
```

---

## 3. บัญชีผู้ใช้สำหรับการทดสอบ (Demo Accounts)

Pre-seeded demo accounts for testing in the development environment:

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) | รายละเอียดและวัตถุประสงค์ (Purpose) |
| :--- | :--- | :--- | :--- |
| REQUESTER | alice@toktick.dev | SecurePass@123 | Primary requester with OPEN, IN_PROGRESS, RESOLVED tickets |
| REQUESTER | bob@toktick.dev | SecurePass@123 | Requester for testing NEW ticket queue |
| REQUESTER | carol@toktick.dev | SecurePass@123 | Requester for testing RESOLVED ticket state and Action history |
| REQUESTER | dave@toktick.dev | SecurePass@123 | Requester for testing OPEN ticket workflows |
| REQUESTER | eve@toktick.dev | InitPass@1 | Forced password change account (`requiresPasswordChange: true`) |
| REQUESTER | zack@toktick.dev | InitPass@1 | Forced password change account on first login |
| REQUESTER | inactive@toktick.dev | SecurePass@123 | Inactive account (`isActive: false`) - login forbidden |
| IT_STAFF | frank@toktick.dev | SecurePass@123 | Active IT Staff with assigned tickets and recorded actions |
| IT_STAFF | grace@toktick.dev | SecurePass@123 | Active IT Staff for testing Action edits and status transitions |
| IT_STAFF | hank@toktick.dev | SecurePass@123 | Active IT Staff general operational account |
| IT_STAFF | ivy@toktick.dev | InitPass@1 | Inactive IT Staff (`isActive: false`) - excluded from Owner Picker |
| ADMINISTRATOR | admin@toktick.dev | SecurePass@123 | System administrator with access to user management and system metrics |

*Security Notice: All credentials listed above are demo accounts for development and testing only.*

---

## 4. คู่มือการทดสอบระบบ (Demo Walkthrough)

Main Application Routes:
- `/dashboard`: Requester or Administrator overview dashboard
- `/my-tickets`: Requester ticket list with status and priority filters
- `/staff/dashboard`: IT Staff operational dashboard
- `/staff/tickets`: IT Staff ticket queue with status and priority filters
- `/admin/users`: User management portal for administrators

### 4.1 บทบาท ผู้ร้องขอ (Requester Walkthrough) — Login as alice@toktick.dev
1. Navigate to `/dashboard`:
   - Inspect metric cards:
     - **My Open Tickets** (all open tickets) -> drills down to `/my-tickets?statusGroup=open`
     - **Waiting for Me** (tickets in WAITING_FOR_REQUESTER) -> drills down to `/my-tickets?status=WAITING_FOR_REQUESTER`
     - **แก้ปัญหาแล้วล่าสุด (Recently Resolved)** (resolved within 7 days) -> drills down to `/my-tickets?status=RESOLVED&resolvedWithinDays=7`
   - Inspect the **Recently Updated Tickets** list (up to 5 tickets).
2. Open ticket detail (`/my-tickets` -> click ticket):
   - Review Actions Taken tab: view operational history in read-only mode (no add/edit actions permitted).
   - Problem Appears Resolved: on active tickets with progress, toggle or submit advisory indication to notify staff.

### 4.2 บทบาท เจ้าหน้าที่ไอที (IT Staff Walkthrough) — Login as frank@toktick.dev
1. Navigate to `/staff/dashboard`:
   - Inspect operational metric cards:
     - **Unassigned** (open tickets with no assignee) -> drills down to `/staff/tickets?statusGroup=open&assignee=unassigned`
     - **My Owned** (open tickets assigned to current user) -> drills down to `/staff/tickets?statusGroup=open&assignee=me`
     - **By Status** (breakdown across statuses) -> drills down to `/staff/tickets?status=<STATUS>`
     - **By IT Priority** (open tickets breakdown: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, and `UNSET` for tickets with no priority set) -> drills down to `/staff/tickets?statusGroup=open&priority=<PRIORITY>`
   - Inspect the **Recently Updated Tickets** list (up to 5 tickets).
2. Open ticket detail (`/staff/tickets/:id`):
   - **Create Action Taken:** fill form with description, result, follow-up required/note.
   - **Edit Action Taken:** update recorded action; optimistic locking enforces concurrency using `version` (returns 409 Conflict if stale).
   - **Status Transitions:** dropdown shows only permitted transitions according to strict state machine rules.
   - **Resolution Gate:** attempting transition to `RESOLVED` on tickets with zero Actions Taken is rejected (422 Resolution Gate Failed).
   - **Owner Picker:** dropdown lists only active staff and administrator users (inactive user Ivy is omitted).

### 4.3 บทบาท ผู้ดูแลระบบ (Administrator Walkthrough) — Login as admin@toktick.dev
1. Navigate to `/staff/dashboard`:
   - Access the staff operational dashboard with an additional **User Accounts** summary card (active vs inactive user counts).
2. Navigate to `/admin/users`:
   - Create new user accounts, assign roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), and set initial passwords (forcing `requiresPasswordChange: true`).
   - Edit user profiles, toggle active status (with last-active-administrator safety guard), and set new initial passwords requiring the user to change password at next login.

---

## 5. การรันชุดทดสอบ (Running Tests)

### 5.1 Test Database Safety Guard
- Automated tests modifying the database require a database whose name contains `test` (e.g. `toktickit_test` or `lab4_test_<suffix>`) or `NODE_ENV=test`.
- **The test helper guard (`assertTestDatabase`) strictly blocks execution against the primary development database (`toktickit`) to prevent data loss.**

### 5.2 Scratch Database Setup for Testing
*Note: The test database name MUST contain the word `test` (e.g. `lab4_test_<suffix>` or `toktickit_test`) to satisfy the `assertTestDatabase` guard.*
```powershell
# Create dedicated test database on Windows PowerShell (database name must contain "test")
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres toktickit_test
$env:DATABASE_URL = "postgresql://USER:PASSWORD@localhost:5432/toktickit_test?schema=public"
$env:JWT_SECRET = "CHANGE_ME_TO_A_LONG_RANDOM_STRING"
npx --prefix server prisma migrate deploy --schema=server/prisma/schema.prisma
npm run prisma:seed --prefix server
```

### 5.3 Test Execution Commands
```bash
# 1. Baseline tests for Lab 1-3 (Server, Client, E2E)
npm run test:baseline

# 2. Lab 4 test suite (Server, Client, E2E)
npm run test:lab4

# 3. Complete test suite across all labs
npm run test:all

# 4. Individual module test commands:
npm run test --prefix server                     # All server tests
npm run test --prefix server -- "tests/lab-04"   # Lab 4 server tests
npm run test --prefix client                     # All client tests
npx playwright test e2e/lab-04                  # Lab 4 E2E tests
```

### 5.4 Expected Test Results
Documented in [docs/lab-04/tests.md](docs/lab-04/tests.md):
- **Baseline (Lab 1-3):**
  - Server: 11 suites, 133 tests passed
  - Client: 8 suites, 45 tests passed
  - E2E: 35 tests passed (5 skipped due to legacy UI timing dependencies)
- **Lab 4 Suite:**
  - Server: 9 suites, 376 tests passed (Actions Taken API, Ticket Workflow API, Dashboards API, List Filters, Migration Snapshot/Rollback, Performance Smoke).
  - Client: 6 suites, 40 tests passed (RequesterDashboard, StaffDashboard, ActionsTaken, TicketWorkflow, FormsHardening, AppShell; combined client total: 14 suites, 85 passed).
  - E2E: 22 tests in 8 files on Chromium: 17 passed (14 functional E2E tests + 3 helper self-checks), 5 skipped (non-gating visual inspection captures in screenshots.spec.ts).

---

## 6. การสำรองข้อมูลและการย้อนกลับ (Migration Safety & Rollback)
- Lab 4 migrations are designed as **non-destructive forward migrations** preserving earlier tables and data.
- **Snapshot Procedure:**
  ```bash
  pg_dump -U <user> -h localhost -Fc toktickit -f /tmp/toktickit_before_lab4.dump
  ```
- **Rollback Procedure:**
  - Full instructions in [server/prisma/rollback/README.md](server/prisma/rollback/README.md).
  - Execute the rollback SQL script:
    ```bash
    psql -U <user> -h localhost -d toktickit -f server/prisma/rollback/04-rollback.sql
    ```

---

## 7. การสร้างภาพถ่ายหน้าจอสำหรับตรวจประเมิน (Regenerating Screenshots)
- Automated Playwright capture generates all 58 inspection screenshots complying with the Zen Green design system.
- Full index and details: [artifacts/lab-04/screenshots/README.md](artifacts/lab-04/screenshots/README.md).
- Steps to reproduce:
  1. Prepare scratch test database and configure `DATABASE_URL`.
  2. Set `CAPTURE_SCREENSHOTS=1`:
     ```powershell
     $env:CAPTURE_SCREENSHOTS = "1"
     npx playwright test e2e/lab-04/screenshots.spec.ts
     ```
- **คำเตือนความปลอดภัยของ Git:** Running Lab 2/3 legacy E2E suites may overwrite existing screenshots in `artifacts/lab-03/screenshots/`. Before committing, revert any unintended changes using:
  ```bash
  git restore artifacts/lab-03/screenshots/
  ```

---

## 8. โครงสร้างของโปรเจกต์ (Project Structure)
```
toktickit/
├── client/                     # Frontend SPA (React, Vite, Bootstrap)
│   ├── src/                    # UI Components, pages, api services
│   └── .env.example            # Client environment variables example
├── server/                     # Backend API (Express, TypeScript, Prisma)
│   ├── prisma/                 # Database schema, migrations, seed, rollback
│   │   ├── migrations/         # Database migration history
│   │   └── rollback/           # Migration rollback script and guide
│   ├── src/                    # Controllers, routes, middlewares
│   ├── tests/                  # Automated tests (Lab 1-4)
│   └── .env.example            # Server environment variables example
├── e2e/                        # End-to-End test suites (Playwright)
│   ├── lab-02/                 # Lab 2 E2E specs
│   ├── lab-03/                 # Lab 3 E2E specs
│   └── lab-04/                 # Lab 4 E2E specs (flow, resolution, dashboard, visual)
├── docs/                       # Project documentation
│   └── lab-04/                 # Lab 4 specifications, test plan, reviewer, ai-use
└── artifacts/                  # Generated test evidence and visual assets
    └── lab-04/                 # Screenshots index and evidence reports
```

---

## 9. ดัชนีเอกสาร (Documentation Index)
- [docs/lab-04/specification.md](docs/lab-04/specification.md) — Business requirements and scope
- [docs/lab-04/tests.md](docs/lab-04/tests.md) — Comprehensive test plan and status catalog
- [docs/lab-04/api-spec.md](docs/lab-04/api-spec.md) — REST API specifications and contracts
- [docs/lab-04/ui-spec.md](docs/lab-04/ui-spec.md) — UI, accessibility, and responsive layout specifications
- [docs/lab-04/ai-use.md](docs/lab-04/ai-use.md) — AI utilization and development reflections
- [docs/lab-04/reviewer.md](docs/lab-04/reviewer.md) — Peer code review records
- [server/prisma/rollback/README.md](server/prisma/rollback/README.md) — Database rollback and restore procedure
- [artifacts/lab-04/screenshots/README.md](artifacts/lab-04/screenshots/README.md) — Visual inspection screenshot index

---

## 10. กระบวนการทำงานร่วมกับ Git (Git Workflow)
- **Feature Branch Model:** Every issue is developed on a separate branch (`feature/issue-X-...`).
- **Integration Flow:** Feature branch -> Pull Request -> Peer Review & Approval -> Merge into `lab4-staging` -> Final validation -> Merge into `main`.
- **AI Agent Strict Rules:** AI Coding Agents are permitted to add and commit on local feature branches only (`git add <path>`, `git commit`). Agents **never push or merge** under any circumstances. All pushes, PR creations, and merges are executed by human team members.
- **Commit Conventions:** Conventional commits referencing the active issue (e.g. `docs(#10): ...`, `feat(#8): ...`, `test(#9): ...`).

---

## 11. ข้อจำกัดของระบบที่ทราบ (Known Limitations)
1. **Legacy Response Envelopes:** Certain Lab 3 endpoints maintain legacy response shapes for backwards compatibility with baseline tests.
2. **Skipped Baseline Tests:** 5 tests in the Lab 3 E2E suite are skipped due to legacy UI timing dependencies.
3. **Strict Terminal State:** Tickets in `RESOLVED` or `CANCELLED` status are locked; adding or modifying actions is prohibited.

---

## 12. การแก้ไขปัญหาเบื้องต้น (Troubleshooting)
- **Port In Use (3000 / 5173):** Terminate existing node processes or set `$env:PORT = "3001"` in the server terminal.
- **PostgreSQL Tools Missing:** Ensure PostgreSQL is installed and set `$env:PG_BIN_DIR = "C:\Program Files\PostgreSQL\18\bin"`.
- **Database Does Not Exist:** Create the database with `createdb` or pgAdmin before running migrations.
- **Prisma Client Not Generated:** Execute `npx --prefix server prisma generate --schema=server/prisma/schema.prisma`.
- **Playwright Browsers Missing:** Execute `npx playwright install chromium`.
- **PowerShell Encoding Issues:** Initialize UTF-8 encoding before executing scripts:
  ```powershell
  chcp 65001 ; [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false) ; $OutputEncoding = [Text.UTF8Encoding]::new($false)
  ```
