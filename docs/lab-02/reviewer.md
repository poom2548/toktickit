# Lab 2 Reviewer Feedback

**Author:** <your Saksorn Buranatananun> — <student 67070507208> — GitHub: @<poom2548>
**Peer reviewer:** <partner Purin Mebotsom> — <student 67070507214> — GitHub: @<meebotsompurin-stack>

## Pull Requests I authored (reviewed by my partner)

| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| #1 | feature/lab2-specifications | Changes requested -> Approved |
| #2 | feature/requester-context | Changes requested -> Approved |
| #3 | feature/3-create-ticket | Changes requested -> Approved |
| #4 | feature/4-my-tickets | Changes requested -> Approved |
| #5 | feature/5-ticket-detail | Changes requested -> Approved |
| #6 | feature/6 | Changes requested -> Approved |

### Reviewer comments I received & How I responded

### PR Links
#### Issue 1
https://github.com/poom2548/toktickit/pull/19
#### Issue 2
https://github.com/poom2548/toktickit/pull/20
#### Issue 3
https://github.com/poom2548/toktickit/pull/21
#### Issue 4
https://github.com/poom2548/toktickit/pull/22
#### Issue 5
https://github.com/poom2548/toktickit/pull/23
#### Issue 6
https://github.com/poom2548/toktickit/pull/25
#### Lab2-staging 
https://github.com/poom2548/toktickit/pull/26

#### Issue 1: Sprint specification and test plan
* **Reviewer comment received:**
  > "จุดที่เสนอแนะให้ปรับปรุง (Suggestions):

1. ไฟล์ specification.md (Business Rules & Scope)

    ฟิลด์บังคับกรอก (Required Fields): ตอนนี้มีแค่ Summary กับ Description ควรระบุให้ชัดเจนว่าฟิลด์อื่นๆ เช่น Category, Requested Priority, Related System บังคับกรอกด้วยหรือไม่ และควรกำหนดความยาวสูงสุด (Max length) ของ Summary/Description ด้วย

    สถานะและความเร่งด่วน (Enum Values): ควรเพิ่มรายละเอียดว่าระบบรองรับ Status และ Priority อะไรบ้าง (เช่น Low, Medium, High หรือ New, Open, Resolved)

    การลบไฟล์ (Soft-removal): ควรเพิ่มนโยบายว่าไฟล์ที่ถูก Soft-remove จะเก็บไว้นานแค่ไหน ใครสามารถกู้คืนหรือลบถาวรได้บ้าง และระบบจะเก็บ Metadata อะไรไว้บ้าง (เช่น ใครเป็นคนลบ ลบเมื่อไหร่)

2. ไฟล์ api-spec.md (API Contract)

    รูปแบบ Error Response: ควรเพิ่มตัวอย่าง Schema ของ Error Response (เช่น กรณี 400 Bad Request) ว่าจะส่งกลับมาในรูปแบบไหน โดยเฉพาะ Error แบบรายฟิลด์ (Field-level errors)

    การแบ่งหน้า (Pagination): ควรระบุรายละเอียดให้ชัดเจนขึ้น เช่น ค่า Default ของ Page/Limit คือเท่าไหร่ และรูปแบบ Response จะส่งข้อมูลรวม (Total) หรือ Link สำหรับหน้าถัดไปมาอย่างไร

    ความปลอดภัยของไฟล์แนบ: ควรเพิ่มข้อกำหนดเรื่องการตรวจประเภทไฟล์ (MIME type) และระบุว่า requesterId จะถูกส่งผ่านทางไหน (Header หรือ Query Param) เพื่อป้องกันการสวมรอย

3. ไฟล์ ui-spec.md (UI Theme & Responsive)

    การรองรับการเข้าถึง (Accessibility - a11y): ควรเพิ่มข้อกำหนดเรื่อง Contrast ของสีให้อ่านง่าย, การแสดงผลเมื่อใช้ Keyboard (Focus states), และการรองรับ Screen Reader

    รายละเอียด Typography และ Component: ควรระบุขนาดฟอนต์ (Font size), การเว้นช่องว่าง (Spacing), และพฤติกรรมบนจอมือถือให้ชัดเจนขึ้น เช่น ถ้าชื่อไฟล์แนบยาวเกินไปจะแสดงผลอย่างไร หรือตอนไหนที่ตาราง (Table) จะเปลี่ยนเป็นแบบการ์ด (Card)

4. ไฟล์ tests.md (Test Plan)

    การทดสอบไฟล์แนบ (File Upload): ควรเพิ่ม Test Case สำหรับกรณี Error เช่น อัปโหลดไฟล์ผิดประเภท, ไฟล์ใหญ่เกิน 5MB, หรืออัปโหลดเกิน 5 ไฟล์

    การทดสอบ Error และความปลอดภัย: ควรเพิ่มการทดสอบว่าระบบส่ง Error Response กลับมาถูกต้องไหม, การทดสอบ Pagination ในเคสแปลกๆ, และการทดสอบระบบความปลอดภัย (เช่น พยายามปลอมแปลง requesterId)

    การทดสอบ Accessibility และ UI: ควรพิจารณาเพิ่ม Test Case สำหรับ Accessibility, E2E Test สำหรับหน้าจอมือถือ และ Visual Regression (การตรวจจับความผิดเพี้ยนของ UI)"

* **How I responded:**
  1. อัปเดตเอกสารโดยระบุชัดเจนว่า Category, Priority, System เป็นฟิลด์บังคับ (Required), กำหนด Max Length ให้ Summary/Description, เพิ่มค่า Enum ชัดเจน (เช่น Low, Medium, High) และเพิ่มเงื่อนไขว่าไฟล์ที่ถูก Soft-remove จะต้องเก็บ Metadata ไว้ด้วย
  2. เพิ่ม Schema ของ Error Response สำหรับดัก Error ทีละฟิลด์, ระบุค่า Default ของ Page/Limit สำหรับทำ Pagination, และเพิ่มข้อบังคับให้ Backend ตรวจสอบ MIME Type รวมถึงระบุวิธีรับส่ง requesterId อย่างปลอดภัย
  3. อัปเดตข้อกำหนดเรื่องสี (Contrast) และ Focus State สำหรับคนใช้ Keyboard, เพิ่มกฎการตัดคำ (Truncate) ถ้าชื่อไฟล์ยาวเกินไป และกำหนดให้ Table เปลี่ยนรูปแบบเป็น Card เมื่อแสดงผลบนจอมือถือ
  4. เพิ่มแผนการทดสอบ (Test Cases) ครอบคลุมเคส Error ในการอัปโหลดไฟล์, ทดสอบ Pagination เชิงลึก, เพิ่มเคสป้องกันการปลอมแปลง requesterId และเพิ่มการทำ E2E Test สำหรับ Mobile Viewports

#### Issue 2: Development requester context
* **Reviewer comment received:**
  > "จุดที่ต้องแก้ไขก่อน Merge (Action Required)

    ไฟล์ client/src/api.ts (Frontend Header): ปัจจุบันหน้าบ้านยังไม่ได้ส่ง Header รบกวนเขียน Helper ดึงค่าจาก localStorage (toktickit_requester) มาใส่เป็น Header X-Requester-Id สำหรับทุก API ที่มี Auth ป้องกันไว้ด้วยครับ (มิฉะนั้นฟีเจอร์ต่อไปจะยิง API ไม่ผ่านและติด 401)

    ไฟล์ auth.middleware.ts (TypeScript Type Error): การกำหนดและเรียกใช้ res.locals.requesterId อาจทำให้เกิด Error ตอน Build ได้ รบกวนจัดการเพิ่ม Type Augmentation (เช่น declare global interface Locals) ให้ถูกต้องครับ

ข้อเสนอแนะเพิ่มเติม (Non-blocking)

    ป้องกันตั๋วเลขซ้ำ (Race Condition): การใช้ count() + 1 สร้างเลขตั๋วอาจมีปัญหาตอนคนใช้งานพร้อมกัน ฝากมาร์ก // TODO ทิ้งไว้ก่อน หรือปรับปรุงโลจิกส่วนนี้ครับ

    ซ่อนหน้า Dev: ในไฟล์ App.tsx ควรเพิ่มเงื่อนไขเช็ค NODE_ENV ครอบหน้า DevRequesterSelector ไว้ด้วย เพื่อป้องกันไม่ให้หน้านี้หลุดออกไปตอนรันโหมด Production"

* **How I responded:**
  1. เพิ่มระบบส่ง Header หน้าบ้าน (client/src/api.ts): สร้างฟังก์ชัน Helper getRequesterHeaders() เพื่อดึงไอดีผู้ใช้จาก localStorage (toktickit_requester) และแนบเป็น HTTP Header X-Requester-Id อัตโนมัติสำหรับทุก API ที่ต้องมีการตรวจสอบสิทธิ์
  2. แก้ปัญหา TypeScript Error (auth.middleware.ts): เพิ่ม Type Augmentation (declare global { namespace Express... }) เพื่อประกาศ Type ให้กับ res.locals.requesterId ทำให้คอมไพล์ผ่านโดยไม่ติด Error
  3. ซ่อนหน้าจำลองล็อกอินในโหมด Production (client/src/App.tsx): เพิ่มเงื่อนไข import.meta.env.MODE !== 'production' ครอบหน้าจอ DevRequesterSelector เพื่อป้องกันไม่ให้ผู้ใช้ทั่วไปเข้าถึงหน้านี้ได้เมื่อนำเว็บไปขึ้นเซิร์ฟเวอร์จริง มาร์กจุดระวัง Race Condition (ticket.controller.ts): แปะคอมเมนต์ // TODO: อธิบายปัญหาเรื่องการดึง count() + 1 มาสร้างเลขตั๋ว เพื่อเตรียมปรับปรุงใช้ระบบ Lock (Database-level sequence) ป้องกันเลขซ้ำในอนาคต

#### Issue 3: Ticket creation
* **Reviewer comment received:**
  > "รีวิวโค้ดแล้ว ครบถ้วน"

#### Issue 4: My tickets screen
* **Reviewer comment received:**
  > "จุดที่เสนอแนะให้ปรับปรุง (Suggestions)
การทดสอบ Error (Test Coverage Gap): ฝั่ง UI มีการเขียนโค้ดดัก Error ตอนดึงข้อมูลไว้แล้ว (ใช้ .catch()) ถือว่าทำได้ดี แนะนำให้เพิ่ม Test Case สำหรับจำลองสถานการณ์ตอน API ตอบกลับเป็น Error เช่น 401 Unauthorized หรือ Network Error เพิ่มอีกนิด จะทำให้ระบบเทสต์สมบูรณ์แบบ 100%
การจัดการ Pagination ตอนไม่มีข้อมูล: กรณีที่ไม่พบข้อมูล Backend จะคำนวณ totalPages ได้เป็น 0 ซึ่งสังเกตเห็นว่าฝั่ง Frontend เขียนเช็คไว้แล้วว่าถ้า <= 1 ให้ซ่อนตัวเปลี่ยนหน้าไปเลย"

* **How I responded:**
  1. การทดสอบจัดการ Error จาก API (API Error Handling)
ดักจับ Error ถูกต้อง: ตรวจสอบว่าเมื่อ API ล้มเหลว (ไม่ว่าจะเป็น Network Error หรือ 401 Unauthorized) ระบบจะซ่อนตารางข้อมูลและแสดงแถบแจ้งเตือน (Error banner) ที่อ่านเข้าใจง่ายแทน ให้โอกาสแก้ตัว (Retry): ยืนยันว่าแถบ Filter และปุ่มค้นหายังคงทำงานอยู่ ผู้ใช้ไม่เจอทางตัน ฟื้นตัวจาก Error: ทดสอบว่าหากผู้ใช้พิมพ์คำค้นหาใหม่และดึงข้อมูลสำเร็จ แถบแจ้งเตือนจะหายไปและตารางข้อมูลจะกลับมาแสดงตามปกติ
  2. การทดสอบตรรกะการแบ่งหน้า (Pagination Visibility)
ซ่อนปุ่มเมื่อไม่มีข้อมูล (ตรงตามรีวิว): ยืนยันชัดเจนว่าหาก totalPages เป็น 0 (ไม่มีข้อมูล) หรือเป็น 1 (มีแค่หน้าเดียว) ปุ่ม Previous, Next และตัวเลขหน้าจะถูกซ่อนออกจากหน้าจอทั้งหมด ทำงานถูกต้องเมื่อมีหลายหน้า: ตรวจสอบว่าข้อความเช่น "Page 2 of 3" และปุ่มต่างๆ ปรากฏขึ้นมาอย่างถูกต้องเมื่อมีข้อมูล 2 หน้าขึ้นไป ล็อกปุ่มหัวท้าย (Boundary States): ทดสอบกดเปลี่ยนหน้าเพื่อยืนยันว่า ปุ่ม Previous จะถูกล็อก (Disabled) เมื่ออยู่หน้าแรกสุด และปุ่ม Next จะถูกล็อกเมื่ออยู่หน้าสุดท้าย

#### Issue 5: Ticket detail and attachments
* **Reviewer comment received:**
  > "ไฟล์ attachment.controller.ts (Backend - การลบและดาวน์โหลดไฟล์)

    [Issue: AC-05 Soft-Delete]: ฟังก์ชัน removeAttachment อัปเดต isRemoved = true แล้ว แต่ขาดการอัปเดตฟิลด์ deletedAt: new Date() และ deletedBy: requesterId รบกวนเพิ่มในคำสั่ง Update ของ Prisma
    [Suggestion: Auth Route Guard]: ตรวจสอบ API GET /attachments/:id/download ว่าเรียกใช้ authMiddleware แล้วหรือไม่ เพื่อบังคับเช็ค X-Requester-Id เสมอ (ตาม AC-01)
    [Suggestion: Error Handling]: กรณีเรียก res.download() แล้วไฟล์ไม่มีอยู่จริงบน Disk ควรเพิ่มการดัก Error ให้เจาะจงขึ้น เพื่อง่ายต่อการ Debug"

* **How I responded:**
  1. เพิ่ม authMiddleware เข้าไปที่บรรทัด Route ของ Download ให้เห็นแบบชัดเจน
  2. ใช้ console.error ดักจับ Error เผื่อไฟล์หายจากโฟลเดอร์ เพิ่ม res.headersSent ป้องกันไม่ให้เซิร์ฟเวอร์แครช ในกรณีที่ Error เกิดขึ้นหลังจากไฟล์เริ่มถูกดาวน์โหลดไปแล้วบางส่วน

#### Issue 6: E2E Testing, Visual Inspection & Release
* **Reviewer comment received:**

**1. ไฟล์ `responsive-screenshots.spec.ts` (AC-04)**

* **ปัญหา:** โค้ดส่วนค้นหา Ticket (บรรทัด 54-62) ใช้ `console.warn` เมื่อไม่พบ Ticket ทำให้เทสต์ถูกข้ามไปโดยไม่แจ้ง Error
* **วิธีแก้:** ปรับให้เทสต์แจ้ง Error ทันทีหากไม่พบข้อมูล แนะนำให้เปลี่ยนมาใช้ `await expect(firstTicket).toBeVisible();` เพื่อบังคับให้ระบบต้องแคปหน้าจอ Ticket Detail เสมอ

**2. ไฟล์ `reviewer.md` (AC-06)**

* **ปัญหา:** เนื้อหายังเป็นโครงสร้าง Template เปล่า
* **วิธีแก้:** ระบุข้อมูลการทำงานจริงให้ครบถ้วน เช่น รายละเอียดคอมเมนต์ที่ได้รับ, วิธีการแก้ไข, และสถานะการ Approve ของ PR ปัจจุบัน

**3. การจัดการไฟล์ขยะ (Suggestion)**

* **ปัญหา:** มีไฟล์ PDF จำลองจากการเทสต์หลุดเข้ามาในโฟลเดอร์ `server/uploads/`
* **วิธีแก้:** ลบไฟล์ PDF ดังกล่าวออกจาก Commit และเพิ่มกฎ `server/uploads/*.pdf` ลงในไฟล์ `.gitignore` เพื่อป้องกันไฟล์ขยะติด Git ในอนาคต"

* **How I responded:**
  1. บังคับแคปหน้าจอ (Strict Assertion): แก้ไขไฟล์ responsive-screenshots.spec.ts โดยลบเงื่อนไข if/else และ console.warn ออก แล้วเปลี่ยนไปใช้ await expect(firstTicket).toBeVisible(); แทน เพื่อบังคับให้เทสต์ต้องเจอ Ticket เสมอก่อนคลิกเข้าไปแคปหน้าจอ หากไม่เจอ เทสต์จะแจ้ง Error ทันที
  2. จัดการไฟล์ขยะ (Clean Test Artifacts): เพิ่มกฎ server/uploads/*.pdf ลงในไฟล์ .gitignore เพื่อป้องกันไฟล์จำลองจากการเทสต์หลุดเข้าไปในโฟลเดอร์รันไทม์ และทำการล้างไฟล์ PDF ที่ติดเข้าไปใน Git (Untrack) ออกเรียบร้อยแล้ว
  3. เพิ่มเนื้อหาในไฟล์ reviewer.md
#### Lab2-staging
* **Reviewer comment received:**
ตรวจสอบแล้วครบถ้วน 
* **How I responded:**
-

## Pull Requests I reviewed for my partner
Issue 1
My comment: 
1. ไฟล์ specification.md (Business Rules & Scope)
-ฟิลด์บังคับและความยาว: ระบุให้ชัดว่า Category, Priority, และ Related System บังคับกรอก รวมถึงจำกัดความยาวของ Summary (สูงสุด 100 อักษร) และ Description (สูงสุด 1,000 อักษร)
-กำหนดค่าที่อนุญาต (Enum): ระบุค่าของ Priority (Low, Medium, High) และ Status (New, Open, In Progress, Resolved, Closed) ให้ชัดเจน
-ความปลอดภัย & Soft-removal: เพิ่มนโยบายเช็คไฟล์ด้วย MIME Type ที่ฝั่ง Backend และกำหนดให้การลบไฟล์ต้องเก็บ Metadata (ใครลบ, ลบเมื่อไหร่) โดยไม่ลบไฟล์จริงออกจากฐานข้อมูล

2. ไฟล์ api-spec.md (API Contract)
-รูปแบบ Error Response: เพิ่มตัวอย่าง JSON Schema กรณีข้อมูลผิดพลาดแบบรายฟิลด์ (400 Bad Request) เพื่อให้เห็นภาพชัดเจน
-ความปลอดภัยของการยืนยันตัวตน: ระบุให้ส่ง requesterId ผ่าน HTTP Header (ในชื่อ X-Requester-Id) แทนการส่งใน Request Body เพื่อป้องกันการสวมรอย
-รายละเอียด Pagination: ระบุค่า Default (เช่น page=1, limit=10) และกำหนดโครงสร้างข้อมูลอ้างอิงหน้าถัดไปให้ชัดเจน

3. ไฟล์ ui-spec.md (UI Theme & Responsive)
-การเข้าถึง (Accessibility - a11y): เพิ่มกฎการใช้คีย์บอร์ดนำทาง (Focus states), ความต่างของสี (Contrast) ให้อ่านง่าย, และมี aria-label สำหรับปุ่มที่เป็นไอคอน
-การจัดการเนื้อหาบน Mobile: กำหนดว่าหากชื่อไฟล์ยาวเกินไปให้ตัดคำด้วย ... (Ellipsis) และเมื่อเปิดบนหน้าจอมือถือ ตารางตั๋ว (Table) จะต้องเปลี่ยนรูปแบบเป็นการ์ด (Card) เสมอ

4. ไฟล์ tests.md (Test Plan)
-Test Case ไฟล์แนบ (Error): เพิ่มแผนการทดสอบ API กรณีอัปโหลดไฟล์ผิดประเภท (.exe), ขนาดเกิน 5MB, และอัปโหลดเกิน 5 ไฟล์
-Test Case ความปลอดภัย: เพิ่มการทดสอบจำลองการเข้าถึงโดยไม่ส่ง X-Requester-Id (คาดหวัง 403 Forbidden หรือ 401)
-Test Case UI & Mobile: เพิ่มการทดสอบการเข้าถึง (Keyboard Navigation) และ E2E Test เพื่อดูการเปลี่ยนตารางเป็นการ์ดบนหน้าจอมือถือ
Partner's response: 
สรุปการแก้ไขและอัปเดตเอกสาร

1. ไฟล์ specification.md (Business Rules & Scope)

    ฟิลด์บังคับกรอก (Required Fields): เพิ่ม Category, Requested Priority และ Related System เป็นฟิลด์บังคับ รวมถึงกำหนดความยาวสูงสุดของ Summary (100 ตัวอักษร) และ Description (1,000 ตัวอักษร)

    สถานะและความเร่งด่วน (Enum Values): เพิ่มรายละเอียดค่าที่รองรับของ Priority (Low, Medium, High) และ Status (New, Open, In Progress, Resolved, Closed)

    ความปลอดภัยของไฟล์แนบ: เพิ่มข้อกำหนดให้ตรวจสอบประเภทไฟล์จาก MIME Type ที่ฝั่ง Backend (ไม่พึ่งพานามสกุลไฟล์เพียงอย่างเดียว)

    การลบไฟล์ (Soft-removal): เพิ่มนโยบายการเก็บ Metadata (ใครลบ, ลบเมื่อไหร่) โดยไม่ลบไฟล์จริงออกจากระบบ

2. ไฟล์ api-spec.md (API Contract)

    รูปแบบ Error Response: เพิ่มตัวอย่าง JSON ของ Standard Error Responses ครบถ้วน (400, 401, 403, 404) แบบรายฟิลด์ และแก้ไข syntax การแสดงผล code block

    การแบ่งหน้า (Pagination): ระบุรายละเอียดค่า Default ของหน้า (page=1, limit=10, max=50) พร้อมตัวอย่าง Response Metadata แบบมีข้อมูลรวม

    ความปลอดภัย: เปลี่ยนวิธีการส่ง requesterId เป็นการส่งผ่าน HTTP Header ในชื่อ X-Requester-Id ในทุกตัวอย่าง Endpoint เพื่อป้องกันการสวมรอย

3. ไฟล์ ui-spec.md (UI Theme & Responsive)

    การรองรับการเข้าถึง (Accessibility - a11y): เพิ่มข้อกำหนดเรื่อง Contrast ของสี, การแสดงผล Focus states เมื่อใช้คีย์บอร์ด และการใส่ aria-label

    รายละเอียด Responsive: เพิ่มกฎการตัดคำชื่อไฟล์แนบที่ยาวเกินไปด้วย ... (Ellipsis) และกำหนดให้เปลี่ยนตาราง (Table) เป็นแบบการ์ด (Card) เสมอเมื่ออยู่บนหน้าจอมือถือ

4. ไฟล์ tests.md (Test Plan)

    การทดสอบไฟล์แนบ (File Upload): เพิ่ม Test Case สำหรับกรณี Error เช่น อัปโหลดไฟล์ผิดประเภท (.exe), ไฟล์ใหญ่เกิน 5MB และอัปโหลดพร้อมกันเกิน 5 ไฟล์

    การทดสอบความปลอดภัย: เพิ่ม Test Case ตรวจสอบการตอบกลับ 401 Unauthorized เมื่อไม่มีการส่ง Header

    การทดสอบ Accessibility และ UI: เพิ่ม Test Case สำหรับการใช้คีย์บอร์ดนำทาง (Keyboard Navigation) และตรวจสอบการแปลง Table เป็น Card บนมือถือ

(หมายเหตุ: ค่า Status ของ Ticket ใน specification.md ได้ใส่ไว้ครบถ้วนตามข้อเสนอแนะ แต่มีโน้ตกำกับไว้ว่าการพัฒนาใน Lab 2 จะจำกัดการทำงานเฉพาะสถานะ "New" เท่านั้น ตามขอบเขตของแล็บ)

Issue 2 

My comment : ตรวจแล้ว ครบถ้วนถูกต้อง

Partner's response: -

Issue 3

My comment :ตรวจแล้วครบถ้วนแล้ว

Partner's response:-

Issue 4 

My comment:ตรวจแล้วครบถ้วนแล้ว

Partner's response: 

Issue 5

My comment:ตรวจแล้วครบถ้วนแล้ว

Partner's response: -

Lab2-staging

My comment: สรุปจุดที่ต้องแก้ไข
1. ขาดระบบป้องกันการดูข้อมูลข้ามสิทธิ์ (Critical)สิ่งที่ผิด: หน้า TicketDetail.tsx ขาดระบบตรวจสอบเวลาผู้ใช้เปลี่ยนตัวละคร (Development Requester) กลางคัน ทำให้ผู้ใช้สามารถแอบดูตั๋วที่ตัวเองไม่ใช่เจ้าของได้สิ่งที่ต้องแก้: ให้เพิ่ม useEffect ใน TicketDetail.tsx เพื่อดึงค่าจาก localStorage มาเทียบกับ ticket.requesterId ถ้าไอดีไม่ตรงกัน ให้ใช้คำสั่ง Redirect เตะผู้ใช้กลับไปหน้า My Tickets ทันที

2. ขาดการจำกัดโควต้าอัปโหลดไฟล์ (Critical)สิ่งที่ผิด: API อัปโหลดไฟล์ใน attachment.controller.ts ขาดการเช็คเงื่อนไข "ห้ามอัปโหลดเกิน 5 ไฟล์ต่อตั๋ว 1 ใบ" ทำให้ตอนนี้อัปโหลดได้ไม่จำกัด สิ่งที่ต้องแก้: ในคอนโทรลเลอร์ ให้เพิ่มโค้ดนับจำนวนไฟล์ที่ isRemoved: false ของตั๋วใบนั้น ถ้าพบว่ามี $\ge$ 5 ไฟล์ ให้ Block แล้วเตะ Error 400 Bad Request ออกไป

3. ขาดไฟล์ Unit Test ฝั่งเซิร์ฟเวอร์ (High)สิ่งที่ผิด: โปรเจกต์ไม่มีการเขียน Unit Test ฝั่งหลังบ้าน (Backend) เลย โดยเฉพาะการจำลองเคส Error ต่างๆสิ่งที่ต้องแก้: ให้สร้างไฟล์เทสต์ (เช่น server/src/__tests__/ หรือตามโครงสร้างโปรเจกต์) เพื่อเขียนเทสต์ดักเคส 401 (ไม่ส่ง Auth Header), 403 (ไม่มีสิทธิ์), และ 404 (หาข้อมูลไม่พบ)

4. E2E เทสต์ไม่ได้แคปหน้าจอ Responsive (Medium)สิ่งที่ผิด: สคริปต์ Playwright ในโฟลเดอร์ E2E ไม่ได้ถูกตั้งค่าให้ตั้งขนาดหน้าจอและแคปรูป (Desktop, Tablet, Mobile) ตามที่ตกลงกันไว้สิ่งที่ต้องแก้: ให้เพิ่มการตั้งค่า Viewport ในไฟล์ playwright.config.ts หรือในตัวไฟล์เทสต์เอง แล้วเรียกใช้คำสั่ง page.screenshot(...) ให้เซฟรูปลงโฟลเดอร์ให้ครบทุกขนาด

5. ไฟล์เอกสารสรุปงานหายไป (Low)สิ่งที่ผิด: ลืมสร้าง/อัปโหลดไฟล์เอกสารส่งงาน 2 ไฟล์สิ่งที่ต้องแก้: สร้างไฟล์ ai-use.md (ประวัติการใช้ AI) และ reviewer.md (บันทึกการรีวิว) เอาไปวางไว้ในโฟลเดอร์ docs/lab-02/ ให้ครบถ้วน

Partner's response:ได้ดำเนินการแก้ไขและปรับปรุงโค้ดตามข้อเสนอแนะจากการรีวิวครบถ้วนทุกจุดใน Commit ล่าสุดแล้ว โดยมีรายละเอียดการแก้ไขทั้งหมดดังนี้

    Context Switch Protection (client/src/components/TicketDetail.tsx)

        เพิ่ม useEffect สำหรับตรวจสอบ Requester ID ปัจจุบันจาก localStorage (toktickit_requester) เทียบกับ ticket.requesterId

        หากพบว่าไอดีไม่ตรงกัน หรือได้รับ Error 403 Forbidden ระบบจะเรียกฟังก์ชัน onBack() เพื่อพากลับสู่หน้า My Tickets อัตโนมัติทันทีโดยไม่ค้างอยู่ที่หน้า Access Denied

    5-Attachment Limit Enforcement (server/src/controllers/attachment.controller.ts)

        เพิ่มการตรวจสอบโควต้าจำนวนไฟล์แนบที่ยัง Active (isRemoved: false) ของตั๋วใบนั้น ๆ ก่อนบันทึกลงฐานข้อมูล

        หากพบว่ามีไฟล์แนบตั้งแต่ 5 ไฟล์ขึ้นไป ระบบจะสั่งลบไฟล์ชั่วคราวทิ้งทันทีด้วย fs.unlinkSync(req.file.path) เพื่อป้องกันไฟล์ขยะตกค้าง และส่ง Error 400 Bad Request พร้อมข้อความ Attachment limit of 5 exceeded

    Backend Unit Tests (server/src/__tests__/ticket-auth.test.ts)

        สร้างชุดทดสอบด้วย Vitest และ Supertest พร้อม Mocking ฝั่ง Service Layer เพื่อความรวดเร็วและแยกส่วนจากฐานข้อมูลจริง

        ครอบคลุมสถานะ Error 3 รูปแบบ รวม 7 เคสย่อย (ผลการรันผ่านทั้งหมด):

            HTTP 401: เมื่อไม่มีการส่ง Header X-Requester-Id สำหรับเข้าถึงตั๋วหรือดาวน์โหลดไฟล์

            HTTP 403: เมื่อร้องขอตั๋วหรือไฟล์แนบที่เป็นของ Requester คนอื่น

            HTTP 404: เมื่อร้องขอตั๋วหรือไฟล์แนบที่ไม่มีอยู่จริง รวมถึงไฟล์ที่ถูก Soft-remove ไปแล้ว

    E2E Test & Responsive Screenshots (e2e/lab-02/requester-ticket-flow.spec.ts)

        นำการหน่วงเวลาแบบคงที่ (waitForTimeout(600)) ในขั้นตอนค้นหาออก และเปลี่ยนมาใช้ Auto-retrying assertion (expect(...).toBeVisible()) ตามข้อกำหนด

        เพิ่มคำสั่งปรับขนาด Viewport และถ่ายภาพแบบ Full-page บันทึกลงโฟลเดอร์ artifacts/lab-02/screenshots/ticket-detail/ ครบ 3 ขนาด:

            Desktop (1280x720)

            Tablet (768x1024)

            Mobile (375x667)

    Documentation (docs/lab-02/)

        จัดเตรียมและตรวจสอบความสมบูรณ์ของเอกสาร docs/lab-02/ai-use.md และ docs/lab-02/reviewer.md ครบถ้วนตามมาตรฐานของแล็บ

