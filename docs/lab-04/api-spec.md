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

  - **กระบวนการภายใน (Transaction):** การเปลี่ยนแปลงสถานะที่สำเร็จจะต้องทำภายใน 1 Transaction เดียว โดยประกอบด้วย:
    1. ตรวจสอบ `version` และตรวจสอบสิทธิ์จากเมทริกซ์การเปลี่ยนสถานะ
    2. เขียนสถานะใหม่และเพิ่ม `version` ขึ้น 1
    3. เพิ่มแถวข้อมูลใน `TicketStatusHistory`
    4. ล้างค่า `requesterMarkedResolvedAt` (ตั้งเป็น null)
  - **หมายเหตุ:** หาก Requester พยายามเปลี่ยนสถานะในแบบที่ Requester ไม่มีสิทธิ์ จะได้รับ 403 FORBIDDEN, แต่หากเป็นการเปลี่ยนสถานะจาก->ไปยังสถานะที่ไม่ถูกต้อง (Invalid pair) จะได้รับ 422 INVALID_TRANSITION

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
  - **Auth required:** ใช่ (ผู้ร้องขอสำหรับตั๋วของตนเอง)
  - **Request body:**
    ```json
    {
      "problemAppearsResolved": true
    }
    ```

  - **กฎการใช้งาน:** 
    - อนุญาตเฉพาะตั๋วที่อยู่ในสถานะกลุ่มเปิด (ยกเว้น NEW) คือ OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED
    - ไม่ต้องส่ง `version` และการดำเนินการนี้ **ไม่ทำให้ version เพิ่มขึ้น** (จะคืนค่า version ปัจจุบันกลับไป)
    - หากส่งค่า `true` ซ้ำ จะคง timestamp เดิมไว้
    - แฟล็กนี้จะถูกล้างค่าโดยอัตโนมัติเมื่อมีการเปลี่ยนสถานะ
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
  { "version": 2, "ownerId": "cuid_of_staff" } (version is optional for backward compatibility)
  ```
  *(ส่ง `ownerId: null` เพื่อยกเลิกการมอบหมาย — Lab 3 รองรับแล้ว)*
- **กฎ:**
  1. ตั๋วที่ถูกล็อก (CLOSED/CANCELLED) → `409 TICKET_LOCKED`
  2. version ล้าสมัย → `409 CONFLICT`
  3. สำเร็จ → version เพิ่มขึ้น 1
- **Success (200):**
  ```json
  { "id": 42, "ticketNumber": "TKT-0042", "status": "OPEN", "version": 3,
    "owner": { "id": "clxxxxxx", "name": "Jane Staff" } }
  ```
- **Errors:** 422 `VALIDATION_FAILED`, 422 `INVALID_ASSIGNEE`, 409 `TICKET_LOCKED`, 409 `CONFLICT`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 401

## 4. ปลายทางสำหรับแดชบอร์ด (Dashboard Endpoints)

### `GET /api/dashboard/requester`
- **Auth required:** ใช่ (ผู้ร้องขอ)
- **Success (200):**
  ```json
  {
    "metrics": {
      "openTickets": {
        "label": "My Open Tickets",
        "value": 3,
        "drillDown": "/tickets?statusGroup=open"
      },
      "waitingForMe": {
        "label": "Waiting for Me",
        "value": 1,
        "drillDown": "/tickets?status=WAITING_FOR_REQUESTER"
      },
      "recentlyResolved": {
        "label": "แก้ปัญหาแล้วล่าสุด (Recently Resolved)",
        "value": 2,
        "drillDown": "/tickets?status=RESOLVED"
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
        "values": { "LOW": 1, "MEDIUM": 5, "HIGH": 3, "CRITICAL": 1 },
        "drillDownBase": "/staff/tickets?priority="
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
  *(หมายเหตุ: `userCounts` จะแสดงเฉพาะเมื่อผู้ใช้มีบทบาท Administrator เท่านั้น หากเป็น IT Staff ฟิลด์นี้จะถูกละเว้น)*
- **Errors:** 401 (ยังไม่ได้เข้าสู่ระบบ), 403 (ผู้ร้องขอพยายามเข้าถึง)

**ตัวกรองที่ต้องเพิ่มในหน้ารายการ (สำหรับ Issue #8):**
GET /api/tickets และ GET /staff/tickets ต้องรองรับ parameter เพิ่มเติมดังนี้:
- **ยังไม่มีในระบบ (ต้องเพิ่ม):** `statusGroup` (กลุ่มสถานะ เช่น `open`), `assignee` (`me` หรือ `unassigned`)
- **มีอยู่แล้วใน GET /staff/tickets:** `status`, `priority`, `search`, `requestedPriority`
- **มีอยู่แล้วใน GET /api/tickets:** `status`, `priority`, `search`, `categoryId`


## 5. ปลายทางของระบบ (System Endpoints)
### `GET /api/health`
- **Auth required:** ไม่
- **Success (200):**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-03T10:00:00Z"
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
- `PATCH /staff/tickets/:id/status` *(หมายเหตุ: version is optional during compatibility window; enforced when sent; errors like 422 INVALID_TRANSITION and 404 keep the Lab 3 format, while CONFLICT uses Lab 4 envelope)*
- `GET /api/tickets/:id/notes`
- `GET /staff/tickets`
- `GET /staff/tickets/:id` *(หมายเหตุ: การตอบกลับมีการเพิ่มฟิลด์ `version` และ `requesterMarkedResolvedAt` กฎการมองเห็นโน้ตภายในสำหรับ IT Staff เหมือนเดิม)*
- `PATCH /staff/tickets/:id/priority`
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `PATCH /admin/users/:id/password`
