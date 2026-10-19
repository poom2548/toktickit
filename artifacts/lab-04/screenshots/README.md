# ดัชนีภาพถ่ายหน้าจอการตรวจประเมินด้วยสายตา (Visual Inspection Screenshots) - CPE 334 Lab 4

เอกสารนี้รวบรวมรายการภาพถ่ายหน้าจอที่สร้างขึ้นโดยอัตโนมัติผ่าน Playwright E2E Suite สำหรับการตรวจประเมิน coherence, responsive layout, และ visual state ภายใต้แนวทางการออกแบบ Zen Green ของระบบ TokTickIT

---

## 1. ผลการตรวจสอบความซ้ำซ้อนของภาพถ่ายเดิม (Duplicate Investigation)

จากการตรวจสอบไฟล์ภาพถ่ายหน้าจอเดิมที่อยู่ในคลัง:
- `artifacts/lab-04/screenshots/actions-taken/actions-taken-desktop.png` (ขนาด 108,083 ไบต์)
- `artifacts/lab-04/screenshots/workflow/ticket-workflow-desktop.png` (ขนาด 108,083 ไบต์)

พบว่ามีค่าแฮช SHA-256 เหมือนกันทุกประการ:
```
7C19CEE6FC2F424EF57A8739725D43DD0563EF029CBA54628409E2B7CC160F6B
```
**สาเหตุ:** สคริปต์จับภาพหน้าจอเดิมได้ทำการนำทางไปยังหน้าจอเดียวกัน และสั่งบันทึกซ้ำลงในสองไดเรกทอรี ทำให้เกิดไฟล์ซ้ำ (byte-duplicate)  
**การแก้ไข:** ได้ดำเนินการลบไฟล์เดิมที่ไม่เป็นไปตามแบบแผนชื่อออกด้วย `git rm` และพัฒนาระบบการจับภาพใหม่ใน `e2e/lab-04/screenshots.spec.ts` เพื่อแยกการจับภาพตามบริบท ส่วนประกอบของหน้าจอ และสถานะของระบบอย่างชัดเจน (Distinct Captures)

---

## 2. รูปแบบการตั้งชื่อไฟล์ (Naming Convention)

ไฟล์ภาพทั้งหมดตั้งชื่อตามข้อกำหนดอย่างเคร่งครัด:
```
<screen>-<state>-<viewport>-<width>.png
```
- `<screen>`: ชื่อหน้าจอหรือหัวข้อหลัก (`staff-dashboard`, `requester-dashboard`, `actions-taken`, `workflow`, `regression`)
- `<state>`: สภาวะของระบบที่ถูกทดสอบ (เช่น `default`, `admin`, `unset-priority`, `loading-mocked`, `empty-mocked`, `failure-mocked`, `403`, `multiple-actions`, `create-form-validation-errors`, `edit-form`, `conflict-banner`, `requester-advisory`, `mobile-menu-open` ฯลฯ)
- `<viewport>`: ขนาดการแสดงผล ได้แก่ `desktop` (1280x800), `tablet` (768x1024), หรือ `mobile` (360x800)
- `<width>`: ความกว้างในหน่วยพิกเซล (`1280`, `768`, `360`)

---

## 3. ตารางรายการภาพถ่ายหน้าจอทั้งหมด (Inventory Table)

- **จำนวนไฟล์ทั้งหมด:** 58 ไฟล์
- **ขนาดรวมทั้งหมด:** 5,367,611 ไบต์ (~5.12 MB) ซึ่งอยู่ภายใต้ขีดจำกัด 15 MB อย่างปลอดภัย

| ลำดับ | ไดเรกทอรี | ชื่อไฟล์ | ขนาด (ไบต์) | หน้า/หัวข้อ | สถานะ (State) | Viewport | บทบาท | หมายเหตุ |
|---|---|---|---|---|---|---|---|---|
| 1 | actions-taken | `actions-taken-conflict-banner-desktop-1280.png` | 151,245 | ประวัติการดำเนินงาน | conflict-banner | desktop (1280px) | IT_STAFF | ป้ายเตือนข้อขัดแย้ง 409 เมื่อข้อมูลถูกแก้ไขจากเซสชันอื่น |
| 2 | actions-taken | `actions-taken-create-form-validation-errors-desktop-1280.png` | 175,726 | ประวัติการดำเนินงาน | create-form-validation-errors | desktop (1280px) | IT_STAFF | ฟอร์มสร้าง action แสดงข้อความผิดพลาด validation ครบทุกฟิลด์ |
| 3 | actions-taken | `actions-taken-create-form-validation-errors-mobile-360.png` | 176,117 | ประวัติการดำเนินงาน | create-form-validation-errors | mobile (360px) | IT_STAFF | ฟอร์มสร้าง action บนจอมือถือ ไม่พบการล้นแนวนอน |
| 4 | actions-taken | `actions-taken-edit-form-desktop-1280.png` | 173,311 | ประวัติการดำเนินงาน | edit-form | desktop (1280px) | IT_STAFF | ฟอร์มแก้ไข action พร้อมข้อมูลเดิมที่ถูกโหลดลงในฟิลด์ |
| 5 | actions-taken | `actions-taken-edit-form-mobile-360.png` | 177,378 | ประวัติการดำเนินงาน | edit-form | mobile (360px) | IT_STAFF | ฟอร์มแก้ไข action บนหน้าจอมือถือ 360px |
| 6 | actions-taken | `actions-taken-empty-state-desktop-1280.png` | 113,516 | ประวัติการดำเนินงาน | empty-state | desktop (1280px) | IT_STAFF | ตั๋วเก่า (TKT-011) ที่ไม่มีประวัติการดำเนินงาน แสดงข้อความว่าง |
| 7 | actions-taken | `actions-taken-multiple-actions-desktop-1280.png` | 148,238 | ประวัติการดำเนินงาน | multiple-actions | desktop (1280px) | IT_STAFF | ตารางรายการประวัติการดำเนินงานที่มีหลายรายการ |
| 8 | actions-taken | `actions-taken-multiple-actions-mobile-360.png` | 151,456 | ประวัติการดำเนินงาน | multiple-actions | mobile (360px) | IT_STAFF | การ์ดประวัติการดำเนินงานบนจอมือถือ จัดวางแบบ Responsive |
| 9 | actions-taken | `actions-taken-multiple-actions-tablet-768.png` | 144,699 | ประวัติการดำเนินงาน | multiple-actions | tablet (768px) | IT_STAFF | รายการประวัติการดำเนินงานบนแท็บเล็ต 768px |
| 10 | actions-taken | `actions-taken-requester-read-only-desktop-1280.png` | 117,985 | ประวัติการดำเนินงาน | requester-read-only | desktop (1280px) | REQUESTER | ผู้ร้องขอดูประวัติการดำเนินงานได้แบบอ่านอย่างเดียว ไม่มีปุ่มแก้ไข |
| 11 | actions-taken | `actions-taken-requester-read-only-mobile-360.png` | 118,391 | ประวัติการดำเนินงาน | requester-read-only | mobile (360px) | REQUESTER | ผู้ร้องขอดูประวัติการดำเนินงานบนจอมือถือ แบบอ่านอย่างเดียว |
| 12 | actions-taken | `actions-taken-safe-failure-mocked-desktop-1280.png` | 4,714 | ประวัติการดำเนินงาน | safe-failure-mocked | desktop (1280px) | IT_STAFF | การแจ้งเตือนข้อผิดพลาดอย่างปลอดภัยเมื่อ API คืนค่า 500 |
| 13 | regression | `regression-admin-user-management-desktop-1280.png` | 89,191 | ระบบจัดการผู้ใช้ | default | desktop (1280px) | ADMINISTRATOR | หน้าตารางรายชื่อผู้ใช้ ค้นหา ตัวกรองบทบาท และปุ่มเพิ่มผู้ใช้ |
| 14 | regression | `regression-admin-user-management-mobile-360.png` | 45,719 | ระบบจัดการผู้ใช้ | default | mobile (360px) | ADMINISTRATOR | หน้าตารางรายชื่อผู้ใช้บนจอมือถือ 360px |
| 15 | regression | `regression-login-desktop-1280.png` | 20,465 | เข้าสู่ระบบ | default | desktop (1280px) | Public | หน้าจอเข้าสู่ระบบบน Desktop ดีไซน์ Zen Green |
| 16 | regression | `regression-login-mobile-360.png` | 16,709 | เข้าสู่ระบบ | default | mobile (360px) | Public | หน้าจอเข้าสู่ระบบบน Mobile (360x800) |
| 17 | regression | `regression-mobile-menu-open-mobile-360.png` | 92,804 | เมนูนำทาง | mobile-menu-open | mobile (360px) | IT_STAFF | เมนูนำทางบนมือถือเปิดกางออก เมื่อกดปุ่มเบอร์เกอร์ |
| 18 | regression | `regression-my-tickets-desktop-1280.png` | 27,142 | ตั๋วของฉัน | drill-down-filter | desktop (1280px) | REQUESTER | หน้ารายการตั๋วของผู้ร้องขอพร้อมชิปตัวกรองจากการกด drill-down |
| 19 | regression | `regression-my-tickets-mobile-360.png` | 17,989 | ตั๋วของฉัน | drill-down-filter | mobile (360px) | REQUESTER | รายการตั๋วพร้อมชิปตัวกรองบนหน้าจอมือถือ |
| 20 | regression | `regression-requester-detail-desktop-1280.png` | 125,404 | รายละเอียดตั๋ว | default | desktop (1280px) | REQUESTER | หน้ารายละเอียดตั๋วฝั่งผู้ร้องขอ แสดงข้อมูลครบถ้วน |
| 21 | regression | `regression-requester-detail-mobile-360.png` | 125,812 | รายละเอียดตั๋ว | default | mobile (360px) | REQUESTER | หน้ารายละเอียดตั๋วฝั่งผู้ร้องขอบนหน้าจอมือถือ |
| 22 | regression | `regression-staff-detail-desktop-1280.png` | 146,175 | รายละเอียดตั๋ว | internal-notes-visible | desktop (1280px) | IT_STAFF | หน้ารายละเอียดตั๋วฝั่งเจ้าหน้าที่ พร้อม Internal Notes ปลอดภัย |
| 23 | regression | `regression-staff-detail-mobile-360.png` | 150,590 | รายละเอียดตั๋ว | internal-notes-visible | mobile (360px) | IT_STAFF | หน้ารายละเอียดตั๋วฝั่งเจ้าหน้าที่บนจอมือถือ |
| 24 | regression | `regression-staff-queue-desktop-1280.png` | 53,947 | คิวงานเจ้าหน้าที่ | drill-down-filter | desktop (1280px) | IT_STAFF | คิวงานพร้อมชิปตัวกรองสถานะและผู้รับผิดชอบจากการกด drill-down |
| 25 | regression | `regression-staff-queue-mobile-360.png` | 53,183 | คิวงานเจ้าหน้าที่ | drill-down-filter | mobile (360px) | IT_STAFF | คิวงานพร้อมชิปตัวกรองบนหน้าจอมือถือ |
| 26 | requester-dashboard | `requester-dashboard-403-desktop-1280.png` | 37,413 | แดชบอร์ดผู้ร้องขอ | 403-forbidden | desktop (1280px) | IT_STAFF | การปฏิเสธสิทธิ์เมื่อ IT Staff พยายามเข้าถึงแดชบอร์ดผู้ร้องขอ |
| 27 | requester-dashboard | `requester-dashboard-403-mobile-360.png` | 27,039 | แดชบอร์ดผู้ร้องขอ | 403-forbidden | mobile (360px) | IT_STAFF | หน้า 403 Forbidden บนหน้าจอมือถือ |
| 28 | requester-dashboard | `requester-dashboard-403-tablet-768.png` | 35,495 | แดชบอร์ดผู้ร้องขอ | 403-forbidden | tablet (768px) | IT_STAFF | หน้า 403 Forbidden บนหน้าจอแท็บเล็ต |
| 29 | requester-dashboard | `requester-dashboard-default-desktop-1280.png` | 83,903 | แดชบอร์ดผู้ร้องขอ | default | desktop (1280px) | REQUESTER | การแสดงผลเมตริกการ์ด 4 ใบ พร้อมสี Zen Green |
| 30 | requester-dashboard | `requester-dashboard-default-mobile-360.png` | 68,635 | แดชบอร์ดผู้ร้องขอ | default | mobile (360px) | REQUESTER | การแสดงผลเมตริกการ์ดบนหน้าจอมือถือ เรียงในแนวตั้ง |
| 31 | requester-dashboard | `requester-dashboard-default-tablet-768.png` | 83,788 | แดชบอร์ดผู้ร้องขอ | default | tablet (768px) | REQUESTER | การแสดงผลเมตริกการ์ดบนแท็บเล็ต 2 คอลัมน์ |
| 32 | requester-dashboard | `requester-dashboard-empty-mocked-desktop-1280.png` | 45,188 | แดชบอร์ดผู้ร้องขอ | empty-mocked | desktop (1280px) | REQUESTER | สถานะแดชบอร์ดเมื่อข้อมูลเป็น 0 ทั้งหมด |
| 33 | requester-dashboard | `requester-dashboard-failure-mocked-desktop-1280.png` | 21,667 | แดชบอร์ดผู้ร้องขอ | failure-mocked | desktop (1280px) | REQUESTER | สถานะการแจ้งเตือนเมื่อเกิดข้อผิดพลาด API 500 พร้อมปุ่มลองใหม่ |
| 34 | requester-dashboard | `requester-dashboard-loading-mocked-desktop-1280.png` | 18,700 | แดชบอร์ดผู้ร้องขอ | loading-mocked | desktop (1280px) | REQUESTER | สถานะขณะโหลดข้อมูล (Spinner / Skeleton Loader) |
| 35 | staff-dashboard | `staff-dashboard-403-desktop-1280.png` | 36,604 | แดชบอร์ดเจ้าหน้าที่ | 403-forbidden | desktop (1280px) | REQUESTER | การปฏิเสธสิทธิ์เมื่อ Requester พยายามเข้าถึงแดชบอร์ดเจ้าหน้าที่ |
| 36 | staff-dashboard | `staff-dashboard-403-mobile-360.png` | 25,694 | แดชบอร์ดเจ้าหน้าที่ | 403-forbidden | mobile (360px) | REQUESTER | หน้า 403 Forbidden บนหน้าจอมือถือ พร้อมลิงก์กลับ |
| 37 | staff-dashboard | `staff-dashboard-403-tablet-768.png` | 35,338 | แดชบอร์ดเจ้าหน้าที่ | 403-forbidden | tablet (768px) | REQUESTER | หน้า 403 Forbidden บนหน้าจอแท็บเล็ต |
| 38 | staff-dashboard | `staff-dashboard-admin-desktop-1280.png` | 116,591 | แดชบอร์ดเจ้าหน้าที่ | admin | desktop (1280px) | ADMINISTRATOR | แดชบอร์ดสำหรับผู้ดูแลระบบ แสดงการ์ด User Accounts เพิ่มเติม |
| 39 | staff-dashboard | `staff-dashboard-admin-mobile-360.png` | 98,811 | แดชบอร์ดเจ้าหน้าที่ | admin | mobile (360px) | ADMINISTRATOR | แดชบอร์ดสำหรับผู้ดูแลระบบบนหน้าจอมือถือ 360px |
| 40 | staff-dashboard | `staff-dashboard-admin-tablet-768.png` | 122,221 | แดชบอร์ดเจ้าหน้าที่ | admin | tablet (768px) | ADMINISTRATOR | แดชบอร์ดสำหรับผู้ดูแลระบบบนหน้าจอแท็บเล็ต 768px |
| 41 | staff-dashboard | `staff-dashboard-default-desktop-1280.png` | 104,727 | แดชบอร์ดเจ้าหน้าที่ | default | desktop (1280px) | IT_STAFF | แดชบอร์ดเจ้าหน้าที่แสดงการ์ดสรุป สถิติตามสถานะ และตามระดับความสำคัญ |
| 42 | staff-dashboard | `staff-dashboard-default-mobile-360.png` | 90,340 | แดชบอร์ดเจ้าหน้าที่ | default | mobile (360px) | IT_STAFF | แดชบอร์ดเจ้าหน้าที่บนหน้าจอมือถือ 360px |
| 43 | staff-dashboard | `staff-dashboard-default-tablet-768.png` | 108,111 | แดชบอร์ดเจ้าหน้าที่ | default | tablet (768px) | IT_STAFF | แดชบอร์ดเจ้าหน้าที่บนหน้าจอแท็บเล็ต 768px |
| 44 | staff-dashboard | `staff-dashboard-empty-mocked-desktop-1280.png` | 42,618 | แดชบอร์ดเจ้าหน้าที่ | empty-mocked | desktop (1280px) | IT_STAFF | สถานะแดชบอร์ดเจ้าหน้าที่เมื่อค่าเมตริกเป็น 0 ทั้งหมด |
| 45 | staff-dashboard | `staff-dashboard-failure-mocked-desktop-1280.png` | 21,089 | แดชบอร์ดเจ้าหน้าที่ | failure-mocked | desktop (1280px) | IT_STAFF | การแจ้งเตือนข้อผิดพลาดเมื่อ API ล้มเหลว พร้อมปุ่ม Retry |
| 46 | staff-dashboard | `staff-dashboard-loading-mocked-desktop-1280.png` | 18,295 | แดชบอร์ดเจ้าหน้าที่ | loading-mocked | desktop (1280px) | IT_STAFF | สถานะขณะโหลดข้อมูลแดชบอร์ดเจ้าหน้าที่ |
| 47 | staff-dashboard | `staff-dashboard-unset-priority-desktop-1280.png` | 104,727 | แดชบอร์ดเจ้าหน้าที่ | unset-priority | desktop (1280px) | IT_STAFF | แดชบอร์ดแสดงการจัดกลุ่มความสำคัญที่ยังไม่ระบุ (UNSET) |
| 48 | staff-dashboard | `staff-dashboard-unset-priority-mobile-360.png` | 90,340 | แดชบอร์ดเจ้าหน้าที่ | unset-priority | mobile (360px) | IT_STAFF | การจัดกลุ่มความสำคัญที่ยังไม่ระบุบนหน้าจอมือถือ 360px |
| 49 | staff-dashboard | `staff-dashboard-unset-priority-tablet-768.png` | 108,111 | แดชบอร์ดเจ้าหน้าที่ | unset-priority | tablet (768px) | IT_STAFF | การจัดกลุ่มความสำคัญที่ยังไม่ระบุบนแท็บเล็ต 768px |
| 50 | workflow | `workflow-cancel-modal-desktop-1280.png` | 89,101 | ขั้นตอนการทำงาน | cancel-modal | desktop (1280px) | REQUESTER | ปุ่มยกเลิกตั๋วสำหรับผู้ร้องขอ (สถานะ OPEN ของตั๋วตนเอง) |
| 51 | workflow | `workflow-conflict-banner-desktop-1280.png` | 150,517 | ขั้นตอนการทำงาน | conflict-banner | desktop (1280px) | IT_STAFF | ป้ายแจ้งเตือนข้อขัดแย้ง 409 เมื่อเปลี่ยนสถานะตั๋วที่ stale |
| 52 | workflow | `workflow-owner-picker-desktop-1280.png` | 143,756 | ขั้นตอนการทำงาน | owner-picker | desktop (1280px) | IT_STAFF | ตัวเลือกผู้รับผิดชอบตั๋ว เฉพาะเจ้าหน้าที่และผู้ดูแลระบบที่ active |
| 53 | workflow | `workflow-permitted-transitions-desktop-1280.png` | 148,238 | ขั้นตอนการทำงาน | permitted-transitions | desktop (1280px) | IT_STAFF | ตัวเลือกสถานะที่อนุญาตตามสิทธิ์และสถานะปัจจุบันของตั๋ว |
| 54 | workflow | `workflow-permitted-transitions-mobile-360.png` | 151,456 | ขั้นตอนการทำงาน | permitted-transitions | mobile (360px) | IT_STAFF | ตัวเลือกสถานะที่อนุญาตบนหน้าจอมือถือ 360px |
| 55 | workflow | `workflow-requester-advisory-desktop-1280.png` | 127,515 | ขั้นตอนการทำงาน | requester-advisory | desktop (1280px) | IT_STAFF | ป้ายแจ้งเจ้าหน้าที่ว่าผู้ร้องขอได้ระบุว่าปัญหาดูเหมือนได้รับการแก้ไข |
| 56 | workflow | `workflow-requester-advisory-mobile-360.png` | 118,524 | ขั้นตอนการทำงาน | requester-advisory | mobile (360px) | IT_STAFF | ป้ายแจ้งเตือนผู้ร้องขอระบุแก้ไขแล้วบนหน้าจอมือถือ |
| 57 | workflow | `workflow-resolution-gate-failure-desktop-1280.png` | 147,664 | ขั้นตอนการทำงาน | resolution-gate-failure | desktop (1280px) | IT_STAFF | การแจ้งเตือนเมื่อไม่ผ่านเงื่อนไขการแก้ไขปัญหา (Resolution Gate 422) |
| 58 | workflow | `workflow-resolved-ticket-desktop-1280.png` | 127,515 | ขั้นตอนการทำงาน | resolved-ticket | desktop (1280px) | IT_STAFF | ตั๋วสถานะปิดสิ้นสุด (Terminal State) ที่ไม่มีฟอร์มเพิ่มการดำเนินงาน |

---

## 4. วิธีการสร้างภาพถ่ายหน้าจอซ้ำ (How to Reproduce)

การสร้างภาพถ่ายหน้าจอทั้งหมดกระทำผ่านสคริปต์ Playwright อัตโนมัติ โดยเชื่อมต่อกับฐานข้อมูลทดสอบชั่วคราว (Scratch Database) เพื่อความปลอดภัยของข้อมูลหลัก:

1. **เตรียมฐานข้อมูล Scratch:**
   สร้างฐานข้อมูลทดสอบเฉพาะกิจ เช่น `lab4_e2e_scratch_<random>` พร้อมทั้งรัน `npx prisma migrate deploy` และ `npx prisma db seed`
2. **รันคำสั่งจับภาพหน้าจอ:**
   กำหนดค่าตัวแปรสภาพแวดล้อม `CAPTURE_SCREENSHOTS=1` และเรียกใช้ Playwright:
   ```bash
   # Windows PowerShell
   $env:CAPTURE_SCREENSHOTS = "1"
   npx playwright test e2e/lab-04/screenshots.spec.ts
   ```
3. **การตรวจสอบผลลัพธ์:**
   ตรวจสอบว่าไฟล์ทั้ง 58 ไฟล์ถูกสร้างขึ้นในโฟลเดอร์ `artifacts/lab-04/screenshots/` ครบถ้วนและมีขนาดรวมไม่เกิน 15 MB
4. **ลบฐานข้อมูล Scratch:**
   ตัดการเชื่อมต่อและทำลายฐานข้อมูลชั่วคราว (`DROP DATABASE`) ให้หมดจดหลังเสร็จสิ้น
