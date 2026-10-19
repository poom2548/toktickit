# ข้อกำหนด API Lab 4 (API Specification)

## 1. ข้อกำหนดพื้นฐานและข้อผิดพลาด (Conventions and Errors)
- **Base Path Convention:** API ทั้งหมดในเอกสารนี้ใช้ Base Path `/api` (สำหรับ Requester, Attachments และ Workflow) หรือ `/staff` หรือ `/admin` ตามกลุ่มผู้ใช้งาน พารามิเตอร์รหัสตั๋วจะใช้ `:id` เป็นมาตรฐานเดียวกันทั้งหมด
- **Optimistic Concurrency:** ปลายทางที่แก้ไขข้อมูลต้องการ `version` token ปัจจุบัน หากค่าไม่ตรงกัน จะส่งคืนข้อผิดพลาด `409 Conflict`
- **Idempotency:** การรับเรื่องขอสร้างข้อมูล (POST) และการเปลี่ยนสถานะ รองรับ Header `Idempotency-Key` ระยะเวลาเก็บคีย์คือ 24 ชั่วโมง (กำหนดโดยฟิลด์ `expiresAt` ในตาราง `IdempotencyKey` — ดูโมเดลในหัวข้อ 7 ของ specification) โดยมีขอบเขต (scope) แยกตาม User + Endpoint + Key 
  - หากส่งคำขอด้วยคีย์เดิมและ body เดิม จะส่งคืน response เดิม (เช่น 201/200) พร้อมกับ Header `Idempotent-Replayed: true`
  - หากคีย์เดิมแต่เนื้อหา body เปลี่ยน จะส่งคืน `422 IDEMPOTENCY_KEY_REUSED`

### แคตตาล็อกรหัสข้อผิดพลาด (Error Code Catalog)

| รหัสข้อผิดพลาด (Code) | HTTP Status | กรณีที่ใช้งาน (When Used) |
| :--- | :--- | :--- |
| `VALIDATION_FAILED` | 422 | ข้อมูลใน Request ไม่ถูกต้องตามข้อกำหนด |
| `UNAUTHENTICATED` | 401 | ยังไม่ได้เข้าสู่ระบบ หรือ Session หมดอายุ |
| `FORBIDDEN` | 403 | ผู้ใช้ไม่มีสิทธิ์ในการทำงานนี้ หรือเข้าถึงตั๋วของผู้อื่น |
| `NOT_FOUND` | 404 | ไม่พบทรัพยากรที่ระบุ (เช่น ไม่พบตั๋ว) |
| `CONFLICT` | 409 | ค่า version ล้าสมัย (Stale version) (มี `currentVersion` ใน response) |
| `TICKET_LOCKED` | 409 | ตั๋วอยู่ในสถานะปิดใช้งาน (CLOSED หรือ CANCELLED) |
| `INVALID_TRANSITION` | 422 | พยายามเปลี่ยนสถานะข้ามไปในสถานะที่ไม่อนุญาตตามเมทริกซ์ |
| `RESOLUTION_GATE_FAILED` | 422 | ไม่ผ่านเงื่อนไขการปิดงาน (มี `reason` อธิบายสาเหตุ) |
| `INVALID_ASSIGNEE` | 422 | ผู้รับมอบหมายไม่ถูกต้อง หรือเป็น Inactive user |
| `IDEMPOTENCY_KEY_REUSED` | 422 | ส่ง Idempotency Key ซ้ำแต่ Request Body ไม่ตรงกับของเดิม |
| `INVALID_TICKET_STATE` | 409 | การดำเนินการนี้ไม่ได้รับอนุญาตในสถานะปัจจุบันของตั๋ว |
| `INTERNAL_ERROR` | 500 | ข้อผิดพลาดที่ฝั่งเซิร์ฟเวอร์ (ส่งคืนข้อความทั่วไปแบบ Generic เท่านั้น) |

- **Safe Error Envelope:** ข้อผิดพลาดทั้งหมดจะถูกส่งคืนในรูปแบบมาตรฐาน (JSON envelope) ห้ามเปิดเผยข้อมูลรายละเอียดเชิงลึกของเซิร์ฟเวอร์โดยเด็ดขาด
  ```json
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "The provided data is invalid.",
      "fields": {
        "followUpNote": "Required when follow-up is needed."
      }
    }
  }
  ```

- **ตัวอย่าง 409 Conflict:**
  ```json
  {
    "error": {
      "code": "CONFLICT",
      "message": "The ticket was modified by another user.",
      "currentVersion": 3
    }
  }
  ```

### ข้อผิดพลาดส่วนกลางและการสำรองข้อมูล (Global Fallbacks & Safe Failure)
ระบบมีกลไก Global Error Fallbacks บนเซิร์ฟเวอร์เพื่อให้มั่นใจว่าการตอบกลับข้อผิดพลาดมีความปลอดภัยและเป็นไปตามแบบแผน:
1. **Unhandled Errors (500):** ข้อผิดพลาดใดๆ ที่ไม่ได้ถูกดักจับจะถูกส่งกลับด้วย HTTP 500 ในรูปแบบ Error Envelope:
   ```json
   {
     "error": {
       "code": "INTERNAL_ERROR",
       "message": "An unexpected error occurred."
     }
   }
   ```
   ห้ามเปิดเผย `err.message` ดิบหรือ Stack Traces ออกไปเด็ดขาด
2. **Malformed JSON Body (422):** เมื่อ Request Body มีรูปแบบ JSON ที่ไม่ถูกต้อง (เช่น parse error) ระบบจะส่งกลับด้วย HTTP 422:
   ```json
   {
     "error": {
       "code": "VALIDATION_FAILED",
       "message": "Malformed request body."
     }
   }
   ```
3. **Unmatched Routes (404):** สำหรับเส้นทางที่ไม่มีอยู่จริงและผ่านการยืนยันตัวตนแล้ว หรืออยู่นอก `/api` ระบบจะส่งกลับด้วย HTTP 404 ในรูปแบบ Error Envelope:
   ```json
   {
     "error": {
       "code": "NOT_FOUND",
       "message": "Resource not found."
     }
   }
   ```
   *(หมายเหตุสำคัญ: สำหรับคำขอที่ไม่ผ่านการยืนยันตัวตนไปยังเส้นทางที่ไม่มีอยู่ภายใต้ `/api/*` คำขอจะเข้าสู่ middleware `requireAuth` ของ attachment router เป็นลำดับแรก และส่งคืน HTTP 401 `{"error":"Authentication required."}` ตามพฤติกรรมเดิมของ Lab 3 ซึ่งได้รับการรักษาไว้)*

### การเปรียบเทียบรูปแบบการตอบกลับระหว่าง Lab 3 และ Lab 4 (Response Formats Comparison)

| กรณี / เส้นทาง | Lab 3 Format | Lab 4 Standard Envelope Format | หมายเหตุ |
|---|---|---|---|
| Unauthenticated (`401`) | `{"error": "Authentication required."}` | `{"error": {"code": "UNAUTHENTICATED", "message": "Authentication required."}}` | เส้นทาง Lab 3 เดิมและ `/api/*` รักษา format เดิม |
| Forbidden (`403`) | `{"error": "Forbidden"}` / `{"error": "Access denied."}` | `{"error": {"code": "FORBIDDEN", "message": "..."}}` | Endpoints ใหม่ของ Lab 4 ใช้ envelope |
| Validation / Malformed (`422`) | `{"error": "...", "fields": [...]}` | `{"error": {"code": "VALIDATION_FAILED", "message": "...", "fields": {...}}}` | Endpoints ใหม่ของ Lab 4 ใช้ envelope |
| Conflict (`409`) | `{"error": "Conflict"}` | `{"error": {"code": "CONFLICT", "message": "...", "currentVersion": N}}` | ทั้งเส้นทางใหม่และ legacy `/owner` และ `/status` ใช้ envelope เมื่อ version ขัดแย้ง |
| Unhandled Server Error (`500`) | `{"error": err.message}` | `{"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}}` | ปรับปรุงให้ปลอดภัย ปราศจากการรั่วไหล |

## 2. ปลายทางสำหรับการดำเนินการ (Actions Taken Endpoints)

### `GET /api/tickets/:id/actions-taken`
- **Auth required:** ใช่ (ผู้ร้องขอสำหรับตั๋วของตนเอง, เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **Success (200):** ส่งคืนรายการ Actions Taken โดยเรียงลำดับอย่างคงที่ (actionAt น้อยไปมาก, createdAt น้อยไปมาก, id น้อยไปมาก)
  ```json
  {
    "actions": [
      {
        "id": "clxxxxxx",
        "actionAt": "2026-10-03T10:00:00Z",
        "description": "Investigated the network issue.",
        "result": "Restarted the router.",
        "performedBy": { "id": "clxxxxxx", "name": "IT Staff Member" },
        "followUpRequired": false,
        "followUpNote": null,
        "attachmentNotes": "See network_logs.txt",
        "version": 1,
        "createdAt": "2026-10-03T10:05:00Z"
      }
    ]
  }
  ```
- **Errors:** 401, 403, 404

### `POST /api/tickets/:id/actions-taken`
- **Auth required:** ใช่ (เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **Headers:** `Idempotency-Key` (สตริงทางเลือก)

  - **หมายเหตุ:** ฟิลด์ `performedBy` และ `ticketId` ที่ส่งมาใน Request Body จะถูกเพิกเฉยเสมอ โดยระบบจะใช้ค่าจาก Session ของผู้ใช้ปัจจุบันและ ID จาก URL แทน


**ตารางการตรวจสอบข้อมูล (Validation)**

| ฟิลด์ | Required (POST) | ชนิดข้อมูล | ข้อกำหนดความยาว / รูปแบบ |
| :--- | :--- | :--- | :--- |
| `description` | ใช่ | String | สูงสุด 2000 ตัวอักษร |
| `result` | ใช่ | String | สูงสุด 2000 ตัวอักษร |
| `followUpRequired` | ใช่ | Boolean | |
| `followUpNote` | ใช่ (ถ้า followUpRequired=true) | String | สูงสุด 1000 ตัวอักษร (จะถูกเคลียร์เป็น null หาก followUpRequired=false) |
| `attachmentNotes` | ไม่ | String | สูงสุด 1000 ตัวอักษร |
| `actionAt` | ใช่ | String | ISO-8601 UTC ต้องไม่เกิน 5 นาทีในอนาคต |

- **Request body:**
  ```json
  {
    "actionAt": "2026-10-03T10:00:00Z",
    "description": "Investigated the network issue.",
    "result": "Restarted the router.",
    "followUpRequired": true,
    "followUpNote": "Check again in 2 hours.",
    "attachmentNotes": null
  }
  ```
- **Success (201):** ส่งคืนรายการ Action Taken ที่ถูกสร้าง
- **Errors:** 422 `VALIDATION_FAILED` (ข้อมูลไม่ถูกต้อง), 401, 403, 404, 409 `TICKET_LOCKED` (ตั๋วเป็น CLOSED/CANCELLED)

### `PATCH /api/tickets/:id/actions-taken/:actionId`
- **Auth required:** ใช่ (เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **พฤติกรรม (Behavior):** เป็นการอัปเดตบางส่วน (Partial update) เฉพาะฟิลด์ที่ส่งมาเท่านั้นที่จะถูกอัปเดต `version` เป็นข้อมูลบังคับ หากส่งฟิลด์ที่ไม่สามารถเปลี่ยนแปลงได้ (เช่น `ticketId`, `performedById`, `createdAt`) จะถูกละเว้น (Ignored) การเข้าถึงข้ามตั๋ว (Action ID ของตั๋วใบอื่น) จะส่งคืน 404
- **ตารางการตรวจสอบข้อมูล:** ใช้ตารางเดียวกับ POST ยกเว้นว่าทุกฟิลด์ใน Request Body เป็น Optional (เว้นแต่จะส่งมา จะต้องทำตามข้อกำหนดความยาว) `version` เป็น Required
- **Request body:**
  ```json
  {
    "version": 1,
    "description": "Investigated the network issue extensively.",
    "result": "Restarted the router and updated firmware."
  }
  ```
- **Success (200):** ส่งคืนรายการ Action Taken ที่ถูกอัปเดตพร้อมกับค่า `version` ที่เพิ่มขึ้น
  ```json
  {
    "id": "clxxxxxx",
    "actionAt": "2026-10-03T10:00:00Z",
    "description": "Investigated the network issue extensively.",
    "result": "Restarted the router and updated firmware.",
    "performedBy": { "id": "clxxxxxx", "name": "IT Staff Member" },
    "followUpRequired": true,
    "followUpNote": "Check again in 2 hours.",
    "attachmentNotes": null,
    "version": 2,
    "createdAt": "2026-10-03T10:05:00Z"
  }
  ```
- **Errors:** 422 `VALIDATION_FAILED`, 401, 403, 404 `NOT_FOUND` (ไม่พบตั๋ว หรือ Action หรือเข้าถึงข้ามตั๋ว), 409 `CONFLICT` (ค่า version ล้าสมัย), 409 `TICKET_LOCKED`

## 3. ปลายทางสำหรับเวิร์กโฟลว์ตั๋ว (Ticket Workflow Endpoints)

### `POST /api/tickets/:id/status`
- **Auth required:** ใช่ (เจ้าหน้าที่ไอที, ผู้ดูแลระบบ, หรือผู้ร้องขอสำหรับการยกเลิกตั๋วของตนเองที่ได้รับอนุญาต) ผู้ร้องขอสามารถส่งเปลี่ยนได้เฉพาะสถานะที่ตนเองมีสิทธิ์ตามเมทริกซ์การเปลี่ยนสถานะ
- **Headers:** `Idempotency-Key` (สตริงทางเลือก)
- **Request body:** ต้องมี `version` และ `status` ใหม่

  - **ลำดับการตรวจสอบสิทธิ์และการประมวลผล (Order of Checks):**
    1. ตรวจสอบการยืนยันตัวตน (Authentication): 401 UNAUTHENTICATED
    2. ตรวจสอบ :id และการมีอยู่ของตั๋ว (Parsing & Existence): 404 NOT_FOUND
    3. ตรวจสอบสิทธิ์การเข้าถึง (Authorization): ตรวจสอบสิทธิ์ก่อน Body Validation และ Version Concurrency เสมอ หาก Requester ไม่ได้เป็นเจ้าของตั๋ว จะได้รับ 403 FORBIDDEN ทันทีโดยไม่เปิดเผยข้อมูลสถานะหรือ version ของตั๋ว
    4. ตรวจสอบข้อมูลใน Request (Body Validation): status ต้องถูกต้อง และ version ต้องเป็นจำนวนเต็มบวก (> 0) มิฉะนั้นตอบกลับ 422 VALIDATION_FAILED พร้อม fields
    5. ตรวจสอบ Version Concurrency, Transition Matrix และ Resolution Gate: version ล้าสมัยตอบกลับ 409 CONFLICT; คู่สถานะที่ไม่อนุญาต/ตั๋วถูกล็อกตอบกลับ 422 INVALID_TRANSITION; เปลี่ยนสถานะที่บทบาทไม่มีสิทธิ์ตอบกลับ 403 FORBIDDEN; ปิดงานไม่ผ่านเกณฑ์ตอบกลับ 422 RESOLUTION_GATE_FAILED
    6. กระบวนการใน Transaction: บันทึกสถานะใหม่, เพิ่ม version ขึ้น 1, เพิ่มประวัติใน TicketStatusHistory, และล้างค่า requesterMarkedResolvedAt (ตั้งเป็น null) และ problemAppearsResolved (ตั้งเป็น false)
  - **การป้องกันข้อมูลรั่วไหล (No Leakage):** ข้อมูลสรุปตั๋วที่ส่งคืนประกอบด้วยเฉพาะฟิลด์ id, ticketNumber, status, version, updatedAt, requesterMarkedResolvedAt, owner ({id, name} หรือ null) ไม่เปิดเผยข้อมูลอีเมล, รหัสผ่าน, โน้ตภายใน หรือ IT priority

  ```json
  {
    "version": 2,
    "status": "RESOLVED"
  }
  ```
- **Success (200):** ส่งคืนข้อมูลสรุปของตั๋วที่ถูกอัปเดต
  ```json
  {
    "id": 42,
    "ticketNumber": "TKT-0042",
    "status": "RESOLVED",
    "version": 3,
    "updatedAt": "2026-10-03T10:10:00Z",
    "owner": { "id": "clxxxxxx", "name": "IT Staff Member" }
  }
  ```
- **Errors:** 401, 403, 404, 409 `CONFLICT` (ค่า version ล้าสมัย)
  - `422 INVALID_TRANSITION` ตัวอย่าง:
    ```json
    {
      "error": {
        "code": "INVALID_TRANSITION",
        "message": "Cannot transition from CLOSED to IN_PROGRESS."
      }
    }
    ```
  - `422 RESOLUTION_GATE_FAILED` ตัวอย่าง:
    ```json
    {
      "error": {
        "code": "RESOLUTION_GATE_FAILED",
        "message": "Resolution gate failed.",
        "reason": "Must have at least one Action Taken with a result."
      }
    }
    ```

### `GET /api/tickets/:id/allowed-transitions`
- **Auth required:** ใช่ (ผู้ร้องขอสำหรับตั๋วของตนเอง, เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **Success (200):** ส่งคืนข้อมูลสถานะและ version ปัจจุบันของตั๋ว พร้อมกับสถานะที่อนุญาตให้เปลี่ยนได้สำหรับผู้ใช้ปัจจุบัน
  - ตัวอย่างสำหรับ IT Staff ที่กำลังดูตั๋วสถานะ `IN_PROGRESS`:
    ```json
    {
      "currentStatus": "IN_PROGRESS",
      "version": 2,
      "allowedTransitions": ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"]
    }
    ```
  - ตัวอย่างสำหรับ Requester ที่กำลังดูตั๋วสถานะ `IN_PROGRESS` หรือตั๋วที่อยู่ในสถานะ Terminal (ไม่มีสิทธิ์เปลี่ยนสถานะ):
    ```json
    {
      "currentStatus": "IN_PROGRESS",
      "version": 2,
      "allowedTransitions": []
    }
    ```

### `POST /api/tickets/:id/requester-resolved-indication`
  - **Auth required:** ใช่ (เฉพาะผู้ร้องขอที่เป็นเจ้าของตั๋วเท่านั้น; Staff/Admin หรือ Requester อื่น -> 403 FORBIDDEN)
  - **Headers:** `Idempotency-Key` (ทางเลือก, ขอบเขต User + Endpoint + Key อายุ 24 ชั่วโมง; คำขอซ้ำคืน 200 พร้อม Header `Idempotent-Replayed: true`; คำขอซ้ำที่เนื้อหาต่างกันคืน 422 `IDEMPOTENCY_KEY_REUSED`)
  - **Request body:**
    ```json
    {
      "problemAppearsResolved": true
    }
    ```

  - **กฎการใช้งานและ Idempotency:** 
    - อนุญาตเฉพาะตั๋วที่อยู่ในสถานะกลุ่มเปิด (ยกเว้น NEW) คือ OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED หากสถานะอื่น (NEW, RESOLVED, CLOSED, CANCELLED) ตอบกลับ `409 INVALID_TICKET_STATE`
    - ไม่ต้องส่ง `version` และการดำเนินการนี้ **ไม่ทำให้ version เพิ่มขึ้น**
    - Idempotent by design: ส่งค่า `true` ซ้ำจะคง timestamp เดิมไว้และไม่เกิดการเขียนฐานข้อมูลซ้ำ (updatedAt ไม่เปลี่ยน); ส่งค่า `false` เมื่อเป็น null อยู่แล้วจะไม่เขียนฐานข้อมูล
    - เมื่อส่งค่า `false` จะเคลียร์ค่า `requesterMarkedResolvedAt` เป็น null และ `problemAppearsResolved` เป็น false
    - แฟล็กนี้จะถูกล้างค่าโดยอัตโนมัติเมื่อมีการเปลี่ยนสถานะในทั้งสองเส้นทางสถานะ
    - No Leakage: ส่งคืนเฉพาะฟิลด์ id, ticketNumber, status, version, updatedAt, problemAppearsResolved, requesterMarkedResolvedAt, owner
  - **Success (200):**
    ```json
    { "id": 42, "ticketNumber": "TKT-0042", "status": "OPEN",
      "version": 2, "requesterMarkedResolvedAt": "2026-10-04T08:00:00Z" }
    ```
    *(เมื่อส่ง `false`: `requesterMarkedResolvedAt` จะเป็น `null`)*
  - **Errors:**
    - `409 INVALID_TICKET_STATE` ถ้าตั๋วอยู่ในสถานะที่ไม่อนุญาต (NEW, CLOSED, CANCELLED)
    - `403 FORBIDDEN` หากไม่ใช่ผู้ร้องขอหรือเป็นตั๋วของผู้อื่น
    - `404 NOT_FOUND` หากไม่พบตั๋ว


### `PATCH /staff/tickets/:id/owner` (ปรับปรุงจาก Lab 3)
- **Auth required:** ใช่ (เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **Request body:**
  ```json
  { "version": 2, "ownerId": "cuid_of_staff" }
  ```
  *(ส่ง `ownerId: null` เพื่อยกเลิกการมอบหมาย — Lab 3 รองรับแล้ว; ฟิลด์ `version` เป็นข้อมูลบังคับ โดยหน้าต่างการเปลี่ยนผ่าน compatibility window ปิดลงแล้ว)*
- **กฎ:**
  1. ขาดฟิลด์ `version` หรือ version ไม่ถูกต้อง (ไม่เป็นจำนวนเต็มบวก) → `422 VALIDATION_FAILED` (fields: `{"version": "..."}`)
  2. version ล้าสมัย (ไม่ตรงกับค่าปัจจุบันของตั๋ว) → `409 CONFLICT` พร้อม `currentVersion`
  3. ตั๋วที่ถูกล็อก (CLOSED/CANCELLED) → `409 TICKET_LOCKED`
  4. ผู้รับมอบหมายไม่ถูกต้องหรือเป็น inactive user → `422 INVALID_ASSIGNEE`
  5. สำเร็จ → version เพิ่มขึ้น 1 และส่งคืนรูปแบบข้อมูลตั๋วตาม Lab 3
- **Success (200):**
  ```json
  { "id": 42, "ticketNumber": "TKT-0042", "status": "OPEN", "version": 3,
    "owner": { "id": "clxxxxxx", "name": "Jane Staff" } }
  ```
- **Errors:** 422 `VALIDATION_FAILED`, 422 `INVALID_ASSIGNEE`, 409 `TICKET_LOCKED`, 409 `CONFLICT`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 401

### `GET /staff/assignable-users`
- **Auth required:** ใช่ (เจ้าหน้าที่ไอที, ผู้ดูแลระบบ; ผู้ร้องขอจะได้รับ 403 FORBIDDEN, ผู้ใช้ที่ไม่ผ่านการยืนยันตัวตนจะได้รับ 401 UNAUTHENTICATED)
- **Headers:** `Cache-Control: no-store`
- **วัตถุประสงค์:** ดึงรายชื่อผู้ใช้ที่สามารถรับมอบหมายเป็นเจ้าของตั๋วได้ เพื่อให้ Owner Picker ใน UI ของ IT Staff และ Administrator แสดงรายชื่อได้อย่างปลอดภัยโดยไม่ต้องพึ่งพา `GET /admin/users`
- **เงื่อนไขข้อมูล:** ส่งคืนเฉพาะผู้ใช้ที่มี `isActive: true` และมีบทบาทเป็น `IT_STAFF` หรือ `ADMINISTRATOR` เท่านั้น โดยเรียงลำดับตาม `name ASC, id ASC`
- **Success (200):**
  ```json
  {
    "users": [
      {
        "id": "cmxxxxxx1",
        "name": "Jane Staff",
        "role": "IT_STAFF"
      },
      {
        "id": "cmxxxxxx2",
        "name": "John Admin",
        "role": "ADMINISTRATOR"
      }
    ]
  }
  ```
- **Errors:** 401 (UNAUTHENTICATED), 403 (FORBIDDEN)

## 4. ปลายทางสำหรับแดชบอร์ด (Dashboard Endpoints)
ส่วนหัว `Cache-Control: no-store` จะถูกส่งออกไปในทุกการตอบกลับของทั้งสองปลายทางแดชบอร์ด รวมถึงการตอบกลับข้อผิดพลาดและ 405 Method Not Allowed

### `GET /api/dashboard/requester`
- **Auth required:** ใช่ (ผู้ร้องขอ)
- **Headers:** `Cache-Control: no-store`
- **Scope & Field Mapping:** ขอบเขตจำกัดเฉพาะตั๋วที่ผู้ร้องขอเป็นเจ้าของ (`requesterId` ตรงกับ session ของตนเองเท่านั้น โดยละเว้นพารามิเตอร์หรือตัวกรองภายนอก); ฟิลด์ `title` ใน `recentlyUpdated` แมปมาจากฟิลด์ `summary` ของโมเดล Ticket และ `priority` ใช้ค่า `requestedPriority` เสมอ (ซึ่งเป็นระดับความสำคัญที่ Requester สามารถมองเห็นได้จาก Lab 3 และไม่เปิดเผย `itPriority` หรือส่งค่า null ออกไป)
- **Success (200):**
  ```json
  {
    "metrics": {
      "openTickets": {
        "label": "My Open Tickets",
        "value": 3,
        "drillDown": "/my-tickets?statusGroup=open"
      },
      "waitingForMe": {
        "label": "Waiting for Me",
        "value": 1,
        "drillDown": "/my-tickets?status=WAITING_FOR_REQUESTER"
      },
      "recentlyResolved": {
        "label": "แก้ปัญหาแล้วล่าสุด (Recently Resolved)",
        "value": 2,
        "drillDown": "/my-tickets?status=RESOLVED&resolvedWithinDays=7"
      }
    },
    "recentlyUpdated": [
      {
        "id": 42,
        "ticketNumber": "TKT-0042",
        "title": "Cannot access VPN",
        "status": "OPEN",
        "priority": "MEDIUM",
        "updatedAt": "2026-10-03T09:00:00Z"
      }
    ]
  }
  ```
- **Errors:** 401 (ยังไม่ได้เข้าสู่ระบบ), 403 (เจ้าหน้าที่ไอที/ผู้ดูแลระบบพยายามเข้าถึง)

### `GET /api/dashboard/staff`
- **Auth required:** ใช่ (เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **Headers:** `Cache-Control: no-store`
- **Scope & Field Mapping:** ขอบเขตครอบคลุมตั๋วทั้งหมดในระบบที่เจ้าหน้าที่เข้าถึงได้ (อิงตามเกณฑ์ของ GET /staff/tickets ใน Lab 3); ฟิลด์ `title` ใน `recentlyUpdated` แมปมาจากฟิลด์ `summary` ของโมเดล Ticket และ `priority` ใช้ค่า `itPriority` (ส่งค่า null หากยังไม่ได้รับการกำหนดความสำคัญโดยเจ้าหน้าที่ไอที โดยไม่มีการ fallback ไปหา `requestedPriority`)
- **Success (200):**
  ```json
  {
    "metrics": {
      "unassigned": {
        "label": "Unassigned",
        "value": 5,
        "drillDown": "/staff/tickets?statusGroup=open&assignee=unassigned"
      },
      "myOwned": {
        "label": "My Owned",
        "value": 4,
        "drillDown": "/staff/tickets?statusGroup=open&assignee=me"
      },
      "statusCounts": {
        "label": "By Status",
        "values": { "NEW": 2, "OPEN": 5, "IN_PROGRESS": 3, "WAITING_FOR_REQUESTER": 1, "REOPENED": 1 },
        "drillDownBase": "/staff/tickets?status="
      },
      "priorityCounts": {
        "label": "By IT Priority",
        "values": { "LOW": 1, "MEDIUM": 5, "HIGH": 3, "CRITICAL": 1, "UNSET": 0 },
        "drillDownBase": "/staff/tickets?statusGroup=open&priority="
      }
    },
    "userCounts": {
       "label": "User Accounts (Admin Only)",
       "active": 20,
       "inactive": 2
    },
    "recentlyUpdated": [
      {
        "id": 43,
        "ticketNumber": "TKT-0043",
        "title": "Email sync issue",
        "status": "WAITING_FOR_REQUESTER",
        "priority": "HIGH",
        "updatedAt": "2026-10-03T09:30:00Z"
      }
    ]
  }
  ```
  *(หมายเหตุ: `userCounts` จะแสดงเฉพาะเมื่อผู้ใช้มีบทบาท Administrator เท่านั้น หากเป็น IT Staff ฟิลด์นี้จะถูกละเว้น; `priorityCounts` ครอบคลุม 5 คีย์ [LOW, MEDIUM, HIGH, CRITICAL, UNSET] โดย UNSET นับตั๋วสถานะเปิดที่ itPriority เป็น null และ drillDownBase รวม `statusGroup=open` เป็น `/staff/tickets?statusGroup=open&priority=` ซึ่งจะเชื่อมโยงไปยัง `/staff/tickets?statusGroup=open&priority=UNSET` เมื่อเจาะลึกดูตั๋วที่ยังไม่ได้ระบุความสำคัญ)*
- **Errors:** 401 (ยังไม่ได้เข้าสู่ระบบ), 403 (ผู้ร้องขอพยายามเข้าถึง)

> **ข้อกำหนดการเจาะลึก (Drill-Down Routes):** ค่า `drillDown` และ `drillDownBase` ทั้งหมดที่ส่งกลับมาจาก Dashboard API เป็น **Client Routes (เส้นทาง URL ของฝั่งไคลเอนต์)** สำหรับการนำทางไปยังหน้ารายการตั๋วที่ถูกกรองตามตัวชี้วัด โดยไคลเอนต์จะใช้ค่าสตริงเหล่านี้ตรงๆ (Verbatim) โดยไม่มีการประกอบเส้นทางขึ้นเองใหม่

### พารามิเตอร์การค้นหาและกรองข้อมูลในหน้ารายการ (List Query Parameters)

#### 1. `GET /api/tickets` (รายการตั๋วของผู้ร้องขอ — Scoped to Authenticated Requester)

| พารามิเตอร์ (Parameter) | ค่าที่ยอมรับ (Accepted Values) | ความหมาย (Meaning) | พฤติกรรมเมื่อค่าไม่ถูกต้อง (Invalid Value Behavior) |
|---|---|---|---|
| `status` | Legacy: `New`, `In Progress`, `Resolved`, `Closed`; Enum: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED` (Case-insensitive) | กรองตามสถานะตั๋ว | ละเว้นตัวกรอง (Ignored, คืนตั๋วตามปกติ) |
| `statusGroup` | `open` | กรองตั๋วสถานะเปิดทั้งหมด (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`) | ละเว้นตัวกรอง (Ignored) |
| `resolvedWithinDays` | ตัวเลขจำนวนเต็ม `1` ถึง `365` | กรองตั๋วที่สถานะปัจจุบันเป็น `RESOLVED` และมีประวัติสถานะถูกเปลี่ยนเป็น `RESOLVED` ภายใน N วัน (คำนวณจุดตัดเวลา `now - N * 24h`) | ละเว้นตัวกรอง (Ignored) |
| `priority` | `Low`, `Medium`, `High` | กรองตามความสำคัญที่ผู้ร้องขอระบุ (`requestedPriority`) | ละเว้นตัวกรอง (Ignored) |
| `categoryId` | ตัวเลข ID หมวดหมู่ | กรองตามหมวดหมู่ตั๋ว | ละเว้นตัวกรอง (Ignored) |
| `search` | ข้อความค้นหา | ค้นหาแบบ case-insensitive ใน summary หรือ description | คืนรายการว่างหากไม่พบ |
| `page` | ตัวเลข >= 1 (ค่าเริ่มต้น: 1) | หน้าที่ต้องการดู | ปรับเป็น 1 |
| `limit` | ตัวเลข 1..50 (ค่าเริ่มต้น: 10) | จำนวนรายการต่อหน้า | ปรับให้อยู่ในขอบเขต 1..50 |

*หมายเหตุ: พารามิเตอร์ทั้งหมดรวมกันด้วย AND พารามิเตอร์ที่ไม่ใช่ของปลายทางนี้ (เช่น `assignee`) จะถูกเพิกเฉยและไม่ทำให้ขอบเขตข้อมูลกว้างขึ้น*

#### 2. `GET /staff/tickets` (คิวตั๋วของเจ้าหน้าที่ — All Accessible Tickets)

| พารามิเตอร์ (Parameter) | ค่าที่ยอมรับ (Accepted Values) | ความหมาย (Meaning) | พฤติกรรมเมื่อค่าไม่ถูกต้อง (Invalid Value Behavior) |
|---|---|---|---|
| `status` | `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED` | กรองตามสถานะตั๋ว | ตอบกลับ `400 Bad Request` |
| `statusGroup` | `open` | กรองตั๋วสถานะเปิดทั้งหมด (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`) | ตอบกลับ `400 Bad Request` |
| `assignee` | `unassigned`, `me` | `unassigned`: ตั๋วที่ไม่มีเจ้าของ (`ownerId` เป็น null); `me`: ตั๋วที่เจ้าของตรงกับผู้ใช้ปัจจุบันจากเซสชัน | ตอบกลับ `400 Bad Request` |
| `priority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `UNSET` | กรองตามความสำคัญไอที (`itPriority`); `UNSET` หมายถึง `itPriority` เป็น null | ตอบกลับ `400 Bad Request` |
| `requestedPriority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | กรองตามความสำคัญที่ผู้ร้องขอระบุ | ตอบกลับ `400 Bad Request` |
| `ownerId` | CUID ของผู้ใช้เจ้าหน้าที่ | กรองตาม ownerId ของตั๋ว | คืนรายการว่างหากไม่พบ |
| `search` | ข้อความค้นหา | ค้นหาใน summary หรือ ticketNumber | คืนรายการว่างหากไม่พบ |
| `sort` | `createdAt`, `updatedAt`, `ticketNumber`, `status`, `requestedPriority`, `itPriority` | ฟิลด์ที่ใช้เรียงลำดับ | ตอบกลับ `400 Bad Request` |
| `direction` | `asc`, `desc` | ทิศทางการเรียงลำดับ | ตอบกลับ `400 Bad Request` |
| `page` | ตัวเลข >= 1 (ค่าเริ่มต้น: 1) | หน้าที่ต้องการดู | ตอบกลับ `400 Bad Request` |
| `pageSize` | ตัวเลข 1..100 (ค่าเริ่มต้น: 20) | จำนวนรายการต่อหน้า | ตอบกลับ `400 Bad Request` |

*หมายเหตุ: พารามิเตอร์ทั้งหมดรวมกันด้วย AND*


## 5. ปลายทางของระบบ (System Endpoints)
### `GET /api/health`
- **Auth required:** ไม่ (Public endpoint ไม่ต้องยืนยันตัวตน)
- **Success (200):** ส่งคืนเฉพาะคีย์ `status` และ `service` ที่สืบทอดมาจาก Lab 1 โดยไม่มีการเปลี่ยนแปลง ปราศจากรายละเอียดที่อ่อนไหวหรือข้อมูลฐานข้อมูล
  ```json
  {
    "status": "ok",
    "service": "TokTickIT API"
  }
  ```

## 6. ปลายทางเดิมจาก Lab 2-3 ที่รักษาไว้ (Preserved Lab 2-3 Endpoints)
ปลายทางต่อไปนี้จากแล็บก่อนหน้าจะต้องทำงานตามที่ระบุไว้อย่างครบถ้วน:
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/change-password`
- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/:id` *(หมายเหตุ: การตอบกลับมีการเพิ่มฟิลด์ `version` และ `requesterMarkedResolvedAt` โดยไม่กระทบการทำงานเดิม)*
- `POST /api/tickets/:id/attachments`
- `GET /api/attachments/:id/download`
- `DELETE /api/attachments/:id`
- `POST /api/tickets/:id/comments`
- `GET /api/tickets/:id/comments`
- `POST /api/tickets/:id/notes`
- `PATCH /staff/tickets/:id/status` *(หมายเหตุ: หน้าต่างการเปลี่ยนผ่าน compatibility window ปิดลงแล้ว จำเป็นต้องส่งฟิลด์ `version` ใน Request Body เสมอ หากไม่มีส่งกลับ 422 VALIDATION_FAILED หาก version ล้าสมัยส่งกลับ 409 CONFLICT ในรูปแบบ Lab 4 envelope; หากสำเร็จส่งคืนรูปแบบข้อมูลตามเดิมของ Lab 3)*
- `PATCH /staff/tickets/:id/owner` *(หมายเหตุ: หน้าต่างการเปลี่ยนผ่าน compatibility window ปิดลงแล้ว จำเป็นต้องส่งฟิลด์ `version` ใน Request Body เสมอ หากไม่มีส่งกลับ 422 VALIDATION_FAILED หาก version ล้าสมัยส่งกลับ 409 CONFLICT ในรูปแบบ Lab 4 envelope; หากสำเร็จส่งคืนรูปแบบข้อมูลตามเดิมของ Lab 3)*
- `GET /api/tickets/:id/notes`
- `GET /staff/tickets`
- `GET /staff/tickets/:id` *(หมายเหตุ: การตอบกลับมีการเพิ่มฟิลด์ `version` และ `requesterMarkedResolvedAt` กฎการมองเห็นโน้ตภายในสำหรับ IT Staff เหมือนเดิม)*
- `PATCH /staff/tickets/:id/priority`
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `PATCH /admin/users/:id/password`
