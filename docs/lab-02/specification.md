# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
ส่งมอบแอปพลิเคชันฝั่ง Requester (ผู้ใช้งาน) สำหรับระบบ TokTickIT ให้สามารถสร้างตั๋วปัญหา (Create Ticket) ดูรายการตั๋วของตัวเอง (My Tickets) ดูรายละเอียดตั๋ว (Ticket Detail) และจัดการไฟล์แนบได้อย่างสมบูรณ์ โดยใช้ระบบเลือกผู้ใช้ชั่วคราว (Development Requester) ในการจำลองการทำงานแทนระบบ Login จริง

## 2. Stakeholder Request Interpretation
แผนก IT ต้องการระบบฝั่ง Requester ที่ใช้งานง่ายและรองรับ Responsive ผู้ใช้ต้องสามารถแจ้งปัญหา เลือกหมวดหมู่ ระบุความสำคัญ และแนบไฟล์ได้ เมื่อส่งสำเร็จจะได้รับ Ticket Number ผู้ใช้ต้องสามารถติดตามสถานะ ค้นหา กรอง และดูรายละเอียดตั๋วของตัวเองได้ โดยมีระบบจำลองตัวตนเพื่อป้องกันไม่ให้ดูตั๋วของผู้ใช้คนอื่น และใช้ธีม "Zen Green" เพื่อให้เป็นมาตรฐานเดียวกันทั้งระบบ

## 3. Scope
### Included
- Development Requester Selection (ระบบเลือกผู้ใช้จำลองสำหรับทดสอบ)
- Create Ticket (สร้างตั๋วใหม่และอัปโหลดไฟล์แนบ)
- My Tickets (หน้ารายการตั๋ว พร้อมระบบค้นหา กรอง เรียงลำดับ และแบ่งหน้า)
- Requester Ticket Detail (หน้าดูรายละเอียดตั๋วแบบอ่านอย่างเดียว)
- Attachment Lifecycle (อัปโหลด, ดาวน์โหลด, และลบไฟล์แนบแบบ Soft-removal)
- การตรวจสอบสิทธิ์ความเป็นเจ้าของตั๋ว (Ownership protection)

### Excluded
- Authentication และ Security ของจริง (การล็อกอิน, รหัสผ่าน, Token, Session, Roles)
- IT Staff workflow (ระบบแดชบอร์ดของพนักงาน IT, การเปลี่ยนสถานะตั๋วหลังบ้าน)
- Ticket collaboration (การคอมเมนต์แบบสาธารณะ, โน้ตภายใน, บันทึกการดำเนินการ)
- Ticket lifecycle ขั้นถัดไป (เช่น Resolving, Closing, Reopening)
- ระบบจัดการแอดมิน (Admin management)

## 4. Functional Requirements
- **FR-01:** ระบบต้องแสดงหน้าจอเลือก Development Requester เพื่อให้ผู้ใช้จำลองตัวตนก่อนเข้าใช้งาน
- **FR-02:** ผู้ใช้ต้องสามารถสร้าง Ticket โดยระบุข้อมูลที่จำเป็น และสามารถแนบไฟล์ได้
- **FR-03:** ระบบต้องแสดงรายการตั๋วของผู้ใช้งานคนปัจจุบัน (My Tickets)
- **FR-04:** ระบบรายการตั๋วต้องรองรับการค้นหา, กรอง (Filter), เรียงลำดับ (Sort) และแบ่งหน้า (Pagination)
- **FR-05:** ผู้ใช้ต้องสามารถดูรายละเอียดตั๋วของตนเองได้ (Ticket Detail)
- **FR-06:** ผู้ใช้ต้องสามารถเพิ่ม ดาวน์โหลด และลบไฟล์แนบของตนเองได้ (Soft-removal)
- **FR-07:** ระบบต้องป้องกันไม่ให้ผู้ใช้เข้าถึง Ticket หรือ Attachment ของผู้ใช้งานคนอื่น

## 5. Business Rules
- **BR-01:** หมายเลขตั๋ว (Ticket Number) ต้องถูกสร้างจากระบบ Backend อัตโนมัติและไม่ซ้ำกัน
- **BR-02:** ตั๋วปัญหาที่ถูกสร้างใหม่ จะเริ่มต้นด้วยสถานะ (Current Status) ว่า "New" เสมอ
- **BR-03:** Lab 2 ใช้ Development Requester เป็นเพียงเครื่องมือทดสอบเท่านั้น ไม่ใช่การ Authentication จริง
- **BR-04 (Required Fields):** Summary, Description, Category, Requested Priority และ Related System เป็นฟิลด์บังคับ (Required) 
  - ความยาวสูงสุด (Max length): Summary ไม่เกิน 100 ตัวอักษร, Description ไม่เกิน 1000 ตัวอักษร
- **BR-05 (Enum Values):** 
  - `Requested Priority` รองรับค่า: Low, Medium, High
  - `Current Status` รองรับค่า: New, Open, In Progress, Resolved, Closed
- **BR-06 (Attachment Security):** การตรวจสอบประเภทไฟล์ต้องเช็คจาก MIME Type ฝั่ง Backend ด้วย ไม่ใช่แค่เช็คนามสกุลไฟล์ฝั่งหน้าบ้าน
- **BR-07 (Soft-removal Policy):** 
  - ไฟล์ที่ถูก Soft-remove จะไม่ถูกลบออกจาก Storage จริง (เก็บไว้ถาวร หรือจนกว่าจะถึงรอบเคลียร์ข้อมูลรายปี)
  - เก็บ Metadata ระบุว่าลบโดยใคร (`deletedBy`) และลบเมื่อไหร่ (`deletedAt`)
  - มีเพียงบทบาท `Admin` (ในอนาคต) เท่านั้นที่สามารถกู้คืนหรือลบถาวร (Hard delete) ได้
  *(หมายเหตุ: เนื่องจากระบบ Admin Management ถูกตั้งเป็น Excluded ใน Lab 2 การทดสอบสิทธิ์ Admin สำหรับลบถาวร/กู้คืน จะใช้การจำลอง (Mock) ไปก่อนใน Sprint นี้)*
- **BR-08:** ไฟล์แนบที่ถูก Soft-remove ห้ามแสดงผลให้พรีวิวหรือให้ดาวน์โหลดโดยเด็ดขาด
- **BR-09:** ตั๋วหนึ่งใบเป็นกรรมสิทธิ์ของผู้ใช้งาน (Requester) เพียงคนเดียวเท่านั้น ไม่สามารถดูข้ามสิทธิ์ได้

## 6. UI Specification Summary
อ้างอิงจาก `ui-spec.md` อินเทอร์เฟซต้องใช้ธีม **Zen Green**:
- สีหลัก (Primary green): `#006B3C`
- สีพื้นหลังหน้า (Page background): `#F5F7F6`
- การตอบสนอง (Responsive): รองรับ Desktop (≥ 992 px), Tablet (768-991 px), และ Mobile (< 768 px)
- สถานะระบบ (States: Loading, Success, Error, Empty, No-results) ต้องแสดงผลชัดเจนผ่าน UI พร้อมข้อความอธิบายที่เข้าใจง่าย

## 7. Data Changes
โครงสร้างข้อมูล (Prisma) ต้องประกอบด้วยตาราง:
- **Requester:** จำลองผู้ใช้ (id, name, isActive)
- **Category:** หมวดหมู่ปัญหา
- **RelatedSystem:** ระบบที่เกี่ยวข้อง
- **Ticket:** เก็บข้อมูลตั๋ว (id, ticketNumber, requesterId, categoryId, summary, description, status ฯลฯ)
- **Attachment:** เก็บข้อมูลไฟล์แนบเชื่อมกับ Ticket (id, ticketId, filePath, isRemoved, removedReason ฯลฯ)

## 8. API Contract
API หลักต้องประกอบด้วย:
- `GET /api/requesters/active` ดึงรายการผู้ใช้ทดสอบ
- `GET /api/categories` และ `GET /api/related-systems` ดึงข้อมูลตัวเลือก
- `POST /api/tickets` สร้างตั๋วใหม่
- `GET /api/tickets` ดึงรายการตั๋วพร้อมระบบ Pagination, Sort, Filter
- `GET /api/tickets/:id` ดึงรายละเอียดตั๋ว (ต้องเช็คสิทธิ์)
- `POST /api/attachments` และ `DELETE /api/attachments/:id` เพื่ออัปโหลดและลบ (Soft-remove) ไฟล์แนบ

## 9. Acceptance Criteria
- **AC-01:** Given valid Ticket data, when the Requester submits the form, then one Ticket is saved and the official Ticket Number is displayed.
- **AC-02:** Given no Development Requester is selected, when the user attempts to open My Tickets, then the Requester Selection screen is shown.
- **AC-03:** Given Requester B is selected, when a Ticket belonging to Requester A is requested, then the Ticket data is not returned (Access Denied).
- **AC-04:** Given a ticket with an active attachment, when the requester deletes it, then the attachment is soft-removed and can no longer be downloaded.
- **AC-05:** Given a list of tickets, when the user inputs a search keyword, then only tickets matching the search keyword are displayed.

## 10. Definition of Done
- เขียนโค้ดพัฒนาหน้าจอและ API สมบูรณ์ตาม Acceptance Criteria
- จัดทำและรัน Automated Tests ฝั่ง Unit, API, UI และ E2E ผ่าน 100%
- UI สอดคล้องตาม Zen Green Theme และแสดงผลบน Mobile, Tablet, Desktop ได้อย่างสมบูรณ์แบบ
- มีการรีวิวโค้ด (Peer Review) อนุมัติการ Pull Request 
- คำแนะนำวิธีตั้งค่าระบบ (README.md) ได้รับการอัปเดตเรียบร้อยแล้ว

## 11. Assumptions and Decisions
- เพื่อความง่ายในการทดสอบ การเก็บ Session ของตัว Development Requester จะถูกจำลองผ่าน LocalStorage ของเบราว์เซอร์ไปก่อนจนกว่าจะถึง Lab 3 
- รูปแบบหมายเลขตั๋ว (Ticket Number Format) สมมติฐานให้เป็นฟอร์แมต "TKT-YYYY-XXXXXX"