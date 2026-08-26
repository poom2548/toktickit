# Lab 2 Test Plan and Results

## 1. Test Strategy
การทดสอบใน Lab 2 จะมุ่งเน้นไปที่การทำงานของฝั่ง Requester โดยครอบคลุมตั้งแต่ระดับ Unit, API, UI Component, การแสดงผล (Responsive) และ End-to-End (E2E) เพื่อให้มั่นใจว่าฟังก์ชัน Create Ticket, My Tickets, Ticket Detail และระบบ Development Requester ทำงานได้อย่างถูกต้องและปลอดภัยจากการดูข้อมูลข้ามสิทธิ์

## 2. Planned Tests
| Test ID | Requirement/AC | Type | What It Tests | Expected Result | Automated Test File | Final Result |
|---|---|---|---|---|---|---|
| API-01 | AC-01 | API | Create valid ticket | 201; one saved Ticket; number returned | `server/tests/lab-02/create-ticket.api.test.ts` | Todo |
| UI-01 | AC-01 | UI | Submit without Summary | Field message; API not called | `client/src/.../CreateTicket.test.tsx` | Todo |
| UI-02 | AC-02 | UI | Open My Tickets without Requester | Redirects to Requester Selection | `client/src/.../MyTickets.test.tsx` | Todo |
| API-02 | AC-03 | API | Access other user's ticket | 403 Forbidden; empty response | `server/tests/lab-02/ticket-detail.api.test.ts` | Todo |
| API-03 | AC-04 | API | Soft-remove attachment | 200 OK; file metadata kept but cannot download | `server/tests/lab-02/attachments.api.test.ts` | Todo |
| API-04 | AC-05 | API | Search tickets by keyword | 200 OK; returns matching tickets | `server/tests/lab-02/my-tickets.api.test.ts` | Todo |
| E2E-01 | AC-01, AC-05 | E2E | Complete responsive submission flow | Confirmation shows official number | `e2e/lab-02/requester-ticket-flow.spec.ts` | Todo |
| API-05 | File Upload | API | Upload file > 5MB | 413 Payload Too Large | `server/tests/.../attachments.api.test.ts` | Todo |
| API-06 | File Upload | API | Upload invalid MIME type (.exe) | 400 Bad Request | `server/tests/.../attachments.api.test.ts` | Todo |
| API-07 | File Upload | API | Upload > 5 files total | 400 Bad Request | `server/tests/.../attachments.api.test.ts` | Todo |
| API-08 | Security | API | Spoofed missing X-Requester-Id | 401 Unauthorized | `server/tests/.../tickets.api.test.ts` | Todo |
| API-09 | Pagination | API | Request page=-1 or invalid limit | 400 Bad Request | `server/tests/.../my-tickets.api.test.ts` | Todo |
| UI-03 | Accessibility | UI | Check contrast and aria-labels | Pass visual & axe-core check | `client/src/.../CreateTicket.test.tsx` | Todo |
| E2E-02 | Responsive | E2E | View My Tickets on Mobile width | Table turns into Cards, no scroll | `e2e/lab-02/responsive.spec.ts` | Todo |
## 3. Acceptance-Criterion Traceability
| Acceptance Criterion | Linked Tests |
|---|---|
| **AC-01** (Create valid ticket) | API-01, UI-01, E2E-01 |
| **AC-02** (Require selected Requester) | UI-02 |
| **AC-03** (Ownership protection) | API-02 |
| **AC-04** (Soft-remove attachment) | API-03 |
| **AC-05** (Search functionality) | API-04, E2E-01 |

## 4. Responsive and Visual Checklist
- [ ] **Desktop (≥ 992 px):** โครงสร้างหลายคอลัมน์แสดงผลได้ดี ความกว้างเหมาะสม
- [ ] **Tablet (768-991 px):** ปรับเป็น 2 คอลัมน์ ช่อง Summary และ Description มีพื้นที่เพียงพอ
- [ ] **Mobile (< 768 px):** ฟิลด์เรียงซ้อนกันแนวตั้ง (Stack), ปุ่มกดง่าย, ไม่มีแนวนอนเลื่อน (No horizontal scroll)
- [ ] **General:** ไม่มีการแสดงผลทับซ้อน ข้อความไม่ตกขอบ และสีถูกต้องตาม Zen Green Theme

## 5. Test Commands
- **Unit & API Tests:** `npm run test` (ในโฟลเดอร์ `server` และ `client`)
- **E2E Tests:** `npx playwright test` (ในโฟลเดอร์ `e2e`)

## 6. Final Results
*(รออัปเดตผลลัพธ์การรันจริงในช่องนี้ หลังจากให้ AI ช่วยเขียนโค้ดและรันเทสต์ผ่านแล้ว)*

## 7. Known Limitations or Deferred Tests
- เนื่องจากระบบ Login เป็นเพียงการจำลอง (Development Requester) จึงไม่มีการทดสอบเรื่อง Authentication/Token จริงใน Sprint นี้ (จะถูกยกยอดไปทดสอบเต็มรูปแบบใน Lab 3)