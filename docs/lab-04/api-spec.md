# ข้อกำหนด API Lab 4 (API Specification)

## 1. การจัดการ Concurrency, Idempotency และข้อผิดพลาดที่ปลอดภัย (Safe Errors)
- **Optimistic Concurrency:** ปลายทาง (Endpoints) ที่แก้ไขระเบียนที่มีอยู่ (เช่น การอัปเดต Action Taken หรือการเปลี่ยนสถานะของตั๋ว) ต้องการข้อมูล `version` token ปัจจุบันในเนื้อหาคำขอ หากค่าไม่ตรงกัน จะส่งผลให้เกิดข้อผิดพลาด `409 Conflict`
- **Idempotency:** ปลายทางสำหรับการสร้างข้อมูลรองรับ Header `Idempotency-Key` (เป็นทางเลือก) เซิร์ฟเวอร์จะกำจัดคำขอที่ซ้ำซ้อนด้วยคีย์เดียวกันภายในกรอบเวลาเฉพาะ เพื่อป้องกันการสร้างระเบียนซ้ำซ้อนจากการดับเบิลคลิกหรือการลองส่งใหม่ของเครือข่าย
- **Safe Error Envelope:** ข้อผิดพลาดทั้งหมดจะถูกส่งคืนในรูปแบบมาตรฐาน (JSON envelope) ห้ามเปิดเผยข้อมูล Stack traces, ข้อผิดพลาดของ SQL, หรือรายละเอียดเชิงลึกของเซิร์ฟเวอร์โดยเด็ดขาด
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
  สำหรับกรณีข้อขัดแย้ง:
  ```json
  {
    "error": {
      "code": "CONFLICT",
      "message": "The record has been modified by another user. Please reload and try again.",
      "currentVersion": 3
    }
  }
  ```

## 2. ปลายทางสำหรับการดำเนินการ (Actions Taken Endpoints)

### `GET /api/tickets/:ticketId/actions-taken`
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
- **Errors:** 401 (ยังไม่ได้เข้าสู่ระบบ), 403 (ผู้ร้องขอเข้าถึงตั๋วของผู้อื่น), 404 (ไม่พบตั๋ว)

### `POST /api/tickets/:ticketId/actions-taken`
- **Auth required:** ใช่ (เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **Headers:** `Idempotency-Key` (สตริงทางเลือก)
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
  *(หมายเหตุ: `performedBy` ถูกเติมโดยอัตโนมัติจากเซสชันของผู้ใช้ หากมีการระบุ `performedBy` ใน payload ข้อมูลนั้นจะถูกละเว้น)*
- **Success (201):** ส่งคืนรายการ Action Taken ที่ถูกสร้าง
- **Errors:** 400/422 (ข้อมูลไม่ถูกต้อง), 401 (ยังไม่ได้เข้าสู่ระบบ), 403 (ผู้ร้องขอพยายามสร้าง), 404 (ไม่พบตั๋ว), 409 (ตั๋วอยู่ในสถานะ CLOSED หรือ CANCELLED)

### `PATCH /api/tickets/:ticketId/actions-taken/:actionId`
- **Auth required:** ใช่ (เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **Request body:** ต้องมี `version` และฟิลด์ที่ต้องการอัปเดต
  ```json
  {
    "version": 1,
    "description": "Investigated the network issue extensively.",
    "result": "Restarted the router and updated firmware."
  }
  ```
- **Success (200):** ส่งคืนรายการ Action Taken ที่ถูกอัปเดตพร้อมกับค่า `version` ที่เพิ่มขึ้น
- **Errors:** 400/422 (ข้อมูลไม่ถูกต้อง), 401 (ยังไม่ได้เข้าสู่ระบบ), 403 (ผู้ร้องขอพยายามแก้ไข), 404 (ไม่พบตั๋วหรือ Action), 409 (ค่า version ล้าสมัย)

## 3. ปลายทางสำหรับเวิร์กโฟลว์ตั๋ว (Ticket Workflow Endpoints)

### `POST /api/tickets/:ticketId/status` (หรือ `PATCH /api/tickets/:ticketId/status`)
- **Auth required:** ใช่ (เจ้าหน้าที่ไอที, ผู้ดูแลระบบ, หรือผู้ร้องขอสำหรับการยกเลิกตั๋วของตนเองที่ได้รับอนุญาต)
- **Request body:** ต้องมี `version` และ `status` ใหม่
  ```json
  {
    "version": 2,
    "status": "RESOLVED"
  }
  ```
- **Success (200):** ส่งคืนข้อมูลสรุปของตั๋วที่ถูกอัปเดต
- **Errors:** 401, 403 (บทบาทไม่ได้รับอนุญาต), 404, 409 (ค่า version ล้าสมัย), 422 (การเปลี่ยนสถานะไม่ถูกต้องหรือไม่ผ่านข้อจำกัดการปิดงาน)

### `GET /api/tickets/:ticketId/allowed-transitions`
- **Auth required:** ใช่ (ผู้ร้องขอสำหรับตั๋วของตนเอง, เจ้าหน้าที่ไอที, ผู้ดูแลระบบ)
- **Success (200):** ส่งคืนสถานะที่อนุญาตให้เปลี่ยนได้สำหรับผู้ใช้ปัจจุบันและสถานะตั๋วปัจจุบัน
  ```json
  {
    "allowedTransitions": ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"]
  }
  ```

### `POST /api/tickets/:ticketId/requester-resolved-indication` (หรือ `PATCH`)
- **Auth required:** ใช่ (ผู้ร้องขอสำหรับตั๋วของตนเอง)
- **Request body:**
  ```json
  {
    "problemAppearsResolved": true
  }
  ```
- **Success (200):** ส่งคืนข้อมูลสรุปตั๋วที่อัปเดตแล้ว โดยไม่มีการเปลี่ยนแปลงค่าสถานะ (status enum)
- **Errors:** 401, 403, 404.

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
        "drillDown": "/my-tickets?status=open"
      },
      "waitingForMe": {
        "label": "Waiting for Me",
        "value": 1,
        "drillDown": "/my-tickets?status=waiting"
      },
      "recentlyResolved": {
        "label": "Recently Resolved (Last 7 Days)",
        "value": 2,
        "drillDown": "/my-tickets?status=resolved"
      }
    },
    "recentlyUpdated": [
      {
        "id": "123",
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
        "drillDown": "/staff/queue?filter=unassigned"
      },
      "myOwned": {
        "label": "My Owned",
        "value": 4,
        "drillDown": "/staff/queue?filter=mine"
      },
      "statusCounts": {
        "label": "By Status",
        "values": { "NEW": 2, "OPEN": 5, "IN_PROGRESS": 3, "WAITING_FOR_REQUESTER": 1 },
        "drillDownBase": "/staff/queue?status="
      },
      "priorityCounts": {
        "label": "By IT Priority",
        "values": { "CRITICAL": 1, "HIGH": 2, "MEDIUM": 5, "LOW": 3 },
        "drillDownBase": "/staff/queue?priority="
      }
    },
    "userCounts": {
       "label": "User Accounts (Admin Only)",
       "active": 20,
       "inactive": 2
    },
    "recentlyUpdated": [
       // Capped list of tickets
    ]
  }
  ```
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
- `POST /tickets`
- `GET /tickets`
- `GET /tickets/:id`
- `POST /tickets/:id/attachments`
- `GET /tickets/:id/attachments/:attachmentId`
- `POST /tickets/:id/comments`
- `GET /tickets/:id/comments`
- `POST /tickets/:id/notes`
- `GET /tickets/:id/notes`
- `GET /staff/tickets`
- `GET /staff/tickets/:id`
- `PATCH /staff/tickets/:id/owner`
- `PATCH /staff/tickets/:id/priority`
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `PATCH /admin/users/:id/password`
