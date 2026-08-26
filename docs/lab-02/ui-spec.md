# Lab 2 UI Specification (Zen Green Theme)

## 1. Color Palette (โทนสี)
- **Primary green:** `#006B3C` (สำหรับ Header, ปุ่มหลัก, ส่วนที่ต้องการเน้นความสำคัญ)
- **Secondary green:** `#0B7A46` (สำหรับ Active tabs, Hover states, ลิงก์)
- **Pale green:** `#EAF6EF` (สำหรับ Selected, Success, พื้นหลังเน้นเบาๆ)
- **Page background:** `#F5F7F6` (สีพื้นหลังของหน้าเว็บ)
- **Surface/cards:** พื้นสีขาว (`#FFFFFF`) พร้อมขอบบางๆ และเงาเล็กน้อย (Restrained shadow)
- **Text:** สีเทาเข้มอมเขียว (Dark charcoal-green) สำหรับตัวอักษรเพื่อให้อ่านสบายตา
- **Error:** ตัวอักษรและขอบสีแดงเข้ม (Dark red)
- **Warning:** ป้ายหรือกล่องแจ้งเตือนสีเหลืองอำพัน (Amber)
- **Success:** สีเขียวที่อ่านง่าย และไม่พึ่งพาสีเพียงอย่างเดียวในการสื่อความหมาย

## 2. Form & Controls (ฟอร์มและปุ่ม)
- **Editable field:** พื้นหลังสีขาว ขอบสีกลางๆ (Neutral border)
- **Read-only field:** พื้นหลังสีเทาอมเขียวอ่อน หรือสีงาช้าง (Warm ivory) เพื่อให้ดูต่างจากช่องที่พิมพ์ได้ชัดเจน
- **Labels:** อยู่ด้านบนช่องกรอกข้อมูลเสมอ 
- **Required fields:** ต้องมีดอกจันสีแดง (`*`)
- **Buttons:** ต้องมีข้อความบอกชัดเจน (มีไอคอนประกอบได้ แต่ห้ามมีแค่ไอคอนเดี่ยวๆ โดยไม่มีข้อความหรือ Tooltip)
- **Disabled/Busy state:** ปุ่ม Submit ต้องโชว์สถานะกำลังโหลด (Busy) และกดซ้ำไม่ได้ขณะกำลังส่งข้อมูล
- **Validation:** ข้อความแจ้งเตือน Error ต้องปรากฏอยู่ "ใต้ฟิลด์" ที่กรอกผิดพลาดทันที

## 3. Responsive Requirements (พฤติกรรมย่อขยายหน้าจอ)
- **Desktop (≥ 992 px):** Layout แบบหลายคอลัมน์ (Multi-column) เนื้อหาอยู่กึ่งกลางและจำกัดความกว้างสูงสุด (Max-width)
- **Tablet (768-991 px):** Layout แบบ 2 คอลัมน์ (Two-column) ช่อง Summary และ Description ต้องกว้างพอให้อ่านง่าย
- **Mobile (< 768 px):** ทุกฟิลด์ต้องเรียงซ้อนกันแนวตั้ง (Stack vertically) ปุ่มกดง่ายด้วยนิ้ว และห้ามเกิดแถบเลื่อนหน้าจอแนวนอนเด็ดขาด (No horizontal page scrolling)

## 4. Visual Inspection Checklist (จุดที่ต้องตรวจก่อนส่งงาน)
- [ ] ไม่มีการตัดคำผิดพลาด หรือตัวอักษรตกขอบ (No clipped labels)
- [ ] ข้อความและกล่องแจ้งเตือนไม่ซ้อนทับกัน (No overlapping messages)
- [ ] ไม่มีปุ่มหรือฟิลด์โดนบัง (No hidden buttons)
- [ ] ชื่อไฟล์แนบยาวๆ สามารถอ่านได้ชัดเจน (Readable attachment names)
- [ ] ป้ายสถานะ (Badges) ของ Priority และ Status ใช้สไตล์สีสม่ำเสมอกัน
- [ ] หน้า My Tickets ใช้งานได้ดีทั้งแบบตารางบน Desktop และแบบการ์ดบน Mobile