# แผนการทดสอบแบบก่อนการพัฒนา (Pre-implementation Test Plan) - Lab 3

เอกสารนี้ระบุรายละเอียดของการทดสอบเพื่อรับรองความถูกต้องของระบบตามเกณฑ์การยอมรับ (Acceptance Criteria) โดยครอบคลุมทั้งแบบหน่วยย่อย แบบบูรณาการ และแบบครบวงจร

| รหัสทดสอบ (TestID) | ประเภท (Type) | อ้างอิงเกณฑ์ (AC Mapping) | ไฟล์ที่จะใช้ทดสอบ (Test File Path) | รายละเอียด (Description) | ผลลัพธ์ที่คาดหวัง (Expected Result) | สถานะสุดท้าย (Final Status) |
|---|---|---|---|---|---|---|
| T-AUTH-01 | api | AC-AUTH-01 | `server/tests/lab-03/auth.api.test.ts` | ล็อกอินด้วยบัญชีที่ถูกต้อง | 200 OK แสดงข้อมูลระบุตัวตน (ไม่มี `passwordHash`) | |
| T-AUTH-02 | api | AC-AUTH-02 | `server/tests/lab-03/auth.api.test.ts` | ล็อกอินด้วยบัญชีที่ต้องเปลี่ยนรหัสผ่าน | ข้อมูลคืนค่ามามีสถานะ `requiresPasswordChange=true` | |
| T-AUTH-03 | api | AC-AUTH-03 | `server/tests/lab-03/auth.api.test.ts` | ล็อกอินเมื่อบัญชีถูกปิดการใช้งาน (Inactive) | 401 Unauthorized พร้อมข้อความทั่วไป | |
| T-AUTH-04 | api | AC-AUTH-04 | `server/tests/lab-03/auth.api.test.ts` | ล็อกอินเมื่อใส่รหัสผ่านผิด | 401 Unauthorized ข้อมูลเหมือนกับตอนระบุบัญชีผิด | |
| T-AUTH-05 | api | AC-AUTH-05 | `server/tests/lab-03/auth.api.test.ts` | กดปุ่มล็อกเอาต์ | 200 OK และเซสชันถูกยกเลิก (ลองใช้ api อีกครั้งต้องเจอ 401) | |
| T-AUTH-06 | api | AC-AUTH-06 | `server/tests/lab-03/auth.api.test.ts` | ดึงข้อมูลโปรไฟล์ผู้ใช้งานปัจจุบัน (`GET /auth/me`) | 200 OK แสดงข้อมูลโปรไฟล์ | |
| T-AUTH-07 | api | AC-AUTH-07 | `server/tests/lab-03/auth.api.test.ts` | ดึงโปรไฟล์เมื่อไม่ได้ล็อกอิน | 401 Unauthorized | |
| T-AUTH-08 | api | AC-AUTH-08 | `server/tests/lab-03/auth.api.test.ts` | เปลี่ยนรหัสผ่านให้บัญชี (ข้อมูลครบและถูกต้อง) | 200 OK และระบบตั้งค่า `requiresPasswordChange=false` | |
| T-AUTH-09 | api | AC-AUTH-09 | `server/tests/lab-03/auth.api.test.ts` | เปลี่ยนรหัสผ่านแต่น้อยกว่า 8 ตัวอักษร | 422 Unprocessable Entity | |
| T-AUTH-10 | api | AC-AUTH-10 | `server/tests/lab-03/auth.api.test.ts` | ตรวจสอบข้อมูลหลุดรั่ว | ผลลัพธ์ทุกรายการจะต้องไม่แสดง `passwordHash` | |
| T-ZAUTH-01 | security | AC-10, AC-12 | `server/tests/lab-03/authorization.api.test.ts` | เข้าใช้ Endpoint ป้องกัน โดยไม่ได้ยืนยันตัวตน | 401 Unauthorized ตอบกลับทุกครั้ง | |
| T-ZAUTH-02 | security | AC-12 | `server/tests/lab-03/authorization.api.test.ts` | `REQUESTER` พยายามไปที่ `/staff/tickets` | 403 Forbidden | |
| T-ZAUTH-03 | security | AC-12 | `server/tests/lab-03/authorization.api.test.ts` | `REQUESTER` พยายามไปที่ `/admin/users` | 403 Forbidden | |
| T-ZAUTH-04 | security | AC-12 | `server/tests/lab-03/authorization.api.test.ts` | `IT_STAFF` พยายามไปที่ `/admin/users` | 403 Forbidden | |
| T-ZAUTH-05 | security | AC-10 | `server/tests/lab-03/authorization.api.test.ts` | `REQUESTER` เปิดตั๋วของผู้อื่น | 403 Forbidden | |
| T-ZAUTH-06 | security | AC-10 | `server/tests/lab-03/authorization.api.test.ts` | `REQUESTER` ขอเรียกดูบันทึกภายใน | 403 Forbidden และห้ามมีข้อความบันทึกกลับออกมา | |
| T-Q-01 | api | AC-QUEUE-01 | `server/tests/lab-03/staff-queue.api.test.ts` | เรียก `/staff/tickets` โดยไม่ใส่พารามิเตอร์ | 200 OK ได้รับรายการตั๋วและ metadata การแบ่งหน้า | |
| T-Q-02 | api | AC-QUEUE-02 | `server/tests/lab-03/staff-queue.api.test.ts` | ค้นหา `search=keyword` บนคิวงาน | คืนค่าข้อมูลตั๋วที่มีคีย์เวิร์ดปรากฏ | |
| T-Q-03 | api | AC-QUEUE-03 | `server/tests/lab-03/staff-queue.api.test.ts` | ค้นหาตามตัวกรอง `status=IN_PROGRESS` | คืนค่าข้อมูลที่ตรงกับตัวกรองเท่านั้น | |
| T-Q-04 | api | AC-QUEUE-04 | `server/tests/lab-03/staff-queue.api.test.ts` | เรียงลำดับ `sort=createdAt&direction=desc` | ได้รับข้อมูลเรียงแบบลดหลั่นอย่างถูกต้อง | |
| T-Q-05 | api | AC-QUEUE-05 | `server/tests/lab-03/staff-queue.api.test.ts` | แบ่งหน้า `page=2&pageSize=10` | ระบบส่งคืนข้อมูลเฉพาะของหน้าที่ 2 อย่างถูกต้อง | |
| T-Q-06 | api | AC-QUEUE-06 | `server/tests/lab-03/staff-queue.api.test.ts` | ใส่สถานะ enum และค่าการเรียงลำดับผิด | 400 Bad Request | |
| T-Q-07 | security | AC-QUEUE-12 | `server/tests/lab-03/staff-queue.api.test.ts` | `REQUESTER` แอบเปิดระบบดูคิวของระบบส่วนกลาง | 403 Forbidden | |
| T-DTL-01 | api | AC-DETAIL-01 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | เปิดดูรายละเอียดตั๋ว `/staff/tickets/:id` | ได้รับข้อมูลทั้งหมดครบถ้วน รวมผู้รับผิดชอบและความเห็น | |
| T-DTL-02 | api | AC-DETAIL-02 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ตั้งค่าผู้รับผิดชอบด้วยไอดีบทบาท `IT_STAFF` | 200 OK | |
| T-DTL-03 | api | AC-DETAIL-03 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ยัดเยียดผู้รับผิดชอบไปให้คนระดับ `REQUESTER` | 422 Unprocessable Entity | |
| T-DTL-04 | api | AC-DETAIL-04 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ตั้งเจ้าของตั๋วเป็นไอดีของผู้ใช้ที่ไม่มีสถานะ Active | 422 Unprocessable Entity | |
| T-DTL-05 | api | AC-DETAIL-05 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | เปลี่ยนสถานะไอทีเป็นค่าที่ถูกต้อง | 200 OK | |
| T-DTL-06 | api | AC-DETAIL-06 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ปรับสถานะทำได้ เช่น `NEW` ไป `OPEN` | 200 OK เป็นทรานสิชั่นที่อนุญาต | |
| T-DTL-07 | api | AC-DETAIL-07 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ฝืนปรับสถานะ เช่น `RESOLVED` ไป `NEW` | 422 Unprocessable Entity ไม่อนุญาต | |
| T-DTL-08 | security | AC-DETAIL-14 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `REQUESTER` แอบส่ง PATCH สถานะ | 403 Forbidden | |
| T-DTL-09 | security | AC-DETAIL-14 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `REQUESTER` เข้าดูตั๋วในฝั่ง IT | 403 Forbidden | |
| T-CMT-01 | api | AC-REQ-05 | `server/tests/lab-03/comments-notes.api.test.ts` | พิมพ์คอมเมนต์และกดบันทึก | 201 Created ระบุตัวตนผู้แสดงความเห็น | |
| T-CMT-02 | api | AC-REQ-06 | `server/tests/lab-03/comments-notes.api.test.ts` | พิมพ์คอมเมนต์แบบว่างเปล่า | 422 Unprocessable Entity | |
| T-CMT-03 | api | AC-DETAIL-08 | `server/tests/lab-03/comments-notes.api.test.ts` | พิมพ์บันทึกภายใน (Internal Note) ในฐานะแอดมิน | 201 Created | |
| T-CMT-04 | security | AC-DETAIL-09 | `server/tests/lab-03/comments-notes.api.test.ts` | พิมพ์บันทึกภายในแบบไม่ได้รับอนุญาต (Requester) | 403 Forbidden | |
| T-CMT-05 | security | AC-REQ-08 | `server/tests/lab-03/comments-notes.api.test.ts` | อ่านบันทึกภายในในบทบาท (Requester) | 403 Forbidden ข้อมูลไม่หลุดรอด | |
| T-CMT-06 | api | AC-REQ-07 | `server/tests/lab-03/comments-notes.api.test.ts` | ติ๊กธงว่าแก้ปัญหาแล้วสำหรับฝั่ง `REQUESTER` | 200 OK เปลี่ยนค่าธง แต่สถานะไม่ปรับเป็น Resolved | |
| T-ADM-01 | api | AC-ADMIN-01 | `server/tests/lab-03/users-admin.api.test.ts` | โหลดรายการผู้ใช้งานทั้งหมด | 200 OK ได้รับรายชื่อ โดยไม่มีรหัสผ่านที่แฮชแล้ว | |
| T-ADM-02 | api | AC-ADMIN-02 | `server/tests/lab-03/users-admin.api.test.ts` | ค้นหา `search=alice` | รายชื่อถูกกรองเรียบร้อย | |
| T-ADM-03 | api | AC-ADMIN-03 | `server/tests/lab-03/users-admin.api.test.ts` | ค้นหาแบบกรอง `role=IT_STAFF` | คืนเฉพาะผู้ที่มีบทบาทระบุ | |
| T-ADM-04 | api | AC-ADMIN-04 | `server/tests/lab-03/users-admin.api.test.ts` | เพิ่มผู้ใช้ใหม่ด้วยข้อมูลที่สมบูรณ์ | 201 Created สถานะบังคับเปลี่ยนรหัสใหม่เท่ากับจริง | |
| T-ADM-05 | api | AC-ADMIN-05 | `server/tests/lab-03/users-admin.api.test.ts` | ตั้งอีเมลซ้ำกับที่มีอยู่เดิม | 409 Conflict | |
| T-ADM-06 | api | AC-ADMIN-06 | `server/tests/lab-03/users-admin.api.test.ts` | เลือกระบุบทบาทมั่วไม่มีจริง | 422 Unprocessable Entity | |
| T-ADM-07 | api | AC-ADMIN-07 | `server/tests/lab-03/users-admin.api.test.ts` | แก้ไขข้อมูลตัวบุคคล | อัปเดตข้อมูลสำเร็จ | |
| T-ADM-08 | security | AC-ADMIN-14 | `server/tests/lab-03/users-admin.api.test.ts` | แอดมินจงใจปิดบัญชีตนเอง | 403 Forbidden | |
| T-ADM-09 | security | AC-ADMIN-15 | `server/tests/lab-03/users-admin.api.test.ts` | สั่งปิดบัญชีแอดมินคนสุดท้าย | 409 Conflict | |
| T-ADM-10 | api | AC-ADMIN-10 | `server/tests/lab-03/users-admin.api.test.ts` | รีเซ็ตรหัสผ่านใหม่ | 200 OK และสถานะต้องเปลี่ยนรหัสต้องเป็นจริง | |
| T-ADM-11 | security | AC-ADMIN-16 | `server/tests/lab-03/users-admin.api.test.ts` | ลักลอบเข้าดูหลังบ้านโดยคนที่ไม่ใช่ผู้ดูแลระบบ | 403 Forbidden | |
| T-ADM-12 | security | AC-ADMIN-17 | `server/tests/lab-03/users-admin.api.test.ts` | ลักลอบเข้าดูโดยไม่ได้เข้าสู่ระบบ | 401 Unauthorized | |
| U-LOG-01 | ui-component | AC-01 | `client/src/components/lab-03/Login.test.tsx` | เรนเดอร์กล่องรับอีเมล รหัสผ่าน และปุ่มส่ง | ต้องเห็นและโต้ตอบได้ | |
| U-LOG-02 | ui-component | AC-02 | `client/src/components/lab-03/Login.test.tsx` | ล็อกอินสำเร็จ | เชื่อมผ่าน API และนำทางไปหน้าแรก | |
| U-LOG-03 | ui-component | AC-03 | `client/src/components/lab-03/Login.test.tsx` | กดปุ่มล็อกอินโดยไม่กรอกข้อมูล | แสดงคำเตือนกรอบสีแดงอินไลน์ | |
| U-LOG-04 | ui-component | AC-04 | `client/src/components/lab-03/Login.test.tsx` | API ตอบกลับ 401 | ข้อความโชว์แบบกว้างขวางไม่เจาะจงจุด | |
| U-LOG-05 | ui-component | AC-11 | `client/src/components/lab-03/Login.test.tsx` | สถานะกำลังรับส่ง | ปรากฏเครื่องหมายโหลดข้อมูล | |
| U-PW-01 | ui-component | AC-07 | `client/src/components/lab-03/ChangePassword.test.tsx` | เรนเดอร์ช่องพาสใหม่และพาสยืนยัน | แสดงฟอร์มครบ | |
| U-PW-02 | ui-component | AC-08 | `client/src/components/lab-03/ChangePassword.test.tsx` | พิมพ์รหัสไม่ตรงกันสองช่อง | แสดงข้อผิดพลาดแบบอินไลน์ ปุ่มกดไปต่อไม่ได้ | |
| U-PW-03 | ui-component | AC-09 | `client/src/components/lab-03/ChangePassword.test.tsx` | รหัสใหม่สั้นเกินไป | ได้รับ 422 โชว์แจ้งเตือน | |
| U-PW-04 | ui-component | AC-08 | `client/src/components/lab-03/ChangePassword.test.tsx` | เปลี่ยนสำเร็จ | ระบบพานำทางกลับสู่ App Shell | |
| U-SQ-01 | responsive | AC-QUEUE-07 | `client/src/components/lab-03/StaffTicketQueue.test.tsx` | เปิดหน้าระบบตารางคิว (เดสก์ท็อป) | ตารางและคอลัมน์ครบตามดีไซน์ | |
| U-SQ-02 | responsive | AC-QUEUE-08 | `client/src/components/lab-03/StaffTicketQueue.test.tsx` | เปิดหน้าในมือถือ | แสดงเป็นบัตรรายการ | |
| U-SQ-03 | ui-component | AC-QUEUE-09 | `client/src/components/lab-03/StaffTicketQueue.test.tsx` | กรณีระหว่างรอข้อมูล | แสดง Skeleton loader คั่น | |
| U-SQ-04 | ui-component | AC-QUEUE-10 | `client/src/components/lab-03/StaffTicketQueue.test.tsx` | ตารางโล่งหรือผลค้นหาว่างเปล่า | แสดงอาร์ตเวิร์กแสดงความว่างเปล่าชัดเจน | |
| U-SQ-05 | ui-component | AC-QUEUE-11 | `client/src/components/lab-03/StaffTicketQueue.test.tsx` | เชื่อมข้อมูลไม่ได้ API แจ้งพัง | แสดงแจ้งเตือนอย่างละมุนละม่อม | |
| U-SD-01 | ui-component | AC-DETAIL-08 | `client/src/components/lab-03/StaffTicketDetail.test.tsx` | เรนเดอร์ฟิลด์ทั้งหมด ไฟล์แนบ การตอบโต้ | เรนเดอร์สำเร็จไม่มีตกหล่น | |
| U-SD-02 | ui-component | AC-DETAIL-10 | `client/src/components/lab-03/StaffTicketDetail.test.tsx` | ผู้ใช้งานตั้งธงรับเรื่องเรียบร้อย | มีเครื่องหมายแจ้งว่าเจ้าของรับเรื่องแล้วปรากฏ | |
| U-SD-03 | ui-component | AC-DETAIL-11 | `client/src/components/lab-03/StaffTicketDetail.test.tsx` | เปิดโดย `IT_STAFF` | สามารถมองเห็นแบบฟอร์มปรับเปลี่ยนได้อิสระ | |
| U-SD-04 | ui-component | AC-DETAIL-12 | `client/src/components/lab-03/StaffTicketDetail.test.tsx` | เปิดโดย `REQUESTER` แบบโหมดอ่าน | ฟิลด์ปรับเปลี่ยนหายไป เป็นข้อความแข็งอ่านได้อย่างเดียว | |
| U-SD-05 | ui-component | AC-DETAIL-13 | `client/src/components/lab-03/StaffTicketDetail.test.tsx` | พิมพ์โน้ตภายในเปล่าๆ | ปุ่มส่งถูกระงับ หรือมีข้อความแจ้งเตือนสีแดง | |
| U-UM-01 | ui-component | AC-ADMIN-13 | `client/src/components/lab-03/UserManagement.test.tsx` | เรนเดอร์ตารางและคอลัมน์ | มีชื่อ อีเมล โดเมน สถานะ และปุ่มแก้ไข | |
| U-UM-02 | ui-component | AC-ADMIN-13 | `client/src/components/lab-03/UserManagement.test.tsx` | พิมพ์ในช่องค้นหา | ริสต์ในตารางหดสั้นลงตามคีย์เวิร์ด | |
| U-UM-03 | ui-component | AC-ADMIN-14 | `client/src/components/lab-03/UserManagement.test.tsx` | สร้างใหม่ | มีโมดอล / กรอบเพิ่มผู้ใช้งานเปิดออกมา | |
| U-UM-04 | ui-component | AC-ADMIN-15 | `client/src/components/lab-03/UserManagement.test.tsx` | กดปุ่มแก้ไขบนตารางคนเดิม | โมดอลเปิดออกพร้อมข้อมูลปัจจุบันพร้อมปรับแก้ | |
| U-UM-05 | ui-component | AC-ADMIN-16 | `client/src/components/lab-03/UserManagement.test.tsx` | กดปุ่มปิดสถานะแอคทีฟตนเอง | ถูกปฏิเสธพร้อมคำอธิบายแบบสวยงาม | |
| U-UM-06 | ui-component | AC-ADMIN-17 | `client/src/components/lab-03/UserManagement.test.tsx` | พังจากการส่ง API ล้มเหลว | แจ้งเตือนข้อผิดพลาดปลอดภัยต่อผู้ใช้งาน | |
| E-AUTH-01 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | ลำดับการล็อกอินสำเร็จอย่างราบรื่น | จบที่หน้าโฮมกรีนสกรีน | |
| E-AUTH-02 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | ป้อนข้อมูลมั่วซั่ว | หน้าจอโชว์แจ้งเตือน | |
| E-AUTH-03 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | ป้อนข้อมูลบัญชีที่ระงับแล้ว | โชว์แจ้งเตือนคำเดียวกับตอนมั่วข้อมูล | |
| E-AUTH-04 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | ล็อกอินครั้งแรก | นำพาสู่หน้าเปลี่ยนพาสเวิร์ดทันที | |
| E-AUTH-05 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | เปลี่ยนพาสใหม่เสร็จสิ้น | ผลักกลับหน้าปกติ | |
| E-AUTH-06 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | เมื่อกดออกระบบแล้วพยายามลักลอบเปิดหน้า | ดีดกลับหน้าเริ่มระบบ | |
| E-STF-01 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | เจ้าหน้าที่ล็อกอิน | เด้งหน้าตารางคิวแรก | |
| E-STF-02 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | ค้นหาคิว | ไดนามิกปรับการค้นหา | |
| E-STF-03 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | กรองสถานะ | โชว์คิวที่ตรงกรอง | |
| E-STF-04 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | กดเข้าหน้าตั๋วคิวงานในรายการ | เปลี่ยนมุมมอง | |
| E-STF-05 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | กดยอมรับดูแลคิว | เจ้าของตั๋วบนหน้ากระดาษเปลี่ยน | |
| E-STF-06 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | ดึงค่าความสำคัญแบบใหม่ | เปลี่ยนบนตารางทันควัน | |
| E-STF-07 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | กดปุ่มขยับสถานะ | ทำงานข้ามแดนทรานสิชันสำเร็จ | |
| E-STF-08 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | โพสต์ความเห็นตอบ | โชว์ขึ้นบนพื้นที่ทันที | |
| E-STF-09 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | โพสต์บันทึกเฉพาะส่วนตัว (Admin/Staff) | โชว์ขึ้นแผงงาน และซ่อนไม่ให้คนร้องเรียนเห็นเด็ดขาด | |
| E-ADM-01 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | แอดมินเข้าระบบ | เด้งเข้าสู่หน้าผังบัญชีผู้ใช้ | |
| E-ADM-02 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | ข้อมูลโหลดครบ | ตารางมีโชว์ทุกอย่างพร้อม | |
| E-ADM-03 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | ค้นชื่อ | เจอทันที | |
| E-ADM-04 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | กรองโรล | แยกแผนกผู้ใช้ได้ | |
| E-ADM-05 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | กดบวกคน | เห็นไอดีพร้อมสถานะบังคับเซ็ตพาส | |
| E-ADM-06 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | เพิ่มซ้ำอีเมล | ข้อความสีแดงถูกพ่นมา | |
| E-ADM-07 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | แก้บทบาท อีเมล ชื่อเล่น | ของใหม่สวมทับของเก่าทันที | |
| E-ADM-08 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | แปะรหัสผ่านใหม่ | แฟล็กการเปลี่ยนรหัสถูกขึงให้แอคทีฟ | |
| E-ADM-09 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | สับสวิตช์ปิดตัวเอง | โดนสั่งห้ามอย่างรุนแรง | |
| E-ADM-10 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | ถอดแอดมินคนเดียวที่เหลือรอด | โดนสั่งห้ามระบบล็อค | |
