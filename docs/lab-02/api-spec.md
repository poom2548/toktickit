# Lab 2 REST API Specification

เอกสารนี้กำหนดโครงสร้างและพฤติกรรมของ API สำหรับแอปพลิเคชัน TokTickIT ใน Lab 2 (Requester-facing application) โดยใช้ `requesterId` ส่งมาใน Request เพื่อจำลองบริบทของผู้ใช้งาน (เนื่องจากยังไม่มีระบบ Authentication จริง)
*หมายเหตุ: เพื่อป้องกันการสวมรอย (Spoofing) การส่ง `requesterId` จะต้องถูกส่งผ่าน HTTP Header ที่ชื่อว่า `X-Requester-Id` ในทุกๆ Request แทนการส่งผ่าน Query Param หรือ Body โดยตรง*

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
- **Description:** ดึงข้อมูลหมวดหมู่ทั้งหมด
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
- **Description:** ดึงข้อมูลระบบที่เกี่ยวข้องทั้งหมด
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
- **Description:** สร้างตั๋วปัญหาใหม่
- **Request Body:**
  ```json
  {
    "requesterId": 1,
    "summary": "Laptop battery drains quickly",
    "requestedPriority": "MEDIUM",
    "categoryId": 2,
    "relatedSystemId": 1,
    "description": "My laptop battery is draining much faster than usual..."
  }
  ```
- **Validation Rules:** `requesterId`, `summary`, และ `description` เป็นฟิลด์บังคับ ห้ามเป็นค่าว่าง
- **Response (201 Created):**
  ```json
  {
    "id": 101,
    "ticketNumber": "TKT-2025-001234",
    "status": "New",
    "createdAt": "2025-05-12T09:14:00Z"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: ข้อมูลไม่ครบถ้วน หรือ Validation ไม่ผ่าน

### 2.2 Retrieve Selected Requester's Tickets (List)
- **Endpoint:** `GET /api/tickets`
- **Description:** ดึงรายการตั๋วของผู้ใช้งานคนปัจจุบัน รองรับ ค้นหา, กรอง, จัดเรียง, และแบ่งหน้า
- **Query Parameters:**
  - `requesterId` (Required): ไอดีของผู้ใช้งาน (ใช้กรองให้แสดงเฉพาะตั๋วของตัวเอง)
  - `search` (Optional): คำค้นหาสำหรับฟิลด์ Ticket Number หรือ Summary
  - `categoryId`, `requestedPriority`, `currentStatus` (Optional): ตัวกรองข้อมูล
  - `sortBy` (Optional): ฟิลด์สำหรับจัดเรียง (เช่น `createdAt`)
  - `sortDirection` (Optional): `asc` หรือ `desc`
  - `page` (Optional): หน้าปัจจุบัน (Default: 1)
  - `limit` (Optional): จำนวนต่อหน้า (Default: 10)
- **Default Pagination:** หากไม่ส่งค่ามา จะใช้ `page=1` และ `limit=10` เสมอ
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
- **Description:** ดึงข้อมูลรายละเอียดของตั๋ว 1 ใบ
- **Query Parameters:** `?requesterId=1` (จำเป็นต้องส่งมาเพื่อเช็คสิทธิ์)
- **Response (200 OK):** โครงสร้างข้อมูลตั๋วแบบเต็ม (พร้อมข้อมูลผู้แจ้ง, หมวดหมู่)
- **Error Responses:**
  - `403 Forbidden`: หากพยายามเข้าดูตั๋วที่ไม่ได้เป็นของ `requesterId` ที่ระบุ
  - `404 Not Found`: ไม่พบตั๋ว

---

## 3. Attachment APIs

### 3.1 Upload an Attachment
- **Endpoint:** `POST /api/tickets/:ticketId/attachments`
- **Description:** อัปโหลดไฟล์แนบเข้าตั๋วที่ระบุ
- **Request:** `multipart/form-data`
  - `file`: ไฟล์ข้อมูล
  - `requesterId`: ไอดีผู้ใช้ (สำหรับตรวจสอบสิทธิ์ว่าตั๋วนี้เป็นของเขาหรือไม่)
- **Validation Rules:**
  - อนุญาตเฉพาะ .jpg, .jpeg, .png, .webp, .pdf
  - ขนาดไฟล์สูงสุด 5 MB
  - ตั๋ว 1 ใบมีไฟล์รวมกัน (Active) ได้ไม่เกิน 5 ไฟล์
- **Response (201 Created):** คืนค่า Metadata ของไฟล์แนบ
- **Error Responses:**
  - `400 Bad Request`: ผิดประเภทไฟล์, ไฟล์ใหญ่เกิน, หรือโควต้าไฟล์เต็ม
  - `403 Forbidden`: ไม่มีสิทธิ์อัปโหลดไฟล์ในตั๋วนี้

### 3.2 Retrieve Attachment Metadata
- **Endpoint:** `GET /api/tickets/:ticketId/attachments`
- **Query:** `?requesterId=1`
- **Response (200 OK):** รายการไฟล์แนบ (ซ่อนไฟล์ที่ถูก Soft-removed)

### 3.3 Download an Active Attachment
- **Endpoint:** `GET /api/attachments/:id/download`
- **Query:** `?requesterId=1`
- **Response (200 OK):** File Stream สำหรับดาวน์โหลด
- **Error Responses:**
  - `403 Forbidden`: ไม่มีสิทธิ์ดาวน์โหลด, หรือไฟล์นั้นถูก Soft-removed ไปแล้ว

### 3.4 Soft-remove an Attachment
- **Endpoint:** `DELETE /api/attachments/:id`
- **Query/Body:** `requesterId=1`
- **Response (200 OK):**
  ```json
  { "message": "Attachment removed successfully" }
  ```
- **Error Responses:** `403 Forbidden` หากพยายามลบไฟล์ของคนอื่น

---
## Standard Error Response Schema
กรณีที่เกิด Error ระดับฟิลด์ (400 Bad Request) ระบบจะส่งกลับมาในรูปแบบ:
```json
{
  "error": "Validation Failed",
  "details": [
    { "field": "summary", "message": "Summary must not exceed 100 characters" },
    { "field": "categoryId", "message": "Category is required" }
  ]
}
```
---

## 4. HTTP Status Codes
| Status | Condition |
|---|---|
| **200 OK** | สำเร็จ (ดึงข้อมูล, ลบข้อมูล, ดาวน์โหลด) |
| **201 Created** | สร้างทรัพยากรสำเร็จ (สร้างตั๋ว, อัปโหลดไฟล์) |
| **400 Bad Request** | ข้อมูลส่งมาผิดรูปแบบ, Validation ไม่ผ่าน |
| **403 Forbidden** | Ownership Failure (พยายามเข้าถึงตั๋ว/ไฟล์ ของคนอื่น) |
| **404 Not Found** | ไม่พบข้อมูลตั๋วหรือไฟล์ที่ร้องขอ |
| **413 Payload Too Large** | อัปโหลดไฟล์ขนาดเกิน 5 MB |
| **500 Internal Server Error** | เซิร์ฟเวอร์มีปัญหา (ควรหุ้ม Error ด้วยข้อความปลอดภัย) |