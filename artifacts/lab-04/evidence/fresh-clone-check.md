# รายงานผลการทดสอบการโคลนและติดตั้งระบบใหม่ (Fresh-Clone Verification Report) - Lab 4

**รหัสการทดสอบ:** REG-05 / AC-51  
**วันที่ทดสอบ:** 2026-10-21  
**ผู้ดำเนินการ:** Antigravity Documentation & Release-Preparation Agent  
**เป้าหมาย:** พิสูจน์ว่าผู้ใช้งานที่มีเพียง Git Repository และเอกสาร `README.md` สามารถติดตั้ง ตั้งค่าฐานข้อมูล รันระบบ และผ่านชุดทดสอบทั้งหมดได้จริงโดยไม่ต้องอาศัยความรู้ที่อยู่นอกเหนือเอกสาร (Clean Room / Fresh Clone Check)

---

## 1. ข้อมูลสภาพแวดล้อมและเครื่องมือ (Machine Facts)
- **ระบบปฏิบัติการ (Operating System):** Windows 10/11 (win32 x64, PowerShell 5.1 / 7.x, Code Page 65001 UTF-8)
- **Node.js Version:** v24.14.0
- **npm Version:** 11.9.0
- **PostgreSQL Version:** PostgreSQL 18.4 (Client binaries: `createdb`, `dropdb`, `psql`, `pg_dump`, `pg_restore` at `C:\Program Files\PostgreSQL\18\bin`)
- **Git Version:** 2.55.0.windows.3
- **Playwright Version:** 1.62.1 (Chromium browser cache at `%LOCALAPPDATA%\ms-playwright\chromium-1234`)

---

## 2. วิธีการโคลนและแยกสภาพแวดล้อม (Clone Method & Isolation)
- **โฟลเดอร์ชั่วคราว:** `%TEMP%\toktickit-fresh-758106` (ยืนยันว่าอยู่ภายใต้ `$env:TEMP` เพื่อความปลอดภัย)
- **วิธีการโคลน:** ใช้คำสั่ง `git clone --no-hardlinks --branch feature/issue-10-lab4-docs-release "C:/KMUTT/SE/toktickit" "%TEMP%\toktickit-fresh-758106"`
- **การแยกขาดของข้อมูล:** ไม่มีการคัดลอกไฟล์ `.env` หรือ `node_modules` จากโปรเจกต์เดิมเข้าไปยังโฟลเดอร์โคลน
- **ฐานข้อมูลทดสอบชั่วคราว (Scratch DB):** สร้างฐานข้อมูลใหม่เฉพาะกิจชื่อ `lab4_fresh_test_758106` (ไม่แตะต้องฐานข้อมูล Development หลัก `toktickit`)

---

## 3. ปัญหาใน README ที่ตรวจพบและดำเนินการแก้ไข (README Gaps Found & Fixed)

ระหว่างการทดสอบในรอบก่อนหน้า ตรวจพบจุดที่ต้องปรับปรุงใน `README.md` 2 รายการ และได้แก้ไขลงในคลังข้อมูลจริงเรียบร้อยแล้ว:
1. **การเรียกใช้คำสั่ง Prisma จากระดับ Root (Commit `b399ab8`):**
   - *ปัญหา:* เนื่องจาก `prisma` ติดตั้งอยู่ใน `server/package.json` การเรียก `npx prisma ...` จาก root ทำให้ `npx` ไปดาวน์โหลด Prisma 8 RC มาติดตั้งชั่วคราวและคำสั่งล้มเหลว
   - *การแก้ไข:* ปรับเอกสาร `README.md` ให้ระบุแฟล็ก `--prefix server` อย่างชัดเจน:  
     `npx --prefix server prisma generate --schema=server/prisma/schema.prisma`  
     `npx --prefix server prisma migrate deploy --schema=server/prisma/schema.prisma`
2. **การระบุตัวแปรสภาพแวดล้อม `JWT_SECRET` สำหรับชุดทดสอบ (Commit `843bb66`):**
   - *ปัญหา:* การรัน Vitest แยกต่างหากโดยไม่มีการรันเซิร์ฟเวอร์หลัก อาจทำให้ระบบไม่โหลดค่า `JWT_SECRET` จากไฟล์คอนฟิก ส่งผลให้การลงชื่อเข้าใช้จำลอง (`loginAs`) ในชุดทดสอบ Dashboard เกิดสถานะ 500
   - *การแก้ไข:* เพิ่มการกำหนดค่าตัวแปรสภาพแวดล้อม `$env:JWT_SECRET = "CHANGE_ME_TO_A_LONG_RANDOM_STRING"` ในหัวข้อ 5.2 สำหรับการเตรียม Scratch Database

---

## 4. ตารางผลการทดสอบรอบสุดท้าย (Final Passing Run Results)

การทดสอบในรอบที่ 3 (Final Iteration) ดำเนินการตามขั้นตอนใน `README.md` ทุกประการ และผ่านการทดสอบ 100%:

| ขั้นตอน (Step) | คำสั่งที่รัน (Command Executed) | ผลลัพธ์ / Exit Code | รายละเอียด (Details) |
| :--- | :--- | :--- | :--- |
| 1. Clone | `git clone --no-hardlinks --branch feature/issue-10-lab4-docs-release ...` | 0 (OK) | โคลนไปยังโฟลเดอร์ชั่วคราวสำเร็จ |
| 2. Create DB | `createdb -U toktickit -h localhost lab4_fresh_test_758106` | 0 (OK) | สร้างฐานข้อมูลทดสอบชั่วคราวสำเร็จ |
| 3. Configure env | คัดลอกและสร้าง `server/.env` และ `client/.env` จากไฟล์ `.example` | 0 (OK) | กำหนด DATABASE_URL แบบ Masked รหัสผ่าน |
| 4a. Root Install | `npm install` | 0 (OK) | ติดตั้ง Root dependencies ครบถ้วน (Playwright) |
| 4b. Server Install | `npm install --prefix server` | 0 (OK) | ติดตั้ง Server dependencies ครบถ้วน |
| 4c. Client Install | `npm install --prefix client` | 0 (OK) | ติดตั้ง Client dependencies ครบถ้วน |
| 5a. Prisma Generate | `npx --prefix server prisma generate` | 0 (OK) | สร้าง Prisma Client v5.22.0 สำเร็จ |
| 5b. Prisma Migrate | `npx --prefix server prisma migrate deploy` | 0 (OK) | ส่งมอบ Migrations ทั้ง 7 รายการสำเร็จ |
| 5c. Seed 1st Run | `npm run prisma:seed --prefix server` | 0 (OK) | นำเข้าข้อมูลเริ่มต้น (Users=12, Tickets=11, Actions=5, History=6) |
| 5d. Seed 2nd Run | `npm run prisma:seed --prefix server` (รันซ้ำ) | 0 (OK) | **ยืนยันคุณสมบัติ Idempotency:** ข้อมูลไม่ซ้ำซ้อน ไม่เกิดข้อผิดพลาด |
| 6a. Health Check | `GET http://localhost:3000/api/health` | 0 (OK) | คืนค่า `{"status":"ok","service":"TokTickIT API"}` ถูกต้อง |
| 6b. Login Requester | เข้าสู่ระบบด้วย `alice@toktick.dev` -> `/api/dashboard/requester` | 0 (OK) | ล็อกอินสำเร็จ เข้าถึงแดชบอร์ด Requester สถานะ 200 |
| 6c. Login IT Staff | เข้าสู่ระบบด้วย `frank@toktick.dev` -> `/api/dashboard/staff` | 0 (OK) | ล็อกอินสำเร็จ เข้าถึงแดชบอร์ด Staff สถานะ 200 |
| 6d. Login Admin | เข้าสู่ระบบด้วย `admin@toktick.dev` -> `/api/dashboard/staff` | 0 (OK) | ล็อกอินสำเร็จ เข้าถึงแดชบอร์ด Administrator สถานะ 200 |
| 6e. Login Inactive | เข้าสู่ระบบด้วย `inactive@toktick.dev` | 0 (OK) | ระบบปฏิเสธอย่างถูกต้อง (HTTP 401 Unauthorized) |
| 7a. Server Baseline | `npm run test --prefix server -- lab-01..03` | 0 (OK) | **11 suites, 133 tests passed** (0 failed, 0 skipped) |
| 7b. Server Lab 4 | `npm run test --prefix server -- tests/lab-04` | 0 (OK) | **9 suites, 376 tests passed** (0 failed, 0 skipped) |
| 7c. Client Tests | `npm run test --prefix client` | 0 (OK) | **14 suites, 85 tests passed** (0 failed, 0 skipped) |
| 7d. Client Build | `npm run build --prefix client` | 0 (OK) | คอมไพล์โปรดักชันด้วย TypeScript และ Vite สำเร็จ |
| 7e. E2E Lab 4 | `npx playwright test e2e/lab-04` | 0 (OK) | **17 tests passed** (Actions flow, resolution gate, dashboards, etc.) |

---

## 5. ส่วนที่ไม่ได้รันและเหตุผล (What Was Not Run & Why)
- **Baseline E2E Specs (Lab 2/3):** ไม่ได้รันในขั้นตอนนี้ เพื่อป้องกันไม่ให้ชุดทดสอบเดิมเขียนทับไฟล์รูปภาพที่ถูกบันทึกไว้ใน `artifacts/lab-03/screenshots/` ตามคำเตือนความปลอดภัยใน README
- **การบันทึกภาพหน้าจอใหม่ (CAPTURE_SCREENSHOTS=1):** ไม่ได้สั่งเปิดตัวแปรนี้ เนื่องจากภาพถ่ายหน้าจอทั้ง 58 ภาพสำหรับ Lab 4 ได้รับการบันทึกและตรวจสอบเรียบร้อยแล้วใน Issue #9

---

## 6. หลักฐานการเก็บกวาดข้อมูล (Cleanup Proof)
1. **การหยุดโปรเซส:** สั่งปิดโปรเซส Backend และ Frontend ที่รันใน Background ทั้งหมดเรียบร้อย
2. **การทำลายฐานข้อมูลชั่วคราว:**
   - คำสั่ง: `dropdb -U toktickit -h localhost lab4_fresh_test_758106` (Exit Code: 0)
   - การตรวจสอบซ้ำ: เรียกคำสั่ง `psql -lqt` และตรวจสอบว่าไม่มีชื่อฐานข้อมูล `lab4_fresh_test_758106` หลงเหลืออยู่ (`dbStillExists = false`)
3. **การลบโฟลเดอร์โคลนชั่วคราว:**
   - คำสั่ง: ลบโฟลเดอร์ `%TEMP%\toktickit-fresh-758106` แบบ Recursive (Force)
   - การตรวจสอบซ้ำ: ตรวจสอบ `fs.existsSync(clonePath)` ได้ผลลัพธ์เป็น `false`
4. **ความสะอาดของ Working Directory:**
   - คำสั่ง `git status --short` ยืนยันว่าไม่มีไฟล์แปลกปลอมหรือ build artifacts ใดๆ หลงเหลืออยู่ในโปรเจกต์จริง

---

## 7. สรุปผลการประเมิน (Conclusion)

การทดสอบตามข้อกำหนด **REG-05 (AC-51)** ประสบผลสำเร็จอย่างสมบูรณ์แบบ คำสั่งทั้งหมดในเอกสาร `README.md` สามารถทำงานได้จริงบนเครื่องสภาพแวดล้อมใหม่ ข้อมูลตัวอย่างและพอร์ตตรงตามข้อกำหนด และสามารถรันผ่านชุดทดสอบทั้ง Server, Client และ E2E โดยไม่มีข้อผิดพลาด
