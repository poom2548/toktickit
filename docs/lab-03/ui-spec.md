# Lab 3 UI Specification (Zen Green Theme & RBAC)

## 1. Design System & Zen Green Tokens

ระบบยึดถือมาตรฐานสีและการออกแบบที่สอดคล้องกับ Zen Green Theme เดิมจาก Lab 2 พร้อมเพิ่มโทนสีสำหรับจัดการบทบาทและฟีเจอร์ใหม่:

### 1.1 Brand & Neutral Colors
*   **Primary Green:** `#006B3C` (ปุ่มหลัก, ส่วนหัวแถบนำทาง, จุดเด่น)
*   **Secondary Green:** `#0B7A46` (สถานะ Hover, Active)
*   **Dark Accent:** `#004D2C` (ส่วนหัวตาราง, ตัวอักษรเน้นพิเศษ)
*   **Pale Green:** `#EAF6EF` (พื้นหลังการ์ดที่เน้น, Highlight rows, Input focus tint)
*   **Page Background:** `#F5F7F6` (สีพื้นหลังหลักทั่วทั้งแอปพลิเคชัน)
*   **Surface / Cards:** `#FFFFFF` (พื้นหลังของ Card, Modal, Dropdown พร้อมขอบ `border-gray-200`)
*   **Text Primary:** `#1A2E22` (สีตัวอักษรเข้มชาร์โคล)
*   **Text Muted:** `#64748B` (คำอธิบายรอง, Label เล็ก)

### 1.2 Role & Status Badges
*   **Administrator Role Badge:** โทนสีม่วง/คราม (Indigo) `bg-purple-100 text-purple-800 border-purple-200`
*   **IT Staff Role Badge:** โทนสีน้ำเงิน (Blue) `bg-blue-100 text-blue-800 border-blue-200`
*   **Requester Role Badge:** โทนสีเทาเข้ม (Slate) `bg-slate-100 text-slate-800 border-slate-200`
*   **Internal Note Card / Banner:** แถบสีส้มอำพันเตือนความปลอดภัย `bg-amber-50 border-amber-300 text-amber-900` พร้อมไอคอนแม่กุญแจ (Lock) เพื่อระบุชัดเจนว่าเป็นบันทึกภายใน
*   **Public Comment Card:** พื้นหลังสีขาว/เทาอ่อน สะอาดตา `bg-white border-gray-200 text-gray-800`
*   **Access Denied & Errors:** แดงเลือดหมูเข้ม `#8B0000` และแดงเตือน `bg-red-50 text-red-700 border-red-200`

---

## 2. Screen Inventory

### Screen 1: Login Screen (`/login`)
*   **Layout:** กล่องฟอร์มแบบ Card ตรงกลางหน้าจอ (Centered Card) บนพื้นหลัง `#F5F7F6` สะอาดตา มีโลโก้ TokTickIT โดดเด่น
*   **Elements:**
    *   Input: Username หรือ Email (มี Validation เตือนหากเว้นว่าง)
    *   Input: Password (Masking พร้อมไอคอนสลับซ่อน/แสดงรหัสผ่าน)
    *   Button: "Log In" (สี `#006B3C`, แสดง Loading spinner เมื่อกำลังส่งข้อมูล)
    *   Alert Banner: แสดงข้อความแจ้งเตือนสีแดงกรณีข้อมูลล็อกอินไม่ถูกต้อง หรือบัญชีถูกปิดการใช้งาน

### Screen 2: Mandatory Change Password Screen (`/change-password`)
*   **Layout:** การ์ดแจ้งเตือนความปลอดภัยพร้อมแบนเนอร์เน้นย้ำความสำคัญ
*   **Elements:**
    *   Warning Message: "Security Notice: You must update your password before accessing the system."
    *   Input: Current / Temporary Password
    *   Input: New Password (พร้อมข้อกำหนดความยาวขั้นต่ำ 8 ตัวอักษร)
    *   Input: Confirm New Password (ตรวจสอบความตรงกัน)
    *   Button: "Update Password & Continue"
    *   *หมายเหตุ: ในขณะที่อยู่ในสถานะนี้ แถบนำทางด้านบนจะถูกปิดไม่ให้คลิกไปยังหน้าอื่น*

### Screen 3: IT Staff Queue (`/staff/queue`)
*   **Layout:** หน้ารวมคิวตั๋วสำหรับเจ้าหน้าที่ไอที พร้อมแถบควบคุมฟิลเตอร์ด้านบน
*   **Elements:**
    *   Metric Summary Badges: จำนวนตั๋ว `Unassigned`, `In Progress`, `Resolved Today`
    *   Filter Bar:
        *   Search Box (ค้นหาเลขที่ตั๋ว หรือ Summary)
        *   Status Filter Dropdown (`All`, `New`, `Open`, `InProgress`, `Resolved`, `Closed`)
        *   Priority Filter Dropdown
        *   Toggle: "Show Unassigned Only"
    *   Data Table / Card Grid:
        *   คอลัมน์: Ticket #, Summary, Requester, Category, Requested Priority, IT Priority, Status, Assigned Owner, Created At, Action
        *   ปุ่ม Action: "View" และปุ่ม Quick Action "Claim" (กดรับงานทันที)

### Screen 4: IT Staff Ticket Detail (`/staff/tickets/:id`)
*   **Layout:** หน้ารายละเอียดการทำงานแบบ 2 คอลัมน์ (Desktop)
*   **Left Column (Ticket Info & Workflows):**
    *   Ticket Header: Ticket Number, วันที่สร้าง, ผู้แจ้ง (Requester Profile)
    *   Status Dropdown: เจ้าหน้าที่สามารถกดเปลี่ยนสถานะได้โดยตรง
    *   IT Priority Selector: กำหนดความสำคัญทางเทคนิค
    *   Owner Assignment: แสดงชื่อเจ้าหน้าที่ที่ดูแล พร้อมปุ่ม "Claim Ticket" หรือ Dropdown เลือกโอนงาน
    *   Description & Original Attachments (ดาวน์โหลดไฟล์ได้อย่างปลอดภัย)
*   **Right Column (Comments & Notes Feed):**
    *   Tabs สลับโหมดการพิมพ์: **Public Comment** (ส่งถึง Requester) และ **Internal Note** (ไอคอนแม่กุญแจ สลับสีเป็น Amber-50)
    *   Timeline Stream: แสดงประวัติความคิดเห็นเรียงตามเวลา
    *   Internal Notes จะมีป้ายกำกับ "Internal Only - Hidden from Requester" กำกับชัดเจน

### Screen 5: Admin User Management (`/admin/users`)
*   **Layout:** ตารางรายชื่อผู้ใช้งานในระบบ พร้อมปุ่มสร้างผู้ใช้ใหม่
*   **Elements:**
    *   Header Action: ปุ่ม "+ Add New User" เปิด Modal สำหรับกรอกข้อมูล
    *   User Table:
        *   คอลัมน์: Username, Full Name, Role (Badge), Status (Active / Inactive Badge), Created Date, Actions
        *   Actions Menu: ปุ่ม Toggle Status (Deactivate / Activate) และปุ่ม Reset Password
    *   Create User Modal: ฟอร์มกรอก Username, Name, Role (Requester / ITStaff / Administrator) และแสดงรหัสผ่านชั่วคราวเริ่มต้น

---

## 3. Responsive Rules & Breakpoints

ระบบรองรับ 3 ระดับความกว้างหน้าจอตามมาตรฐานเดิม:

### 3.1 Desktop (≥ 992 px)
*   Layout แบบ Multi-column กว้างสูงสุด `max-w-6xl` จัดวางกึ่งกลาง
*   หน้า Ticket Detail แบ่งออกเป็น 2 คอลัมน์ (ข้อมูลตั๋ว 60% และ Timeline ความคิดเห็น 40%)
*   แสดงผลตารางคิวงานและตารางผู้ใช้งานแบบ Full Data Table พร้อมคอลัมน์ครบถ้วน

### 3.2 Tablet (768 px - 991 px)
*   ปรับลดระยะขอบ (Padding) และซ่อนคอลัมน์ที่มีความสำคัญรอง เช่น วันที่สร้างแบบละเอียด
*   หน้า Ticket Detail ปรับการ์ดข้อมูลและช่องทางคอมเมนต์เป็นแถวตอนเรียงซ้อน (Stacked Layout)

### 3.3 Mobile (< 768 px)
*   **Table to Card Transformation:** ตารางรายการตั๋วในหน้า Queue และตารางผู้ใช้จะถูกแปลงเป็นการ์ดเดี่ยว (Card layout) เรียงซ้อนแนวตั้งทั้งหมด ห้ามมีแถบเลื่อนแนวนอน (Horizontal Scrollbar)
*   **Sticky Action Bar:** ปุ่มแอ็กชันสำคัญ เช่น "Submit Comment", "Claim Ticket", "Update Status" จะถูกตรึงไว้ที่ตำแหน่งที่กดง่ายบนสมาร์ตโฟน
*   **Modal Fullscreen:** หน้าต่างสร้างผู้ใช้ใหม่จะขยายเต็มหน้าจอเพื่อความสะดวกในการพิมพ์บน Virtual Keyboard

---

## 4. Visual Inspection Checklist

ทีมทดสอบและผู้ตรวจรับงานสามารถใช้ Checklist นี้ในการตรวจรับงาน UI (Phase 4):

- [x] **Login Screen:** การจัดวางกึ่งกลางสวยงาม ฟิลด์ Password มีไอคอนซ่อน/แสดงรหัส และแสดง Error ชัดเจนเมื่อกรอกผิด
- [x] **Mandatory Password Change:** บัญชีที่มีสิทธิ์เปลี่ยนรหัสผ่านจะถูกกักตัวไว้ในหน้านี้ ไม่สามารถกดลิงก์ไปหน้าอื่นได้
- [x] **Zen Green Identity:** องค์ประกอบหลักใช้สี `#006B3C`, `#0B7A46`, และ `#EAF6EF` ถูกต้องตามแบบแผน
- [x] **Role Badges:** สัญลักษณ์ระบุบทบาทแสดงสีตรงตามกำหนด (Admin สีม่วง, Staff สีน้ำเงิน, Requester สีเทา)
- [x] **Internal Notes Distinction:** บันทึกช่วยจำภายในทีมไอทีมีแถบสีส้ม/เหลือง (Amber) พร้อมไอคอนแม่กุญแจชัดเจน ไม่สับสนกับ Public Comment
- [x] **Table-to-Card Responsive (< 768 px):** เมื่อเปิดหน้าจอมือถือ ตารางคิวงานและตารางผู้ใช้แปลงเป็นการ์ดอย่างสมบูรณ์ และไม่มี Scroll แนวนอน
- [x] **Button States & Feedback:** ปุ่มมีสถานะ Loading Spinner เมื่ออยู่ระหว่างรอดำเนินการ และมี Disabled state ป้องกันการกดซ้ำ
- [x] **Accessibility (WCAG AA):** ความต่างของสี (Color Contrast) อ่านง่าย ชัดเจน และมี `aria-label` บนปุ่มไอคอนทั้งหมด

