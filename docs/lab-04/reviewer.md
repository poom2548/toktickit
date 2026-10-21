# บันทึกการตรวจทานโค้ด (Peer Code Review Record) - Lab 4

**ผู้พัฒนา (Author):** Saksorn Buranatananun — GitHub: [@poom2548](https://github.com/poom2548)  
**ผู้ตรวจทาน (Peer Reviewer):** Purin Mebotsom — GitHub: [@meebotsompurin-stack](https://github.com/meebotsompurin-stack)  
**คลังข้อมูล (Repository):** [poom2548/toktickit](https://github.com/poom2548/toktickit)  

เอกสารนี้รวบรวมประวัติการตรวจทานโค้ดผ่าน Pull Request บน GitHub สำหรับกระบวนการพัฒนา CPE 334 Lab 4 ตั้งแต่ Issue #1 ถึง Issue #10 โดยดึงข้อมูลจากประวัติของ Git และ GitHub API เพื่อความโปร่งใสและตรวจสอบได้

---

## สรุปภาพรวมการตรวจทานโค้ด (PR Overview Table)

| Issue | ชื่องาน (Issue / PR Title) | กิ่งงาน (Branch) | ลิงก์ Pull Request | ผู้ตรวจทาน (Reviewer) | สถานะการตรวจ (Review Status) | สถานะการรวมโค้ด (Merge Status) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Issue 1 | L4_Issue 1 engineering contract | `feature/issue-1-engineering-contract` | [#61](https://github.com/poom2548/toktickit/pull/61) | @meebotsompurin-stack | APPROVED | Merged (2026-10-04) |
| Issue 2 | L4_Issue 2: Test DD, Baseline Audit, and Red-Test Scaffolding | `feature/issue-2-test-dd` | [#62](https://github.com/poom2548/toktickit/pull/62) | @meebotsompurin-stack | APPROVED | Merged (2026-10-06) |
| Issue 3 | Issue #3: Database Foundation (Migration, Backfill, Rollback, Seed) | `feature/issue-3-lab4-db` | [#63](https://github.com/poom2548/toktickit/pull/63) | @meebotsompurin-stack | APPROVED | Merged (2026-10-07) |
| Issue 4 | Issue #4 – Actions Taken API and authorization | `feature/issue-4-lab4-actions-api` | [#64](https://github.com/poom2548/toktickit/pull/64) | @meebotsompurin-stack | APPROVED | Merged (2026-10-08) |
| Issue 5 | Issue #5 – Ticket workflow API | `feature/issue-5-lab4-workflow-api` | [#65](https://github.com/poom2548/toktickit/pull/65) | @meebotsompurin-stack | APPROVED | Merged (2026-10-11) |
| Issue 6 | Issue #6: Role dashboards API (Requester, IT Staff, Admin) | `feature/issue-6-lab4-dashboards-api` | [#66](https://github.com/poom2548/toktickit/pull/66) | @meebotsompurin-stack | APPROVED | Merged (2026-10-13) |
| Issue 7 | Issue #7 – Ticket Detail UI: Actions Taken และ workflow controls | `feature/issue-7-lab4-ticket-detail-ui` | [#67](https://github.com/poom2548/toktickit/pull/67) | @meebotsompurin-stack | APPROVED | Merged (2026-10-15) |
| Issue 8 | Issue #8: Dashboards UI | `feature/issue-8-lab4-dashboards-ui` | [#68](https://github.com/poom2548/toktickit/pull/68) | @meebotsompurin-stack | APPROVED | Merged (2026-10-17) |
| Issue 9 | Issue #9 – Final hardening | `feature/issue-9-lab4-hardening` | [#69](https://github.com/poom2548/toktickit/pull/69) | @meebotsompurin-stack | APPROVED | Merged (2026-10-19) |
| Issue 10 | [S4-10] Documentation and release preparation | `feature/issue-10-lab4-docs-release` | <<HUMAN TO FILL: PR link after it is opened>> | <<HUMAN TO FILL: reviewer name>> | <<HUMAN TO FILL: approval status>> | <<HUMAN TO FILL: merge status>> |

---

## รายละเอียดการตรวจทานราย Issue (Review Details)

### Issue #1: L4_Issue 1 engineering contract
- **Branch:** `feature/issue-1-engineering-contract`
- **PR Link:** [https://github.com/poom2548/toktickit/pull/61](https://github.com/poom2548/toktickit/pull/61)
- **Author:** @poom2548
- **Reviewer:** @meebotsompurin-stack
- **Merge Status:** Merged into `lab4-staging` on 2026-10-04 by @meebotsompurin-stack

#### ความคิดเห็นจากผู้ตรวจทาน (Reviewer Comments)
> **[APPROVED] @meebotsompurin-stack (2026-10-04):**
> ตรวจแล้วถูกต้องเรียบร้อย
>

### Issue #2: L4_Issue 2: Test DD, Baseline Audit, and Red-Test Scaffolding
- **Branch:** `feature/issue-2-test-dd`
- **PR Link:** [https://github.com/poom2548/toktickit/pull/62](https://github.com/poom2548/toktickit/pull/62)
- **Author:** @poom2548
- **Reviewer:** @meebotsompurin-stack
- **Merge Status:** Merged into `lab4-staging` on 2026-10-06 by @meebotsompurin-stack

#### ความคิดเห็นจากผู้ตรวจทาน (Reviewer Comments)
> **[CHANGES_REQUESTED] @meebotsompurin-stack (2026-10-04):**
> * **Playwright viewport** (360/768/1280px) – ยังไม่พบในโปรเจกต์
> * **Axe accessibility integration** – ยังไม่มีการ setup
> * **Test data factories** – ไฟล์ `helpers.ts` มีอยู่แล้วแต่ยังไม่สมบูรณ์ (ขาดส่วนสร้างข้อมูลทดสอบและ Auth helpers)
>
> **[APPROVED] @meebotsompurin-stack (2026-10-06):**
> ตรวจแล้วครบถ้วน
>
#### การตอบกลับของผู้พัฒนา (Author Responses)
> **@poom2548:**
> > * **Playwright viewport** (360/768/1280px) – ยังไม่พบในโปรเจกต์
> > * **Axe accessibility integration** – ยังไม่มีการ setup
> > * **Test data factories** – ไฟล์ `helpers.ts` มีอยู่แล้วแต่ยังไม่สมบูรณ์ (ขาดส่วนสร้างข้อมูลทดสอบและ Auth helpers)
> 
> แก้ไข: ขาดตัวช่วยจัดการ Viewport ของ Playwright
> 
> สิ่งที่ทำ: สร้างไฟล์ e2e/lab-04/helpers/viewport.ts
> 
> รายละเอียด: เพิ่มออบเจกต์ VIEWPORTS (มือถือ: 360px, แท็บเล็ต: 768px, เดสก์ท็อป: 1280px), ฟังก์ชัน setViewport, และ assertion expectNoHorizontalScroll(page) เพื่อตรวจสอบและดักจับ element ที่ล้นหน้าจอ (overflow)
> 
> แก้ไข: ยังไม่ได้ตั้งค่าการทำงานร่วมกับ Axe Accessibility
> 
> สิ่งที่ทำ: ติดตั้งแพ็กเกจ @axe-core/playwright และสร้างไฟล์ e2e/lab-04/helpers/axe.ts
> 
> รายละเอียด: เพิ่มตัวช่วย expectNoSeriousAxeViolations(page) ซึ่งใช้ AxeBuilder เพื่อบังคับใช้มาตรฐาน WCAG โดยจะกำหนดให้การทดสอบไม่ผ่าน (fail) อย่างเคร่งครัด หากพบการละเมิดในระดับ serious หรือ critical แต่จะบันทึกข้อผิดพลาดระดับ minor เป็นเพียงคำเตือน (warnings) แทน
> 
> แก้ไข: ไฟล์ helpers.ts ไม่สมบูรณ์ (ขาด Data Factories และ Auth)
> 
> สิ่งที่ทำ (ฝั่งเซิร์ฟเวอร์): เขียนทับไฟล์ server/tests/lab-04/helpers.ts เพื่อเพิ่ม data factories แบบสมบูรณ์ (createUser, createTicket, createPublicComment เป็นต้น) มีการเพิ่ม mocks แบบ try/catch สำหรับโมเดลของ Lab 4 ที่กำลังรอการดำเนินการ (ActionTaken, StatusHistory) รวมทั้งสร้างฟังก์ชัน resetTestData() ที่ทำงานได้อย่างปลอดภัย และตัวช่วย loginAs สำหรับ supertest auth
> 
> สิ่งที่ทำ (ฝั่ง E2E): สร้างไฟล์ e2e/lab-04/helpers/auth.ts ซึ่งประกอบด้วยตัวช่วย E2E loginAs(page, role) เพื่อช่วยในการล็อกอินเข้าสู่ระบบ UI แบบอัตโนมัติ โดยใช้บัญชีเดโม่ที่มีอยู่แล้วในระบบ (alice@toktick.dev, frank@toktick.dev, admin@toktick.dev)
>

### Issue #3: Issue #3: Database Foundation (Migration, Backfill, Rollback, Seed)
- **Branch:** `feature/issue-3-lab4-db`
- **PR Link:** [https://github.com/poom2548/toktickit/pull/63](https://github.com/poom2548/toktickit/pull/63)
- **Author:** @poom2548
- **Reviewer:** @meebotsompurin-stack
- **Merge Status:** Merged into `lab4-staging` on 2026-10-07 by @meebotsompurin-stack

#### ความคิดเห็นจากผู้ตรวจทาน (Reviewer Comments)
> **[CHANGES_REQUESTED] @meebotsompurin-stack (2026-10-07):**
> **การเช็ค Path ใน `migration.test.ts` (MIG-01):**
>    ในโค้ดมีการ Hardcode path ของ Windows:
>    `if (fs.existsSync(dumpPath) && fs.existsSync('C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe'))`
>    **ปัญหา:** ถ้าไปรันบนเครื่อง Mac/Linux (หรือ CI/CD) เทสต์นี้จะถูก Skip 
>    **ข้อเสนอแนะ:** ควรแก้ให้รองรับ Cross-platform เช่น ดึงพาร์ทจาก Environment Variable (`process.env.PG_RESTORE_BIN`) หรือเช็คผ่านคำสั่ง `which pg_restore`
>
> **[APPROVED] @meebotsompurin-stack (2026-10-07):**
> ตรวจสอบแล้วถูกต้องเรียบร้อย
>

### Issue #4: Issue #4 – Actions Taken API and authorization
- **Branch:** `feature/issue-4-lab4-actions-api`
- **PR Link:** [https://github.com/poom2548/toktickit/pull/64](https://github.com/poom2548/toktickit/pull/64)
- **Author:** @poom2548
- **Reviewer:** @meebotsompurin-stack
- **Merge Status:** Merged into `lab4-staging` on 2026-10-08 by @meebotsompurin-stack

#### ความคิดเห็นจากผู้ตรวจทาน (Reviewer Comments)
> **[APPROVED] @meebotsompurin-stack (2026-10-08):**
> ตรวจสอบแล้วครบถ้วน
>

### Issue #5: Issue #5 – Ticket workflow API
- **Branch:** `feature/issue-5-lab4-workflow-api`
- **PR Link:** [https://github.com/poom2548/toktickit/pull/65](https://github.com/poom2548/toktickit/pull/65)
- **Author:** @poom2548
- **Reviewer:** @meebotsompurin-stack
- **Merge Status:** Merged into `lab4-staging` on 2026-10-11 by @meebotsompurin-stack

#### ความคิดเห็นจากผู้ตรวจทาน (Reviewer Comments)
> **[CHANGES_REQUESTED] @meebotsompurin-stack (2026-10-10):**
> #### 1. การตรวจสอบสิทธิ์หละหลวม (AC-5, AC-11)
> - `GET /api/tickets/:id/allowed-transitions` และ `POST /api/tickets/:id/status` ไม่มี ownership/role gating ที่ชัดเจน
> - **ปัญหา:** Requester สามารถดูข้อมูล Transition ของตั๋วคนอื่นได้
> 
> #### 2. ตรรกะ Appears-Resolved ไม่สมบูรณ์ (AC-6)
> - `problemAppearsResolved` ยังไม่ได้ใช้งานใน Business logic จริง
> - ขาดระบบป้องกันการส่งค่าซ้ำ (Idempotency) และการจัดการ Error/Response ที่ชัดเจนเมื่อผิดเงื่อนไข
> 
> #### 3. ข้อมูลรั่วไหล (AC-11)
> - Response จากบาง endpoint มีข้อมูล staff-only หรือ internal fields หลุดไปถึง Requester
> - **วิธีแก้:** ต้อง Sanitize payload ก่อน return เสมอ
> 
> #### 4. ระบบ Versioning ไม่เข้มงวด (AC-8, AC-9)
> - มีช่องโหว่ (Legacy) ที่ยอมให้อัปเดตได้โดยไม่ต้องส่ง `version` ทำให้เสี่ยงต่อการถูกเซฟทับ (Stale-write)
> - **วิธีแก้:** บังคับเช็ค `version` และคืนค่า `409 Conflict` ในทุก Endpoint ของ Lab 4
> 
> #### 5. การทดสอบ Matrix ไม่ครอบคลุม (AC-1, AC-2, AC-12)
> - มี Matrix เดี่ยว แต่ไม่มี Test ยืนยันว่าทำงานถูกต้องครบทั้ง 8 สถานะและทุก Role
> - **วิธีแก้:** เพิ่ม Test ให้ครอบคลุมทุก From/To/Role
>
> **[APPROVED] @meebotsompurin-stack (2026-10-11):**
> ตรวจสอบแล้วแก้ไขครบถ้วน
>
#### การตอบกลับของผู้พัฒนา (Author Responses)
> **@poom2548:**
> > #### 1. การตรวจสอบสิทธิ์หละหลวม (AC-5, AC-11)
> > * `GET /api/tickets/:id/allowed-transitions` และ `POST /api/tickets/:id/status` ไม่มี ownership/role gating ที่ชัดเจน
> > * **ปัญหา:** Requester สามารถดูข้อมูล Transition ของตั๋วคนอื่นได้
> > 
> > #### 2. ตรรกะ Appears-Resolved ไม่สมบูรณ์ (AC-6)
> > * `problemAppearsResolved` ยังไม่ได้ใช้งานใน Business logic จริง
> > * ขาดระบบป้องกันการส่งค่าซ้ำ (Idempotency) และการจัดการ Error/Response ที่ชัดเจนเมื่อผิดเงื่อนไข
> > 
> > #### 3. ข้อมูลรั่วไหล (AC-11)
> > * Response จากบาง endpoint มีข้อมูล staff-only หรือ internal fields หลุดไปถึง Requester
> > * **วิธีแก้:** ต้อง Sanitize payload ก่อน return เสมอ
> > 
> > #### 4. ระบบ Versioning ไม่เข้มงวด (AC-8, AC-9)
> > * มีช่องโหว่ (Legacy) ที่ยอมให้อัปเดตได้โดยไม่ต้องส่ง `version` ทำให้เสี่ยงต่อการถูกเซฟทับ (Stale-write)
> > * **วิธีแก้:** บังคับเช็ค `version` และคืนค่า `409 Conflict` ในทุก Endpoint ของ Lab 4
> > 
> > #### 5. การทดสอบ Matrix ไม่ครอบคลุม (AC-1, AC-2, AC-12)
> > * มี Matrix เดี่ยว แต่ไม่มี Test ยืนยันว่าทำงานถูกต้องครบทั้ง 8 สถานะและทุก Role
> > * **วิธีแก้:** เพิ่ม Test ให้ครอบคลุมทุก From/To/Role
> 
> แก้แล้ว
> สิ่งที่เปลี่ยนแปลงหลังจากการรีวิว
> 
> 1.การตรวจสอบความเป็นเจ้าของและบทบาท: ลำดับการทำงานตอนนี้คือ authenticate, โหลด ticket, authorize, แล้วค่อย validate สำหรับ Requester ที่ไม่ได้เป็นเจ้าของ ticket จะได้รับ error 403 แบบทั่วไปโดยไม่มีข้อมูล ticket ใดๆ ติดไป
> 2.“Appears resolved”: อนุญาตให้ใช้เฉพาะ Requester ที่เป็นเจ้าของในขณะที่ตั๋วเปิดอยู่ (open statuses) การส่งค่า true ซ้ำจะคง timestamp อันแรกไว้และไม่มีการเขียนทับอะไรเพิ่ม การเปลี่ยนสถานะใดๆ จะเป็นการล้างค่านี้ และมันรองรับการใช้ Idempotency-Key
> 3.ข้อมูลรั่วไหล (Data leaks): การตอบกลับใหม่จะใช้ serializers ที่เลือกฟิลด์อย่างชัดเจน (explicit field-picking) และเทสต์มีการล็อกชุดคีย์ (key sets) เอาไว้ การตอบกลับรายละเอียดของ Lab 3 ที่มีอยู่เดิมได้รับการตรวจสอบ (audited) แล้ว พร้อมการรายงานผลหากพบว่ามันมีการเปิดเผยข้อมูลอะไรออกไป
> 4.Version: ทุก endpoint ของ Lab 4 บังคับใช้ version โดย legacy routes ของ Lab 3 ทั้งสองเส้นทางจะคงช่วงเวลาผ่อนผันไว้ชั่วคราว (รายละเอียดด้านล่าง)
> 5.Matrix tests: ตอนนี้ครอบคลุมคู่สถานะแบบ 8×8 ทั้งหมดสำหรับผู้ดำเนินการ (actors) ทั้ง 4 ซึ่งน่าจะเป็น 256 กรณี บวกกับอีก 32 กรณีสำหรับ allowed-transitions ตัว oracle เป็นสเปกที่ถูกคัดลอกแยกออกมาต่างหาก
> 6.การซ่อมแซมไฟล์: ไฟล์ที่เสียหายได้รับการกู้คืนเรียบร้อยแล้ว และ branch ก็ได้รับการกู้คืนหลังจากเกิดการ reset โดยไม่ได้ตั้งใจ
> 
> หมายเหตุ อ่านก่อนตรวจอีกครั้ง
> 
> 1.ช่วงเวลาผ่อนผันสำหรับ version (Temporary version window): PATCH /staff/tickets/:id/owner และ /status ยังคงยอมรับกรณีที่ไม่มีการส่ง version เข้ามา เนื่องจาก client และเทสต์ของ Lab 3 ไม่ได้ส่งค่านี้ หากมีการส่ง version มา ระบบจะบังคับใช้อย่างเคร่งครัดเสมอ สิ่งนี้ถูกบันทึกไว้ในเอกสาร BR-15 และผ่านการทดสอบโดยเทสต์ WF-05 แล้ว ช่องโหว่นี้จะถูกปิดใน Issue #7 (UI ใหม่จะส่งค่ามาเสมอ) และ Issue #9 (legacy routes จะถูกบังคับใช้)
> 
> 2.CLOSED เป็นสถานะสิ้นสุด (terminal) เหมือนเช่นใน Lab 3
> 
> 3.การแก้ไขเทสต์ของ Lab 3 ทำแค่ส่วน setup เท่านั้น: เทสต์ส่วนการ resolve ตอนนี้จะสร้าง ticket ที่มี owner และ Action ให้เลย เนื่องจาก gate ถูกนำไปบังคับใช้กับ route เดิมด้วย ไม่มีการเปลี่ยนแปลงโค้ดส่วนตรวจสอบความถูกต้อง (assertion) หรือชื่อของเทสต์
> 
> 4.รูปแบบ error ที่ปะปนกันยังคงอยู่บน legacy routes: ใน Issue #9 จะเข้ามาจัดการให้เป็นระเบียบ
>

### Issue #6: Issue #6: Role dashboards API (Requester, IT Staff, Admin)
- **Branch:** `feature/issue-6-lab4-dashboards-api`
- **PR Link:** [https://github.com/poom2548/toktickit/pull/66](https://github.com/poom2548/toktickit/pull/66)
- **Author:** @poom2548
- **Reviewer:** @meebotsompurin-stack
- **Merge Status:** Merged into `lab4-staging` on 2026-10-13 by @meebotsompurin-stack

#### ความคิดเห็นจากผู้ตรวจทาน (Reviewer Comments)
> **[CHANGES_REQUESTED] @meebotsompurin-stack (2026-10-12):**
> **1. Test Oracle Independence (ห้ามนำ Production Code มาอ้างอิงใน Test)**
> - **ปัญหา:** ในไฟล์ `server/tests/lab-04/helpers.ts` มีการ `export dashboardService` ออกมาให้ Test ใช้งาน และใน `staff-dashboard.api.test.ts` มีการใช้ `vi.spyOn(dashboardService, ...)` เพื่อจำลอง Error 
> - **ทำไมถึงต้องแก้:** ตามกฎของการเขียน Test ที่ดี (Oracle Independence) ชุดทดสอบต้องคำนวณและคาดเดาผลลัพธ์ด้วยตัวเอง ไม่ควรดึง Logic ของ Production มาใช้งานหรือ Mock ตรงๆ
> - **วิธีแก้ที่แนะนำ:** 
>   - ลบ `export dashboardService` ออกจาก `helpers.ts`
>   - ลบ `vi.spyOn(dashboardService, ...)` ออก
>   - ถ้าต้องการเทสต์เคส 500 Error ให้เปลี่ยนไป Mock ที่ชั้น Database แทน (เช่น `vi.spyOn(getPrisma().ticket, 'findMany').mockRejectedValue(...)`)
> 
> **2. `Cache-Control` สำหรับเคส 405 Method Not Allowed**
> - **ปัญหา:** ในไฟล์ `server/src/dashboard/dashboard.routes.ts` จังหวะที่มีการดัก `.all(...)` เพื่อพ่น 405 Error ยังไม่มีการแนบ Header `Cache-Control: no-store` ตามที่ Spec กำหนด
> - **วิธีแก้ที่แนะนำ:** เพิ่ม `res.setHeader('Cache-Control', 'no-store');` เข้าไปก่อนส่ง `res.status(405)...` ในทั้งเส้น `/requester` และ `/staff`
>
> **[APPROVED] @meebotsompurin-stack (2026-10-13):**
> ตรวจแล้วครบถ้วน
>
#### การตอบกลับของผู้พัฒนา (Author Responses)
> **@poom2548:**
> > **1. Test Oracle Independence (ห้ามนำ Production Code มาอ้างอิงใน Test)**
> > 
> > * **ปัญหา:** ในไฟล์ `server/tests/lab-04/helpers.ts` มีการ `export dashboardService` ออกมาให้ Test ใช้งาน และใน `staff-dashboard.api.test.ts` มีการใช้ `vi.spyOn(dashboardService, ...)` เพื่อจำลอง Error
> > * **ทำไมถึงต้องแก้:** ตามกฎของการเขียน Test ที่ดี (Oracle Independence) ชุดทดสอบต้องคำนวณและคาดเดาผลลัพธ์ด้วยตัวเอง ไม่ควรดึง Logic ของ Production มาใช้งานหรือ Mock ตรงๆ
> > * **วิธีแก้ที่แนะนำ:**
> >   
> >   * ลบ `export dashboardService` ออกจาก `helpers.ts`
> >   * ลบ `vi.spyOn(dashboardService, ...)` ออก
> >   * ถ้าต้องการเทสต์เคส 500 Error ให้เปลี่ยนไป Mock ที่ชั้น Database แทน (เช่น `vi.spyOn(getPrisma().ticket, 'findMany').mockRejectedValue(...)`)
> > 
> > **2. `Cache-Control` สำหรับเคส 405 Method Not Allowed**
> > 
> > * **ปัญหา:** ในไฟล์ `server/src/dashboard/dashboard.routes.ts` จังหวะที่มีการดัก `.all(...)` เพื่อพ่น 405 Error ยังไม่มีการแนบ Header `Cache-Control: no-store` ตามที่ Spec กำหนด
> > * **วิธีแก้ที่แนะนำ:** เพิ่ม `res.setHeader('Cache-Control', 'no-store');` เข้าไปก่อนส่ง `res.status(405)...` ในทั้งเส้น `/requester` และ `/staff`
> 
> แก้ไขแล้ว
> สรุปการแก้ไข 
> 
> 1. กำจัดการอิมพอร์ตโค้ด Production จากชั้น Test (ปัญหาข้อที่ 1)
> - นำการ export `dashboardService` ออกจาก `helpers.ts`
> - แทนที่ `vi.spyOn(dashboardService, ...)` ใน SD-03 ด้วยการม็อค Prisma ระดับฐานข้อมูล (`findMany`, `count`, `groupBy` บน `getPrisma()`)
> - ติดตั้งการกู้คืน (restoration) แบบ proxy-safe ใน `try/finally` และ `afterEach` เพื่อป้องกันปัญหา Vitest descriptor เสียหาย (`prisma.ticket.count is not a function`)
> - ยืนยันว่าเมื่อบังคับให้เกิด error 500 รูปแบบของ error จะไม่มีการรั่วไหลของ stack traces, SQL, path ของไฟล์, หรือข้อความ error ภายในระบบเลย
> 
> 2. เพิ่ม Cache-Control: no-store ในระดับ Router (ปัญหาข้อที่ 2)
> - เพิ่ม middleware ที่ root ของ `dashboard.routes.ts` เพื่อให้การตอบกลับของแดชบอร์ดทุกครั้ง (200, 401, 403, 405, 500) มี `Cache-Control: no-store` รวมอยู่ด้วย
> - อัปเดต `api-spec.md` และ `tests.md` พร้อมเพิ่มโน้ตเป็นภาษาไทย
> - ตรวจสอบยืนยันว่ามี `Cache-Control: no-store` ในทุก status codes ในเทสต์ AUTHZ-06 และ SD-03
> 
> 3. ป้องกันความไม่เสถียร (Flakiness) ในการตรวจสอบของ Parallel Suite
> - ปรับความยืดหยุ่นให้การตรวจสอบจำนวน ticket รวมในเทสต์ SD-01/SD-02 ด้วย `Math.min`/`Math.max` (±2) เพื่อรองรับการเพิ่ม/ลบข้อมูลในฐานข้อมูลของ worker ที่ทำงานพร้อมกันระหว่างการรันเทสต์แบบ parallel ได้อย่างปลอดภัย
> 
> 4. ทำความสะอาด Prompt Label และการเข้ารหัสไฟล์ (Encoding Sanitization)
> - ลบป้ายกำกับ prompt ภายในและตัวระบุขั้นตอนทั้งหมด (Part <N>, Step <N>, Option B) ออกจากคอมเมนต์และตัวแปร
> - ยืนยันความถูกต้องของการเข้ารหัส UTF-8 CRLF ในทุกไฟล์ผ่าน `encscan.js`
> - ยืนยันการรันชุดทดสอบ Lab 4 แบบเต็มผ่าน 3 ครั้งติดต่อกัน (ผ่าน 369/369, ไม่มีการรั่วไหลของข้อมูลใน DB: Users=82, Tickets=300)
> - สถานะ local git บน branch `feature/issue-6-lab4-dashboards-api` สะอาดเรียบร้อย; ไม่มีการ push และไม่มีการ merge ใดๆ เกิดขึ้น
>

### Issue #7: Issue #7 – Ticket Detail UI: Actions Taken และ workflow controls
- **Branch:** `feature/issue-7-lab4-ticket-detail-ui`
- **PR Link:** [https://github.com/poom2548/toktickit/pull/67](https://github.com/poom2548/toktickit/pull/67)
- **Author:** @poom2548
- **Reviewer:** @meebotsompurin-stack
- **Merge Status:** Merged into `lab4-staging` on 2026-10-15 by @meebotsompurin-stack

#### ความคิดเห็นจากผู้ตรวจทาน (Reviewer Comments)
> **[CHANGES_REQUESTED] @meebotsompurin-stack (2026-10-15):**
> **1. [AC-03, AC-05] ความยาวสูงสุดของ `followUpNote` และ `attachmentNotes` ไม่ตรงสเปก**
> - **ปัญหา:** ในไฟล์ `client/src/components/actions/ActionsTakenSection.tsx` (ทั้งใน `handleFollowUpNoteChange` และตอน validate ใน `handleSubmit`) ตั้งค่าจำกัดความยาวไว้ที่ `> 2000` ตัวอักษร
> - **ตามสเปก:** กำหนดความยาวสูงสุดไว้ที่ 2000 / 2000 / **1000 / 1000** (Description 2000, Result 2000, Follow-up 1000, Attachment 1000)
> - **วิธีแก้:** เปลี่ยนตัวเลขเช็คความยาวของ `followUpNote` และ `attachmentNotes` จาก `2000` เป็น `1000` ทั้งตอนพิมพ์และตอนกด Submit พร้อมอัปเดตข้อความแจ้งเตือน
> 
> **2. [AC-11] `aria-label` ของปุ่ม "แก้ไข" ในแต่ละแถวยังไม่มีวันที่/เวลา**
> - **ปัญหา:** ในไฟล์ `client/src/components/actions/ActionsTakenSection.tsx` ปุ่มแก้ไขตั้งค่าไว้แค่ `aria-label={`แก้ไข ${act.description}`}`
> - **ตามสเปก:** ต้องระบุวันที่และเวลาลงใน `aria-label` ด้วยเพื่อให้ Screen Reader แยกแยะแถวได้
> - **วิธีแก้:** นำฟังก์ชันแปลงเวลามาใส่ร่วมด้วย เช่น:
>   `aria-label={`แก้ไข ${formatBangkokDateTime(act.actionAt)} -${act.description}`}`
> 
> **3. [AC-18] การส่งซ้ำ (Retry) ยังไม่ได้ใช้ `Idempotency-Key` ตัวเดิม**
> - **ปัญหา:** ใน `ActionsTakenSection.tsx` (จังหวะ Create ใน `handleSubmit`) มีการเรียก `generateIdempotencyKey()` ใหม่ทุกครั้งที่กดส่ง ทำให้ถ้าเกิด Error (เช่น เน็ตหลุดหรือ 500) แล้วผู้ใช้กดส่งซ้ำด้วยข้อมูลเดิม ระบบจะเจนคีย์ใหม่แทนที่จะใช้คีย์เดิม
> - **วิธีแก้:** เก็บ `idempotencyKey` ไว้ใน State หรือ `useRef` ตั้งแต่เปิดฟอร์ม/เริ่มส่ง และนำคีย์เดิมกลับมาใช้ซ้ำหากส่งใหม่ด้วย Payload เดิม (และล้างค่า/สร้างใหม่เมื่อบันทึกสำเร็จหรือเมื่อผู้ใช้แก้ข้อความในฟอร์ม) พร้อมเพิ่ม Unit Test เช็คหัวข้อนี้ 1 ข้อ
> 
> **4. [Error Sanitization] ป้องกันการหลุดข้อความดิบจากเซิร์ฟเวอร์ใน `parseApiError`**
> - **ปัญหา:** ในไฟล์ `client/src/api/errors.ts` กรณีที่ `body.error` เป็น String ธรรมดาและไม่ตรงกับเงื่อนไขคำค้นที่ดักไว้ โค้ดจะตกลงไปที่ `else { message = rawError }` ซึ่งเสี่ยงต่อการเอาข้อความดิบจากเซิร์ฟเวอร์มาโชว์บนหน้าเว็บ
> - **วิธีแก้:** เปลี่ยน Fallback สุดท้ายให้คืนค่าเป็นข้อความปลอดภัยทั่วไปแทน (เช่น `'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง'`) แล้วเก็บ `rawError` ไว้แสดงเฉพาะใน `console.debug`
>
> **[APPROVED] @meebotsompurin-stack (2026-10-15):**
> ตรวจแล้วครบถ้วน
>
#### การตอบกลับของผู้พัฒนา (Author Responses)
> **@poom2548:**
> > **1. [AC-03, AC-05] ความยาวสูงสุดของ `followUpNote` และ `attachmentNotes` ไม่ตรงสเปก**
> > 
> > * **ปัญหา:** ในไฟล์ `client/src/components/actions/ActionsTakenSection.tsx` (ทั้งใน `handleFollowUpNoteChange` และตอน validate ใน `handleSubmit`) ตั้งค่าจำกัดความยาวไว้ที่ `> 2000` ตัวอักษร
> > * **ตามสเปก:** กำหนดความยาวสูงสุดไว้ที่ 2000 / 2000 / **1000 / 1000** (Description 2000, Result 2000, Follow-up 1000, Attachment 1000)
> > * **วิธีแก้:** เปลี่ยนตัวเลขเช็คความยาวของ `followUpNote` และ `attachmentNotes` จาก `2000` เป็น `1000` ทั้งตอนพิมพ์และตอนกด Submit พร้อมอัปเดตข้อความแจ้งเตือน
> > 
> > **2. [AC-11] `aria-label` ของปุ่ม "แก้ไข" ในแต่ละแถวยังไม่มีวันที่/เวลา**
> > 
> > * **ปัญหา:** ในไฟล์ `client/src/components/actions/ActionsTakenSection.tsx` ปุ่มแก้ไขตั้งค่าไว้แค่ `aria-label={`แก้ไข ${act.description}`}`
> > * **ตามสเปก:** ต้องระบุวันที่และเวลาลงใน `aria-label` ด้วยเพื่อให้ Screen Reader แยกแยะแถวได้
> > * **วิธีแก้:** นำฟังก์ชันแปลงเวลามาใส่ร่วมด้วย เช่น:
> >   `aria-label={`แก้ไข ${formatBangkokDateTime(act.actionAt)} -${act.description}`}`
> > 
> > **3. [AC-18] การส่งซ้ำ (Retry) ยังไม่ได้ใช้ `Idempotency-Key` ตัวเดิม**
> > 
> > * **ปัญหา:** ใน `ActionsTakenSection.tsx` (จังหวะ Create ใน `handleSubmit`) มีการเรียก `generateIdempotencyKey()` ใหม่ทุกครั้งที่กดส่ง ทำให้ถ้าเกิด Error (เช่น เน็ตหลุดหรือ 500) แล้วผู้ใช้กดส่งซ้ำด้วยข้อมูลเดิม ระบบจะเจนคีย์ใหม่แทนที่จะใช้คีย์เดิม
> > * **วิธีแก้:** เก็บ `idempotencyKey` ไว้ใน State หรือ `useRef` ตั้งแต่เปิดฟอร์ม/เริ่มส่ง และนำคีย์เดิมกลับมาใช้ซ้ำหากส่งใหม่ด้วย Payload เดิม (และล้างค่า/สร้างใหม่เมื่อบันทึกสำเร็จหรือเมื่อผู้ใช้แก้ข้อความในฟอร์ม) พร้อมเพิ่ม Unit Test เช็คหัวข้อนี้ 1 ข้อ
> > 
> > **4. [Error Sanitization] ป้องกันการหลุดข้อความดิบจากเซิร์ฟเวอร์ใน `parseApiError`**
> > 
> > * **ปัญหา:** ในไฟล์ `client/src/api/errors.ts` กรณีที่ `body.error` เป็น String ธรรมดาและไม่ตรงกับเงื่อนไขคำค้นที่ดักไว้ โค้ดจะตกลงไปที่ `else { message = rawError }` ซึ่งเสี่ยงต่อการเอาข้อความดิบจากเซิร์ฟเวอร์มาโชว์บนหน้าเว็บ
> > * **วิธีแก้:** เปลี่ยน Fallback สุดท้ายให้คืนค่าเป็นข้อความปลอดภัยทั่วไปแทน (เช่น `'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง'`) แล้วเก็บ `rawError` ไว้แสดงเฉพาะใน `console.debug`
> 
> สรุปการแก้ไข
> 1.ขีดจำกัดความยาวฟิลด์ (Length Limits)
> 
> แยกค่าคงที่และ validation ไว้ที่ actionLimits.ts:
> -description สูงสุด 2,000 ตัวอักษร
> -result สูงสุด 2,000 ตัวอักษร
> -followUpNote สูงสุด 1,000 ตัวอักษร
> -attachmentNotes สูงสุด 1,000 ตัวอักษร
> ตรวจสอบทั้งฟอร์มสร้างและแก้ไขแบบ inline พร้อม trim ช่องว่างหัวท้ายก่อนส่ง
> 
> 2.Accessible Name ของปุ่ม "แก้ไข" (A11y)
> 
> -ปรับ aria-label ของปุ่มแก้ไข Action ใน ActionsTakenSection.tsx ให้ระบุวันเวลาตามโซน Asia/Bangkok พร้อมตัดคำอธิบายไม่เกิน 40 ตัวอักษร: แก้ไข Action เมื่อ {dd/mm/yyyy hh:mm} - {description...}
> 
> 3.การใช้ Idempotency-Key ซ้ำเมื่อ Retry
> 
> ทั้งการบันทึก Action และการเปลี่ยนสถานะตั๋ว:
> -ใช้คีย์เดิม เมื่อกดลองใหม่ (retry) ด้วยข้อมูลเดิมหลังเกิด Network Error หรือ HTTP 500
> -สร้างคีย์ใหม่ เมื่อผู้ใช้แก้ไขข้อมูลในฟอร์ม หรือหลังทำรายการสำเร็จ (200/201)
> -ล้างคีย์ทิ้ง เมื่อยกเลิก, เกิด 409 Conflict, หรือเกิด 422 IDEMPOTENCY_KEY_REUSED
> 
> 4.ข้อความผิดพลาดปลอดภัย (Safe Error Display)
> 
> -ปรับ errors.ts ให้แสดงเฉพาะข้อความภาษาไทยที่แมปตาม HTTP Status Code และ Error Code เท่านั้น ไม่แสดงข้อความดิบ (raw server text) หรือ stack trace หลุดไปที่ UI
> -กรองและจำกัดความยาวของ reason ไม่เกิน 300 ตัวอักษร
> -ลบการเรียก console.* ทั้งหมดในโค้ดใหม่
>

### Issue #8: Issue #8: Dashboards UI
- **Branch:** `feature/issue-8-lab4-dashboards-ui`
- **PR Link:** [https://github.com/poom2548/toktickit/pull/68](https://github.com/poom2548/toktickit/pull/68)
- **Author:** @poom2548
- **Reviewer:** @meebotsompurin-stack
- **Merge Status:** Merged into `lab4-staging` on 2026-10-17 by @meebotsompurin-stack

#### ความคิดเห็นจากผู้ตรวจทาน (Reviewer Comments)
> **[APPROVED] @meebotsompurin-stack (2026-10-17):**
> ตรวจสอบแล้วครบถ้วน
>

### Issue #9: Issue #9 – Final hardening
- **Branch:** `feature/issue-9-lab4-hardening`
- **PR Link:** [https://github.com/poom2548/toktickit/pull/69](https://github.com/poom2548/toktickit/pull/69)
- **Author:** @poom2548
- **Reviewer:** @meebotsompurin-stack
- **Merge Status:** Merged into `lab4-staging` on 2026-10-19 by @meebotsompurin-stack

#### ความคิดเห็นจากผู้ตรวจทาน (Reviewer Comments)
> **[APPROVED] @meebotsompurin-stack (2026-10-19):**
> ตรวจสอบแล้วเรียบร้อยครบถ้วน
>

### Issue #10: [S4-10] Documentation and release preparation
- **Branch:** `feature/issue-10-lab4-docs-release`
- **PR Link:** <<HUMAN TO FILL: PR link after it is opened, e.g. https://github.com/poom2548/toktickit/pull/70>>
- **Author:** @poom2548
- **Reviewer:** <<HUMAN TO FILL: reviewer name, e.g. @meebotsompurin-stack>>
- **Approval Status:** <<HUMAN TO FILL: approval status, e.g. APPROVED>>
- **Merge Status:** <<HUMAN TO FILL: merge status after PR is merged into lab4-staging>>

#### ความคิดเห็นจากผู้ตรวจทาน (Reviewer Comments)
> <<HUMAN TO FILL: comments and responses from the PR page>>

#### การตอบกลับของผู้พัฒนา (Author Responses)
> <<HUMAN TO FILL: author responses if changes requested>>

---

## วิธีเติมข้อมูล (How to Complete Missing Information)

สำหรับข้อมูลของ Issue #10 ที่ยังเป็น Placeholder (`<<HUMAN TO FILL: ...>>`) นักศึกษาจะต้องเติมข้อมูลให้สมบูรณ์หลังจากดำเนินกระบวนการ Pull Request บน GitHub ดังนี้:
1. **เมื่อเปิด Pull Request สำหรับ Issue #10:**
   - คัดลอก URL ของ PR (เช่น `https://github.com/poom2548/toktickit/pull/70`) มาวางแทนที่ `<<HUMAN TO FILL: PR link...>>` ในตารางและหัวข้อย่อย
2. **เมื่อ Reviewer ตรวจทานและให้ความเห็น:**
   - ระบุชื่อ GitHub handle ของ Reviewer (เช่น `@meebotsompurin-stack`)
   - คัดลอกข้อความ Review Comment จากแท็บ *Conversation* หรือ *Files changed* บนหน้า PR มาวางในส่วน Reviewer Comments
   - หากมีการขอให้แก้ไข (Changes Requested) ให้บันทึกการตอบกลับใน Author Responses
3. **เมื่อได้รับการอนุมัติและรวมโค้ด (Approved & Merged):**
   - อัปเดตสถานะเป็น `APPROVED`
   - ระบุวันที่และผู้ที่ทำการกดปุ่ม Merge เข้าสู่ `lab4-staging`
