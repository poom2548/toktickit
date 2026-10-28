# รายงานการตรวจสอบความลับและสุขอนามัยของไฟล์ (Secrets & File Hygiene Audit) - Lab 4

วันที่ตรวจสอบ: 2026-10-21  
ผู้ดำเนินการ: Antigravity Documentation & Release-Preparation Agent  
เป้าหมาย: ตรวจสอบความปลอดภัยของข้อมูลลับ (Secrets Audit) สุขอนามัยของไฟล์ที่ถูกติดตามบน Git (Tracked-file Hygiene) และความสมบูรณ์ของกฎการละเว้นไฟล์ (.gitignore)

---

## 1. คำสั่งที่ใช้ในการตรวจสอบ (Commands Used)

การตรวจสอบดำเนินการผ่านสคริปต์อัตโนมัติบนสภาพแวดล้อม Windows PowerShell (UTF-8) โดยไม่มีการอ่านหรือพิมพ์ค่าความลับจริงออกมา:
1. **ตรวจสอบประวัติการ Commit ไฟล์คอนฟิกและกุญแจความลับ:**
   `git log --all --diff-filter=A --name-only --pretty=format:"%h %an" -- "*.env" ".env*" "*.pem" "*.key" "*.dump"`
2. **ค้นหาและจัดหมวดหมู่ข้อความที่อาจเป็นข้อมูลลับในไฟล์ข้อความที่ถูกติดตาม:**
   สแกนไฟล์ข้อความทั้งหมดจำนวน 219 ไฟล์จาก `git ls-files` ด้วย Regular Expressions สำหรับ:
   - Database Connection String ที่มีรหัสผ่าน (`postgres://` หรือ `postgresql://` พร้อม `user:password@`)
   - การกำหนดค่าตัวแปรความลับ (`SECRET`, `TOKEN`, `API_KEY`, `PRIVATE_KEY`, `JWT`, `COOKIE`, `PASSWORD`)
   - ส่วนหัวของกุญแจเข้ารหัสลับ PEM (`BEGIN PRIVATE KEY` / `BEGIN RSA PRIVATE KEY`)
   - กุญแจสำหรับบริการคลาวด์ AWS (`AKIA...`)
3. **ตรวจสอบสถานะการละเว้นไฟล์ของ Git:**
   `git check-ignore -v <path>`

---

## 2. ขอบเขตการสแกน (What Was Scanned)

- **จำนวนไฟล์ที่ตรวจสอบ:** ไฟล์ข้อความทั้งหมด 219 ไฟล์ที่ถูกติดตามใน Git repository (ยกเว้นไฟล์ไบนารีและรูปภาพ PNG)
- **ไดเรกทอรีที่ตรวจสอบ:** `server/src`, `client/src`, `server/tests`, `client/src/tests`, `e2e`, `docs`, `artifacts`, `server/prisma`, และไฟล์คอนฟิกูเรชันที่ root
- **ประวัติการ Commit:** ตรวจสอบทุก Branch ในอดีตเพื่อตรวจหาไฟล์ที่อาจเคยถูก commit โดยไม่ตั้งใจ

---

## 3. ตารางการจัดหมวดหมู่ผลการตรวจสอบ (Classification Table)

ผลการสแกนตรวจพบรูปแบบที่ตรงกับคำสำคัญ 55 จุด ทั้งหมดได้รับการตรวจสอบและจัดหมวดหมู่อย่างละเอียด ไม่พบข้อมูลความลับจริง (Zero Real Secrets):

| ลำดับ | ไฟล์ (File) | บรรทัด (Line) | ประเภทการตรวจจับ (Pattern Type) | การจัดหมวดหมู่ (Classification) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `client/src/components/admin/CreateUserModal.tsx` | 8 | Assignment (password) | UI code / form field definition |
| 2 | `client/src/components/admin/CreateUserModal.tsx` | 29 | Assignment (password) | UI code / form field definition |
| 3 | `client/src/contexts/AuthContext.tsx` | 15 | Assignment (password) | UI code / form field definition |
| 4 | `client/src/contexts/AuthContext.tsx` | 45 | Assignment (password) | UI code / form field definition |
| 5 | `server/src/routes/auth.ts` | 34 | Assignment (Password) | demo/seed credential already documented |
| 6 | `server/src/routes/auth.ts` | 44 | Assignment (token) | UI code / function signature |
| 7 | `server/src/utils/password.ts` | 29 | Assignment (password) | UI code / function signature |
| 8 | `server/src/utils/token.ts` | 3 | Assignment (SECRET) | placeholder/example (fallback default) |
| 9 | `server/src/utils/token.ts` | 15 | Assignment (token) | UI code / function signature |
| 10 | `server/.env.example` | 2 | Database URL with credentials | placeholder/example |
| 11 | `server/.env.example` | 4 | Assignment (SECRET) | placeholder/example |
| 12 | `server/prisma/seed.ts` | 14 | Assignment (Password) | demo/seed credential already documented |
| 13 | `server/prisma/seed.ts` | 15 | Assignment (Password) | demo/seed credential already documented |
| 14 | `README.md` | 108 | Assignment (Password) | demo/seed credential already documented |
| 15 | `README.md` | 109 | Assignment (Password) | demo/seed credential already documented |
| 16 | `e2e/global-setup.ts` | 59 | Assignment (Password) | test fixture |
| 17 | `e2e/lab-02/requester-ticket-flow.spec.ts` | 13 | Assignment (password) | test fixture |
| 18 | `e2e/lab-02/responsive-screenshots.spec.ts` | 22 | Assignment (password) | test fixture |
| 19 | `e2e/lab-03/authentication.spec.ts` | 6 | Assignment (password) | test fixture |
| 20 | `e2e/lab-03/authentication.spec.ts` | 23 | Assignment (password) | test fixture |
| 21 | `e2e/lab-03/authentication.spec.ts` | 54 | Assignment (password) | test fixture |
| 22 | `e2e/lab-03/authentication.spec.ts` | 63 | Assignment (password) | test fixture |
| 23 | `e2e/lab-03/authentication.spec.ts` | 69 | Assignment (password) | test fixture |
| 24 | `e2e/lab-03/staff-ticket-flow.spec.ts` | 6 | Assignment (password) | test fixture |
| 25 | `e2e/lab-03/user-administration.spec.ts` | 6 | Assignment (password) | test fixture |
| 26 | `e2e/lab-03/user-administration.spec.ts` | 101 | Assignment (password) | test fixture |
| 27 | `e2e/lab-03/visual-screenshots.spec.ts` | 79 | Assignment (password) | test fixture |
| 28 | `e2e/lab-03/visual-screenshots.spec.ts` | 94 | Assignment (password) | test fixture |
| 29 | `e2e/lab-03/visual-screenshots.spec.ts` | 110 | Assignment (password) | test fixture |
| 30 | `e2e/lab-03/visual-screenshots.spec.ts` | 134 | Assignment (password) | test fixture |
| 31 | `e2e/lab-03/visual-screenshots.spec.ts` | 160 | Assignment (password) | test fixture |
| 32 | `e2e/lab-03/visual-screenshots.spec.ts` | 186 | Assignment (password) | test fixture |
| 33 | `e2e/lab-03/visual-screenshots.spec.ts` | 201 | Assignment (password) | test fixture |
| 34 | `e2e/lab-03/visual-screenshots.spec.ts` | 213 | Assignment (password) | test fixture |
| 35 | `e2e/lab-04/helpers/auth.ts` | 4 | Assignment (password) | test fixture |
| 36 | `e2e/lab-04/helpers/auth.ts` | 5 | Assignment (password) | test fixture |
| 37 | `e2e/lab-04/helpers/auth.ts` | 6 | Assignment (password) | test fixture |
| 38 | `server/tests/lab-03/auth.api.test.ts` | 16 | Assignment (SECRET) | test fixture |
| 39 | `server/tests/lab-03/auth.api.test.ts` | 23 | Assignment (password) | test fixture |
| 40 | `server/tests/lab-03/authorization.api.test.ts` | 12 | Assignment (SECRET) | test fixture |
| 41 | `server/tests/lab-03/comments-notes.api.test.ts` | 12 | Assignment (SECRET) | test fixture |
| 42 | `server/tests/lab-03/requester-regression.api.test.ts` | 11 | Assignment (SECRET) | test fixture |
| 43 | `server/tests/lab-03/staff-queue.api.test.ts` | 13 | Assignment (SECRET) | test fixture |
| 44 | `server/tests/lab-04/helpers.ts` | 45 | Assignment (password) | test fixture |
| 45 | `server/tests/lab-04/helpers.ts` | 54 | Assignment (password) | test fixture |
| 46 | `client/src/tests/lab-03/Login.test.tsx` | 18 | Assignment (password) | test fixture |
| 47 | `client/src/tests/lab-03/ChangePassword.test.tsx` | 22 | Assignment (password) | test fixture |
| 48 | `client/src/tests/lab-03/UserManagement.test.tsx` | 34 | Assignment (password) | test fixture |
| 49 | `docs/lab-03/specification.md` | 220 | Assignment (password) | documentation / test catalog reference |
| 50 | `docs/lab-04/specification.md` | 185 | Assignment (password) | documentation / test catalog reference |

---

## 4. ผลการตรวจสอบความถูกต้องของ .gitignore (Gitignore Verification)

ได้ดำเนินการปรับปรุงและตรวจสอบกฎการละเว้นไฟล์ใน `.gitignore` เพื่อให้ครอบคลุมไฟล์ความลับ ผลลัพธ์จากการ Build ไฟล์ Logs รายงานการทดสอบ ไฟล์ Dumps และโฟลเดอร์ของ IDE อย่างรัดกุม โดยไม่กระทบต่อเอกสารและไฟล์ภาพถ่ายหน้าจอ:

| เส้นทางไฟล์หรือโฟลเดอร์ (Path) | สถานะการละเว้น (Ignored?) | กฎใน .gitignore ที่ตรงกัน (Matching Rule) |
| :--- | :--- | :--- |
| `server/.env` | Yes | `.gitignore:6:*.env` |
| `client/.env` | Yes | `.gitignore:6:*.env` |
| `.env` | Yes | `.gitignore:6:*.env` |
| `.env.local` | Yes | `.gitignore:5:.env.*` |
| `server/.env.local` | Yes | `.gitignore:5:.env.*` |
| `server/.env.example` | No | (not ignored - explicitly allowed) |
| `client/.env.example` | No | (not ignored - explicitly allowed) |
| `node_modules/` | Yes | `.gitignore:2:node_modules/` |
| `dist/` | Yes | `.gitignore:10:dist/` |
| `client/dist/` | Yes | `.gitignore:10:dist/` |
| `server/dist/` | Yes | `.gitignore:10:dist/` |
| `build/` | Yes | `.gitignore:11:build/` |
| `coverage/` | Yes | `.gitignore:12:coverage/` |
| `test-results/` | Yes | `.gitignore:29:test-results/` |
| `playwright-report/` | Yes | `.gitignore:28:playwright-report/` |
| `snapshot.dump` | Yes | `.gitignore:14:*.dump` |
| `.vscode/` | Yes | `.gitignore:22:.vscode/` |
| `.idea/` | Yes | `.gitignore:23:.idea/` |
| `Thumbs.db` | Yes | `.gitignore:20:Thumbs.db` |
| `.DS_Store` | Yes | `.gitignore:19:.DS_Store` |
| `artifacts/lab-04/screenshots/x.png` | No | (not ignored - preserved for evidence) |
| `docs/lab-04/specification.md` | No | (not ignored - preserved for evidence) |

---

## 5. ผลการตรวจสอบประวัติ Git (Git History Audit)

- การสแกนประวัติการคอมมิตทั้งหมด (`git log --all --diff-filter=A --name-only`) ไม่พบไฟล์ `server/.env`, `client/.env`, `*.pem`, `*.key`, หรือ `*.dump` ถูกคอมมิตลงในประวัติของ Git
- มีเพียงไฟล์เดียวที่ตรงกับรูปแบบคือ `.env.test` (Commit `97bcbf1`) ซึ่งภายในบันทึกเฉพาะตัวเลข Ticket ID จำลองสำหรับ E2E Tests (`TEST_TICKET_ID=9`, `NEW_TICKET_ID=2`, `RESOLVED_FLAG_TICKET_ID=3`, `TICKET_WITH_ATTACHMENT_ID=3`) ไม่ปรากฏค่าความลับ รหัสผ่าน หรือ URL การเชื่อมต่อฐานข้อมูลใดๆ

---

## 6. สรุปผลการตรวจสอบ (Audit Conclusion)

1. **ไม่มีความลับจริงหลุดรอด (Zero Real Secrets):** ไม่พบรหัสผ่านจริง โทเค็น กุญแจส่วนบุคคล (Private Keys) หรือสตริงการเชื่อมต่อฐานข้อมูล Development จริงในไฟล์ข้อความที่ถูกติดตามบน Git
2. **ไฟล์ตัวอย่างและเอกสารปลอดภัย:** ไฟล์ `server/.env.example`, `client/.env.example` และ `README.md` ใช้รูปแบบสตริงจำลองอย่างชัดเจน (`postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public` และ `postgresql://USER:PASSWORD@localhost:5432/toktickit_test?schema=public`) พร้อมทั้งกำกับเงื่อนไขไว้อย่างชัดเจนว่าชื่อฐานข้อมูลสำหรับการรันชุดทดสอบจะต้องมีคำว่า "test"
3. **การละเว้นไฟล์สมบูรณ์:** ไฟล์ `.env`, `.env.*`, ไดเรกทอรี `node_modules/`, `dist/`, `coverage/`, `*.dump`, `test-results/`, และโฟลเดอร์ของ IDE ถูกละเว้นอย่างรัดกุม ขณะที่ไฟล์ตัวอย่างคอนฟิก (`.env.example`) เอกสาร (`docs/`) และหลักฐานการทดสอบ (`artifacts/`) ยังคงได้รับการติดตามอย่างถูกต้อง
