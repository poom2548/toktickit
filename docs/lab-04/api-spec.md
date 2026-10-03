# ข้อกำหนด API Lab 4 (API Specification)

## 1. ข้อกำหนดพื้นฐานและข้อผิดพลาด (Conventions and Errors)
- **Base Path Convention:** API ทั้งหมดในเอกสารนี้ใช้ Base Path `/api` (สำหรับ Requester, Attachments และ Workflow) หรือ `/staff` หรือ `/admin` ตามกลุ่มผู้ใช้งาน พารามิเตอร์รหัสตั๋วจะใช้ `:id` เป็นมาตรฐานเดียวกันทั้งหมด
- **Optimistic Concurrency:** ปลายทางที่แก้ไขข้อมูลต้องการ `version` token ปัจจุบัน หากค่าไม่ตรงกัน จะส่งคืนข้อผิดพลาด `409 Conflict`
- **Idempotency:** การรับเรื่องขอสร้างข้อมูล (POST) และการเปลี่ยนสถานะ รองรับ Header `Idempotency-Key` ระยะเวลาเก็บคีย์คือ 24 ชั่วโมง โดยมีขอบเขต (scope) แยกตาม User + Endpoint + Key 
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

## 2. ปลายทางสำหรับการดำเนินการ (Actions Taken Endpoints)

### `GET /api/tickets/:id/actions-taken`
- **Auth required:** ใช่ (ผู้ร้องขอสำหรับตั๋วของตนเอง, เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **Success (200):** ส่งคืนรายการ Actions Taken โดยเรียงลำดับอย่างคงที่ (actionAt น้อยไปมาก, createdAt น้อยไปมาก, id น้อยไปมาก)
  ```json
  {
    "actions": [
      {
        "id": "cuid...",
        "actionAt": "2026-10-03T10:00:00Z",
        "description": "Investigated the network issue.",
        "result": "Restarted the router.",
        "performedBy": { "id": "...", "name": "IT Staff Member" },
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
    "id": "cuid...",
    "actionAt": "2026-10-03T10:00:00Z",
    "description": "Investigated the network issue extensively.",
    "result": "Restarted the router and updated firmware.",
    "performedBy": { "id": "...", "name": "IT Staff Member" },
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
  ```json
  {
    "version": 2,
    "status": "RESOLVED"
  }
  ```
- **Success (200):** ส่งคืนข้อมูลสรุปของตั๋วที่ถูกอัปเดต
  ```json
  {
    "id": 123,
    "ticketNumber": "TKT-001",
    "status": "RESOLVED",
    "version": 3,
    "updatedAt": "2026-10-03T10:10:00Z",
    "owner": { "id": "...", "name": "IT Staff Member" }
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
- **Success (200):** ส่งคืนข้อมูลสรุปตั๋วที่อัปเดตแล้ว โดยไม่มีการเปลี่ยนแปลงค่าสถานะ (status enum) ของตั๋ว และการส่ง `true` จะประทับเวลา `requesterMarkedResolvedAt` ส่วน `false` จะล้างค่า (clear) ให้เป็น `null`
  ```json
  {
    "id": 123,
    "ticketNumber": "TKT-001",
    "status": "OPEN",
    "version": 2,
    "requesterMarkedResolvedAt": "2026-10-03T10:15:00Z"
  }
  ```
- **Errors:** 401, 403, 404

### `PATCH /staff/tickets/:id/owner` (ปรับปรุงจาก Lab 3)
- **Auth required:** ใช่ (เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **Request body:**
  ```json
  {
    "version": 2,
    "ownerId": "cuid_of_staff"
  }
  ```
- **Success (200):** ส่งคืนข้อมูลตั๋วที่อัปเดตแล้วพร้อม `version` ใหม่
- **Errors:** 422 `INVALID_ASSIGNEE` (ผู้ใช้ไม่แอคทีฟ หรือไม่มีบทบาท IT_STAFF/ADMINISTRATOR), 409 `CONFLICT` (ค่า version ล้าสมัย), 403 (Requester พยายามเรียกใช้งาน), 404

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
        "drillDown": "/tickets?status=open"
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
        "id": 123,
        "ticketNumber": "TKT-001",
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
        "drillDown": "/staff/tickets?status=unassigned"
      },
      "myOwned": {
        "label": "My Owned",
        "value": 4,
        "drillDown": "/staff/tickets?status=mine"
      },
      "statusCounts": {
        "label": "By Status",
        "values": { "NEW": 2, "OPEN": 5, "IN_PROGRESS": 3, "WAITING_FOR_REQUESTER": 1 },
        "drillDownBase": "/staff/tickets?status="
      },
      "priorityCounts": {
        "label": "By IT Priority",
        "values": { "CRITICAL": 1, "HIGH": 2, "MEDIUM": 5, "LOW": 3 },
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
        "id": 124,
        "ticketNumber": "TKT-002",
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
- `GET /api/tickets/:id/notes`
- `GET /staff/tickets`
- `GET /staff/tickets/:id` *(หมายเหตุ: การตอบกลับมีการเพิ่มฟิลด์ `version` และ `requesterMarkedResolvedAt` กฎการมองเห็นโน้ตภายในสำหรับ IT Staff เหมือนเดิม)*
- `PATCH /staff/tickets/:id/priority`
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `PATCH /admin/users/:id/password`
