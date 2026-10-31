# เอกสารการใช้งาน AI (AI Use Documentation) - Lab 4

---

## 1. LLM ที่ใช้ (LLMs Used)

Gemini 3.8 Flash, Gemini 4 Argon, Claude Sonnet 5.5

---

## 2. Prompt สำคัญ (Key Prompts, 6-10)

> **หมายเหตุ:** ทุก prompt ใช้โครงเดียวกัน (ROLE → ขอบเขต issue → กฎ Git → Data Safety → Parts → Self-check → Report) และมีกฎร่วมคือ ห้าม `git push` และ merge, stage เฉพาะ path ที่กำหนด, ห้ามเขียนไฟล์ด้วย `Set-Content` / `Out-File` และต้องรัน encoding scan ก่อน commit ด้านล่างจึงสรุปเฉพาะส่วนสำคัญของแต่ละ prompt (lightly trimmed)

### Prompt ที่ 1: Specification (Issue #1)
> **ROLE:** specification agent for CPE 334 Lab 4 on the existing TokTickIT repository. Your task is ISSUE #1 ONLY.
> Write `docs/lab-04/specification.md` covering Actions Taken, workflow rules and role-based dashboards. Include numbered FR, BR and AC IDs (contiguous), a per-role permission table, and testable acceptance criteria. Ask when something is ambiguous. Do not change product code, tests or Prisma.
> **Report:** list of ACs, open questions, commits, and "I did not push and did not merge anything".

- **วัตถุประสงค์ (Purpose):** สร้าง Specification ก่อนเขียนโค้ด (Spec-Driven Development)
- **หลักฐานใน repository (Evidence):** `docs/lab-04/specification.md`, Commit `cc1d0eb`, `cf26d6f`, `3779c8e`

### Prompt ที่ 2: Test Plan และ Transition Matrix (Issue #2)
> **ROLE:** test-planning agent. Your task is ISSUE #2 ONLY.
> Create `docs/lab-04/tests.md` mapping every AC to a test ID, and design the ticket status transition matrix (role x from x to, Resolution Gate, error codes). Every test ID must be traceable to an AC. Planned tests start as "Planned (Red)". Documentation and test scaffolding only.
> **Self-check:** all ACs appear in tests.md, no orphan IDs.

- **วัตถุประสงค์ (Purpose):** ได้แผนทดสอบและ Transition Matrix ที่ตรวจย้อนกลับถึง AC ได้
- **หลักฐานใน repository (Evidence):** `docs/lab-04/tests.md`, Commit `ba1848b`, `cdef4e4`

### Prompt ที่ 3: Database Migration และ Rollback (Issue #3)
> **ROLE:** database agent. Your task is ISSUE #3 ONLY.
> Add a Prisma migration for the actions table and the optimistic-locking `version` column. The forward migration must be non-destructive and backfill history. Provide snapshot and rollback steps with `pg_dump` / `pg_restore`, plus a migration test.
> **DATA SAFETY:** never run against the development database `toktickit`. Use a scratch database whose name contains "test".

- **วัตถุประสงค์ (Purpose):** เปลี่ยน schema อย่างปลอดภัยและย้อนกลับได้
- **หลักฐานใน repository (Evidence):** `server/prisma/migrations/`, `prisma/rollback/`, Commit `0f60510`, `b6607bf`

### Prompt ที่ 4: Actions Taken API ด้วย TDD (Issue #4)
> **ROLE:** coding agent. Your task is ISSUE #4 ONLY.
> TDD: implement the Actions Taken API tests first, then the endpoints with optimistic locking (`version`), idempotency and the shared error envelope. Do not change tests to make them pass. Show red then green output.

- **วัตถุประสงค์ (Purpose):** ใช้ชุดทดสอบควบคุมขอบเขตการเขียนโค้ดของ Coding Agent
- **หลักฐานใน repository (Evidence):** `server/tests/lab-04/actions-taken.api.test.ts`, Commit `452d099`, `8051791`

### Prompt ที่ 5: Workflow และ Dashboards API (Issues #5-#6)
> **ROLE:** coding agent. Your task is ISSUE #5 / #6 ONLY.
> Enforce the transition matrix, the Resolution Gate and role permissions on the ticket workflow API. Add the requester and staff dashboard metrics endpoints. Follow `api-spec.md` exactly. Tests first, then the implementation. Baseline Lab 1-3 tests must stay green.

- **วัตถุประสงค์ (Purpose):** บังคับกฎ Workflow และคำนวณตัวเลข Dashboard ตาม Specification
- **หลักฐานใน repository (Evidence):** `server/tests/lab-04/ticket-workflow.api.test.ts`, `server/src/dashboard/`, Commit `1a327d3`, `07e61f6`, `d46d9aa`

### Prompt ที่ 6: Ticket Detail UI และ Dashboards UI (Issues #7-#8)
> **ROLE:** frontend agent. Your task is ISSUE #7 / #8 ONLY.
> Implement the Ticket Detail Actions Taken UI, status controls and role dashboards (Zen Green design system) per `ui-spec.md`. Dashboard cards drill down to filtered lists. Write failing client tests first, then the implementation, then Playwright e2e. Do not touch server code except as `api-spec.md` requires.

- **วัตถุประสงค์ (Purpose):** สร้าง UI ตาม ui-spec พร้อมชุดทดสอบ e2e
- **หลักฐานใน repository (Evidence):** Commit `2224406`, `34f27e5`, `bdc300f`, `05d3887`, `a046ce3`

### Prompt ที่ 7: Final Hardening, เอกสาร และ Release Prep (Issues #9-#10)
> **ROLE:** documentation and release-preparation agent. Your task is ISSUE #10 ONLY: README and `.env.example`, `.gitignore` and a secrets audit, `ai-use.md` and `reviewer.md` skeletons (no invented personal statements), a docs-versus-tests consistency audit, and a FRESH-CLONE run of the README (REG-05 / AC-51) against a scratch test database.
> Do not change product code, tests, Prisma or `package.json`. Never `git push` or merge.
> **Report:** commits, secrets-audit conclusion, traceability result, remaining `<<` placeholders, and a human release checklist.

- **วัตถุประสงค์ (Purpose):** ทำให้ repository อ่านง่ายและรันซ้ำได้ พร้อมหลักฐานสำหรับส่งงาน
- **หลักฐานใน repository (Evidence):** Commit `f59f50d`, `649e210`, `bb65260`, `273021f`

---

## 3. My Reflection

### 4.1 การใช้ Specification Agent
ผมใช้ agent ที่เก่งที่สุดที่ผมมีในการช่วยวานแผนทั้ง lab และช่วยเขียน specification เพื่อให้เนื้อหาตั้งต้นครอบคลุมมากที่สุด จะได้ทำต่อได้ราบรื่น
Specification Agent ช่วยให้ขอบเขตของ Lab 4 ชัดเจนก่อนเริ่มเขียนโค้ด โดยแยกเป็น FR, BR และ AC ที่มีเลขกำกับ ทำให้กฎอย่าง Transition Matrix, Resolution Gate และสิทธิ์ของแต่ละ role มีที่อ้างอิงเดียวกัน และเทสต์โยงกลับไปหา AC ได้ตรงๆ การมี spec ก่อนทำให้ตอนเขียน tests.md ไม่ต้องเดาว่าอะไรคือพฤติกรรมที่ถูกต้อง

ถึงตัวที่ผมให้ทำจะฉลาดสุด แต่ก็ต้องแก้หลายรอบ ทั้งเพิ่ม authorization matrix, metrics, backfill และ idempotency (cf26d6f, 3779c8e) และถูกแก้เพิ่มหลังเริ่มทำ UI เรื่อง list filters (9aa4d8c) กับ hardening เรื่อง version บน legacy route (5a506ff) ผมเจอส่วนเหล่านี้ตอนเขียนเทสต์หรือ UI แล้วย้อนกลับมาแก้ spec ก่อน ไม่ได้แก้เฉพาะโค้ด เพื่อให้เอกสารกับระบบตรงกัน

ข้อสรุปของฉันคือ spec ที่ดีไม่ได้เกิดจากการสั่ง agent ครั้งเดียว ต้องอ่านทวนและเทียบกับโจทย์เสมอ โดยเฉพาะตัวเลขกับกฎที่คลุมเครือ

### 4.2 การใช้ Coding Agent
TDD ช่วยคุม Coding Agent ได้จริง เพราะเขียนเทสต์ที่ fail ก่อนแล้วค่อยให้ implement ทำให้ agent มีเป้าหมายตรวจสอบได้ ไม่ต้องตีความเอง และบังคับให้ไม่แก้เทสต์เพื่อให้ผ่าน

Agent ทำงานได้ดีกับงาน boilerplate, test factory, mocking และการเขียน e2e ที่มีรูปแบบซ้ำ แต่พลาดเรื่องที่ต้องใช้บริบทหรือสายตามนุษย์ ตัวอย่างจาก commit คือ a11y contrast และ label association (6367d09), layout บนมือถือ (7331f5e) และการตรวจสิทธิ์/การรั่วของข้อมูลที่ต้องแก้ตามผลรีวิว (07e61f6) เรื่อง race condition และ strict mode ของ Playwright ก็ต้องแก้เองหรือสั่งให้แก้ซ้ำ

บางที Agent มัน merge งานเข้า branch เองโดยที่ผมยังไม่ได้ตรวจ ผมเลยต้องกำหนดขอบเขตงานให้ชัดเจนก่อนที่จะให้มันทำงาน
---

## 4. ขอบเขตและกฎ Git ของ agent (Agent Scope and Git Rules)

ในระหว่างการพัฒนา Lab 4 ของคลังข้อมูลนี้ Agentได้รับการกำหนดบทบาทและข้อจำกัดการใช้งาน Git อย่างเคร่งครัด: Agent ได้รับอนุญาตเฉพาะการสร้างและแก้ไขไฟล์ในขอบเขตที่ได้รับมอบหมาย รวมถึงการสร้างคอมมิตในเครื่อง (`git add <explicit-path>` และ `git commit`) บน Local Feature Branch เท่านั้น โดยห้ามมิให้ Agent เรียกคำสั่ง `git push` หรือสั่งรวมสาขา (`git merge`) โดยเด็ดขาด การผลักดันโค้ดขึ้นสู่ GitHub Remote การเปิด Pull Request การตรวจทานโค้ด (Peer Review) และการอนุมัติรวมสาขาเข้าสู่ `lab4-staging` และ `main` ต้องกระทำโดยมนุษย์เสมอเพื่อความปลอดภัยและความถูกต้องของประวัติการพัฒนา
