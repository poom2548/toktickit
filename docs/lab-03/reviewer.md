# Sprint 3 Code Review Record

**Author:** <your Saksorn Buranatananun> — <student 67070507208> — GitHub: @<poom2548>
**Peer reviewer:** <partner Purin Mebotsom> — <student 67070507214> — GitHub: @<meebotsompurin-stack>

## Pull Requests Reviewed by Others (My Code)

| Issue | Branch | PR Link | Status |
| :--- | :--- | :--- | :--- |
| Issue 1 | feature/1-Engineeringcontract | https://github.com/poom2548/toktickit/tree/feature/1-Engineeringcontract | Approved |
| Issue 2 | feature/issue-2-db-migration | https://github.com/poom2548/toktickit/tree/feature/issue-2-db-migration | Approved |
| Issue 3 | feature/issue-3-authentication | https://github.com/poom2548/toktickit/tree/feature/issue-3-authentication | Approved |
| Issue 4 | feature/issue-4-requester-regression | https://github.com/poom2548/toktickit/tree/feature/issue-4-requester-regression | Approved |
| Issue 5 | feature/issue-5-staff-ticket-queue | https://github.com/poom2548/toktickit/tree/feature/issue-5-staff-ticket-queue | Approved |
| Issue 6 | feature/issue-6-staff-ticket-detail | https://github.com/poom2548/toktickit/tree/feature/issue-6-staff-ticket-detail | Approved |
| Issue 7 | feature/issue-7-admin-user-management | https://github.com/poom2548/toktickit/tree/feature/issue-7-admin-user-management | Approved |
| Issue 8 | feature/issue-8-visual-qa | https://github.com/poom2548/toktickit/tree/feature/issue-8-visual-qa | Approved |
| Issue 9 | feature/issue-9-release-integration | https://github.com/poom2548/toktickit/tree/feature/issue-9-release-integration | Approved |

---

### Issue 1
**Reviewer:**
> **Summary**
> - **AC-SPEC-01 (specification.md):** PASS - เนื้อหาครบถ้วน ครอบคลุม Sprint Goal, FR, BR, Authorization Matrix และ DoD
> - **AC-SPEC-02 (api-spec.md):** PASS - ระบุ Endpoint ครบถ้วน (Auth, IT Staff, Admin) พร้อม Status Code และ Schema
> - **AC-SPEC-03 (ui-spec.md):** PASS - มีรายการหน้าจอ กฎ Responsive 3 ขนาด และตาราง Checklist สำหรับตรวจสอบ UI
> - **AC-SPEC-04 (tests.md):** PASS - แผนการทดสอบครอบคลุมทั้ง API, UI และ E2E พร้อมระบุไฟล์เทสต์ชัดเจน

**Author (Me):**
> ขอบคุณที่ตรวจให้ครับ

---

### Issue 2
**Reviewer:**
> จากการตรวจสอบโค้ดและการตั้งค่าฐานข้อมูลใน Pull Request นี้ เทียบกับ Acceptance Criteria (AC) ที่กำหนดไว้ พบว่าผ่านเกณฑ์การทดสอบทั้งหมด โดยมีรายละเอียดผลการตรวจสอบดังนี้:
> - **โครงสร้างตาราง User (AC-DB-01):** มีการสร้างโมเดล User ครบถ้วนตามข้อกำหนด และไม่มีการจัดเก็บรหัสผ่านในรูปแบบข้อความธรรมดา (Plaintext)
> - **การปรับปรุงตาราง Ticket (AC-DB-02):** มีการเพิ่มฟิลด์ `ownerId` และ `itPriority` อย่างถูกต้อง พร้อมทั้งปรับปรุงคอลัมน์สถานะให้สอดคล้องกับ Enum ซึ่งครอบคลุมสถานะการดำเนินงานทั้ง 8 รูปแบบตามโจทย์
> - **ระบบจัดการ Comment และ Note (AC-DB-03):** ตาราง PublicComment และ InternalNote ถูกสร้างขึ้นอย่างถูกต้อง โดยได้รับการออกแบบให้เป็นรูปแบบบันทึกข้อมูลอย่างเดียว (Append-only) และไม่มีการใช้งานคอลัมน์ `updatedAt`
> - **ความปลอดภัยในการโยกย้ายข้อมูล (AC-DB-04):** ไฟล์ Migration มีการจัดการข้อมูลอย่างรัดกุม สามารถรักษาข้อมูลตั๋วปัญหาและไฟล์แนบเดิมจาก Lab 2 ได้ครบถ้วน 100% และมีการทำ Data Migration จากข้อมูล Requester เดิมเข้าสู่ระบบ User ใหม่ได้อย่างสมบูรณ์
> - **ความสมบูรณ์ของสคริปต์ Seed (AC-DB-05 และ AC-DB-06):** ข้อมูลจำลองมีความครอบคลุมในทุกบทบาท (Role) และมีการกระจายสถานะของตั๋วปัญหาอย่างเหมาะสม นอกจากนี้ สคริปต์ยังถูกเขียนด้วยคำสั่ง upsert ทั้งระบบ ทำให้สามารถรันซ้ำได้โดยไม่เกิดปัญหาข้อมูลซ้ำซ้อน (Idempotent)
> - **ความปลอดภัยของการเข้ารหัสรหัสผ่าน (AC-DB-07):** ข้อมูลรหัสผ่านจำลองทั้งหมดถูกเข้ารหัสด้วยไลบรารี bcrypt อย่างถูกต้องก่อนทำการบันทึกลงฐานข้อมูล

**Author (Me):**
> ขอบคุณที่ตรวจให้ครับ

---

### Issue 3
**Reviewer (Comment 1):**
> **ส่วนที่เรียบร้อย:**
> - การปกป้องข้อมูลความลับ (AC-01, AC-06): ระบบทำการคัดกรองข้อมูล passwordHash ออกจาก Response ในทุก API อย่างหมดจด ไม่มีข้อมูลรหัสผ่านรั่วไหลไปยังฝั่ง Frontend
> - การป้องกันการคาดเดาบัญชี (AC-03, AC-04): มีการป้องกัน Account Enumeration และ Timing Attack ที่ยอดเยี่ยม ข้อความแจ้งเตือนกรณีบัญชีถูกระงับ (Inactive) และกรณีรหัสผ่านผิด เป็นข้อความเดียวกันแบบ 100% (Invalid email or password.) พร้อมทั้งมีการตั้งค่าหน่วงเวลา (Delay) 200ms เพื่อป้องกันการถูกโจมตี
> - ระบบบังคับเปลี่ยนรหัสผ่าน (AC-02, AC-07 ถึง 09): ระบบ Route Guard ทำงานได้อย่างสมบูรณ์ ป้องกันผู้ใช้จากการเข้าถึงหน้าจออื่นก่อนเปลี่ยนรหัสผ่านได้จริง รวมถึงมีการตรวจสอบ (Validation) ทั้งฝั่ง Client และ Server (HTTP 422) อย่างครบถ้วน
> - การควบคุมสิทธิ์การเข้าถึง (AC-10, AC-12): Middleware จัดการคำขอที่ไม่มีสิทธิ์ด้วยสถานะ HTTP 401 ได้อย่างถูกต้องแม่นยำ และระบบ Router ฝั่ง React สามารถป้องกันการเข้าถึงหน้าเว็บตามสิทธิ์ (RBAC) ได้อย่างมีประสิทธิภาพ
> 
> **ส่วนที่ควรปรับปรุงเล็กน้อย:**
> โค้ดมีความปลอดภัยและไม่มีการฝังค่า Secret (Hardcoded) ในระบบปฏิบัติการหลัก แต่พบจุดตกหล่นด้านเอกสารประกอบและการพิมพ์ผิดเล็กน้อย ซึ่งควรได้รับการแก้ไข:
> - ไฟล์ `server/.env.example`: ยังขาด Placeholder สำหรับตัวแปร Secret ขอเสนอแนะให้เพิ่มบรรทัด `JWT_SECRET=your_jwt_secret_here` เพื่อให้ผู้พัฒนารายอื่นทราบว่าต้องตั้งค่าตัวแปรนี้
> - ไฟล์ `server/src/utils/token.ts` (บรรทัดที่ 5): พบการพิมพ์ตัวแปรผิด (Typo) ในคำสั่ง `const EXPIRY = process.env.JWT_SECRET || '24h'` ซึ่งในเชิงตรรกะน่าจะหมายถึง `process.env.JWT_EXPIRY` ขอให้ตรวจสอบและแก้ไขจุดนี้
> 
> จากการตรวจสอบล่าสุด พบว่ายังมี Unit Tests 8 ตัวที่ยัง Failed tests 
> ลองรันคำสั่ง `npm test` ในโฟลเดอร์ server/ เพื่อตรวจสอบว่าเทสต์ตัวไหนที่พัง และทำการแก้ไข

**Author (Response 1):**
> แก้ไขเรียบร้อยแล้ว สิ่งที่แก้มีดังนี้:
> 1. `server/.env.example`: เพิ่ม `JWT_SECRET=your_jwt_secret_here` ต่อท้ายไฟล์ และจัดการแก้ปัญหาการเข้ารหัสตัวอักษร (Character encoding ที่เพี้ยนเป็น UTF-16 แทนที่จะเป็น UTF-8) ที่เผลอติดมาโดยไม่ได้ตั้งใจเรียบร้อยแล้ว
> 2. `server/src/utils/token.ts`: แก้ไขตัวแปรตั้งเวลาระยะหมดอายุจาก `process.env.JWT_SECRET` เป็น `process.env.JWT_EXPIRY` ตามคำแนะนำ พร้อมทั้งอัปเดตเมธอด `jwt.sign()` ด้านล่างให้ดึงค่าคงที่ EXPIRY ใหม่นี้ไปใช้งานจริงแทนการฟิกซ์ค่าตายตัวเป็น '24h'
> 
> แก้ไขแล้ว ลองรัน `npm test` แล้ว ผ่านทั้ง 87 tests

**Reviewer (Comment 2):**
> ตรวจสอบแล้วถูกต้องเรียบร้อย

---

### Issue 4
**Reviewer:**
> **ข้อเสนอแนะ:**
> แม้โค้ดจะทำงานได้ตาม Requirement แต่มีจุดที่ควรปรับปรุงเพื่อคุณภาพและความปลอดภัยของระบบในระยะยาว ดังนี้:
> - **แก้ไข HTTP Status ของ Internal Notes:** ปัจจุบันฟังก์ชัน `postNote()` และ `getNotes()` คืนค่า 501 (Not Implemented) ควรแนะนำให้เพื่อนเปลี่ยนเป็น 403 (Forbidden) ทันที เพื่อป้องกันช่องโหว่ในกรณีที่ Middleware ถูกถอดออกในอนาคต
> - **ตรวจสอบ Data Type ของ requesterId:** ใน Controller มีการกำหนดค่า `requesterId` เป็น string ควรให้เพื่อนยืนยันว่า Data Type ตรงกับใน Prisma Schema (หากใน Schema เป็น Int ต้องทำการแปลงค่าก่อน)
> - **ขาด Backend Tests:** เพื่อนเขียน Frontend Tests มาครบถ้วน แต่ยังขาดการทดสอบฝั่ง Backend สำหรับฟีเจอร์ใหม่ (ระบบคอมเมนต์และการอัปเดตสถานะ Resolved) ควรแนะนำให้เขียนเพิ่มเติม

**Author (Me):**
> ขอบคุณสำหรับคำแนะนำครับ

---

### Issue 5
**Reviewer:**
> ตรวจสอบโค้ดและทดสอบการทำงานตาม Acceptance Criteria ทั้ง 12 ข้อเรียบร้อย:
> - **Backend API:** ระบบ Pagination, การ Search/Filter และการจัดเรียง (Sorting) ทำงานได้ถูกต้องสมบูรณ์
> - **Frontend UI/UX:** Responsive Design แยก Card (Mobile) และ Table (Desktop) ได้ชัดเจน ระบบ Loading Skeleton และ Error Message ปลอดภัยต่อผู้ใช้งาน
> - **Tests:** ครอบคลุมทั้ง API และ UI Components
> 
> **Suggestion (Optional - สำหรับปรับปรุงในอนาคต):**
> - ใน `StaffTicketQueuePage.tsx` อาจพิจารณาเพิ่ม `.trim()` ตอนส่งค่า Filter เพื่อป้องกัน Whitespace
> - หากข้อมูลในอนาคตมีจำนวนมาก อาจพิจารณาเพิ่ม Database Index บนฟิลด์ (`status`, `createdAt`, `ticketNumber`) เพื่อเพิ่มความเร็วในการ Query

**Author (Me):**
> ขอบคุณสำหรับการตรวจครับ

---

### Issue 6
**Reviewer (Comment 1):**
> ภาพรวม Backend และ Test ทำได้ครอบคลุมดีครับ แต่มี 4 จุดที่ต้องแก้ไขก่อน Merge:
> - **Scope ไม่ตรงกับ Description:** โค้ดเป็นงาน Ticket Detail (Issue 6) แต่ Description ระบุ Acceptance Criteria ของ Ticket Queue (Issue 5) รบกวนแก้ไข Description ให้ตรงกับโค้ด หรืออัปเดตโค้ดให้ครบตาม Issue 5
> - **ขาด CSS ของ UI Badges:** Component StatusBadge และ PriorityBadge ยังไม่มีการกำหนดสี Zen Green Theme ตามสเปค
> - **ขาด CSS สำหรับ Loading State:** คลาส `loading-skeleton` ยังไม่มี CSS รองรับ ทำให้หน้าจอขาวโพลนขณะโหลด รบกวนเพิ่ม Spinner หรือ Skeleton UI
> - **การใช้ Type any:** ในไฟล์ `OperationalSection.tsx` รบกวนเปลี่ยนจาก `any` เป็นการกำหนด `TicketDetail` interface ให้ถูกต้อง

**Author (Response 1):**
> แก้ไขแล้ว สิ่งที่แก้คือ
> - **แก้ไขคำอธิบาย PR:** อัปเดตรายละเอียด Acceptance Criteria ให้ตรงกับขอบเขตของ Issue 6 (Ticket Detail) แทนที่อันเดิมที่เผลอใส่ของ Issue 5 ไป
> - **เพิ่ม CSS ให้ Badge:** สร้างไฟล์ `badges.css` เพื่อกำหนดสีให้ป้ายสถานะ (Status) และความสำคัญ (Priority) แล้ว Import เข้าไปใช้งานในคอมโพเนนต์
> - **เพิ่ม CSS สำหรับ Loading:** ใส่เอฟเฟกต์ Skeleton แอนิเมชันไล่สีแบบกระพริบ ลงในคลาส `.loading-skeleton` เพื่อให้รู้ว่าระบบกำลังโหลดข้อมูลอยู่ (แทนที่จะเป็นหน้าจอขาวเปล่าๆ)
> - **แก้ไขการใช้ Type any:** เปลี่ยนการส่ง Prop ที่เคยใช้ type `any` เป็นการระบุ Interface `TicketDetail` แทน เพื่อให้ TypeScript ตรวจสอบความปลอดภัยได้ถูกต้องและรัดกุมขึ้น

**Reviewer (Comment 2):**
> เหลือแก้แค่ 1 จุด: ในไฟล์ `badges.css` ยังใส่สีแบบ Hardcode (เช่น #e0f2fe, #fef3c7) ซึ่งไม่ตรงกับสเปค รบกวนเปลี่ยนไปใช้สีของ Zen Green Theme (หรือดึงตัวแปร CSS มาใช้จริงตามที่คอมเมนต์ทิ้งไว้ในโค้ด) ให้เรียบร้อยครับ นอกนั้นโอเคหมดแล้ว

**Author (Response 2):**
> แก้แล้ว เปลี่ยนสีแล้ว

**Reviewer (Comment 3):**
> ตรวจสอบแล้วเรียบร้อย

---

### Issue 7
**Reviewer:**
> ตรวจสอบแล้วเรียบร้อย

**Author (Me):**
> ขอบคุณครับ

---

### Issue 8
**Reviewer:**
> ตรวจสอบแล้วครบถ้วน

**Author (Me):**
> ขอบคุณครับ

---

### Issue 9
**Reviewer:**
> **จุดที่ต้องแก้ไข:**
> - **ลบไฟล์ขยะ:** ลบ `server/check_users.js` ทิ้ง เพราะมี console.log ติดมา ไม่ควรปล่อยขึ้น Production
> - **แก้ Typo ใน E2E:** ไฟล์ `artifact-screenshots.spec.ts` พิมพ์อีเมลแอดมินผิดเป็น `admin@toktick.dev` ให้แก้เป็น `admin@toktickit.dev` ไม่งั้นเทสต์ล็อกอินพัง
> - **ห้ามซ่อน Error:** ในไฟล์ E2E ตัวเดิม ให้เอา `.catch(() => {})` ออกให้หมด ต้องปล่อยให้เทสต์พังตามจริงถ้าระบบมีปัญหา ไม่ใช่แอบปล่อยผ่าน
> - **แก้ Vitest ชน Playwright:** ไปตั้งค่าใน `vitest.config.ts` ให้ Ignore โฟลเดอร์ `e2e/` เพราะตอนนี้ Vitest เผลอไปรันไฟล์ของ Playwright จนพัง

**Author (Me):**
> แก้ไขแล้ว
> 1. ตรวจสอบแล้ว ไม่เจอ `server/check_users.js` น่าจะเป็นไฟล์ที่เพื่อนสร้างตอนตรวจรึป่าว
> 2. **แก้ไขอีเมล Admin ในเทสต์ E2E:** อัปเดตไฟล์ `visual-screenshots.spec.ts` (ชื่อไฟล์ที่แจ้งมาคลาดเคลื่อน) โดยเปลี่ยนอีเมลเป็น `admin@toktickit.dev` เพื่อให้การทดสอบล็อกอินทำงานได้สำเร็จ
> 3. **ลบ `.catch(() => {})`:** ถอดบล็อก Catch ที่ว่างเปล่าออกจากคำสั่ง (เช่น `waitForSelector` และ `isVisible`) ใน `visual-screenshots.spec.ts` เพื่อให้ระบบแจ้ง Error อย่างชัดเจนเมื่อหาองค์ประกอบหน้าเว็บไม่พบ แทนที่จะปล่อยผ่านเงียบๆ
> 4. **แก้ปัญหา Vitest ทำงานทับซ้อนกับ Playwright:** เพิ่มค่า `exclude: ["/e2e/", "/node_modules/"]` ลงในคอนฟิก `server/vitest.config.ts` และ `client/vite.config.ts` เพื่อป้องกันไม่ให้ Vitest ไปดึงไฟล์ E2E มาเทสต์ซ้ำ

---
---

## Pull Requests I reviewed for my partner

| Issue | Author | PR Link | Status |
| :--- | :--- | :--- | :--- |
| Issue 1 | `[ชื่อ Partner]` | `[ลิงก์ PR]` | Approved |
| Issue 2 | `[ชื่อ Partner]` | `[ลิงก์ PR]` | Approved |
| Issue 3 | `[ชื่อ Partner]` | `[ลิงก์ PR]` | Approved |
| Issue 4 | `[ชื่อ Partner]` | `[ลิงก์ PR]` | Approved |
| Issue 5 | `[ชื่อ Partner]` | `[ลิงก์ PR]` | Approved |
| Issue 6 | `[ชื่อ Partner]` | `[ลิงก์ PR]` | Approved (after changes) |

---

### Issue 1
**My Comment:**
> ตรวจไฟล์ doc แล้ว ครบถ้วน

**Partner's Response:**
> *(ไม่มีการตอบกลับ)*

---

### Issue 2
**My Comment (Round 1):**
> ตรวจแล้ว สิ่งที่ควรแก้ไขมีดังนี้
> 1. รวมโค้ด Diff ของไฟล์ `schema.prisma` ฉบับเต็มมาด้วย เพื่อให้ Reviewer สามารถตรวจสอบโครงสร้างของโมเดล User ได้
> 2. เพิ่มฟิลด์ `appearsResolved` ของตาราง Ticket ลงในไฟล์ Schema และไฟล์ Migration
> 3. ควรพิจารณายุบรวมโมเดล PublicComment และ InternalNote เข้าด้วยกันเป็นตารางเดียวคือ TicketComment (หรือหากตั้งใจแยกตารางไว้ตั้งแต่แรก ก็ให้อัปเดตเอกสารสเปคให้ชัดเจน)
> 4. บังคับใช้เงื่อนไขตาม AC-04 ใน authenticate middleware โดยต้องบล็อกการเข้าถึง Route อื่นๆ ที่ไม่ใช่หน้าเปลี่ยนรหัสผ่าน หากผู้ใช้งานรายนั้นมีค่า `requiresPasswordChange: true`
> 5. แก้ไขลำดับการตรวจสอบข้อมูลในระบบ Login: ย้ายการเช็คสถานะ isActive ขึ้นมาตรวจสอบก่อนการเปรียบเทียบรหัสผ่านด้วย `bcrypt.compare`
> 6. เพิ่มชุดทดสอบ (Tests) สำหรับการบังคับใช้เงื่อนไข AC-04 และการทำงานของระบบ Logout ตาม AC-05

**Partner's Response (Round 1):**
> ดำเนินการแก้ไขตามฟีดแบ็กครบทั้ง 6 ข้อเรียบร้อยแล้ว:
> 1-3. อัปเดต Schema (ยุบรวมโมเดลเป็น TicketComment และเพิ่มฟิลด์ appearsResolved)
> 4. ปรับ Middleware ให้บล็อก 403 ตามเงื่อนไข AC-04 (ยกเว้น /change-password และ /logout)
> 5. ย้ายการตรวจสอบ isActive ขึ้นก่อน bcrypt เพื่อป้องกัน Timing Attack
> 6. เพิ่มชุดทดสอบ (AC-04, AC-05) รันผ่าน 100%

<br/>

**My Comment (Round 2):**
> สิ่งที่ต้องแก้เพิ่มเติม
> 1. เพิ่มฟิลด์ `appearsResolved` (ชนิด Boolean, ค่าเริ่มต้น `false`) ลงในโมเดล `Ticket` ในไฟล์ `schema.prisma`
> 2. ตรวจสอบให้แน่ใจว่ามีการบันทึก (commit) การกำหนดค่าโมเดล `User` ลงในไฟล์ `schema.prisma` แล้ว และสามารถมองเห็นการเปลี่ยนแปลงดังกล่าวได้ใน PR

**Partner's Response (Round 2):**
> ดำเนินการแก้ไขและ Push โค้ดส่วนที่ตกหล่นเรียบร้อยแล้ว:
> - ฟิลด์ `appearsResolved` (Boolean, default: false) ถูกเพิ่มลงในโมเดล Ticket เรียบร้อยแล้ว
> - โมเดล User พร้อมฟิลด์สำหรับ Authentication ทั้งหมดถูกบันทึก (Commit) ลงในไฟล์ `schema.prisma` แล้ว 

<br/>

**My Comment (Approval):**
> ตรวจแล้ว ครบถ้วนแล้ว

---

### Issue 3
**My Comment (Round 1):**
> จุดที่ต้องแก้
> 1. **เส้นทาง API ผิด (Incorrect API Routes):** นำ API ไปวางไว้ที่ `/api/users` แทนที่จะเป็น `/api/admin/users` และส่วนของการรีเซ็ตรหัสผ่านใช้ Method ผิด (ควรเป็น `PATCH /api/admin/users/:id/password` แต่ทำมาเป็น `POST /api/users/:id/reset-password`)
> 2. **ขาดฟีเจอร์สร้างผู้ใช้งาน (Missing "Create User"):**
>    - **Backend:** ไม่มี API สำหรับสร้างผู้ใช้ใหม่ (`POST /api/admin/users`) และไม่มีโค้ดดักจับกรณีอีเมล/ชื่อซ้ำ (409 Conflict)
>    - **Frontend:** หน้า UserManagementPage ไม่มี Modal สำหรับสร้างผู้ใช้และเลือก Role
> 3. **UI ไม่แสดง Badge สี (Missing UI Role Badges):** แทนที่จะแสดงผล Role เป็นป้ายสี (Admin=สีม่วง, Staff=สีฟ้า, Requester=สีเทา) ตามสเปค แต่กลับใช้แค่ Dropdown ธรรมดา
> 4. **ไฟล์ทดสอบหาย:** ไม่พบไฟล์ `admin-users.test.ts` และ `admin-rbac.test.ts` ใน PR นี้

**Partner's Response:**
> ดำเนินการอัปเดตเพิ่มเติมตามแผนเรียบร้อยแล้ว
> - ปรับ API Endpoint เป็น `/api/admin/users` เพื่อความชัดเจน
> - เพิ่มฟีเจอร์ Create User พร้อม UI Modal ป้องกันอีเมล/ชื่อซ้ำ (Return 409)
> - ปรับปรุง UI ให้แสดง Role เป็น Badge สี (Purple/Blue/Gray)
> - เพิ่ม Test Suites สำหรับระบบจัดการแอดมิน (`admin-users.test.ts`) และระบบ RBAC (`admin-rbac.test.ts`) 

<br/>

**My Comment (Approval):**
> ตรวจแล้ว ครบถ้วนแล้ว 

---

### Issue 4
**My Comment (Round 1):**
> สิ่งที่ต้องแก้ไข
> 1. ป้องกันข้อมูล Internal Notes รั่วไหลได้ แต่มีการแนบข้อมูล Comments รวมไปกับ Response ของ `GET /api/tickets/:id` แทนที่จะทำ Endpoint แยกตามสเปก
> 2. ฟีเจอร์กดปุ่มทำงานได้และอัปเดต DB ถูกต้อง แต่ตั้งชื่อ Route ผิด ไปใช้ `/resolved-status` แทนที่จะเป็น `/resolution-flag`
> 3. สิ่งที่ขาดหายไป Unit Tests: ไม่พบไฟล์ทดสอบ `comments.test.ts` และ `requester-actions.test.ts` ตามที่สเปกบังคับไว้ 

**Partner's Response (Round 1):**
> แก้ไขตามรีวิวเรียบร้อย:
> - แยก Endpoint ดึง Comments ออกมาต่างหาก
> - เปลี่ยนชื่อ Route เป็น `/resolution-flag`
> - เพิ่มไฟล์ Unit Tests (`comments.test.ts` และ `requester-actions.test.ts`) ครบถ้วน

<br/>

**My Comment (Round 2):**
> สิ่งที่ต้องแก้เพิ่ม บั้กใหม่
> 1. ให้เรียกใช้งาน `getTicketComments(ticketId)` จริงๆ (เช่น ใส่ไว้ใน `fetchTicket` หรือ `useEffect`) แล้วเก็บค่าลง State
> 2. เปลี่ยนโค้ดฝั่ง UI ให้ดึงข้อมูลมาแสดงผลจาก State `comments` แทน `ticket.comments`

**Partner's Response (Round 2):**
> แก้ไขตามที่รีวิวเรียบร้อยแล้ว:
> - ปรับให้ `fetchTicket` เรียกใช้ฟังก์ชัน `getTicketComments(ticketId)` จริงๆ และนำผลลัพธ์มาเก็บลง State `comments` แยกต่างหาก
> - ปรับโค้ดฝั่ง UI ให้ Map ข้อมูลจาก State `comments` แทน `ticket.comments` ตัวเก่าแล้ว

<br/>

**My Comment (Round 3):**
> `patch.js` และ `patch.py` ยังมีโค้ดเก่าที่พังอยู่ (พยายามเรียกใช้ `ticket.comments.map(...)`)

**Partner's Response (Round 3):**
> แก้ไขแล้ว

<br/>

**My Comment (Approval & Suggestion):**
> ตรวจแล้ว ตัวโค้ดทำงานถูกต้องแล้ว แต่มีข้อเสนอแนะเพิ่มเติมคือ:
> ในไฟล์ `patch.js` และ `patch.py` ยังลบพวกโค้ดที่ไม่ได้ใช้ไม่หมด ทำให้ดูรก

---

### Issue 5
**My Comment (Round 1):**
> สิ่งที่ต้องแก้ 
> 1. **ขาดคิวงานและ API (AC-06):** ยังไม่ได้สร้างหน้า UI StaffQueue และไม่มี API `GET /api/staff/tickets` สำหรับดึงข้อมูลคิวงานของสตาฟฟ์
> 2. **รวบ Endpoint ผิดกติกา (AC-07 & 08):** สเปกบังคับให้แยก API สำหรับ Claim งาน, อัปเดต Priority, และเปลี่ยน Status ออกจากกัน แต่เพื่อนเอาทุกอย่างไปยัดรวมใน `PATCH /api/tickets/:ticketId` แค่เส้นเดียว
> 3. **จัดการ Security ผิดจุด (AC-09):** ผลจากข้อ 2 พอไม่ได้ดึง Route ไปไว้ใต้ `/api/staff/*` ทำให้เสียระบบการจัดการสิทธิ์ด้วย Middleware และต้องมา Hardcode บล็อก HTTP 403 สำหรับ Requester เอาเองข้างใน Controller
> 4. **เลย์เอาต์ Ticket Detail ผิด (UI Mismatch):** สเปกระบุว่าช่อง Public Comments และ Internal Notes ต้องทำงานแบบ กดสลับแท็บ แต่โค้ดปัจจุบันเอาทั้งสองกล่องมาวางโชว์คู่กันซ้ายขวาเฉยๆ
> 5. **ตั้งชื่อไฟล์เทสต์ผิด:** ไฟล์ Unit Test ถูกสร้างขึ้นใหม่ในชื่อ `ticket-updates.test.ts` ซึ่งผิดจากข้อกำหนดที่บังคับให้เขียนลงใน `staff-ticket.test.ts`
> 
> ถ้าตรวจผิดตรงไหนเขียนแย้งมาได้เลย 

**Partner's Response (Round 1):**
> แก้ไขเรียบร้อยแล้ว:
> - (AC-06): เพิ่ม API `GET /api/staff/tickets` และสร้างหน้า UI StaffQueue เรียบร้อย
> - (AC-07, 08, 09): แตก Endpoint เป็น `/claim`, `/priority`, `/status` ย้ายเข้าใต้ Route `/api/staff/tickets` และใช้ Middleware จัดการ RBAC อย่างถูกต้อง ลบ Hardcode 403 ออกแล้ว
> - (UI Mismatch): ปรับหน้า Ticket Detail ให้ส่วน Comments และ Internal Notes เป็นแบบสลับ Tab ตามสเปคแล้ว
> - (Test File): เปลี่ยนชื่อไฟล์เทสต์เป็น `staff-ticket.test.ts` และอัปเดต Test Cases ตาม Route ใหม่

<br/>

**My Comment (Round 2):**
> ยังต้องแก้ไขอยุ่
> - เพิ่มลอจิกรับค่า Query parameters สำหรับระบบตัวกรองและการแบ่งหน้าใน `getStaffTicketsHandler` พร้อมทั้งเติมส่วน UI ที่เกี่ยวข้องลงใน StaffQueuePage
> - เปลี่ยนชื่อเส้นทางจาก `/claim` เป็น `/owner`
> - อัปเดตคอมโพเนนต์ TicketDetail (และไฟล์ `api.ts`) ให้เรียกใช้งาน API เส้นทางใหม่ `/api/staff/tickets/...` จริงๆ
> - สร้างระบบสลับแท็บระหว่าง Comments และ Notes ในหน้า Ticket Detail
> - ลบเส้นทาง API แบบเก่า `PATCH /api/tickets/:ticketId` ทิ้งออกจากระบบ

**Partner's Response (Round 2):**
> แก้ไขแล้ว

<br/>

**My Comment (Round 3):**
> **1. ขาดการเรียกใช้ API ฝั่ง Frontend (`client/src/api.ts`)**
> ไฟล์ `api.ts` ในโค้ดยังไม่มีฟังก์ชันสำหรับการเรียกใช้งาน API ใหม่ๆ (เช่น `getStaffTickets()`, `addTicketNote()`, `getTicketNotes()` รวมถึงคำสั่งอัปเดตสถานะต่างๆ) ทำให้หน้าเว็บส่วนที่เป็น UI ใหม่ไม่สามารถดึงข้อมูลจากหลังบ้านได้ และจะเกิด Error ตอนคอมไพล์
> **สิ่งที่ต้องทำ:** ต้องเขียนฟังก์ชัน fetch() หรือโค้ดดึงข้อมูลเหล่านี้เพิ่มเข้าไปในไฟล์ `client/src/api.ts` และรวมเข้าไปใน Pull Request (PR) นี้ด้วย
> 
> **2. โค้ดขัดแย้งกันในไฟล์สคริปต์ `rewriteTicketDetail.js`**
> โค้ด UI ใน PR (ส่วนบน) มีการแก้ไขเรื่องระบบสลับแท็บ (Tab switching) ได้ถูกต้องแล้ว แต่ไฟล์สคริปต์ `rewriteTicketDetail.js` ที่แนบมาด้านล่างกลับยังมีโค้ดเวอร์ชันเก่าอยู่ (ซึ่งเป็นเลย์เอาต์แบบซ้าย-ขวา และเรียก API ผิด)
> **สิ่งที่ต้องทำ:** ต้องอัปเดตโค้ดในไฟล์สคริปต์นี้ให้ตรงกับโค้ด UI เวอร์ชันล่าสุดที่แก้ไขแล้ว
> 
> **3. มี Route ฝั่ง Backend ตกค้าง**
> ยังมีฟังก์ชัน `updateTicketHandler` แบบเก่า (ที่มีการเขียนโค้ดเช็ค Role ของผู้ใช้แบบแมนนวล) ค้างอยู่ในไฟล์ `ticket.controller.ts` และ `ticket.routes.ts`
> **สิ่งที่ต้องทำ:** ในเมื่อตอนนี้การอัปเดตข้อมูลของเจ้าหน้าที่ไอที (IT Staff) ย้ายไปใช้เส้นทาง `/api/staff/*` โดยเฉพาะแล้ว ควรลบโค้ดเวอร์ชันเก่านี้ทิ้ง

**Partner's Response (Round 3):**
> แก้ไขเรียบร้อย:
> - เติมฟังก์ชันดึง API (`getStaffTickets`, `addTicketNote` ฯลฯ) ลงใน `api.ts` ครบแล้ว
> - ไฟล์ `rewriteTicketDetail.js` ลบออกจากโปรเจกต์
> - ลบ `updateTicketHandler` และ Route เก่าฝั่ง Backend เรียบร้อย

<br/>

**My Comment (Round 4):**
> ตรวจใหม่อย่างถี่ถ้วนแล้ว ผมพบปัญหาตรงที่ คำสั่งดึงโค้ด files change มาไม่หมดทำให้ไม่เจอไฟล์บางส่วน ต้องขออภัยด้วย

**Partner's Response (Round 4):**
> แก้ไขเรียบร้อย:
> - เพิ่มฟังก์ชัน `getStaffTickets`, `addTicketNote` และเปลี่ยนชื่อเป็น `updateStaffTicket...` ใน `api.ts` 
> - ประกาศฟังก์ชัน `handleUpdateStatus`, `handleUpdatePriority`, `handleClaim` ใน `TicketDetail.tsx` และผูกเข้ากับ API เส้นใหม่
> - ลบ `updateTicketHandler` และ Route เก่าฝั่ง Backend ออกอย่างถาวรเรียบร้อย
---

### Issue 6
**My Comment:**
> 1. **ขาดไฟล์ทดสอบ E2E:** สเปกบังคับให้ต้องผ่านเทสต์ `auth-flow.spec.ts`, `staff-flow.spec.ts`, `admin-flow.spec.ts`, และ `requester-flow.spec.ts` 100% แต่ใน PR มีแค่ไฟล์แคปหน้าจอ `artifact-screenshots.spec.ts` เท่านั้น ไฟล์เทสต์ E2E โฟลว์หลักหายไปทั้งหมด
> 2. **ลืมอัปเดตสถานะใน tests.md:** ลืมเปลี่ยนสถานะในตารางทดสอบจาก Pending เป็น Pass (เขียนมาแค่สรุปสั้นๆ ด้านบน) 
> 3. **ทำระบบเก่าพัง:** การทดสอบ Lab 1 (`tests/lab-01/API-02.test.ts`) รันไม่ผ่าน เพราะไปลบระบบ authMiddleware ตัวเก่าที่ยอมให้ยิง API โดยไม่ต้องมี Token ทิ้ง เพื่อบังคับใช้ JWT อย่างเข้มงวด แต่ดันลืมไปอัปเดตไฟล์เทสต์ Lab 1 ให้แนบ JWT ไปด้วย ทำให้ API คืนค่า 401 Unauthorized แทนที่จะเป็น 200

**Partner's Response:**
> แก้ไขแล้ว