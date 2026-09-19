# แผนการทดสอบแบบก่อนการพัฒนา (Pre-implementation Test Plan) - Lab 3

เอกสารนี้ระบุรายละเอียดของการทดสอบเพื่อรับรองความถูกต้องของระบบตามเกณฑ์การยอมรับ (Acceptance Criteria) โดยครอบคลุมทั้งแบบหน่วยย่อย แบบบูรณาการ และแบบครบวงจร

| รหัสทดสอบ (TestID) | ประเภท (Type) | อ้างอิงเกณฑ์ (AC Mapping) | ไฟล์ที่จะใช้ทดสอบ (Test File Path) | รายละเอียด (Description) | ผลลัพธ์ที่คาดหวัง (Expected Result) | สถานะสุดท้าย (Final Status) |
|---|---|---|---|---|---|---|
| T-AUTH-01 | api | AC-AUTH-01 | `server/tests/lab-03/auth.api.test.ts` | ล็อกอินด้วยบัญชีที่ถูกต้อง | 200 OK แสดงข้อมูลระบุตัวตน (ไม่มี `passwordHash`) | ✅ Pass |
| T-AUTH-02 | api | AC-AUTH-02 | `server/tests/lab-03/auth.api.test.ts` | ล็อกอินด้วยบัญชีที่ต้องเปลี่ยนรหัสผ่าน | ข้อมูลคืนค่ามามีสถานะ `requiresPasswordChange=true` | ✅ Pass |
| T-AUTH-03 | api | AC-AUTH-03 | `server/tests/lab-03/auth.api.test.ts` | ล็อกอินเมื่อบัญชีถูกปิดการใช้งาน (Inactive) | 401 Unauthorized พร้อมข้อความทั่วไป | ✅ Pass |
| T-AUTH-04 | api | AC-AUTH-04 | `server/tests/lab-03/auth.api.test.ts` | ล็อกอินเมื่อใส่รหัสผ่านผิด | 401 Unauthorized ข้อมูลเหมือนกับตอนระบุบัญชีผิด | ✅ Pass |
| T-AUTH-05 | api | AC-AUTH-05 | `server/tests/lab-03/auth.api.test.ts` | กดปุ่มล็อกเอาต์ | 200 OK และเซสชันถูกยกเลิก (ลองใช้ api อีกครั้งต้องเจอ 401) | ✅ Pass |
| T-AUTH-06 | api | AC-AUTH-06 | `server/tests/lab-03/auth.api.test.ts` | ดึงข้อมูลโปรไฟล์ผู้ใช้งานปัจจุบัน (`GET /auth/me`) | 200 OK แสดงข้อมูลโปรไฟล์ | ✅ Pass |
| T-AUTH-07 | api | AC-AUTH-07 | `server/tests/lab-03/auth.api.test.ts` | ดึงโปรไฟล์เมื่อไม่ได้ล็อกอิน | 401 Unauthorized | ✅ Pass |
| T-AUTH-08 | api | AC-AUTH-08 | `server/tests/lab-03/auth.api.test.ts` | เปลี่ยนรหัสผ่านให้บัญชี (ข้อมูลครบและถูกต้อง) | 200 OK และระบบตั้งค่า `requiresPasswordChange=false` | ✅ Pass |
| T-AUTH-09 | api | AC-AUTH-09 | `server/tests/lab-03/auth.api.test.ts` | เปลี่ยนรหัสผ่านแต่น้อยกว่า 8 ตัวอักษร | 422 Unprocessable Entity | ✅ Pass |
| T-AUTH-10 | api | AC-AUTH-10 | `server/tests/lab-03/auth.api.test.ts` | ตรวจสอบข้อมูลหลุดรั่ว | ผลลัพธ์ทุกรายการจะต้องไม่แสดง `passwordHash` | ✅ Pass |
| T-ZAUTH-01 | security | AC-10, AC-12 | `server/tests/lab-03/authorization.api.test.ts` | เข้าใช้ Endpoint ป้องกัน โดยไม่ได้ยืนยันตัวตน | 401 Unauthorized ตอบกลับทุกครั้ง | ✅ Pass |
| T-ZAUTH-02 | security | AC-12 | `server/tests/lab-03/authorization.api.test.ts` | `REQUESTER` พยายามไปที่ `/staff/tickets` | 403 Forbidden | ✅ Pass |
| T-ZAUTH-03 | security | AC-12 | `server/tests/lab-03/authorization.api.test.ts` | `REQUESTER` พยายามไปที่ `/admin/users` | 403 Forbidden | ✅ Pass |
| T-ZAUTH-04 | security | AC-12 | `server/tests/lab-03/authorization.api.test.ts` | `IT_STAFF` พยายามไปที่ `/admin/users` | 403 Forbidden | ✅ Pass |
| T-ZAUTH-05 | security | AC-10 | `server/tests/lab-03/authorization.api.test.ts` | `REQUESTER` เปิดตั๋วของผู้อื่น | 403 Forbidden | ✅ Pass |
| T-ZAUTH-06 | security | AC-10 | `server/tests/lab-03/authorization.api.test.ts` | `REQUESTER` ขอเรียกดูบันทึกภายใน | 403 Forbidden และห้ามมีข้อความบันทึกกลับออกมา | ✅ Pass |
| T-Q-01 | api | AC-QUEUE-01 | `server/tests/lab-03/staff-queue.api.test.ts` | เรียก `/staff/tickets` โดยไม่ใส่พารามิเตอร์ | 200 OK ได้รับรายการตั๋วและ metadata การแบ่งหน้า | ✅ Pass |
| T-Q-02 | api | AC-QUEUE-02 | `server/tests/lab-03/staff-queue.api.test.ts` | ค้นหา `search=keyword` บนคิวงาน | คืนค่าข้อมูลตั๋วที่มีคีย์เวิร์ดปรากฏ | ✅ Pass |
| T-Q-03 | api | AC-QUEUE-03 | `server/tests/lab-03/staff-queue.api.test.ts` | ค้นหาตามตัวกรอง `status=IN_PROGRESS` | คืนค่าข้อมูลที่ตรงกับตัวกรองเท่านั้น | ✅ Pass |
| T-Q-04 | api | AC-QUEUE-04 | `server/tests/lab-03/staff-queue.api.test.ts` | เรียงลำดับ `sort=createdAt&direction=desc` | ได้รับข้อมูลเรียงแบบลดหลั่นอย่างถูกต้อง | ✅ Pass |
| T-Q-05 | api | AC-QUEUE-05 | `server/tests/lab-03/staff-queue.api.test.ts` | แบ่งหน้า `page=2&pageSize=10` | ระบบส่งคืนข้อมูลเฉพาะของหน้าที่ 2 อย่างถูกต้อง | ✅ Pass |
| T-Q-06 | api | AC-QUEUE-06 | `server/tests/lab-03/staff-queue.api.test.ts` | ใส่สถานะ enum และค่าการเรียงลำดับผิด | 400 Bad Request | ✅ Pass |
| T-Q-07 | security | AC-QUEUE-12 | `server/tests/lab-03/staff-queue.api.test.ts` | `REQUESTER` แอบเปิดระบบดูคิวของระบบส่วนกลาง | 403 Forbidden | ✅ Pass |
| T-DTL-01 | api | AC-DETAIL-01 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | เปิดดูรายละเอียดตั๋ว `/staff/tickets/:id` | ได้รับข้อมูลทั้งหมดครบถ้วน รวมผู้รับผิดชอบและความเห็น | ✅ Pass |
| T-DTL-02 | api | AC-DETAIL-02 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ตั้งค่าผู้รับผิดชอบด้วยไอดีบทบาท `IT_STAFF` | 200 OK | ✅ Pass |
| T-DTL-03 | api | AC-DETAIL-03 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ยัดเยียดผู้รับผิดชอบไปให้คนระดับ `REQUESTER` | 422 Unprocessable Entity | ✅ Pass |
| T-DTL-04 | api | AC-DETAIL-04 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ตั้งเจ้าของตั๋วเป็นไอดีของผู้ใช้ที่ไม่มีสถานะ Active | 422 Unprocessable Entity | ✅ Pass |
| T-DTL-05 | api | AC-DETAIL-05 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | เปลี่ยนสถานะไอทีเป็นค่าที่ถูกต้อง | 200 OK | ✅ Pass |
| T-DTL-06 | api | AC-DETAIL-06 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ปรับสถานะทำได้ เช่น `NEW` ไป `OPEN` | 200 OK เป็นทรานสิชั่นที่อนุญาต | ✅ Pass |
| T-DTL-07 | api | AC-DETAIL-07 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ฝืนปรับสถานะ เช่น `RESOLVED` ไป `NEW` | 422 Unprocessable Entity ไม่อนุญาต | ✅ Pass |
| T-DTL-08 | security | AC-DETAIL-14 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `REQUESTER` แอบส่ง PATCH สถานะ | 403 Forbidden | ✅ Pass |
| T-DTL-09 | security | AC-DETAIL-14 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `REQUESTER` เข้าดูตั๋วในฝั่ง IT | 403 Forbidden | ✅ Pass |
| T-CMT-01 | api | AC-REQ-05 | `server/tests/lab-03/comments-notes.api.test.ts` | พิมพ์คอมเมนต์และกดบันทึก | 201 Created ระบุตัวตนผู้แสดงความเห็น | ✅ Pass |
| T-CMT-02 | api | AC-REQ-06 | `server/tests/lab-03/comments-notes.api.test.ts` | พิมพ์คอมเมนต์แบบว่างเปล่า | 422 Unprocessable Entity | ✅ Pass |
| T-CMT-03 | api | AC-DETAIL-08 | `server/tests/lab-03/comments-notes.api.test.ts` | พิมพ์บันทึกภายใน (Internal Note) ในฐานะแอดมิน | 201 Created | ✅ Pass |
| T-CMT-04 | security | AC-DETAIL-09 | `server/tests/lab-03/comments-notes.api.test.ts` | พิมพ์บันทึกภายในแบบไม่ได้รับอนุญาต (Requester) | 403 Forbidden | ✅ Pass |
| T-CMT-05 | security | AC-REQ-08 | `server/tests/lab-03/comments-notes.api.test.ts` | อ่านบันทึกภายในในบทบาท (Requester) | 403 Forbidden ข้อมูลไม่หลุดรอด | ✅ Pass |
| T-CMT-06 | api | AC-REQ-07 | `server/tests/lab-03/comments-notes.api.test.ts` | ติ๊กธงว่าแก้ปัญหาแล้วสำหรับฝั่ง `REQUESTER` | 200 OK เปลี่ยนค่าธง แต่สถานะไม่ปรับเป็น Resolved | ✅ Pass |
| T-ADM-01 | api | AC-ADMIN-01 | `server/tests/lab-03/users-admin.api.test.ts` | โหลดรายการผู้ใช้งานทั้งหมด | 200 OK ได้รับรายชื่อ โดยไม่มีรหัสผ่านที่แฮชแล้ว | ✅ Pass |
| T-ADM-02 | api | AC-ADMIN-02 | `server/tests/lab-03/users-admin.api.test.ts` | ค้นหา `search=alice` | รายชื่อถูกกรองเรียบร้อย | ✅ Pass |
| T-ADM-03 | api | AC-ADMIN-03 | `server/tests/lab-03/users-admin.api.test.ts` | ค้นหาแบบกรอง `role=IT_STAFF` | คืนเฉพาะผู้ที่มีบทบาทระบุ | ✅ Pass |
| T-ADM-04 | api | AC-ADMIN-04 | `server/tests/lab-03/users-admin.api.test.ts` | เพิ่มผู้ใช้ใหม่ด้วยข้อมูลที่สมบูรณ์ | 201 Created สถานะบังคับเปลี่ยนรหัสใหม่เท่ากับจริง | ✅ Pass |
| T-ADM-05 | api | AC-ADMIN-05 | `server/tests/lab-03/users-admin.api.test.ts` | ตั้งอีเมลซ้ำกับที่มีอยู่เดิม | 409 Conflict | ✅ Pass |
| T-ADM-06 | api | AC-ADMIN-06 | `server/tests/lab-03/users-admin.api.test.ts` | เลือกระบุบทบาทมั่วไม่มีจริง | 422 Unprocessable Entity | ✅ Pass |
| T-ADM-07 | api | AC-ADMIN-07 | `server/tests/lab-03/users-admin.api.test.ts` | แก้ไขข้อมูลตัวบุคคล | อัปเดตข้อมูลสำเร็จ | ✅ Pass |
| T-ADM-08 | security | AC-ADMIN-14 | `server/tests/lab-03/users-admin.api.test.ts` | แอดมินจงใจปิดบัญชีตนเอง | 403 Forbidden | ✅ Pass |
| T-ADM-09 | security | AC-ADMIN-15 | `server/tests/lab-03/users-admin.api.test.ts` | สั่งปิดบัญชีแอดมินคนสุดท้าย | 409 Conflict | ✅ Pass |
| T-ADM-10 | api | AC-ADMIN-10 | `server/tests/lab-03/users-admin.api.test.ts` | รีเซ็ตรหัสผ่านใหม่ | 200 OK และสถานะต้องเปลี่ยนรหัสต้องเป็นจริง | ✅ Pass |
| T-ADM-11 | security | AC-ADMIN-16 | `server/tests/lab-03/users-admin.api.test.ts` | ลักลอบเข้าดูหลังบ้านโดยคนที่ไม่ใช่ผู้ดูแลระบบ | 403 Forbidden | ✅ Pass |
| T-ADM-12 | security | AC-ADMIN-17 | `server/tests/lab-03/users-admin.api.test.ts` | ลักลอบเข้าดูโดยไม่ได้เข้าสู่ระบบ | 401 Unauthorized | ✅ Pass |
| U-LOG-01 | ui-component | AC-01 | `client/src/components/lab-03/Login.test.tsx` | เรนเดอร์กล่องรับอีเมล รหัสผ่าน และปุ่มส่ง | ต้องเห็นและโต้ตอบได้ | ✅ Pass |
| U-LOG-02 | ui-component | AC-02 | `client/src/components/lab-03/Login.test.tsx` | ล็อกอินสำเร็จ | เชื่อมผ่าน API และนำทางไปหน้าแรก | ✅ Pass |
| U-LOG-03 | ui-component | AC-03 | `client/src/components/lab-03/Login.test.tsx` | กดปุ่มล็อกอินโดยไม่กรอกข้อมูล | แสดงคำเตือนกรอบสีแดงอินไลน์ | ✅ Pass |
| U-LOG-04 | ui-component | AC-04 | `client/src/components/lab-03/Login.test.tsx` | API ตอบกลับ 401 | ข้อความโชว์แบบกว้างขวางไม่เจาะจงจุด | ✅ Pass |
| U-LOG-05 | ui-component | AC-11 | `client/src/components/lab-03/Login.test.tsx` | สถานะกำลังรับส่ง | ปรากฏเครื่องหมายโหลดข้อมูล | ✅ Pass |
| U-PW-01 | ui-component | AC-07 | `client/src/components/lab-03/ChangePassword.test.tsx` | เรนเดอร์ช่องพาสใหม่และพาสยืนยัน | แสดงฟอร์มครบ | ✅ Pass |
| U-PW-02 | ui-component | AC-08 | `client/src/components/lab-03/ChangePassword.test.tsx` | พิมพ์รหัสไม่ตรงกันสองช่อง | แสดงข้อผิดพลาดแบบอินไลน์ ปุ่มกดไปต่อไม่ได้ | ✅ Pass |
| U-PW-03 | ui-component | AC-09 | `client/src/components/lab-03/ChangePassword.test.tsx` | รหัสใหม่สั้นเกินไป | ได้รับ 422 โชว์แจ้งเตือน | ✅ Pass |
| U-PW-04 | ui-component | AC-08 | `client/src/components/lab-03/ChangePassword.test.tsx` | เปลี่ยนสำเร็จ | ระบบพานำทางกลับสู่ App Shell | ✅ Pass |
| U-SQ-01 | responsive | AC-QUEUE-07 | `client/src/components/lab-03/StaffTicketQueue.test.tsx` | เปิดหน้าระบบตารางคิว (เดสก์ท็อป) | ตารางและคอลัมน์ครบตามดีไซน์ | ✅ Pass |
| U-SQ-02 | responsive | AC-QUEUE-08 | `client/src/components/lab-03/StaffTicketQueue.test.tsx` | เปิดหน้าในมือถือ | แสดงเป็นบัตรรายการ | ✅ Pass |
| U-SQ-03 | ui-component | AC-QUEUE-09 | `client/src/components/lab-03/StaffTicketQueue.test.tsx` | กรณีระหว่างรอข้อมูล | แสดง Skeleton loader คั่น | ✅ Pass |
| U-SQ-04 | ui-component | AC-QUEUE-10 | `client/src/components/lab-03/StaffTicketQueue.test.tsx` | ตารางโล่งหรือผลค้นหาว่างเปล่า | แสดงอาร์ตเวิร์กแสดงความว่างเปล่าชัดเจน | ✅ Pass |
| U-SQ-05 | ui-component | AC-QUEUE-11 | `client/src/components/lab-03/StaffTicketQueue.test.tsx` | เชื่อมข้อมูลไม่ได้ API แจ้งพัง | แสดงแจ้งเตือนอย่างละมุนละม่อม | ✅ Pass |
| U-SD-01 | ui-component | AC-DETAIL-08 | `client/src/components/lab-03/StaffTicketDetail.test.tsx` | เรนเดอร์ฟิลด์ทั้งหมด ไฟล์แนบ การตอบโต้ | เรนเดอร์สำเร็จไม่มีตกหล่น | ✅ Pass |
| U-SD-02 | ui-component | AC-DETAIL-10 | `client/src/components/lab-03/StaffTicketDetail.test.tsx` | ผู้ใช้งานตั้งธงรับเรื่องเรียบร้อย | มีเครื่องหมายแจ้งว่าเจ้าของรับเรื่องแล้วปรากฏ | ✅ Pass |
| U-SD-03 | ui-component | AC-DETAIL-11 | `client/src/components/lab-03/StaffTicketDetail.test.tsx` | เปิดโดย `IT_STAFF` | สามารถมองเห็นแบบฟอร์มปรับเปลี่ยนได้อิสระ | ✅ Pass |
| U-SD-04 | ui-component | AC-DETAIL-12 | `client/src/components/lab-03/StaffTicketDetail.test.tsx` | เปิดโดย `REQUESTER` แบบโหมดอ่าน | ฟิลด์ปรับเปลี่ยนหายไป เป็นข้อความแข็งอ่านได้อย่างเดียว | ✅ Pass |
| U-SD-05 | ui-component | AC-DETAIL-13 | `client/src/components/lab-03/StaffTicketDetail.test.tsx` | พิมพ์โน้ตภายในเปล่าๆ | ปุ่มส่งถูกระงับ หรือมีข้อความแจ้งเตือนสีแดง | ✅ Pass |
| U-UM-01 | ui-component | AC-ADMIN-13 | `client/src/components/lab-03/UserManagement.test.tsx` | เรนเดอร์ตารางและคอลัมน์ | มีชื่อ อีเมล โดเมน สถานะ และปุ่มแก้ไข | ✅ Pass |
| U-UM-02 | ui-component | AC-ADMIN-13 | `client/src/components/lab-03/UserManagement.test.tsx` | พิมพ์ในช่องค้นหา | ริสต์ในตารางหดสั้นลงตามคีย์เวิร์ด | ✅ Pass |
| U-UM-03 | ui-component | AC-ADMIN-14 | `client/src/components/lab-03/UserManagement.test.tsx` | สร้างใหม่ | มีโมดอล / กรอบเพิ่มผู้ใช้งานเปิดออกมา | ✅ Pass |
| U-UM-04 | ui-component | AC-ADMIN-15 | `client/src/components/lab-03/UserManagement.test.tsx` | กดปุ่มแก้ไขบนตารางคนเดิม | โมดอลเปิดออกพร้อมข้อมูลปัจจุบันพร้อมปรับแก้ | ✅ Pass |
| U-UM-05 | ui-component | AC-ADMIN-16 | `client/src/components/lab-03/UserManagement.test.tsx` | กดปุ่มปิดสถานะแอคทีฟตนเอง | ถูกปฏิเสธพร้อมคำอธิบายแบบสวยงาม | ✅ Pass |
| U-UM-06 | ui-component | AC-ADMIN-17 | `client/src/components/lab-03/UserManagement.test.tsx` | พังจากการส่ง API ล้มเหลว | แจ้งเตือนข้อผิดพลาดปลอดภัยต่อผู้ใช้งาน | ✅ Pass |
| E-AUTH-01 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | ลำดับการล็อกอินสำเร็จอย่างราบรื่น | จบที่หน้าโฮมกรีนสกรีน | ✅ Pass |
| E-AUTH-02 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | ป้อนข้อมูลมั่วซั่ว | หน้าจอโชว์แจ้งเตือน | ✅ Pass |
| E-AUTH-03 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | ป้อนข้อมูลบัญชีที่ระงับแล้ว | โชว์แจ้งเตือนคำเดียวกับตอนมั่วข้อมูล | ✅ Pass |
| E-AUTH-04 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | ล็อกอินครั้งแรก | นำพาสู่หน้าเปลี่ยนพาสเวิร์ดทันที | ✅ Pass |
| E-AUTH-05 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | เปลี่ยนพาสใหม่เสร็จสิ้น | ผลักกลับหน้าปกติ | ✅ Pass |
| E-AUTH-06 | e2e | AC-E2E-01 | `e2e/lab-03/authentication.spec.ts` | เมื่อกดออกระบบแล้วพยายามลักลอบเปิดหน้า | ดีดกลับหน้าเริ่มระบบ | ✅ Pass |
| E-STF-01 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | เจ้าหน้าที่ล็อกอิน | เด้งหน้าตารางคิวแรก | ✅ Pass |
| E-STF-02 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | ค้นหาคิว | ไดนามิกปรับการค้นหา | ✅ Pass |
| E-STF-03 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | กรองสถานะ | โชว์คิวที่ตรงกรอง | ✅ Pass |
| E-STF-04 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | กดเข้าหน้าตั๋วคิวงานในรายการ | เปลี่ยนมุมมอง | ✅ Pass |
| E-STF-05 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | กดยอมรับดูแลคิว | เจ้าของตั๋วบนหน้ากระดาษเปลี่ยน | ✅ Pass |
| E-STF-06 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | ดึงค่าความสำคัญแบบใหม่ | เปลี่ยนบนตารางทันควัน | ✅ Pass |
| E-STF-07 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | กดปุ่มขยับสถานะ | ทำงานข้ามแดนทรานสิชันสำเร็จ | ✅ Pass |
| E-STF-08 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | โพสต์ความเห็นตอบ | โชว์ขึ้นบนพื้นที่ทันที | ✅ Pass |
| E-STF-09 | e2e | AC-E2E-02 | `e2e/lab-03/staff-ticket-flow.spec.ts` | โพสต์บันทึกเฉพาะส่วนตัว (Admin/Staff) | โชว์ขึ้นแผงงาน และซ่อนไม่ให้คนร้องเรียนเห็นเด็ดขาด | ✅ Pass |
| E-ADM-01 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | แอดมินเข้าระบบ | เด้งเข้าสู่หน้าผังบัญชีผู้ใช้ | ✅ Pass |
| E-ADM-02 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | ข้อมูลโหลดครบ | ตารางมีโชว์ทุกอย่างพร้อม | ✅ Pass |
| E-ADM-03 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | ค้นชื่อ | เจอทันที | ✅ Pass |
| E-ADM-04 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | กรองโรล | แยกแผนกผู้ใช้ได้ | ✅ Pass |
| E-ADM-05 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | กดบวกคน | เห็นไอดีพร้อมสถานะบังคับเซ็ตพาส | ✅ Pass |
| E-ADM-06 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | เพิ่มซ้ำอีเมล | ข้อความสีแดงถูกพ่นมา | ✅ Pass |
| E-ADM-07 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | แก้บทบาท อีเมล ชื่อเล่น | ของใหม่สวมทับของเก่าทันที | ✅ Pass |
| E-ADM-08 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | แปะรหัสผ่านใหม่ | แฟล็กการเปลี่ยนรหัสถูกขึงให้แอคทีฟ | ✅ Pass |
| E-ADM-09 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | สับสวิตช์ปิดตัวเอง | โดนสั่งห้ามอย่างรุนแรง | ✅ Pass |
| E-ADM-10 | e2e | AC-E2E-03 | `e2e/lab-03/user-administration.spec.ts` | ถอดแอดมินคนเดียวที่เหลือรอด | โดนสั่งห้ามระบบล็อค | ✅ Pass |
 
  [ 1 m  [ 7 m  [ 3 6 m   R U N    [ 3 9 m  [ 2 7 m  [ 2 2 m    [ 3 6 m v 2 . 1 . 9    [ 3 9 m  [ 9 0 m C : / K M U T T / S E / t o k t i c k i t / s e r v e r  [ 3 9 m  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / m i g r a t i o n . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 2 1   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   2 1 9  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m U n a u t h e n t i c a t e d   r e q u e s t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   G E T   / a u t h / m e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / m e  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m U n a u t h e n t i c a t e d   r e q u e s t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   P O S T   / a u t h / l o g o u t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / l o g o u t  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 1   B�    m i s s i n g   X - R e q u e s t e r - I d   h e a d e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m U n a u t h e n t i c a t e d   r e q u e s t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   G E T   / a p i / t i c k e t s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m U n a u t h e n t i c a t e d   r e q u e s t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   G E T   / a p i / s t a f f / t i c k e t s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 1   B�    r e q u e s t e r   n o t   f o u n d   o r   i n a c t i v e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 4 0 1   a u t h   t o k e n   m i s s i n g  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 2 0 1   B�    c r e a t e s   t i c k e t   a n d   r e t u r n s   t i c k e t N u m b e r   T K T - 0 0 0 1  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    m i s s i n g   s u m m a r y  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    m i s s i n g   d e s c r i p t i o n  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    m i s s i n g   c a t e g o r y I d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    m i s s i n g   r e l a t e d S y s t e m I d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    m i s s i n g   r e q u e s t e d P r i o r i t y  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    i n v a l i d   r e q u e s t e d P r i o r i t y   v a l u e   ( U r g e n t   i s   n o t   a l l o w e d )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 2 0 1   B�    a c c e p t s   e a c h   o f   t h e   t h r e e   v a l i d   p r i o r i t i e s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 2 0 1   B�    a c c e p t s   e a c h   o f   t h e   t h r e e   v a l i d   p r i o r i t i e s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 2 0 1   B�    a c c e p t s   e a c h   o f   t h e   t h r e e   v a l i d   p r i o r i t i e s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    s u m m a r y   e x c e e d s   1 0 0   c h a r a c t e r s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    d e s c r i p t i o n   e x c e e d s   1 0 0 0   c h a r a c t e r s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    c a t e g o r y I d   r e f e r e n c e s   n o n - e x i s t e n t   c a t e g o r y  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    r e l a t e d S y s t e m I d   r e f e r e n c e s   n o n - e x i s t e n t   s y s t e m  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e s p o n s e   b o d y   i n c l u d e s   c a t e g o r y   a n d   r e l a t e d S y s t e m   n e s t e d   o b j e c t s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 5   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   1 6 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m R E Q U E S T E R   a c c e s s i n g   / s t a f f / t i c k e t s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / t e s t / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   a l l   u s e r s   f o r   A d m i n i s t r a t o r   B�    n o   p a s s w o r d H a s h  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   f u l l   t i c k e t   d e t a i l   f o r   I T   S t a f f  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m R E Q U E S T E R   a c c e s s i n g   / s t a f f / t i c k e t s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   a l l   u s e r s   f o r   A d m i n i s t r a t o r   B�    n o   p a s s w o r d H a s h  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   f u l l   t i c k e t   d e t a i l   f o r   I T   S t a f f  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 r e q u e s t e d   i d :   1   p a r s e d :    [ 3 3 m 1  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   f u l l   t i c k e t   d e t a i l   f o r   I T   S t a f f  
  [ 2 2 m  [ 3 9 m s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 1  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   2 0 0   w i t h   t i c k e t s   a n d   p a g i n a t i o n   m e t a d a t a   f o r   I T   S t a f f   ( n o   p a r a m s )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m R E Q U E S T E R   a c c e s s i n g   / a d m i n / u s e r s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / t e s t / a d m i n / u s e r s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m R E Q U E S T E R   a c c e s s i n g   / a d m i n / u s e r s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s   c r e a t e s   a   t i c k e t   u s i n g   t h e   a u t h e n t i c a t e d   r e q u e s t e r I d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   2 0 0   w i t h   t i c k e t s   a n d   p a g i n a t i o n   m e t a d a t a   f o r   I T   S t a f f   ( n o   p a r a m s )  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s   c r e a t e s   a   t i c k e t   u s i n g   t h e   a u t h e n t i c a t e d   r e q u e s t e r I d  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   s e a r c h   B�    c a s e - i n s e n s i t i v e   n a m e / e m a i l   m a t c h  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s ? s e a r c h = a l i c e  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m t i c k e t   i t e m s   c o n t a i n   r e q u i r e d   f i e l d s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m t i c k e t   i t e m s   c o n t a i n   r e q u i r e d   f i e l d s  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m r e q u e s t e r I d   i n   r e q u e s t   b o d y   i s   s i l e n t l y   i g n o r e d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s e a r c h   f i l t e r s   b y   s u m m a r y   ( c a s e - i n s e n s i t i v e )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s e a r c h = v p n  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m r e q u e s t e r I d   i n   r e q u e s t   b o d y   i s   s i l e n t l y   i g n o r e d  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s e a r c h   f i l t e r s   b y   s u m m a r y   ( c a s e - i n s e n s i t i v e )  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m s t o r e s   c o m m e n t   w i t h   c o r r e c t   a u t h o r I d   a n d   r e t u r n s   2 0 1  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s e a r c h   w i t h   n o   m a t c h i n g   k e y w o r d   r e t u r n s   e m p t y   a r r a y   w i t h   t o t a l   0  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s e a r c h = X Y Z N O N E X I S T E N T T E R M 1 2 3  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s e a r c h   w i t h   n o   m a t c h i n g   k e y w o r d   r e t u r n s   e m p t y   a r r a y   w i t h   t o t a l   0  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s   r e t u r n s   o n l y   t h e   a u t h e n t i c a t e d   u s e r   t i c k e t s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   s t a t u s   I N _ P R O G R E S S  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s t a t u s = I N _ P R O G R E S S  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   s t a t u s   N E W  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s t a t u s = N E W  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d   r e t u r n s   2 0 0   f o r   t h e   a u t h e n t i c a t e d   o w n e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 2  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   s t a t u s   N E W  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s o r t s   b y   c r e a t e d A t   d e s c e n d i n g  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s o r t = c r e a t e d A t & d i r e c t i o n = d e s c  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d   r e t u r n s   2 0 0   f o r   t h e   a u t h e n t i c a t e d   o w n e r  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s o r t s   b y   c r e a t e d A t   d e s c e n d i n g  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d   r e t u r n s   4 0 3   ( n o t   4 0 4 )   w h e n   a c c e s s i n g   a n o t h e r   u s e r   t i c k e t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 2  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s o r t s   b y   c r e a t e d A t   a s c e n d i n g  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s o r t = c r e a t e d A t & d i r e c t i o n = a s c  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m I T _ S T A F F   a c c e s s i n g   / a d m i n / u s e r s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / t e s t / a d m i n / u s e r s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m I T _ S T A F F   a c c e s s i n g   / a d m i n / u s e r s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / a t t a c h m e n t s   u p l o a d s   s u c c e s s f u l l y   f o r   t i c k e t   o w n e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 2 / a t t a c h m e n t s  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 8   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   8 7 1  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m R E Q U E S T E R   a c c e s s i n g   / s t a f f / t i c k e t s   r e t u r n s   4 0 3    [ 3 3 m 3 6 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   c o r r e c t   s e c o n d   p a g e   w i t h   p a g e S i z e = 2  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? p a g e = 1 & p a g e S i z e = 2 & s o r t = c r e a t e d A t & d i r e c t i o n = a s c  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / a t t a c h m e n t s   u p l o a d s   s u c c e s s f u l l y   f o r   t i c k e t   o w n e r  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   c o r r e c t   s e c o n d   p a g e   w i t h   p a g e S i z e = 2  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? p a g e = 2 & p a g e S i z e = 2 & s o r t = c r e a t e d A t & d i r e c t i o n = a s c  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   a u t h e n t i c a t e d   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   a u t h e n t i c a t e d   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / a t t a c h m e n t s   r e t u r n s   4 0 3   f o r   n o n - o w n e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 2 / a t t a c h m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / a t t a c h m e n t s   r e t u r n s   4 0 3   f o r   n o n - o w n e r  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   f o r   i n v a l i d   s t a t u s   v a l u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s t a t u s = I N V A L I D _ S T A T U S  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   f o r   i n v a l i d   s o r t   f i e l d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s o r t = n o n E x i s t e n t F i e l d  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m N o   e n d p o i n t   a c c e p t s   o r   a c t s   o n   a   c l i e n t - s u p p l i e d   r e q u e s t e r I d   q u e r y   p a r a m e t e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s ? r e q u e s t e r I d = c m u 7 v t o 9 k 0 0 0 1 c 1 v 2 k 7 f 2 e r b 1  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m N o   e n d p o i n t   a c c e p t s   o r   a c t s   o n   a   c l i e n t - s u p p l i e d   r e q u e s t e r I d   q u e r y   p a r a m e t e r  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   f o r   i n v a l i d   d i r e c t i o n   v a l u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? d i r e c t i o n = s i d e w a y s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   f o r   i n v a l i d   d i r e c t i o n   v a l u e  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m d o e s   N O T   r e t u r n   5 0 0   f o r   i n v a l i d   q u e r y   p a r a m s   ( a l w a y s   4 0 0 )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s t a t u s = % 2 7 ; % 2 0 D R O P % 2 0 T A B L E % 2 0 t i c k e t s ; % 2 0 - -  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 8   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   9 1 9  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   r o l e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s ? r o l e = I T _ S T A F F  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   r o l e  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 4   f o r   n o n - e x i s t e n t   t i c k e t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 9 9 9 9 9 9 9 9  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 4   f o r   n o n - e x i s t e n t   t i c k e t  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 r e q u e s t e d   i d :   9 9 9 9 9 9 9 9   p a r s e d :    [ 3 3 m 9 9 9 9 9 9 9 9  [ 3 9 m  
 s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 9 9 9 9 9 9 9 9  [ 3 9 m   f o u n d :    [ 3 3 m f a l s e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   e m p t y   c o n t e n t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   A D M I N I S T R A T O R   r e s u l t s   t h e   s a m e   a s   I T _ S T A F F  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   A D M I N I S T R A T O R   r e s u l t s   t h e   s a m e   a s   I T _ S T A F F  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   o w n e r I d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? o w n e r I d = c m u 7 v o l a 1 0 0 0 5 f m q h i m g x 5 g z p  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 7   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   1 1 3 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   I T _ S T A F F  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   o w n e r   t o   a   v a l i d   a c t i v e   I T _ S T A F F   u s e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / o w n e r  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   o w n e r   t o   a   v a l i d   a c t i v e   I T _ S T A F F   u s e r  
  [ 2 2 m  [ 3 9 m s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 1  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   w h i t e s p a c e - o n l y   c o n t e n t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m u n a s s i g n s   o w n e r   w h e n   o w n e r I d   i s   n u l l  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / o w n e r  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 1  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   w h e n   c o n t e n t   e x c e e d s   m a x   l e n g t h  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m c r e a t e s   a   u s e r   w i t h   r e q u i r e s P a s s w o r d C h a n g e = t r u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   w h e n   o w n e r I d   i s   a   R E Q U E S T E R   u s e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / o w n e r  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   w h e n   o w n e r I d   i s   a   R E Q U E S T E R   u s e r  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   w h e n   R e q u e s t e r   c o m m e n t s   o n   a n o t h e r   u s e r   t i c k e t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / l o g o u t  [ 2 m   >    [ 2 2 m  [ 2 m i n v a l i d a t e s   s e s s i o n   s o   s u b s e q u e n t   r e q u e s t s   r e t u r n   4 0 1  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / l o g o u t  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / l o g o u t  [ 2 m   >    [ 2 2 m  [ 2 m i n v a l i d a t e s   s e s s i o n   s o   s u b s e q u e n t   r e q u e s t s   r e t u r n   4 0 1  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / m e  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   w h e n   o w n e r I d   i s   a n   i n a c t i v e   I T _ S T A F F   u s e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / o w n e r  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m a l l o w s   I T _ S T A F F   t o   c o m m e n t   o n   a n y   t i c k e t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a u t h / m e  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   u s e r   i d e n t i t y   w i t h o u t   p a s s w o r d H a s h   f o r   a u t h e n t i c a t e d   u s e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / m e  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a u t h / m e  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   ( n o t   4 0 3   o r   4 0 4 )   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / m e  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 9   f o r   d u p l i c a t e   e m a i l  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / o w n e r  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   l i s t   o f   c o m m e n t s   i n   c h r o n o l o g i c a l   o r d e r   f o r   t i c k e t   o w n e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / c h a n g e - p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m c h a n g e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e   t o   f a l s e   o n   v a l i d   i n p u t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / c h a n g e - p a s s w o r d  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   i n v a l i d   r o l e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / p r i o r i t y  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   i t P r i o r i t y   f o r   I T   S t a f f  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / p r i o r i t y  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / p r i o r i t y  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   i t P r i o r i t y   f o r   I T   S t a f f  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 1  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   n o n - o w n e r   R e q u e s t e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / c h a n g e - p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m c h a n g e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e   t o   f a l s e   o n   v a l i d   i n p u t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / m e  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   u s e r   n a m e   a n d   e m a i l  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l 9 z 0 0 0 3 f m q h m q 3 4 c b i p  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   u s e r   n a m e   a n d   e m a i l  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / p r i o r i t y  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   i n v a l i d   p r i o r i t y   v a l u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / p r i o r i t y  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / p r i o r i t y  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   i n v a l i d   p r i o r i t y   v a l u e  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / n o t e s   a l l o w s   I T _ S T A F F   t o   p o s t   a n   i n t e r n a l   n o t e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / n o t e s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / n o t e s   a l l o w s   I T _ S T A F F   t o   p o s t   a n   i n t e r n a l   n o t e  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / c h a n g e - p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   w i t h   v a l i d a t i o n   d e t a i l s   w h e n   p a s s w o r d   i s   t o o   s h o r t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / c h a n g e - p a s s w o r d  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / c h a n g e - p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / c h a n g e - p a s s w o r d  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 1   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   2 5 9 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   P O S T   / a u t h / l o g i n  [ 2 m   >    [ 2 2 m r e t u r n s   2 0 0   w i t h   u s e r   i d e n t i t y   ( n o   p a s s w o r d H a s h )   f o r   v a l i d   a c t i v e   u s e r    [ 3 3 m 3 1 5  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   P O S T   / a u t h / c h a n g e - p a s s w o r d  [ 2 m   >    [ 2 2 m c h a n g e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e   t o   f a l s e   o n   v a l i d   i n p u t    [ 3 3 m 4 1 6  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   w h e n   A d m i n i s t r a t o r   t r i e s   t o   d e a c t i v a t e   t h e m s e l v e s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l a 5 0 0 0 9 f m q h o m l d o 7 t 8  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   w h e n   A d m i n i s t r a t o r   t r i e s   t o   d e a c t i v a t e   t h e m s e l v e s  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / p r i o r i t y  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / p r i o r i t y  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d / n o t e s   a l l o w s   I T _ S T A F F   t o   v i e w   i n t e r n a l   n o t e s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / n o t e s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d / n o t e s   a l l o w s   I T _ S T A F F   t o   v i e w   i n t e r n a l   n o t e s  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 9   w h e n   t r y i n g   t o   d e a c t i v a t e   t h e   l a s t   a c t i v e   A d m i n i s t r a t o r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l a 5 0 0 0 9 f m q h o m l d o 7 t 8  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 9   w h e n   t r y i n g   t o   d e a c t i v a t e   t h e   l a s t   a c t i v e   A d m i n i s t r a t o r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v r 7 c 5 0 0 0 0 9 q 4 q a w p q o 5 o 5  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 9   w h e n   t r y i n g   t o   d e a c t i v a t e   t h e   l a s t   a c t i v e   A d m i n i s t r a t o r  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m t r a n s i t i o n s   N E W   B�    O P E N   s u c c e s s f u l l y  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 4 7 / s t a t u s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m t r a n s i t i o n s   N E W   B�    O P E N   s u c c e s s f u l l y  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m t r a n s i t i o n s   N E W   B�    O P E N   s u c c e s s f u l l y  
  [ 2 2 m  [ 3 9 m s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 4 7  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / n o t e s   r e t u r n s   4 0 3   f o r   R E Q U E S T E R   ( n o   n o t e   c o n t e n t   i n   e r r o r )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / n o t e s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / n o t e s   r e t u r n s   4 0 3   f o r   R E Q U E S T E R   ( n o   n o t e   c o n t e n t   i n   e r r o r )  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 9   f o r   d u p l i c a t e   e m a i l   d u r i n g   e d i t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l 9 z 0 0 0 3 f m q h m q 3 4 c b i p  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m t r a n s i t i o n s   I N _ P R O G R E S S   B�    R E S O L V E D   s u c c e s s f u l l y  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 4 8 / s t a t u s  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 4 8  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d / n o t e s   r e t u r n s   4 0 3   f o r   R E Q U E S T E R   ( n o   n o t e   c o n t e n t   i n   e r r o r )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / n o t e s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d / p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e = t r u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l 9 z 0 0 0 3 f m q h m q 3 4 c b i p / p a s s w o r d  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d / p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e = t r u e  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   R E S O L V E D   B�    N E W   ( n o t   a   p e r m i t t e d   t r a n s i t i o n )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 4 9 / s t a t u s  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 4 9  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m s e t s   p r o b l e m A p p e a r s R e s o l v e d   f l a g   w i t h o u t   c h a n g i n g   t i c k e t   s t a t u s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m s e t s   p r o b l e m A p p e a r s R e s o l v e d   f l a g   w i t h o u t   c h a n g i n g   t i c k e t   s t a t u s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / r e s o l v e d - f l a g  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d / p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e = t r u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   C L O S E D   B�    a n y t h i n g   ( t e r m i n a l   s t a t e )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 5 0 / s t a t u s  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   C L O S E D   B�    a n y t h i n g   ( t e r m i n a l   s t a t e )  
  [ 2 2 m  [ 3 9 m s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 5 0  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   n o n - o w n e r   R e q u e s t e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / r e s o l v e d - f l a g  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d / p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   p a s s w o r d   s h o r t e r   t h a n   8   c h a r a c t e r s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l 9 z 0 0 0 3 f m q h m q 3 4 c b i p / p a s s w o r d  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 5   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   3 6 8 3  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m r e t u r n s   a l l   u s e r s   f o r   A d m i n i s t r a t o r   B�    n o   p a s s w o r d H a s h    [ 3 3 m 4 1 6  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   P O S T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m c r e a t e s   a   u s e r   w i t h   r e q u i r e s P a s s w o r d C h a n g e = t r u e    [ 3 3 m 4 0 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   P A T C H   / a d m i n / u s e r s / : i d / p a s s w o r d  [ 2 m   >    [ 2 2 m u p d a t e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e = t r u e    [ 3 3 m 4 1 0  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R   a t t e m p t i n g   s t a t u s   c h a n g e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / s t a t u s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   I T _ S T A F F   ( n o t   t h e i r   a c t i o n )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / r e s o l v e d - f l a g  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   I T _ S T A F F   ( n o t   t h e i r   a c t i o n )  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   f o r   i n v a l i d   s t a t u s   v a l u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / s t a t u s  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 8   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   3 9 3 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m r e t u r n s   f u l l   t i c k e t   d e t a i l   f o r   I T   S t a f f    [ 3 3 m 4 3 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   w h e n   p r o b l e m A p p e a r s R e s o l v e d   i s   n o t   a   b o o l e a n  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / r e s o l v e d - f l a g  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / r e s o l v e d - f l a g  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 8   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   4 0 1 5  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  
  [ 2 m   T e s t   F i l e s    [ 2 2 m    [ 1 m  [ 3 2 m 9   p a s s e d  [ 3 9 m  [ 2 2 m  [ 9 0 m   ( 9 )  [ 3 9 m  
  [ 2 m             T e s t s    [ 2 2 m    [ 1 m  [ 3 2 m 1 3 1   p a s s e d  [ 3 9 m  [ 2 2 m  [ 9 0 m   ( 1 3 1 )  [ 3 9 m  
  [ 2 m       S t a r t   a t    [ 2 2 m   1 1 : 2 6 : 1 2  
  [ 2 m       D u r a t i o n    [ 2 2 m   5 . 3 1 s  [ 2 m   ( t r a n s f o r m   6 2 1 m s ,   s e t u p   0 m s ,   c o l l e c t   7 . 4 0 s ,   t e s t s   1 7 . 5 4 s ,   e n v i r o n m e n t   2 m s ,   p r e p a r e   1 . 0 3 s )  [ 2 2 m  
  
  
  [ 1 m  [ 7 m  [ 3 6 m   R U N    [ 3 9 m  [ 2 7 m  [ 2 2 m    [ 3 6 m v 2 . 1 . 9    [ 3 9 m  [ 9 0 m C : / K M U T T / S E / t o k t i c k i t / c l i e n t  [ 3 9 m  
  
 n o d e . e x e   :    [ 9 0 m s t d e r r  [ 2 m   |   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . a 1 1 y . t e s t . t s x  [ 2 m   >    [ 2 2 m  [ 2 m C r e a t e T i c k e t F o r m   B�     
 A c c e s s i b i l i t y   ( a 1 1 y )   T e s t s  [ 2 m   >    [ 2 2 m  [ 2 m e v e r y   i n p u t / s e l e c t / t e x t a r e a   i s   r e a c h a b l e   v i a   g e t B y L a b e l T e x t   ( l a b e l    
 a s s o c i a t i o n )  
 A t   l i n e : 1   c h a r : 1  
 +   &   " D : \ / n o d e . e x e "   " D : \ / n o d e _ m o d u l e s / n p m / b i n / n p x - c l i . j s "   v i t e s t   r u n   l a b   . . .  
 +   ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  
         +   C a t e g o r y I n f o                     :   N o t S p e c i f i e d :   (  [ 9 0 m s t d e r r  [ 2 m . . . e l   a s s o c i a t i o n ) : S t r i n g )   [ ] ,   R e m o t e E x c e p t i o n  
         +   F u l l y Q u a l i f i e d E r r o r I d   :   N a t i v e C o m m a n d E r r o r  
    
  [ 2 2 m  [ 3 9 m W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / C h a n g e P a s s w o r d . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 2   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   1 5 3  [ 2 m m s  [ 2 2 m  [ 3 9 m  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / T i c k e t D e t a i l . r e q u e s t e r . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 4   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   2 7 9  [ 2 m m s  [ 2 2 m  [ 3 9 m  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / U s e r M a n a g e m e n t . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 8   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   2 6 6  [ 2 m m s  [ 2 2 m  [ 3 9 m  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / S t a f f T i c k e t D e t a i l . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 7   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   2 5 3  [ 2 m m s  [ 2 2 m  [ 3 9 m  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / L o g i n . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 3   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   7 0 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   s h o w s   l o a d i n g   s t a t e   w h i l e   s u b m i t t i n g    [ 3 3 m 5 3 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / S t a f f T i c k e t Q u e u e . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 9   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   1 1 3 3  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   s h o w s   " N o   r e s u l t s "   s t a t e   w h e n   f i l t e r s   r e t u r n   e m p t y   a r r a y    [ 3 3 m 4 3 2  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   s e a r c h   i n p u t   c a l l s   A P I   w i t h   s e a r c h   p a r a m   a f t e r   d e b o u n c e    [ 3 3 m 4 1 6  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d e r r  [ 2 m   |   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . a 1 1 y . t e s t . t s x  [ 2 m   >    [ 2 2 m  [ 2 m C r e a t e T i c k e t F o r m   B�    A c c e s s i b i l i t y    
 ( a 1 1 y )   T e s t s  [ 2 m   >    [ 2 2 m  [ 2 m i n p u t s   d o   N O T   s u p p r e s s   t h e   b r o w s e r   f o c u s   r i n g   ( n o   o u t l i n e : n o n e )  
  [ 2 2 m  [ 3 9 m W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
  
  [ 9 0 m s t d e r r  [ 2 m   |   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . a 1 1 y . t e s t . t s x  [ 2 m   >    [ 2 2 m  [ 2 m C r e a t e T i c k e t F o r m   B�    A c c e s s i b i l i t y    
 ( a 1 1 y )   T e s t s  [ 2 m   >    [ 2 2 m  [ 2 m e v e r y   r e q u i r e d   f i e l d   l a b e l   h a s   a   v i s i b l e   r e d   a s t e r i s k   t h a t   i s   h i d d e n   f r o m   s c r e e n   r e a d e r s  
  [ 2 2 m  [ 3 9 m W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . a 1 1 y . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 6   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   1 3 5 1  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    A c c e s s i b i l i t y   ( a 1 1 y )   T e s t s  [ 2 m   >    [ 2 2 m T a b   k e y   c y c l e s   t h r o u g h   a l l   f o c u s a b l e   f o r m   c o n t r o l s    [ 3 3 m 3 6 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    A c c e s s i b i l i t y   ( a 1 1 y )   T e s t s  [ 2 m   >    [ 2 2 m p r e s s i n g   E n t e r   w h i l e   S u b m i t   b u t t o n   i s   f o c u s e d   t r i g g e r s   f o r m   s u b m i s s i o n    [ 3 3 m 8 1 8  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d e r r  [ 2 m   |   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . t e s t . t s x  [ 2 m   >    [ 2 2 m  [ 2 m C r e a t e T i c k e t F o r m   B�    U I   T e s t s  [ 2 m   >    
  [ 2 2 m  [ 2 m d i s a b l e s   S u b m i t   b u t t o n   a n d   s h o w s   s p i n n e r   w h i l e   A P I   c a l l   i s   p e n d i n g  
  [ 2 2 m  [ 3 9 m W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
 W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
 W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
 W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
 W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 6   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   3 8 4 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    U I   T e s t s  [ 2 m   >    [ 2 2 m s h o w s   s u m m a r y   e r r o r   w h e n   s u m m a r y   e x c e e d s   1 0 0   c h a r a c t e r s   B�    a n d   d o e s   N O T   c a l l   t h e   A P I    [ 3 3 m 5 5 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    U I   T e s t s  [ 2 m   >    [ 2 2 m d i s a b l e s   S u b m i t   b u t t o n   a n d   s h o w s   s p i n n e r   w h i l e   A P I   c a l l   i s   p e n d i n g    [ 3 3 m 1 1 0 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    U I   T e s t s  [ 2 m   >    [ 2 2 m r e n d e r s   s e r v e r - r e t u r n e d   f i e l d   e r r o r s   b e l o w   t h e   c o r r e c t   i n p u t s   o n   4 0 0   r e s p o n s e    [ 3 3 m 9 7 1  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    U I   T e s t s  [ 2 m   >    [ 2 2 m s h o w s   s u c c e s s   b a n n e r   w i t h   t i c k e t N u m b e r   a n d   r e s e t s   f o r m   a f t e r   2 0 1   r e s p o n s e    [ 3 3 m 9 1 6  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  
  [ 2 m   T e s t   F i l e s    [ 2 2 m    [ 1 m  [ 3 2 m 8   p a s s e d  [ 3 9 m  [ 2 2 m  [ 9 0 m   ( 8 )  [ 3 9 m  
  [ 2 m             T e s t s    [ 2 2 m    [ 1 m  [ 3 2 m 4 5   p a s s e d  [ 3 9 m  [ 2 2 m  [ 9 0 m   ( 4 5 )  [ 3 9 m  
  [ 2 m       S t a r t   a t    [ 2 2 m   1 1 : 3 2 : 1 7  
  [ 2 m       D u r a t i o n    [ 2 2 m   5 . 2 2 s  [ 2 m   ( t r a n s f o r m   6 9 1 m s ,   s e t u p   7 7 3 m s ,   c o l l e c t   2 . 7 2 s ,   t e s t s   7 . 9 8 s ,   e n v i r o n m e n t   4 . 8 5 s ,   p r e p a r e   9 6 9 m s )  [ 2 2 m  
  
 

## Backend API Test Output

\\n�� 
  [ 1 m  [ 7 m  [ 3 6 m   R U N    [ 3 9 m  [ 2 7 m  [ 2 2 m    [ 3 6 m v 2 . 1 . 9    [ 3 9 m  [ 9 0 m C : / K M U T T / S E / t o k t i c k i t / s e r v e r  [ 3 9 m  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / m i g r a t i o n . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 2 1   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   2 1 9  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m U n a u t h e n t i c a t e d   r e q u e s t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   G E T   / a u t h / m e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / m e  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m U n a u t h e n t i c a t e d   r e q u e s t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   P O S T   / a u t h / l o g o u t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / l o g o u t  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 1   B�    m i s s i n g   X - R e q u e s t e r - I d   h e a d e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m U n a u t h e n t i c a t e d   r e q u e s t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   G E T   / a p i / t i c k e t s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m U n a u t h e n t i c a t e d   r e q u e s t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   G E T   / a p i / s t a f f / t i c k e t s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 1   B�    r e q u e s t e r   n o t   f o u n d   o r   i n a c t i v e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 4 0 1   a u t h   t o k e n   m i s s i n g  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 2 0 1   B�    c r e a t e s   t i c k e t   a n d   r e t u r n s   t i c k e t N u m b e r   T K T - 0 0 0 1  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    m i s s i n g   s u m m a r y  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    m i s s i n g   d e s c r i p t i o n  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    m i s s i n g   c a t e g o r y I d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    m i s s i n g   r e l a t e d S y s t e m I d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    m i s s i n g   r e q u e s t e d P r i o r i t y  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    i n v a l i d   r e q u e s t e d P r i o r i t y   v a l u e   ( U r g e n t   i s   n o t   a l l o w e d )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 2 0 1   B�    a c c e p t s   e a c h   o f   t h e   t h r e e   v a l i d   p r i o r i t i e s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 2 0 1   B�    a c c e p t s   e a c h   o f   t h e   t h r e e   v a l i d   p r i o r i t i e s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 2 0 1   B�    a c c e p t s   e a c h   o f   t h e   t h r e e   v a l i d   p r i o r i t i e s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    s u m m a r y   e x c e e d s   1 0 0   c h a r a c t e r s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    d e s c r i p t i o n   e x c e e d s   1 0 0 0   c h a r a c t e r s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    c a t e g o r y I d   r e f e r e n c e s   n o n - e x i s t e n t   c a t e g o r y  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m 4 0 0   B�    r e l a t e d S y s t e m I d   r e f e r e n c e s   n o n - e x i s t e n t   s y s t e m  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a p i / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e s p o n s e   b o d y   i n c l u d e s   c a t e g o r y   a n d   r e l a t e d S y s t e m   n e s t e d   o b j e c t s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / t i c k e t s . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 5   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   1 6 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m R E Q U E S T E R   a c c e s s i n g   / s t a f f / t i c k e t s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / t e s t / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   a l l   u s e r s   f o r   A d m i n i s t r a t o r   B�    n o   p a s s w o r d H a s h  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   f u l l   t i c k e t   d e t a i l   f o r   I T   S t a f f  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m R E Q U E S T E R   a c c e s s i n g   / s t a f f / t i c k e t s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   a l l   u s e r s   f o r   A d m i n i s t r a t o r   B�    n o   p a s s w o r d H a s h  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   f u l l   t i c k e t   d e t a i l   f o r   I T   S t a f f  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 r e q u e s t e d   i d :   1   p a r s e d :    [ 3 3 m 1  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   f u l l   t i c k e t   d e t a i l   f o r   I T   S t a f f  
  [ 2 2 m  [ 3 9 m s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 1  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   2 0 0   w i t h   t i c k e t s   a n d   p a g i n a t i o n   m e t a d a t a   f o r   I T   S t a f f   ( n o   p a r a m s )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m R E Q U E S T E R   a c c e s s i n g   / a d m i n / u s e r s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / t e s t / a d m i n / u s e r s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m R E Q U E S T E R   a c c e s s i n g   / a d m i n / u s e r s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s   c r e a t e s   a   t i c k e t   u s i n g   t h e   a u t h e n t i c a t e d   r e q u e s t e r I d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   2 0 0   w i t h   t i c k e t s   a n d   p a g i n a t i o n   m e t a d a t a   f o r   I T   S t a f f   ( n o   p a r a m s )  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s   c r e a t e s   a   t i c k e t   u s i n g   t h e   a u t h e n t i c a t e d   r e q u e s t e r I d  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   s e a r c h   B�    c a s e - i n s e n s i t i v e   n a m e / e m a i l   m a t c h  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s ? s e a r c h = a l i c e  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m t i c k e t   i t e m s   c o n t a i n   r e q u i r e d   f i e l d s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m t i c k e t   i t e m s   c o n t a i n   r e q u i r e d   f i e l d s  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m r e q u e s t e r I d   i n   r e q u e s t   b o d y   i s   s i l e n t l y   i g n o r e d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s e a r c h   f i l t e r s   b y   s u m m a r y   ( c a s e - i n s e n s i t i v e )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s e a r c h = v p n  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m r e q u e s t e r I d   i n   r e q u e s t   b o d y   i s   s i l e n t l y   i g n o r e d  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s e a r c h   f i l t e r s   b y   s u m m a r y   ( c a s e - i n s e n s i t i v e )  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m s t o r e s   c o m m e n t   w i t h   c o r r e c t   a u t h o r I d   a n d   r e t u r n s   2 0 1  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s e a r c h   w i t h   n o   m a t c h i n g   k e y w o r d   r e t u r n s   e m p t y   a r r a y   w i t h   t o t a l   0  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s e a r c h = X Y Z N O N E X I S T E N T T E R M 1 2 3  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s e a r c h   w i t h   n o   m a t c h i n g   k e y w o r d   r e t u r n s   e m p t y   a r r a y   w i t h   t o t a l   0  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s   r e t u r n s   o n l y   t h e   a u t h e n t i c a t e d   u s e r   t i c k e t s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   s t a t u s   I N _ P R O G R E S S  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s t a t u s = I N _ P R O G R E S S  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   s t a t u s   N E W  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s t a t u s = N E W  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d   r e t u r n s   2 0 0   f o r   t h e   a u t h e n t i c a t e d   o w n e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 2  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   s t a t u s   N E W  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s o r t s   b y   c r e a t e d A t   d e s c e n d i n g  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s o r t = c r e a t e d A t & d i r e c t i o n = d e s c  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d   r e t u r n s   2 0 0   f o r   t h e   a u t h e n t i c a t e d   o w n e r  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s o r t s   b y   c r e a t e d A t   d e s c e n d i n g  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d   r e t u r n s   4 0 3   ( n o t   4 0 4 )   w h e n   a c c e s s i n g   a n o t h e r   u s e r   t i c k e t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 2  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m s o r t s   b y   c r e a t e d A t   a s c e n d i n g  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s o r t = c r e a t e d A t & d i r e c t i o n = a s c  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m I T _ S T A F F   a c c e s s i n g   / a d m i n / u s e r s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / t e s t / a d m i n / u s e r s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m  [ 2 m I T _ S T A F F   a c c e s s i n g   / a d m i n / u s e r s   r e t u r n s   4 0 3  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / a t t a c h m e n t s   u p l o a d s   s u c c e s s f u l l y   f o r   t i c k e t   o w n e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 2 / a t t a c h m e n t s  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / a u t h o r i z a t i o n . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 8   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   8 7 1  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   R o l e - b a s e d   a c c e s s   c o n t r o l  [ 2 m   >    [ 2 2 m R E Q U E S T E R   a c c e s s i n g   / s t a f f / t i c k e t s   r e t u r n s   4 0 3    [ 3 3 m 3 6 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   c o r r e c t   s e c o n d   p a g e   w i t h   p a g e S i z e = 2  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? p a g e = 1 & p a g e S i z e = 2 & s o r t = c r e a t e d A t & d i r e c t i o n = a s c  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / a t t a c h m e n t s   u p l o a d s   s u c c e s s f u l l y   f o r   t i c k e t   o w n e r  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   c o r r e c t   s e c o n d   p a g e   w i t h   p a g e S i z e = 2  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? p a g e = 2 & p a g e S i z e = 2 & s o r t = c r e a t e d A t & d i r e c t i o n = a s c  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   a u t h e n t i c a t e d   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   a u t h e n t i c a t e d   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / a t t a c h m e n t s   r e t u r n s   4 0 3   f o r   n o n - o w n e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 2 / a t t a c h m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / a t t a c h m e n t s   r e t u r n s   4 0 3   f o r   n o n - o w n e r  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   f o r   i n v a l i d   s t a t u s   v a l u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s t a t u s = I N V A L I D _ S T A T U S  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   f o r   i n v a l i d   s o r t   f i e l d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s o r t = n o n E x i s t e n t F i e l d  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m N o   e n d p o i n t   a c c e p t s   o r   a c t s   o n   a   c l i e n t - s u p p l i e d   r e q u e s t e r I d   q u e r y   p a r a m e t e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s ? r e q u e s t e r I d = c m u 7 v t o 9 k 0 0 0 1 c 1 v 2 k 7 f 2 e r b 1  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m R e q u e s t e r   R e g r e s s i o n  [ 2 m   >    [ 2 2 m  [ 2 m N o   e n d p o i n t   a c c e p t s   o r   a c t s   o n   a   c l i e n t - s u p p l i e d   r e q u e s t e r I d   q u e r y   p a r a m e t e r  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   f o r   i n v a l i d   d i r e c t i o n   v a l u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? d i r e c t i o n = s i d e w a y s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   f o r   i n v a l i d   d i r e c t i o n   v a l u e  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m d o e s   N O T   r e t u r n   5 0 0   f o r   i n v a l i d   q u e r y   p a r a m s   ( a l w a y s   4 0 0 )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? s t a t u s = % 2 7 ; % 2 0 D R O P % 2 0 T A B L E % 2 0 t i c k e t s ; % 2 0 - -  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / r e q u e s t e r - r e g r e s s i o n . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 8   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   9 1 9  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   r o l e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s ? r o l e = I T _ S T A F F  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   r o l e  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 4   f o r   n o n - e x i s t e n t   t i c k e t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 9 9 9 9 9 9 9 9  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 4   f o r   n o n - e x i s t e n t   t i c k e t  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 r e q u e s t e d   i d :   9 9 9 9 9 9 9 9   p a r s e d :    [ 3 3 m 9 9 9 9 9 9 9 9  [ 3 9 m  
 s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 9 9 9 9 9 9 9 9  [ 3 9 m   f o u n d :    [ 3 3 m f a l s e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   e m p t y   c o n t e n t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   A D M I N I S T R A T O R   r e s u l t s   t h e   s a m e   a s   I T _ S T A F F  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   A D M I N I S T R A T O R   r e s u l t s   t h e   s a m e   a s   I T _ S T A F F  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / s t a f f / t i c k e t s  [ 2 m   >    [ 2 2 m  [ 2 m f i l t e r s   b y   o w n e r I d  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s ? o w n e r I d = c m u 7 v o l a 1 0 0 0 5 f m q h i m g x 5 g z p  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / s t a f f - q u e u e . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 7   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   1 1 3 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   I T _ S T A F F  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   o w n e r   t o   a   v a l i d   a c t i v e   I T _ S T A F F   u s e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / o w n e r  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   o w n e r   t o   a   v a l i d   a c t i v e   I T _ S T A F F   u s e r  
  [ 2 2 m  [ 3 9 m s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 1  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   w h i t e s p a c e - o n l y   c o n t e n t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m u n a s s i g n s   o w n e r   w h e n   o w n e r I d   i s   n u l l  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / o w n e r  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 1  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   w h e n   c o n t e n t   e x c e e d s   m a x   l e n g t h  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m c r e a t e s   a   u s e r   w i t h   r e q u i r e s P a s s w o r d C h a n g e = t r u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   w h e n   o w n e r I d   i s   a   R E Q U E S T E R   u s e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / o w n e r  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   w h e n   o w n e r I d   i s   a   R E Q U E S T E R   u s e r  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   w h e n   R e q u e s t e r   c o m m e n t s   o n   a n o t h e r   u s e r   t i c k e t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / l o g o u t  [ 2 m   >    [ 2 2 m  [ 2 m i n v a l i d a t e s   s e s s i o n   s o   s u b s e q u e n t   r e q u e s t s   r e t u r n   4 0 1  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / l o g o u t  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / l o g o u t  [ 2 m   >    [ 2 2 m  [ 2 m i n v a l i d a t e s   s e s s i o n   s o   s u b s e q u e n t   r e q u e s t s   r e t u r n   4 0 1  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / m e  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   w h e n   o w n e r I d   i s   a n   i n a c t i v e   I T _ S T A F F   u s e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / o w n e r  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m a l l o w s   I T _ S T A F F   t o   c o m m e n t   o n   a n y   t i c k e t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a u t h / m e  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   u s e r   i d e n t i t y   w i t h o u t   p a s s w o r d H a s h   f o r   a u t h e n t i c a t e d   u s e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / m e  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / a u t h / m e  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   ( n o t   4 0 3   o r   4 0 4 )   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / m e  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 9   f o r   d u p l i c a t e   e m a i l  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / o w n e r  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / o w n e r  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   l i s t   o f   c o m m e n t s   i n   c h r o n o l o g i c a l   o r d e r   f o r   t i c k e t   o w n e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / c h a n g e - p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m c h a n g e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e   t o   f a l s e   o n   v a l i d   i n p u t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / c h a n g e - p a s s w o r d  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   i n v a l i d   r o l e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / p r i o r i t y  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   i t P r i o r i t y   f o r   I T   S t a f f  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / p r i o r i t y  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / p r i o r i t y  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   i t P r i o r i t y   f o r   I T   S t a f f  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 1  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d / c o m m e n t s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   n o n - o w n e r   R e q u e s t e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / c o m m e n t s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / c h a n g e - p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m c h a n g e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e   t o   f a l s e   o n   v a l i d   i n p u t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / m e  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   u s e r   n a m e   a n d   e m a i l  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l 9 z 0 0 0 3 f m q h m q 3 4 c b i p  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   u s e r   n a m e   a n d   e m a i l  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / p r i o r i t y  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   i n v a l i d   p r i o r i t y   v a l u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / p r i o r i t y  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / p r i o r i t y  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   i n v a l i d   p r i o r i t y   v a l u e  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / n o t e s   a l l o w s   I T _ S T A F F   t o   p o s t   a n   i n t e r n a l   n o t e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / n o t e s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / n o t e s   a l l o w s   I T _ S T A F F   t o   p o s t   a n   i n t e r n a l   n o t e  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / c h a n g e - p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   w i t h   v a l i d a t i o n   d e t a i l s   w h e n   p a s s w o r d   i s   t o o   s h o r t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / c h a n g e - p a s s w o r d  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / a u t h / c h a n g e - p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a u t h / c h a n g e - p a s s w o r d  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / a u t h . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 1   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   2 5 9 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   P O S T   / a u t h / l o g i n  [ 2 m   >    [ 2 2 m r e t u r n s   2 0 0   w i t h   u s e r   i d e n t i t y   ( n o   p a s s w o r d H a s h )   f o r   v a l i d   a c t i v e   u s e r    [ 3 3 m 3 1 5  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   P O S T   / a u t h / c h a n g e - p a s s w o r d  [ 2 m   >    [ 2 2 m c h a n g e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e   t o   f a l s e   o n   v a l i d   i n p u t    [ 3 3 m 4 1 6  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   w h e n   A d m i n i s t r a t o r   t r i e s   t o   d e a c t i v a t e   t h e m s e l v e s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l a 5 0 0 0 9 f m q h o m l d o 7 t 8  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   w h e n   A d m i n i s t r a t o r   t r i e s   t o   d e a c t i v a t e   t h e m s e l v e s  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / p r i o r i t y  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / p r i o r i t y  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d / n o t e s   a l l o w s   I T _ S T A F F   t o   v i e w   i n t e r n a l   n o t e s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / n o t e s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d / n o t e s   a l l o w s   I T _ S T A F F   t o   v i e w   i n t e r n a l   n o t e s  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 9   w h e n   t r y i n g   t o   d e a c t i v a t e   t h e   l a s t   a c t i v e   A d m i n i s t r a t o r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l a 5 0 0 0 9 f m q h o m l d o 7 t 8  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 9   w h e n   t r y i n g   t o   d e a c t i v a t e   t h e   l a s t   a c t i v e   A d m i n i s t r a t o r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v r 7 c 5 0 0 0 0 9 q 4 q a w p q o 5 o 5  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 9   w h e n   t r y i n g   t o   d e a c t i v a t e   t h e   l a s t   a c t i v e   A d m i n i s t r a t o r  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m t r a n s i t i o n s   N E W   B�    O P E N   s u c c e s s f u l l y  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 4 7 / s t a t u s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m t r a n s i t i o n s   N E W   B�    O P E N   s u c c e s s f u l l y  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m t r a n s i t i o n s   N E W   B�    O P E N   s u c c e s s f u l l y  
  [ 2 2 m  [ 3 9 m s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 4 7  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / n o t e s   r e t u r n s   4 0 3   f o r   R E Q U E S T E R   ( n o   n o t e   c o n t e n t   i n   e r r o r )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / n o t e s  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m P O S T   / t i c k e t s / : i d / n o t e s   r e t u r n s   4 0 3   f o r   R E Q U E S T E R   ( n o   n o t e   c o n t e n t   i n   e r r o r )  
  [ 2 2 m  [ 3 9 m r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 9   f o r   d u p l i c a t e   e m a i l   d u r i n g   e d i t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l 9 z 0 0 0 3 f m q h m q 3 4 c b i p  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m t r a n s i t i o n s   I N _ P R O G R E S S   B�    R E S O L V E D   s u c c e s s f u l l y  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 4 8 / s t a t u s  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 4 8  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m I n t e r n a l   N o t e s  [ 2 m   >    [ 2 2 m  [ 2 m G E T   / t i c k e t s / : i d / n o t e s   r e t u r n s   4 0 3   f o r   R E Q U E S T E R   ( n o   n o t e   c o n t e n t   i n   e r r o r )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / n o t e s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d / p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e = t r u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l 9 z 0 0 0 3 f m q h m q 3 4 c b i p / p a s s w o r d  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d / p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e = t r u e  
  [ 2 2 m  [ 3 9 m r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   R E S O L V E D   B�    N E W   ( n o t   a   p e r m i t t e d   t r a n s i t i o n )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 4 9 / s t a t u s  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
 s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 4 9  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m s e t s   p r o b l e m A p p e a r s R e s o l v e d   f l a g   w i t h o u t   c h a n g i n g   t i c k e t   s t a t u s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m s e t s   p r o b l e m A p p e a r s R e s o l v e d   f l a g   w i t h o u t   c h a n g i n g   t i c k e t   s t a t u s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / r e s o l v e d - f l a g  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d / p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m u p d a t e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e = t r u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   C L O S E D   B�    a n y t h i n g   ( t e r m i n a l   s t a t e )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 5 0 / s t a t u s  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   C L O S E D   B�    a n y t h i n g   ( t e r m i n a l   s t a t e )  
  [ 2 2 m  [ 3 9 m s t a f f D e t a i l   t i c k e t I d :    [ 3 3 m 5 0  [ 3 9 m   f o u n d :    [ 3 3 m t r u e  [ 3 9 m  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   n o n - o w n e r   R e q u e s t e r  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / r e s o l v e d - f l a g  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / a d m i n / u s e r s / : i d / p a s s w o r d  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 2 2   f o r   p a s s w o r d   s h o r t e r   t h a n   8   c h a r a c t e r s  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a d m i n / u s e r s / c m u 7 v o l 9 z 0 0 0 3 f m q h m q 3 4 c b i p / p a s s w o r d  
 r o l e :   A D M I N I S T R A T O R   r o l e s :   [    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / u s e r s - a d m i n . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 5   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   3 6 8 3  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   G E T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m r e t u r n s   a l l   u s e r s   f o r   A d m i n i s t r a t o r   B�    n o   p a s s w o r d H a s h    [ 3 3 m 4 1 6  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   P O S T   / a d m i n / u s e r s  [ 2 m   >    [ 2 2 m c r e a t e s   a   u s e r   w i t h   r e q u i r e s P a s s w o r d C h a n g e = t r u e    [ 3 3 m 4 0 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   P A T C H   / a d m i n / u s e r s / : i d / p a s s w o r d  [ 2 m   >    [ 2 2 m u p d a t e s   p a s s w o r d   a n d   s e t s   r e q u i r e s P a s s w o r d C h a n g e = t r u e    [ 3 3 m 4 1 0  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   R E Q U E S T E R   a t t e m p t i n g   s t a t u s   c h a n g e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / s t a t u s  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   I T _ S T A F F   ( n o t   t h e i r   a c t i o n )  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / r e s o l v e d - f l a g  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 3   f o r   I T _ S T A F F   ( n o t   t h e i r   a c t i o n )  
  [ 2 2 m  [ 3 9 m r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / s t a f f / t i c k e t s / : i d / s t a t u s  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   f o r   i n v a l i d   s t a t u s   v a l u e  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / s t a f f / t i c k e t s / 1 / s t a t u s  
 r o l e :   I T _ S T A F F   r o l e s :   [    [ 3 2 m ' I T _ S T A F F '  [ 3 9 m ,    [ 3 2 m ' A D M I N I S T R A T O R '  [ 3 9 m   ]  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / s t a f f - t i c k e t - d e t a i l . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 8   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   3 9 3 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   S t a f f   T i c k e t   D e t a i l   A P I  [ 2 m   >    [ 2 2 m G E T   / s t a f f / t i c k e t s / : i d  [ 2 m   >    [ 2 2 m r e t u r n s   f u l l   t i c k e t   d e t a i l   f o r   I T   S t a f f    [ 3 3 m 4 3 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 0   w h e n   p r o b l e m A p p e a r s R e s o l v e d   i s   n o t   a   b o o l e a n  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / r e s o l v e d - f l a g  
 r o l e :   R E Q U E S T E R   r o l e s :   [    [ 3 2 m ' R E Q U E S T E R '  [ 3 9 m   ]  
  
  [ 9 0 m s t d o u t  [ 2 m   |   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s  [ 2 m   >    [ 2 2 m  [ 2 m C o m m e n t s   a n d   N o t e s   A P I  [ 2 m   >    [ 2 2 m  [ 2 m P A T C H   / t i c k e t s / : i d / r e s o l v e d - f l a g  [ 2 m   >    [ 2 2 m  [ 2 m r e t u r n s   4 0 1   f o r   u n a u t h e n t i c a t e d   r e q u e s t  
  [ 2 2 m  [ 3 9 m r e q u i r e A u t h   c a l l e d   f o r :   / a p i / t i c k e t s / 5 1 / r e s o l v e d - f l a g  
  
    [ 3 2 m B�   [ 3 9 m   t e s t s / l a b - 0 3 / c o m m e n t s - n o t e s . a p i . t e s t . t s    [ 2 m (  [ 2 2 m  [ 2 m 1 8   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   4 0 1 5  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  
  [ 2 m   T e s t   F i l e s    [ 2 2 m    [ 1 m  [ 3 2 m 9   p a s s e d  [ 3 9 m  [ 2 2 m  [ 9 0 m   ( 9 )  [ 3 9 m  
  [ 2 m             T e s t s    [ 2 2 m    [ 1 m  [ 3 2 m 1 3 1   p a s s e d  [ 3 9 m  [ 2 2 m  [ 9 0 m   ( 1 3 1 )  [ 3 9 m  
  [ 2 m       S t a r t   a t    [ 2 2 m   1 1 : 2 6 : 1 2  
  [ 2 m       D u r a t i o n    [ 2 2 m   5 . 3 1 s  [ 2 m   ( t r a n s f o r m   6 2 1 m s ,   s e t u p   0 m s ,   c o l l e c t   7 . 4 0 s ,   t e s t s   1 7 . 5 4 s ,   e n v i r o n m e n t   2 m s ,   p r e p a r e   1 . 0 3 s )  [ 2 2 m  
  
 
\\n
## Frontend UI Test Output

\\n�� 
  [ 1 m  [ 7 m  [ 3 6 m   R U N    [ 3 9 m  [ 2 7 m  [ 2 2 m    [ 3 6 m v 2 . 1 . 9    [ 3 9 m  [ 9 0 m C : / K M U T T / S E / t o k t i c k i t / c l i e n t  [ 3 9 m  
  
 n o d e . e x e   :    [ 9 0 m s t d e r r  [ 2 m   |   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . a 1 1 y . t e s t . t s x  [ 2 m   >    [ 2 2 m  [ 2 m C r e a t e T i c k e t F o r m   B�     
 A c c e s s i b i l i t y   ( a 1 1 y )   T e s t s  [ 2 m   >    [ 2 2 m  [ 2 m e v e r y   i n p u t / s e l e c t / t e x t a r e a   i s   r e a c h a b l e   v i a   g e t B y L a b e l T e x t   ( l a b e l    
 a s s o c i a t i o n )  
 A t   l i n e : 1   c h a r : 1  
 +   &   " D : \ / n o d e . e x e "   " D : \ / n o d e _ m o d u l e s / n p m / b i n / n p x - c l i . j s "   v i t e s t   r u n   l a b   . . .  
 +   ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  
         +   C a t e g o r y I n f o                     :   N o t S p e c i f i e d :   (  [ 9 0 m s t d e r r  [ 2 m . . . e l   a s s o c i a t i o n ) : S t r i n g )   [ ] ,   R e m o t e E x c e p t i o n  
         +   F u l l y Q u a l i f i e d E r r o r I d   :   N a t i v e C o m m a n d E r r o r  
    
  [ 2 2 m  [ 3 9 m W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / C h a n g e P a s s w o r d . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 2   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   1 5 3  [ 2 m m s  [ 2 2 m  [ 3 9 m  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / T i c k e t D e t a i l . r e q u e s t e r . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 4   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   2 7 9  [ 2 m m s  [ 2 2 m  [ 3 9 m  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / U s e r M a n a g e m e n t . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 8   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   2 6 6  [ 2 m m s  [ 2 2 m  [ 3 9 m  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / S t a f f T i c k e t D e t a i l . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 7   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 9 0 m   2 5 3  [ 2 m m s  [ 2 2 m  [ 3 9 m  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / L o g i n . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 3   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   7 0 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   s h o w s   l o a d i n g   s t a t e   w h i l e   s u b m i t t i n g    [ 3 3 m 5 3 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / S t a f f T i c k e t Q u e u e . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 9   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   1 1 3 3  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   s h o w s   " N o   r e s u l t s "   s t a t e   w h e n   f i l t e r s   r e t u r n   e m p t y   a r r a y    [ 3 3 m 4 3 2  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   s e a r c h   i n p u t   c a l l s   A P I   w i t h   s e a r c h   p a r a m   a f t e r   d e b o u n c e    [ 3 3 m 4 1 6  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d e r r  [ 2 m   |   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . a 1 1 y . t e s t . t s x  [ 2 m   >    [ 2 2 m  [ 2 m C r e a t e T i c k e t F o r m   B�    A c c e s s i b i l i t y    
 ( a 1 1 y )   T e s t s  [ 2 m   >    [ 2 2 m  [ 2 m i n p u t s   d o   N O T   s u p p r e s s   t h e   b r o w s e r   f o c u s   r i n g   ( n o   o u t l i n e : n o n e )  
  [ 2 2 m  [ 3 9 m W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
  
  [ 9 0 m s t d e r r  [ 2 m   |   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . a 1 1 y . t e s t . t s x  [ 2 m   >    [ 2 2 m  [ 2 m C r e a t e T i c k e t F o r m   B�    A c c e s s i b i l i t y    
 ( a 1 1 y )   T e s t s  [ 2 m   >    [ 2 2 m  [ 2 m e v e r y   r e q u i r e d   f i e l d   l a b e l   h a s   a   v i s i b l e   r e d   a s t e r i s k   t h a t   i s   h i d d e n   f r o m   s c r e e n   r e a d e r s  
  [ 2 2 m  [ 3 9 m W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . a 1 1 y . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 6   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   1 3 5 1  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    A c c e s s i b i l i t y   ( a 1 1 y )   T e s t s  [ 2 m   >    [ 2 2 m T a b   k e y   c y c l e s   t h r o u g h   a l l   f o c u s a b l e   f o r m   c o n t r o l s    [ 3 3 m 3 6 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    A c c e s s i b i l i t y   ( a 1 1 y )   T e s t s  [ 2 m   >    [ 2 2 m p r e s s i n g   E n t e r   w h i l e   S u b m i t   b u t t o n   i s   f o c u s e d   t r i g g e r s   f o r m   s u b m i s s i o n    [ 3 3 m 8 1 8  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  [ 9 0 m s t d e r r  [ 2 m   |   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . t e s t . t s x  [ 2 m   >    [ 2 2 m  [ 2 m C r e a t e T i c k e t F o r m   B�    U I   T e s t s  [ 2 m   >    
  [ 2 2 m  [ 2 m d i s a b l e s   S u b m i t   b u t t o n   a n d   s h o w s   s p i n n e r   w h i l e   A P I   c a l l   i s   p e n d i n g  
  [ 2 2 m  [ 3 9 m W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
 W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
 W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
 W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
 W a r n i n g :   A n   u p d a t e   t o   C r e a t e T i c k e t F o r m   i n s i d e   a   t e s t   w a s   n o t   w r a p p e d   i n   a c t ( . . . ) .  
  
 W h e n   t e s t i n g ,   c o d e   t h a t   c a u s e s   R e a c t   s t a t e   u p d a t e s   s h o u l d   b e   w r a p p e d   i n t o   a c t ( . . . ) :  
  
 a c t ( ( )   = >   {  
     / *   f i r e   e v e n t s   t h a t   u p d a t e   s t a t e   * /  
 } ) ;  
 / *   a s s e r t   o n   t h e   o u t p u t   * /  
  
 T h i s   e n s u r e s   t h a t   y o u ' r e   t e s t i n g   t h e   b e h a v i o r   t h e   u s e r   w o u l d   s e e   i n   t h e   b r o w s e r .   L e a r n   m o r e   a t    
 h t t p s : / / r e a c t j s . o r g / l i n k / w r a p - t e s t s - w i t h - a c t  
         a t   C r e a t e T i c k e t F o r m   ( C : \ K M U T T \ S E \ t o k t i c k i t \ c l i e n t \ s r c \ C r e a t e T i c k e t F o r m . t s x : 2 7 3 : 4 1 )  
  
    [ 3 2 m B�   [ 3 9 m   s r c / t e s t s / l a b - 0 3 / C r e a t e T i c k e t F o r m . t e s t . t s x    [ 2 m (  [ 2 2 m  [ 2 m 6   t e s t s  [ 2 2 m  [ 2 m )  [ 2 2 m  [ 3 3 m   3 8 4 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    U I   T e s t s  [ 2 m   >    [ 2 2 m s h o w s   s u m m a r y   e r r o r   w h e n   s u m m a r y   e x c e e d s   1 0 0   c h a r a c t e r s   B�    a n d   d o e s   N O T   c a l l   t h e   A P I    [ 3 3 m 5 5 7  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    U I   T e s t s  [ 2 m   >    [ 2 2 m d i s a b l e s   S u b m i t   b u t t o n   a n d   s h o w s   s p i n n e r   w h i l e   A P I   c a l l   i s   p e n d i n g    [ 3 3 m 1 1 0 4  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    U I   T e s t s  [ 2 m   >    [ 2 2 m r e n d e r s   s e r v e r - r e t u r n e d   f i e l d   e r r o r s   b e l o w   t h e   c o r r e c t   i n p u t s   o n   4 0 0   r e s p o n s e    [ 3 3 m 9 7 1  [ 2 m m s  [ 2 2 m  [ 3 9 m  
        [ 3 3 m  [ 2 m B�   [ 2 2 m  [ 3 9 m   C r e a t e T i c k e t F o r m   B�    U I   T e s t s  [ 2 m   >    [ 2 2 m s h o w s   s u c c e s s   b a n n e r   w i t h   t i c k e t N u m b e r   a n d   r e s e t s   f o r m   a f t e r   2 0 1   r e s p o n s e    [ 3 3 m 9 1 6  [ 2 m m s  [ 2 2 m  [ 3 9 m  
  
  [ 2 m   T e s t   F i l e s    [ 2 2 m    [ 1 m  [ 3 2 m 8   p a s s e d  [ 3 9 m  [ 2 2 m  [ 9 0 m   ( 8 )  [ 3 9 m  
  [ 2 m             T e s t s    [ 2 2 m    [ 1 m  [ 3 2 m 4 5   p a s s e d  [ 3 9 m  [ 2 2 m  [ 9 0 m   ( 4 5 )  [ 3 9 m  
  [ 2 m       S t a r t   a t    [ 2 2 m   1 1 : 3 2 : 1 7  
  [ 2 m       D u r a t i o n    [ 2 2 m   5 . 2 2 s  [ 2 m   ( t r a n s f o r m   6 9 1 m s ,   s e t u p   7 7 3 m s ,   c o l l e c t   2 . 7 2 s ,   t e s t s   7 . 9 8 s ,   e n v i r o n m e n t   4 . 8 5 s ,   p r e p a r e   9 6 9 m s )  [ 2 2 m  
  
 
\\n
## E2E Test Output

\\n��[ g l o b a l S e t u p ]   R e s e t   t i c k e t   9   t o   u n o w n e d  
 [ g l o b a l S e t u p ]   R e s e t   t i c k e t   2   t o   N E W   s t a t u s  
 [ g l o b a l S e t u p ]   S e t   p r o b l e m A p p e a r s R e s o l v e d = t r u e   o n   t i c k e t   3  
  
 R u n n i n g   3 8   t e s t s   u s i n g   6   w o r k e r s  
  
 [ 1 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ a u t h e n t i c a t i o n . s p e c . t s : 2 9 : 7   B�   P a s s w o r d   C h a n g e   F l o w   B�   f i r s t - l o g i n   u s e r   i s   r e d i r e c t e d   t o   c h a n g e - p a s s w o r d   s c r e e n  
 [ 2 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ a u t h e n t i c a t i o n . s p e c . t s : 3 : 5   B�   v a l i d   l o g i n   r e d i r e c t s   t o   r o l e   h o m e   s c r e e n  
 [ 3 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ a u t h e n t i c a t i o n . s p e c . t s : 2 0 : 5   B�   i n a c t i v e   a c c o u n t   s h o w s   s a m e   g e n e r i c   e r r o r   a s   w r o n g   p a s s w o r d  
 [ 4 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ a u t h e n t i c a t i o n . s p e c . t s : 6 2 : 5   B�   I T   S t a f f   n a v   s h o w s   T i c k e t   Q u e u e   b u t   n o t   U s e r   M a n a g e m e n t  
 [ 5 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ a u t h e n t i c a t i o n . s p e c . t s : 1 1 : 5   B�   w r o n g   p a s s w o r d   s h o w s   g e n e r i c   e r r o r   ( n o   a c c o u n t   e n u m e r a t i o n )  
 [ 6 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ a u t h e n t i c a t i o n . s p e c . t s : 5 3 : 5   B�   p r o t e c t e d   r o u t e s   a r e   i n a c c e s s i b l e   a f t e r   l o g o u t  
 [ 7 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ a u t h e n t i c a t i o n . s p e c . t s : 6 8 : 5   B�   R E Q U E S T E R   n a v i g a t i n g   t o   / s t a f f / t i c k e t s   s e e s   f o r b i d d e n   s c r e e n  
 [ 8 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ s t a f f - t i c k e t - f l o w . s p e c . t s : 1 1 : 5   B�   I T   S t a f f   c a n   v i e w   t h e   T i c k e t   Q u e u e   a n d   n a v i g a t e   t o   d e t a i l  
 [ 9 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ s t a f f - t i c k e t - f l o w . s p e c . t s : 1 7 : 5   B�   I T   S t a f f   c a n   c l a i m   t i c k e t   o w n e r s h i p  
 [ 1 0 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ s t a f f - t i c k e t - f l o w . s p e c . t s : 2 3 : 5   B�   I T   S t a f f   c a n   s e t   I T   P r i o r i t y  
 [ 1 1 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ s t a f f - t i c k e t - f l o w . s p e c . t s : 3 0 : 5   B�   I T   S t a f f   c a n   p e r f o r m   a   v a l i d   s t a t u s   t r a n s i t i o n  
 [ 1 2 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ a u t h e n t i c a t i o n . s p e c . t s : 3 7 : 5   B�   P a s s w o r d   C h a n g e   F l o w   B�   s u c c e s s f u l   p a s s w o r d   c h a n g e   r e d i r e c t s   t o   a p p   s h e l l  
 [ 1 3 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ s t a f f - t i c k e t - f l o w . s p e c . t s : 3 7 : 5   B�   I T   S t a f f   c a n   p o s t   a n   I n t e r n a l   N o t e  
 [ 1 4 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ s t a f f - t i c k e t - f l o w . s p e c . t s : 4 4 : 5   B�   I T   S t a f f   c a n   p o s t   a   P u b l i c   C o m m e n t  
 [ 1 5 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ s t a f f - t i c k e t - f l o w . s p e c . t s : 5 1 : 5   B�   " P r o b l e m   A p p e a r s   R e s o l v e d "   i n d i c a t o r   i s   v i s i b l e   w h e n   f l a g   i s   s e t  
 [ 1 6 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ s t a f f - t i c k e t - f l o w . s p e c . t s : 5 6 : 5   B�   A t t a c h m e n t s   a r e   l i s t e d   a n d   d o w n l o a d a b l e  
 [ 1 7 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ u s e r - a d m i n i s t r a t i o n . s p e c . t s : 1 2 : 5   B�   A d m i n i s t r a t o r   s e e s   u s e r   t a b l e   w i t h   N a m e ,   E m a i l ,   R o l e ,   S t a t u s   c o l u m n s  
 [ 1 8 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ u s e r - a d m i n i s t r a t i o n . s p e c . t s : 2 0 : 5   B�   S e a r c h   f i l t e r s   u s e r   l i s t   b y   n a m e   o r   e m a i l  
 [ 1 9 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ u s e r - a d m i n i s t r a t i o n . s p e c . t s : 2 7 : 5   B�   R o l e   f i l t e r   s h o w s   o n l y   u s e r s   o f   s e l e c t e d   r o l e  
 [ 2 0 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ u s e r - a d m i n i s t r a t i o n . s p e c . t s : 3 6 : 5   B�   C r e a t e   U s e r   B�    n e w   u s e r   a p p e a r s   i n   l i s t  
 [ 2 1 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ u s e r - a d m i n i s t r a t i o n . s p e c . t s : 5 3 : 5   B�   C r e a t e   U s e r   B�    d u p l i c a t e   e m a i l   s h o w s   4 0 9   e r r o r  
 [ 2 2 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ u s e r - a d m i n i s t r a t i o n . s p e c . t s : 6 5 : 5   B�   E d i t   U s e r   m o d a l   i s   p r e - p o p u l a t e d   w i t h   c u r r e n t   v a l u e s  
 [ 2 3 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ u s e r - a d m i n i s t r a t i o n . s p e c . t s : 7 5 : 5   B�   S e t   N e w   P a s s w o r d   B�    r e q u i r e s   p a s s w o r d   c h a n g e   a t   n e x t   l o g i n  
 [ 2 4 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ u s e r - a d m i n i s t r a t i o n . s p e c . t s : 8 5 : 5   B�   S e l f - d e a c t i v a t i o n   i s   p r e v e n t e d   i n   t h e   U I  
 [ 2 5 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ u s e r - a d m i n i s t r a t i o n . s p e c . t s : 9 2 : 5   B�   N o n - A d m i n i s t r a t o r   s e e s   f o r b i d d e n   s c r e e n  
 [ 2 6 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 2 7 : 5   B�   S c r e e n s h o t :   L o g i n   p a g e   B�    d e f a u l t   s t a t e  
 [ 2 7 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 3 6 : 5   B�   S c r e e n s h o t :   L o g i n   p a g e   B�    e r r o r   s t a t e  
 [ 2 8 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 4 8 : 5   B�   S c r e e n s h o t :   C h a n g e   P a s s w o r d   p a g e  
 [ 2 9 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 6 4 : 5   B�   S c r e e n s h o t :   I T   S t a f f   T i c k e t   Q u e u e  
 [ 3 0 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 7 5 : 5   B�   S c r e e n s h o t :   I T   S t a f f   Q u e u e   B�    s e a r c h   a c t i v e  
 [ 3 1 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 8 7 : 5   B�   S c r e e n s h o t :   I T   S t a f f   Q u e u e   B�    e m p t y   r e s u l t s  
 [ 3 2 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 1 0 0 : 5   B�   S c r e e n s h o t :   I T   S t a f f   T i c k e t   D e t a i l  
 [ 3 3 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 1 2 1 : 5   B�   S c r e e n s h o t :   I T   S t a f f   T i c k e t   D e t a i l   B�    o p e r a t i o n a l   s e c t i o n   f o c u s  
 [ 3 4 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 1 3 4 : 5   B�   S c r e e n s h o t :   R e q u e s t e r   T i c k e t   D e t a i l  
 [ 3 5 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 1 5 6 : 5   B�   S c r e e n s h o t :   A d m i n   U s e r   M a n a g e m e n t   B�    t a b l e   v i e w  
 [ 3 6 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 1 7 0 : 5   B�   S c r e e n s h o t :   A d m i n   B�    C r e a t e   U s e r   m o d a l  
 [ 3 7 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 1 8 0 : 5   B�   S c r e e n s h o t :   A d m i n   B�    E d i t   U s e r   m o d a l   ( p r e - p o p u l a t e d )  
 [ 3 8 / 3 8 ]   [ c h r o m i u m ]   B�   e 2 e \ l a b - 0 3 \ v i s u a l - s c r e e n s h o t s . s p e c . t s : 1 9 0 : 5   B�   S c r e e n s h o t :   A d m i n   B�    n o n - A d m i n   s e e s   f o r b i d d e n   s c r e e n  
     3 8   p a s s e d   ( 1 2 . 7 s )  
 
\\n