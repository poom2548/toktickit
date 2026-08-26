# Lab 2 REST API Specification

*หมายเหตุสำคัญ: เพื่อความปลอดภัยและป้องกันการสวมรอย ทุก Endpoint ที่ต้องการตรวจสอบสิทธิ์ผู้ใช้งาน จะต้องส่งไอดีผ่าน **HTTP Header** ที่ชื่อว่า `X-Requester-Id` เสมอ (ห้ามส่งผ่าน Request Body หรือ Query Parameters เด็ดขาด)*

## 1. Reference Data APIs

### 1.1 Retrieve Active Development Requesters
- **Endpoint:** `GET /api/requesters/active`
- **Description:** ดึงรายชื่อผู้ใช้จำลองที่มีสถานะเปิดใช้งาน (Active) สำหรับไปแสดงในหน้าเลือกผู้ใช้งาน
- **Response (200 OK):**
  ```json
  [
    { "id": 1, "name": "Jennifer Anderson", "email": "jennifer.a@example.com", "isActive": true }
  ]
  ```

### 1.2 Retrieve Active Categories
- **Endpoint:** `GET /api/categories`
- **Response (200 OK):**
  ```json
  [
    { "id": 1, "name": "Account and Access" },
    { "id": 2, "name": "Hardware" },
    { "id": 3, "name": "Software" },
    { "id": 4, "name": "Network" }
  ]
  ```

### 1.3 Retrieve Active Related Systems
- **Endpoint:** `GET /api/related-systems`
- **Response (200 OK):**
  ```json
  [
    { "id": 1, "name": "Corporate Laptop" },
    { "id": 2, "name": "Email" },
    { "id": 3, "name": "Campus Wi-Fi" },
    { "id": 4, "name": "VPN" },
    { "id": 5, "name": "LEB2 App" },
    { "id": 6, "name": "Printer" }
  ]
  ```

---

## 2. Ticket APIs

### 2.1 Create a Ticket
- **Endpoint:** `POST /api/tickets`
- **Required Header:** `X-Requester-Id`
- **Request Body:**
  ```json
  {
    "summary": "Laptop battery drains quickly",
    "requestedPriority": "MEDIUM",
    "categoryId": 2,
    "relatedSystemId": 1,
    "description": "My laptop battery is draining much faster than usual..."
  }
  ```
- **Validation Rules:** `summary` (ไม่เกิน 100 อักษร), และ `description` (ไม่เกิน 1,000 อักษร) เป็นฟิลด์บังคับ
- **Response (201 Created):**
  ```json
  {
    "id": 101,
    "ticketNumber": "TKT-2025-001234",
    "status": "New",
    "createdAt": "2025-05-12T09:14:00Z"
  }
  ```

### 2.2 Retrieve Selected Requester's Tickets (List)
- **Endpoint:** `GET /api/tickets`
- **Description:** ดึงรายการตั๋วของผู้ใช้งานคนปัจจุบัน
- **Required Header:** `X-Requester-Id`
- **Query Parameters:**
  - `search` (Optional): คำค้นหา
  - `categoryId`, `requestedPriority`, `currentStatus` (Optional): ตัวกรองข้อมูล
  - `sortBy` / `sortDirection` (Optional): จัดเรียงข้อมูล
  - `page` (Default: 1), `limit` (Default: 10): ตัวแบ่งหน้า
- **Response (200 OK):**
  ```json
  {
    "data": [ ... ],
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 10,
      "totalItems": 42,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```

### 2.3 Retrieve One Owned Ticket
- **Endpoint:** `GET /api/tickets/:id`
- **Required Header:** `X-Requester-Id`
- **Response (200 OK):** ข้อมูลตั๋ว 1 ใบพร้อมรายละเอียด
- **Error Responses:** `403 Forbidden` หากดูตั๋วที่ไม่ใช่ของตนเอง

---

## 3. Attachment APIs

### 3.1 Upload an Attachment
- **Endpoint:** `POST /api/tickets/:ticketId/attachments`
- **Required Header:** `X-Requester-Id`
- **Request:** ส่งเฉพาะฟิลด์ `file` ในรูปแบบ `multipart/form-data` (ห้ามส่ง requesterId ใน body หรือ query แต่ต้องแนบ HTTP Header `X-Requester-Id` เสมอ)
- **Validation Rules:**
  - ขนาดไฟล์สูงสุด 5 MB และตั๋ว 1 ใบมีไฟล์รวมกันไม่เกิน 5 ไฟล์
  - **การตรวจสอบประเภทไฟล์ Backend ต้องตรวจจากเนื้อหา "MIME Type" ของจริงเท่านั้น ห้ามเชื่อเพียงแค่นามสกุลไฟล์ (File Extension) ที่หน้าบ้านส่งมาเด็ดขาด**
- **Response (201 Created):** คืนค่า Metadata ของไฟล์แนบ

### 3.2 Retrieve Attachment Metadata
- **Endpoint:** `GET /api/tickets/:ticketId/attachments`
- **Required Header:** `X-Requester-Id`
- **Response (200 OK):** รายการไฟล์แนบ (ซ่อนไฟล์ที่ถูก Soft-removed)

### 3.3 Download an Active Attachment
- **Endpoint:** `GET /api/attachments/:id/download`
- **Required Header:** `X-Requester-Id`
- **Response (200 OK):** File Stream สำหรับดาวน์โหลด

### 3.4 Soft-remove an Attachment
- **Endpoint:** `DELETE /api/attachments/:id`
- **Required Header:** `X-Requester-Id`
- **Response (200 OK):**
  ```json
  { "message": "Attachment removed successfully" }
  ```

---

## 4. Standard Error Response Schema

**400 Bad Request (Validation Error)**
กรณีที่เกิด Error ระดับฟิลด์ ระบบจะส่งกลับมาในรูปแบบ:
```json
{
  "error": "Validation Failed",
  "details": [
    { "field": "summary", "message": "Summary must not exceed 100 characters" }
  ]
}
```

**401 Unauthorized / 403 Forbidden (Authentication & Authorization Error)**
กรณีที่ไม่ได้ส่ง `X-Requester-Id`, ข้อมูลผู้ใช้ไม่ถูกต้อง, หรือพยายามเข้าถึงตั๋วของคนอื่น:
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid X-Requester-Id header"
}
```

## 5. HTTP Status Codes
| Status | Condition |
|---|---|
| **200 OK** | สำเร็จ (ดึงข้อมูล, ลบข้อมูล, ดาวน์โหลด) |
| **201 Created** | สร้างทรัพยากรสำเร็จ (สร้างตั๋ว, อัปโหลดไฟล์) |
| **400 Bad Request** | ข้อมูลส่งมาผิดรูปแบบ, Validation ไม่ผ่าน |
| **401 Unauthorized** | ไม่ได้ส่ง HTTP Header `X-Requester-Id` มาใน Request, ค่าไม่ถูกต้อง หรือไม่พบในระบบ |
| **403 Forbidden** | Ownership Failure (พยายามเข้าถึงตั๋ว/ไฟล์ ของคนอื่น) |
| **404 Not Found** | ไม่พบข้อมูลตั๋วหรือไฟล์ที่ร้องขอ |
| **413 Payload Too Large** | อัปโหลดไฟล์ขนาดเกิน 5 MB |
| **500 Internal Server Error** | เซิร์ฟเวอร์มีปัญหา |