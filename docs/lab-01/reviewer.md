# Lab 1 — Peer Review Record

**Author:** <your Saksorn Buranatananun> — <student 67070507208> — GitHub: @<poom2548>
**Peer reviewer:** <partner Purin Mebotsom> — <student 67070507214> — GitHub: @<meebotsompurin-stack>,<partner Natthawadee  Phukhamao> — <student 67070507201> — GitHub: @<guluJa>,<partner Aphiwat Panthathanaphat> — <student 67070507209> — GitHub: @<apfirst13>

## Pull Requests I authored (reviewed by my partner)

| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| #1 | feature/1-project-foundation | Changes requested -> Approved |
| #2 | feature/2-health-check | Changes requested -> Approved (เพื่อนตรวจให้ถูกต้องแล้ว merge แล้ว แต่ลืมกด approved)|
| #3 | feature/3-category-seed | Changes requested -> Approved (เพื่อนตรวจให้ถูกต้องแล้ว merge แล้ว แต่ลืมกด approved)|
| #4 | feature/4-category-list | Changes requested -> Approved |

### Reviewer comments I received & How I responded

#### Issue 1: Project Foundation
* **Reviewer comment received:**
  > "จากมุมมอง Reviewer ยังไม่พบ GitHub Project ที่เชื่อมกับ Repository จึงไม่สามารถตรวจสอบ Kanban Board และสถานะ Issues ได้ Issues #1–#4 ยังไม่มี Description, Required Branch และ Acceptance Criteria ตาม Labsheet และยังไม่ได้เพิ่มเข้า Project README ยังขาดรายละเอียดการติดตั้ง Client/Server, การสร้าง .env จาก .env.example, การตั้งค่า PostgreSQL, วิธีเปิด Frontend/Backend, วิธีรัน Tests และคำเตือนไม่ให้ Commit Secrets README ระบุ prisma db push แต่ Issue #1 ยังไม่มี Prisma Model แนะนำให้ใช้ prisma validate และ prisma migrate status สำหรับตรวจ Project Foundation"

* **How I responded:**
  1. สร้าง GitHub Project Board ("Tok TickIT Individual Sprints") แบบ Kanban และทำการเชื่อมเข้ากับ Repository
  2. ใส่ Description, Required Branch และ Acceptance Criteria ใน Issues #1–#4 พร้อมย้ายการ์ดเข้า Project Board
  3. ปรับปรุงไฟล์ `README.md` เพิ่มขั้นตอน Setup ทั้ง Client/Server, การตั้งค่า `.env`, PostgreSQL, วิธีรัน Dev/Test และคำเตือนห้าม Commit Secrets
  4. แก้ไขคำสั่งใน `README.md` จาก `prisma db push` เป็น `npx prisma validate` และ `npx prisma migrate status`

---

#### Issue 2: Health Check API
* **Reviewer comment received:**
  > "Missing Test: There is no Supertest file to verify the endpoint. Please add a test file (e.g., server/tests/lab-01/health.test.ts) that asserts the 200 status and the exact JSON payload.
  > Hardcoded URL: In client/src/App.tsx, please do not hardcode "http://localhost:3000/api/health". Use a relative path "/api/health" or an environment variable so it works anywhere.
  > Button Logic: The [Check System] button currently only sets the loading state but doesn't actually trigger the fetch request (the fetch seems to run automatically on mount). Please update the handleCheck function to trigger the real API call when the button is clicked."

* **How I responded:**
  1. เพิ่มไฟล์ `server/tests/lab-01/health.test.ts` โดยใช้ Supertest ตรวจสอบ HTTP Status 200 และคืนค่า JSON `{ status: "ok", service: "TokTickIT API" }`
  2. ลบ Hardcoded URL `http://localhost:3000` ออกจาก `client/src/App.tsx` โดยเปลี่ยนเป็น Relative path `/api/health` ร่วมกับการตั้งค่า Vite Proxy ใน `vite.config.ts`
  3. แก้ไขลอจิกฟังก์ชัน `handleCheck` ใน `App.tsx` ให้ยิง API เรียกข้อมูลเมื่อมีการคลิกปุ่ม [Check System] จริงๆ แทนการยิงอัตโนมัติตอน Mount

---

#### Issue 3: Category Seed Data
* **Reviewer comment received:**
  > "ไฟล์ server/prisma/schema.prisma ยังไม่มีการเพิ่มโมเดล Category จำเป็นต้องเพิ่มโครงสร้างโมเดล ตัวอย่างฟิลด์ที่แนะนำ ได้แก่ id Int @id @default(autoincrement()), name String @unique, และ createdAt DateTime @default(now())
  > ไฟล์ server/prisma/seed.ts ยังไม่มีการเขียนคำสั่ง upsert ปัจจุบันเป็นเพียง console.log ซึ่งจะไม่เกิดการสร้างข้อมูลใด ๆ ในฐานข้อมูล
  > สคริปต์ seed.ts ควรใช้ instance ของ Prisma ตัวเดียวกันตลอดกระบวนการเชื่อมต่อและตัดการเชื่อมต่อ โค้ดปัจจุบันมีการประกาศ const prisma = getPrisma(); แต่ใน block finally กลับเรียก await getPrisma().$disconnect(); ซึ่งอาจก่อให้เกิดการสร้างและปิด client คนละตัว ควรปรับแก้เป็นการเรียก await prisma.$disconnect() แทน
  > จำเป็นต้องใช้ await เมื่อเรียกคำสั่ง prisma.category.upsert(...) เพื่อให้แน่ใจว่าการดำเนินการแต่ละรายการเสร็จสิ้นก่อนที่สคริปต์จะทำงานจบ
  > ควรตรวจสอบความถูกต้องของการ import ../src/prisma.js ให้สอดคล้องกับวิธีการรัน seed ในโปรเจกต์ หากใช้ ts-node อาจต้องปรับเป็น ../src/prisma หรือแก้ไข package.json และ tsconfig ให้รองรับไฟล์ .js
  > ยังไม่มีไฟล์ Migration ปรากฏใน Pull Request เมื่อมีการเพิ่มโมเดลแล้ว จำเป็นต้องรันคำสั่ง npx prisma migrate dev --name init (หรือตามมาตรฐานของโปรเจกต์) และทำการ commit ไฟล์ migration ที่เกิดขึ้นด้วย
  > ขาดการจัดการข้อผิดพลาด (error handling) และการบันทึกข้อมูล (logging) ในสคริปต์ seed เพื่อให้สามารถตรวจสอบผลลัพธ์หรือข้อผิดพลาดของแต่ละกระบวนการ upsert ได้"

* **How I responded:**
  1. เพิ่มโมเดล `Category` ลงใน `server/prisma/schema.prisma`
  2. รันคำสั่ง `npx prisma migrate dev --name init` เพื่อสร้างและ Commit โฟลเดอร์ `prisma/migrations`
  3. เขียนสคริปต์ `seed.ts` ใหม่โดยใช้ `prisma.category.upsert()` พร้อมใส่ `await` สำหรับหมวดหมู่ทั้ง 4 รายการ
  4. แก้ไขการเรียก Prisma instance ใน `seed.ts` ให้ใช้ตัวแปร `prisma` ตัวเดียวกันทั้งในฟังก์ชันหลักและในบล็อก `finally` (`await prisma.$disconnect()`)
  5. เพิ่ม Try-Catch สำหรับ Error handling และเพิ่ม `console.log` เพื่อบันทึกผลการ Seeding

---

#### Issue 4: Category List API & UI
* **Reviewer comment received:**
  > "fix the app export/import mismatch, and add a mocked server test (vi.mock) or update the supertest test to document the required DB setup."

* **How I responded:**
  1. แก้ไขไฟล์ `server/src/app.ts` ปรับโครงสร้าง Export ให้สอดคล้องกัน โดยใช้ `export const app = express();` และจัดลำดับการประกาศ Route ให้ถูกต้องก่อนการ Export
  2. อัปเดตไฟล์เทสต์ `server/tests/lab-01/categories.test.ts` โดยใช้ `vi.mock("../../src/prisma.js")` เพื่อจำลอง (Mock) ข้อมูลจากฐานข้อมูล Prisma ทำให้ Supertest สามารถทดสอบ API ได้โดยไม่ต้องพึ่งพาการเชื่อมต่อฐานข้อมูลจริง

---
## Pull Requests I reviewed for my partner
Issue 1
My comment: 
Frontend ขาดการตั้งค่า Bootstrap ขาด client/package.json กับ client/src/main.tsx
1.รัน npm install bootstrap ในโฟลเดอร์ client
2.เพิ่มโค้ด import 'bootstrap/dist/css/bootstrap.min.css'; ในไฟล์ client/src/main.tsx
Partner's response: 
ขอบคุณที่ตรวจสอบให้อีกครั้งและ Approve PR ให้นะคะ ตัวไฟล์มีอยู่ใน Base Branch เดิมแล้วจึงไม่แสดงใน Files changed ตอนนี้ตรวจสอบ Bootstrap dependency, CSS import และการแสดงผลหน้า Frontend ครบถ้วนแล้วค่ะ
Issue 2 
My comment :
1.ตรงไฟล์ API test มันเขียนว่า'Tok TickIT API' แต่ใน API จริงมันเขียน 'TokTickIT API'
2.Syntax Error ในclient/src/App.tsx ฟังก์ชัน handleCheckSystem และ return อันใหม่ ไปแทรกอยู่ตรงกลางของโครงสร้าง HTML/JSX เดิมของ Vite ทำให้โค้ดพังและหน้าเว็บจะรันไม่ขึ้น
Partner's response:
แก้ไขปัญหา Prisma Version: ปรับโค้ดการเชื่อมต่อฐานข้อมูลกลับมาใช้รูปแบบมาตรฐานของ Prisma v5 เพื่อแก้ปัญหาเวอร์ชันไม่ตรงกันและให้สอดคล้องกับโครงสร้างหลักของโปรเจกต์
แก้ไขปัญหา Port Collision: เพิ่มเงื่อนไขป้องกันไม่ให้เซิร์ฟเวอร์แย่งกันเปิด Port 3000 ซ้ำซ้อนตอนรันโหมด Test (แก้ไข Error EADDRINUSE)
หมายเหตุ: โค้ดที่แก้ไขในส่วนของ Issue 2 นี้ ได้นำไปรวมและ Push ขึ้นไปพร้อมกับงานของ Issue 3 เรียบร้อยแล้วครับ เนื่องจากมีความจำเป็นต้องเคลียร์ระบบเดิมให้รันผ่านก่อน จึงจะสามารถพัฒนาและทดสอบ Issue 3 ต่อได้
Issue 3
My comment :1.หมวดหมู่ในไฟล์ seed.ts ขาดหมวดหมู่ Account and Access
2.ถ้าใช้คำสั่ง prisma.category.create(...) ตอนรันซ้ำจะพัง ฟิลด์ name ในตารางถูกตั้งเป็น @unique ไว้ หากรันคำสั่ง Seed นี้รอบที่สอง ระบบจะพยายามสร้างชื่อเดิมซ้ำ ทำให้เกิด Error ทันที แนะนำให้ใช้ upsert แทน
3.ใน schema.prisma ตรง name String ไม่มี @unique
4.ไม่มีฟิลด์สำหรับเก็บเวลาที่ข้อมูลถูกสร้าง ต้องเพิ่มฟิลด์ createdAt
ถ้าตรวจไม่ครบถ้วนสามารถแย้งได้
Partner's response:
แก้โค้ด Issue 3 ตามที่คอมเมนต์มาให้เรียบร้อยแล้ว
1.เพิ่มหมวดหมู่ Account and Access แล้ว
2.เปลี่ยนไปใช้ upsert ตามที่แนะนำแล้ว รันซ้ำได้ไม่พัง
3.เติม @unique ในฟิลด์ name แล้ว
4.เพิ่มฟิลด์ createdAt แล้ว
Issue 4 
My comment:
ไฟล์ client/src/App.tsx มีปัญหา Syntax Error ทำให้มีแท็ก หลงไปอยู่ในบล็อก catch และโค้ดส่วน UI ที่ใช้แสดงผลขาดคำสั่ง return (...) ครอบเอาไว้ ทำให้ตอนรันจะเกิด Error
Partner's response: 
ขอบคุณสำหรับ Review ค่ะ ตรวจไฟล์ฉบับเต็มบน Branch feature/4-category-list แล้ว ทั้งสองประเด็นเกิดจากการอ่าน GitHub Unified Diff ซึ่งซ่อนบรรทัดที่ไม่มีการเปลี่ยนแปลงค่ะ
โครงสร้างจริงของไฟล์เป็นดังนี้:

บล็อก catch ปิดหลัง setState("error");
ฟังก์ชัน handleCheck ปิดก่อนเริ่มส่วน UI
มี return (...) ครอบ JSX ทั้งหมด
JSX ไม่ได้อยู่ภายในบล็อก catch
ในหน้า Files changed เลขบรรทัดกระโดดจากบรรทัดปกติ เพราะ GitHub ซ่อนบรรทัดที่ไม่มี Diff ซึ่งเป็นช่วงที่มีการปิด catch, ปิด handleCheck และเริ่ม return (...)
ตรวจด้วย npx.cmd tsc --noEmit แล้วผ่านโดยไม่มี Syntax Error สามารถตรวจไฟล์ฉบับเต็มได้ที่:
https://github.com/guluJa/toktickit/blob/feature/4-category-list/client/src/App.tsx
ดังนั้นจึงยังไม่มี Source Code ที่ต้องแก้ในสองจุดนี้ สามารถตรวจจากไฟล์ฉบับเต็มได้เลยค่ะ
