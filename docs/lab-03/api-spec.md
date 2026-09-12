# เอกสารข้อกำหนดระบบ API (API Specification) - Lab 3

## กลยุทธ์การจัดการเซสชันและโทเค็น (Session / Token Strategy)
- **ตัวเลือก (Choice):** ระบบใช้ HttpOnly Cookie (จัดเก็บ Token แบบฝั่งเซิร์ฟเวอร์หรือ JWT) เนื่องจากสามารถป้องกันการโจมตีแบบ XSS (Cross-Site Scripting) ได้อย่างมีประสิทธิภาพ เพราะฝั่งเบราว์เซอร์จะไม่สามารถอ่านค่าจาก Cookie โดยตรงได้
- **การป้องกัน CSRF (CSRF mitigation):** การส่ง Cookie จะตั้งค่า `SameSite=Strict` อย่างเคร่งครัด
- **ระยะเวลาหมดอายุ (Token/session expiry):** กำหนดเวลาหมดอายุที่ 24 ชั่วโมงหลังจากล็อกอิน
- **แหล่งจัดเก็บข้อมูลความลับ (Where secrets live):** ข้อมูลลับทั้งหมด (เช่น JWT Secret) จะถูกเก็บไว้ในไฟล์ `.env` บนฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามทำการคอมมิตเข้าสู่ระบบจัดการซอร์สโค้ด (Source control) เด็ดขาด

---

## ข้อมูลจำเพาะของจุดสิ้นสุด (Endpoint Specifications)

### Endpoints สำหรับการยืนยันตัวตน (Authentication Endpoints)

**POST `/auth/login`**
- **Auth required:** ไม่จำเป็น (No)
- **Request body:** `{ "email": "string", "password": "string" }`
- **Success (200):** `{ "id": "string", "name": "string", "email": "string", "role": "enum", "requiresPasswordChange": "boolean" }` — **ไม่มีการตอบกลับ `passwordHash` ออกไป**
- **Error (401):** `{ "error": "Invalid credentials" }` — ใช้ข้อความเดียวกันนี้ไม่ว่าจะรหัสผ่านผิดหรือบัญชีไม่มีอยู่จริง (ปิดกั้น Account enumeration)
- **กลไกการทำงาน:** ทำการสร้างเซสชันใน Cookie / หรือส่งออก HttpOnly Token

**POST `/auth/logout`**
- **Auth required:** จำเป็น (ทุกบทบาท)
- **Request body:** ไม่มี
- **Success (200):** `{ "message": "Logged out" }`; ทำการเพิกถอน Token หรือเคลียร์เซสชัน
- **Error (401):** หากคำขอมาจากผู้ใช้ที่ไม่ได้เข้าสู่ระบบอยู่

**GET `/auth/me`**
- **Auth required:** จำเป็น (ทุกบทบาท)
- **Request body:** ไม่มี
- **Success (200):** `{ "id": "string", "name": "string", "email": "string", "role": "enum", "requiresPasswordChange": "boolean" }` — **ไม่มี `passwordHash`**
- **Error (401):** หากคำขอมาโดยยังไม่ได้เข้าสู่ระบบ

**POST `/auth/change-password`**
- **Auth required:** จำเป็น (ทุกบทบาท)
- **Request body:** `{ "newPassword": "string", "confirmPassword": "string" }` (หมายเหตุ: `confirmPassword` ถูกตรวจสอบจากฝั่งไคลเอนต์ ในฝั่งเซิร์ฟเวอร์ตรวจสอบความปลอดภัยของ `newPassword` เท่านั้น)
- **Success (200):** `{ "message": "Password changed" }`; ระบบทำการแก้ไขฐานข้อมูลและตั้ง `requiresPasswordChange = false`
- **Error (422):** `{ "error": "Password does not meet requirements", "details": ["..."] }`
- **Error (401):** หากไม่ได้ยืนยันตัวตน

---

### Endpoints สำหรับผู้ร้องขอ (Ticket Endpoints - Requester)

*(หมายเหตุ: ทุก Endpoint เหล่านี้ หาก Client ส่ง `requesterId` แทรกมาใน Body จะถูกเพิกเฉย ระบบจะต้องยึดจาก `req.user.id` เท่านั้น รวมไปถึงตรวจสอบสิทธิ์ในการเข้าถึงตั๋วของตนเอง กรณีละเมิดสิทธิ์ ระบบจะแสดง 403)*

**POST `/tickets`**
- **Auth required:** จำเป็น (`REQUESTER` อนุญาตให้สร้างเป็นของตนเองเท่านั้น)
- **Request body:** `summary`, `description`, `category`... (ตามโครงสร้าง Lab 2)
- **Success (201):** คืนค่าข้อมูล Ticket ที่สร้างใหม่
- **Error (422):** ส่งข้อมูลไม่ครบ

**GET `/tickets`**
- **Auth required:** จำเป็น (`REQUESTER` เห็นเฉพาะของตนเอง)
- **Success (200):** คืนรายการอาร์เรย์ของ Ticket

**GET `/tickets/:id`**
- **Auth required:** จำเป็น (`REQUESTER` อนุญาตเฉพาะตั๋วของตนเองเท่านั้น)
- **Success (200):** คืนรายละเอียดข้อมูลตั๋ว
- **Error (403):** หากพยายามดูตั๋วของบุคคลอื่น (ไม่เปิดเผยว่าตั๋วมีอยู่จริง)

**POST `/tickets/:id/attachments` และ GET `/tickets/:id/attachments/:attachmentId`**
- **Auth required:** จำเป็น (`REQUESTER` เฉพาะตั๋วตัวเอง)
- การทำงานตามมาตรฐานจาก Lab 2 เพิ่มเติมเพียงการตรวจสอบสิทธิ์การเป็นเจ้าของ

**POST `/tickets/:id/comments`**
- **Auth required:** จำเป็น (`REQUESTER` ตั๋วตนเอง, `IT_STAFF`, `ADMINISTRATOR`)
- **Request body:** `{ "content": "string" }` — ความยาวไม่ว่างเปล่า และสูงสุด 2000 ตัวอักษร
- **Success (201):** `{ "id": "...", "ticketId": "...", "authorId": "...", "content": "...", "createdAt": "...", "author": { "id": "...", "name": "...", "role": "..." } }`
- **Error (422):** ไม่ระบุเนื้อหา หรือประกอบด้วยแค่ช่องว่าง
- **Error (403):** `REQUESTER` พยายามดูตั๋วของผู้อื่น

**GET `/tickets/:id/comments`**
- **Auth required:** จำเป็น (`REQUESTER` ตั๋วตนเอง, `IT_STAFF`, `ADMINISTRATOR`)
- **Success (200):** `{ "comments": [{ "id": "...", "ticketId": "...", "authorId": "...", "content": "...", "createdAt": "...", "author": { "id": "...", "name": "...", "role": "..." } }] }`

**PATCH `/tickets/:id/resolved-flag`**
- **Auth required:** จำเป็น (`REQUESTER` ตั๋วตนเองเท่านั้น)
- **Request body:** `{ "problemAppearsResolved": "boolean" }`
- **Success (200):** `{ "id": "...", "problemAppearsResolved": "boolean" }`
- **Error (403):** พยายามแก้ไขของผู้อื่น หรือเข้าถึงด้วยบทบาทอื่นที่ไม่ใช่ `REQUESTER`

**POST `/tickets/:id/notes`**
- **Auth required:** จำเป็น (`IT_STAFF`, `ADMINISTRATOR` เท่านั้น)
- **Request body:** `{ "content": "string" }` — ไม่ว่างเปล่า และสูงสุด 2000 ตัวอักษร
- **Success (201):** คืนค่าออบเจ็กต์ Note แบบเดียวกับคอมเมนต์
- **Error (403):** `REQUESTER` ไม่สามารถบันทึก — **ข้อผิดพลาดนี้ห้ามเปิดเผยหรือมีโครงสร้างเนื้อหาของ Note ใด ๆ ออกไป**
- **Error (422):** เนื้อหาว่างเปล่า

**GET `/tickets/:id/notes`**
- **Auth required:** จำเป็น (`IT_STAFF`, `ADMINISTRATOR` เท่านั้น)
- **Success (200):** `{ "notes": [...] }`
- **Error (403):** `REQUESTER` ร้องขอ — **ห้ามเปิดเผยข้อมูลภายในใด ๆ ในข้อความตอบกลับ**

---

### Endpoints สำหรับเจ้าหน้าที่ (IT Staff Endpoints)

**GET `/staff/tickets`**
- **Auth required:** จำเป็น (`IT_STAFF`, `ADMINISTRATOR`)
- **Query params:**
  - `search` (string, ป้อนได้): ค้นหาในฟิลด์ Summary หรือ หมายเลขตั๋ว โดยไม่คำนึงถึงตัวพิมพ์
  - `status` (enum, ป้อนได้): ตัวเลือกตามสถานะที่มี (ส่งรหัส 400 หากไม่ใช่ค่า enum)
  - `priority` (enum, ป้อนได้): ตัวเลือกตามลำดับความสำคัญ (ส่งรหัส 400 หากผิด)
  - `ownerId` (string, ป้อนได้): ค้นหาตาม ID ของเจ้าของ
  - `sort` (string, ป้อนได้): ชื่อฟิลด์ (ส่งรหัส 400 หากผิด)
  - `direction` (enum: `asc | desc`, ป้อนได้)
  - `page` (integer ≥ 1, ป้อนได้, ค่าเริ่มต้น 1)
  - `pageSize` (integer 1–100, ป้อนได้, ค่าเริ่มต้น 20)
- **Success (200):**
  ```json
  {
    "tickets": [ /* อาร์เรย์ของการสรุปตั๋ว */ ],
    "pagination": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 }
  }
  ```
- **Error (400):** ระบุฟิลด์การเรียงลำดับ หรือค่าความสำคัญ สถานะ ที่ผิดพลาด
- **Error (403):** `REQUESTER` พยายามเข้าใช้งาน
- **Error (401):** ไม่ได้ยืนยันตัวตน

**GET `/staff/tickets/:id`**
- **Auth required:** จำเป็น (`IT_STAFF`, `ADMINISTRATOR`)
- **Success (200):** คืนรายละเอียดตั๋วทั้งหมด รวมผู้ร้องขอ, เจ้าของ, คอมเมนต์, บันทึกภายใน และไฟล์แนบ
- **Error (403):** `REQUESTER` พยายามเข้าถึง
- **Error (404):** ไม่พบตั๋ว

**PATCH `/staff/tickets/:id/owner`**
- **Auth required:** จำเป็น (`IT_STAFF`, `ADMINISTRATOR`)
- **Request body:** `{ "ownerId": "string | null" }` (null คือ ยกเลิกการอ้างสิทธิ์)
- **Success (200):** อัปเดตพร้อมระบุเจ้าของใหม่
- **Error (422):** ระบุเจ้าของไปให้บทบาท `REQUESTER` หรือ ผู้ใช้ที่ไม่มีสถานะ Active
- **Error (403):** `REQUESTER` พยายามเข้าถึง

**PATCH `/staff/tickets/:id/priority`**
- **Auth required:** จำเป็น (`IT_STAFF`, `ADMINISTRATOR`)
- **Request body:** `{ "itPriority": "enum | null" }`
- **Success (200):** อัปเดตตั๋วแล้ว
- **Error (422):** ให้ค่าความสำคัญที่ไม่ถูกต้อง
- **Error (403):** `REQUESTER` พยายามเข้าถึง

**PATCH `/staff/tickets/:id/status`**
- **Auth required:** จำเป็น (`IT_STAFF`, `ADMINISTRATOR`)
- **Request body:** `{ "status": "enum" }`
- **Success (200):** อัปเดตตั๋วแล้ว
- **Error (422):** การเปลี่ยนสถานะฝ่าฝืนกฎ Ticket Status Transition Matrix
- **Error (403):** `REQUESTER` พยายามเข้าถึง
*(หมายเหตุ: กฎการเปลี่ยนแปลงเมทริกซ์สถานะ จะยึดตามเอกสาร Specification.md อย่างเคร่งครัด)*

---

### Endpoints สำหรับผู้ดูแลระบบ (Administrator Endpoints)

**GET `/admin/users`**
- **Auth required:** จำเป็น (`ADMINISTRATOR` เท่านั้น)
- **Query params:** `search` (ชื่อ หรือ อีเมล, แบบป้อนได้), `role` (แบบป้อนได้)
- **Success (200):** `{ "users": [{ "id": "...", "name": "...", "email": "...", "role": "...", "isActive": true, "createdAt": "..." }] }` — **ต้องไม่มี `passwordHash`**
- **Error (403):** ไม่ใช่แอดมิน
- **Error (401):** ไม่ได้ยืนยันตัวตน

**POST `/admin/users`**
- **Auth required:** จำเป็น (`ADMINISTRATOR` เท่านั้น)
- **Request body:** `{ "name": "string", "email": "string", "role": "enum", "password": "string" }`
- **Success (201):** `{ "id": "...", "name": "...", "email": "...", "role": "...", "isActive": true, "requiresPasswordChange": true, "createdAt": "..." }` — **ไม่มี `passwordHash`**
- **Error (409):** อีเมลซ้ำ
- **Error (422):** บทบาทไม่ถูกต้อง หรือไม่ผ่านเกณฑ์การตั้งค่า

**PATCH `/admin/users/:id`**
- **Auth required:** จำเป็น (`ADMINISTRATOR` เท่านั้น)
- **Request body:** `{ "name"?: "string", "email"?: "string", "role"?: "enum", "isActive"?: "boolean" }` (ทุกฟิลด์ส่งแบบ Option)
- **Success (200):** อัปเดตข้อมูลผู้ใช้งานแล้ว — **ไม่มี `passwordHash`**
- **Error (403):** พยายามปิดการใช้งานของตนเอง หรือมีบทบาทอื่นเข้าถึง
- **Error (409):** พยายามปิดการใช้งานของแอดมินระบบคนสุดท้าย หรือเกิดกรณีอีเมลซ้ำกับคนอื่น
- **Error (422):** ให้บทบาทไม่ถูกต้อง

**PATCH `/admin/users/:id/password`**
- **Auth required:** จำเป็น (`ADMINISTRATOR` เท่านั้น)
- **Request body:** `{ "newPassword": "string" }`
- **Success (200):** `{ "message": "Password reset" }` พร้อมตั้งค่า `requiresPasswordChange = true` ในฐานข้อมูล
- **Error (422):** รหัสผ่านความยาวไม่ถึงขั้นต่ำ หรือไม่ได้มาตรฐานความปลอดภัย

---

## รูปแบบมาตรฐานความปลอดภัยของข้อผิดพลาด (Safe Error Conventions)
- **ข้อห้ามเด็ดขาด (Never):** ห้ามตอบกลับด้วย Stack traces, ข้อมูลความผิดพลาดของ SQL, หรือข้อความรายละเอียดจากส่วนลึกของเซิร์ฟเวอร์ ให้แก่ผู้ใช้งาน
- **ข้อห้ามเด็ดขาด (Never):** ห้ามเปิดเผยข้อมูล `passwordHash` ไม่ว่าในกรณีรับส่ง หรือเมื่อเกิดข้อผิดพลาด
- รูปแบบมาตรฐานเมื่อแสดงผลความผิดพลาด ต้องมีรูปร่างคือ `{ "error": "string", "details"?: ["string"] }`
- เมื่อเกิดการละเมิดสิทธิ์บทบาทแบบถูกปฏิเสธ (Forbidden) ให้ระบบส่งข้อความที่ช่วยปกปิดข้อมูลที่มีอยู่จริง (เช่น การละเมิดไปดูตั๋วของผู้อื่น ส่งเป็น `403` ไม่ใช่ `404` แต่ไม่มีการชี้แจงว่ามีตั๋วนั้นอยู่จริง)
