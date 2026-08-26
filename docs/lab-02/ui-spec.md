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

## 5. Typography, Spacing & Accessibility (a11y)
- **Typography:** ขนาดฟอนต์พื้นฐาน 16px, ระยะห่างบรรทัด (Line-height) 1.5 เพื่อให้อ่านง่าย
- **Spacing:** ใช้มาตราส่วนแบบ 8px (เช่น 8px, 16px, 24px) สำหรับช่องไฟ (Padding/Margin)
- **Contrast:** สีตัวอักษรและพื้นหลังต้องผ่านมาตรฐาน WCAG AA (Contrast Ratio ขั้นต่ำ 4.5:1)
- **Keyboard Navigation:** ทุกปุ่มและฟิลด์ต้องสามารถใช้ปุ่ม `Tab` เข้าถึงได้ และต้องแสดง Focus state (กรอบสี Secondary green) ให้เห็นชัดเจน
- **Screen Reader:** ปุ่มที่มีแค่ไอคอน (เช่น ปุ่มลบไฟล์) ต้องมี `aria-label` กำกับเสมอ
- **Data Truncation:** หากชื่อไฟล์แนบยาวเกินพื้นที่ ให้ตัดทอนด้วย `...` (CSS: `text-overflow: ellipsis`) 
- **Table to Card:** ในหน้าจอ Mobile (< 768px) ตารางแสดงรายการตั๋วจะถูกเปลี่ยนรูปแบบ (Transform) ไปแสดงผลแบบ Card แทนเพื่อป้องกันการเลื่อนหน้าจอแนวนอน