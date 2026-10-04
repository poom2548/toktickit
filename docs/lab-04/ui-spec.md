# ข้อกำหนด UI Lab 4 (UI Specification)

## 1. Design System และโทเค็น (Tokens)
อ้างอิงจากไฟล์ CSS จริงของโปรเจกต์ (`client/src/styles/zen-green.css`) ระบบใช้ CSS Custom Properties (CSS Variables) ไม่ใช่ Tailwind

**สีหลัก (Color Tokens)**
- `--zen-color-primary` (#006B3C) — สีเขียวหลัก, ปุ่มหลัก, ลิงก์
- `--zen-color-secondary` (#0B7A46) — hover/focus ปุ่มหลัก
- `--zen-color-primary-light` (#EAF6EF) — highlight/accent พื้นหลังอ่อน
- `--zen-bg-page` (#F5F7F6) — พื้นหลังหน้า
- `--zen-bg-surface` (#FFFFFF) — พื้นหลัง Card/Panel
- `--zen-bg-readonly` (#f0f3f1) — ฟิลด์อ่านอย่างเดียว
- `--zen-color-text` (#212529) — ข้อความหลัก
- `--zen-color-text-secondary` (#495057) — ข้อความรอง/label
- `--zen-color-error` (#8b0000), `--zen-color-error-border` (#dc3545)
- `--zen-color-focus` (#0B7A46) — สีวงแหวนโฟกัส

**สี Badge — Status (จาก zen-green.css)**
ใช้ตัวแปร `--zen-badge-{status}-bg` และ `--zen-badge-{status}-text` สำหรับทุกสถานะ: `new`, `open`, `progress`, `waiting`, `resolved`, `closed`, `reopened`, `cancelled`

**สี Badge — Priority:** `--zen-badge-{low|medium|high|critical}-bg/text`

**การแสดงผลฟิลด์**
- **ฟิลด์แก้ไขได้ (Editable):** พื้นขาว (`--zen-bg-surface`), ขอบ `--zen-border-neutral` (#dee2e6), โฟกัส = `outline: 2px solid var(--zen-color-focus); outline-offset: 2px`
- **ฟิลด์อ่านอย่างเดียว (Read-only):** พื้น `--zen-bg-readonly` (#f0f3f1), ตัวอักษร italic สี `--zen-color-text-secondary`
- **บันทึกภายใน (Internal Notes) / เนื้อหาส่วนตัว:** พื้นสีเหลืองอำพัน + ขอบสีอำพัน + ไอคอนแม่กุญแจ (`background: #FFF8E1; border: 1px solid #FFC107; color: #856404`) ไม่ใช้สีเพียงอย่างเดียว ต้องมีข้อความและไอคอนประกอบเสมอ
- **การสื่อความหมายที่ไม่ใช้สี (Non-color cues):** ใช้ข้อความ + badge + ไอคอนเสมอ ไม่พึ่งพาสีเพียงอย่างเดียว

---

## 2. โครงสร้างหน้าจอ (Screen Inventory)

### หน้าจอที่ 1: IT Staff / Admin Dashboard
หน้าแดชบอร์ดสำหรับเจ้าหน้าที่ IT และผู้ดูแลระบบ ประกอบด้วย:
- **ส่วนต้อนรับ:** หัวข้อ "ยินดีต้อนรับกลับ, `<ชื่อ>`" และปุ่ม "รีเฟรช" (`aria-label="รีเฟรชข้อมูลแดชบอร์ด"`, โฟกัสได้ด้วยคีย์บอร์ด, แสดง spinner ขณะโหลด)
- **การ์ดตัวชี้วัด (Metric Cards):** แต่ละการ์ดเป็นลิงก์ (Link) สำหรับ Drill-down โดยมี accessible name รวมค่าและป้ายกำกับ เช่น `aria-label="ยังไม่ได้มอบหมาย 5 รายการ"`
  1. **Unassigned** → drill-down `/staff/tickets?statusGroup=open&assignee=unassigned`
  2. **My Owned** → drill-down `/staff/tickets?statusGroup=open&assignee=me`
  3. **By Status** (5 buckets: NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED) → drill-down `/staff/tickets?status={STATUS}`
  4. **By IT Priority** (LOW, MEDIUM, HIGH, CRITICAL) → drill-down `/staff/tickets?priority={PRIORITY}`
  5. **User Accounts** — **มองเห็นเฉพาะ Administrator เท่านั้น**
- **อัปเดตล่าสุด (Recent Updates):** รายการตั๋ว 5 อันดับล่าสุดตาม updatedAt desc
- **Quick Actions:** สร้างตั๋ว (ไปยังหน้าสร้างตั๋ว), ค้นหาตั๋ว (ไปยังคิวตั๋ว), คิวของฉัน (`/staff/tickets?statusGroup=open&assignee=me`)

**Layout ตอบสนอง:**
- **1280px (Desktop):** การ์ดตัวชี้วัดเรียงในแถวเดียว ด้านล่างมี 2 คอลัมน์: "อัปเดตล่าสุด" 60% และ "Quick Actions" 40%
- **768px (Tablet):** การ์ดแสดงแบบ 2 คอลัมน์ (2x2 grid), เนื้อหาเรียงซ้อนกัน
- **360px (Mobile):** คอลัมน์เดียวทั้งหมด, แถวรายการเปลี่ยนเป็น card ซ้อนกัน, ไม่มี horizontal scroll

**States:**
- Loading: skeleton cards
- Forbidden (Requester เข้ามา): แสดงหน้า 403 พร้อมลิงก์กลับไป Requester Dashboard

### หน้าจอที่ 2: Requester Dashboard
หน้าแดชบอร์ดสำหรับผู้ร้องขอ (Requester) ประกอบด้วย:
- **ส่วนต้อนรับ:** หัวข้อ "ยินดีต้อนรับกลับ, `<ชื่อ>`" และปุ่ม "รีเฟรช" (เหมือนหน้าจอที่ 1)
- **การ์ดตัวชี้วัด (Metric Cards):** แต่ละการ์ดมีลิงก์ "ดูทั้งหมด" (View all)
  1. **My Open Tickets** → drill-down `/tickets?statusGroup=open`
  2. **Waiting for Me** → drill-down `/tickets?status=WAITING_FOR_REQUESTER`
  3. **แก้ปัญหาแล้วล่าสุด (Recently Resolved)** → drill-down `/tickets?status=RESOLVED`
- **อัปเดตล่าสุด (Recent Updates):** รายการตั๋วตนเอง 5 อันดับล่าสุด
- **Quick Actions:** สร้างตั๋ว, ดูตั๋วทั้งหมดของฉัน (`/tickets`)

**Layout ตอบสนอง:**
- **1280px (Desktop):** การ์ด 3 ใบในแถวเดียว (3 columns); ด้านล่างมีรายการ Recent Updates และ Quick Actions เรียงกัน
- **768px (Tablet):** การ์ด 2 คอลัมน์ (ใบที่ 3 อยู่ล่าง full-width ได้); Recent Updates และ Quick Actions เรียงซ้อนกัน
- **360px (Mobile):** คอลัมน์เดียวทั้งหมด

**States:**
- Loading: skeleton cards
- Forbidden (Staff เข้ามา): หน้า 403 พร้อมลิงก์กลับไป Staff Dashboard

### หน้าจอที่ 3: Actions Taken (รายการการดำเนินการ)

**ฟอร์มและตาราง:**
- **การตัดสินใจ:** ฟอร์มสร้างและแก้ไขเป็น **Inline Panel** เหนือตารางในทุกขนาดหน้าจอ (ไม่ใช้ Modal สำหรับสร้าง/แก้ไข Action)
  - Modal ใช้เฉพาะ Confirmation dialog เท่านั้น (เช่น ยืนยันยกเลิกตั๋ว) พร้อม focus-trap, ปิดด้วย Esc, คืนโฟกัสหลังปิด
- **คอลัมน์ตาราง:** วันที่/เวลา (`actionAt`, แสดงเวลาเขต Asia/Bangkok ส่งเป็น UTC), คำอธิบาย, ผลลัพธ์, ผู้ดำเนินการ (อ่านอย่างเดียว อัตโนมัติ), การติดตามผล (badge + ข้อความ + หมายเหตุ), บันทึกไฟล์แนบ
- **Semantic HTML:** ต้องใช้ `<caption>` อธิบายตาราง และ `<th scope="col">` สำหรับหัวตาราง
- **Layout ตอบสนอง:** ตาราง (1280px/768px) ด้านล่าง ticket description; เปลี่ยนเป็น card ที่ 360px

**ฟอร์ม Inline:**
- วันที่/เวลาค่าเริ่มต้น = ตอนนี้ (now)
- คำอธิบาย (Description) และผลลัพธ์ (Result) เป็น Required
- สวิตช์ "ต้องการติดตามผล" — เมื่อเปิด ช่อง "บันทึกการติดตามผล" จะปรากฏและเป็น Required
- บันทึกไฟล์แนบ (Attachment Notes) เป็น Optional
- Validation แบบ inline ข้างฟิลด์, เชื่อมด้วย `aria-describedby`
- ปุ่ม "บันทึก" (Save) — ปิดการใช้งาน + spinner ขณะส่ง; ข้อมูลที่กรอกถูกรักษาไว้หาก request ล้มเหลว
- ปุ่ม "ยกเลิก" (Cancel)
- แบนเนอร์ขัดแย้ง 409 (พร้อมปุ่ม "โหลดซ้ำ") แสดงเหนือฟอร์ม และรักษาข้อมูลที่พิมพ์ไว้

**สิทธิ์:**
- IT Staff/Admin: เห็นตาราง + ปุ่ม "แก้ไข" ชัดเจนในแต่ละแถว (โฟกัสด้วยคีย์บอร์ด, `aria-label` รวมวันที่/เวลาของ Action) + สามารถสร้าง Action ใหม่
- ผู้ร้องขอ (Requester): เห็นตาราง Actions แบบอ่านอย่างเดียว ไม่มีปุ่มแก้ไขหรือสร้าง

### หน้าจอที่ 4: การเปลี่ยนสถานะ (Ticket Status Controls) และเปลี่ยนผู้รับผิดชอบ (Owner Picker)

- **Transition ไม่ Hardcode:** UI โหลดรายการสถานะที่เปลี่ยนได้จาก `GET /api/tickets/:id/allowed-transitions` ทุกครั้ง (Dropdown ถูกสร้างแบบไดนามิก)
- **Owner Dropdown:** แสดงเฉพาะผู้ใช้ที่ Active และมีบทบาท IT Staff/Admin เท่านั้น (ผู้ไม่ active ไม่ปรากฏในรายการ) หากเซิร์ฟเวอร์ยังคืน `INVALID_ASSIGNEE` ให้แสดงข้อความ inline ข้าง dropdown
- **Advisory Flag (Requester):** ปุ่ม "ทำเครื่องหมายว่าปัญหาดูเหมือนจะได้รับการแก้ไขแล้ว" — อนุญาตเฉพาะสถานะ OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED; มีคำอธิบายชัดเจนว่าเป็นเพียงคำแนะนำและไม่เปลี่ยนสถานะ
- **Banner (Staff):** เมื่อ `requesterMarkedResolvedAt` มีค่า จะแสดงแบนเนอร์ "ผู้ร้องขอได้ทำเครื่องหมายว่าแก้ไขแล้ว" พร้อมวันที่
- **Status badge:** อัปเดตทันทีหลังเปลี่ยนสถานะสำเร็จ ไม่ต้อง reload หน้า

**Layout ตอบสนอง:**
- **360px:** ปุ่มและ Dropdown เรียงซ้อนกัน full-width, ห้ามมี Overflow ออกนอกจอ
- **768px/1280px:** วางปุ่มและส่วนควบคุมแบบ inline เรียงกัน

### หน้าจอที่ 5: การนำทาง (Navigation)

- **ไอเทม "แดชบอร์ด":** ชี้ไปยังแดชบอร์ดตามบทบาท — Requester ไป `/tickets`; IT Staff/Admin ไป `/staff/tickets`
- **Active item:** ต้องมี `aria-current="page"` เสมอ
- **360px (Mobile):** ปุ่มเปิด/ปิดเมนู (Hamburger) พร้อม `aria-expanded` และ `aria-controls`; กด Esc ปิดเมนูและโฟกัสกลับที่ปุ่ม toggle; เมนูพับเก็บได้ (Collapsible)
- **768px/1280px:** แถบนำทางแบบปกติ (Horizontal nav bar)

---

## 3. เมทริกซ์แสดงสถานะ UI (State Matrix Table)

| ส่วนประกอบ / หน้าจอ | Loading | Empty | Validation (422) | Success | Forbidden (403) | Not-found (404) | Conflict (409) | Network / Safe-failure |
|---|---|---|---|---|---|---|---|---|
| **Requester Dashboard** | Skeleton cards ในแต่ละการ์ด | "ยังไม่มีข้อมูลตั๋ว" ในแต่ละการ์ด (count = 0) | — | แสดงตัวเลขและรายการ พร้อมปุ่ม "รีเฟรช" พร้อมใช้ | หน้า 403 "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" + ลิงก์กลับ Staff Dashboard (กรณี Staff หลงเข้า) | — | — | แบนเนอร์ `role="alert"` "เกิดข้อผิดพลาดในการเชื่อมต่อ" + ปุ่มลองใหม่ |
| **Staff Dashboard** | Skeleton cards | แสดง 0 ในทุกถัง | — | แสดงแดชบอร์ดพร้อมตัวเลขและรายการ | หน้า 403 "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" + ลิงก์กลับ Requester Dashboard (กรณี Requester หลงเข้า) | — | — | แบนเนอร์ `role="alert"` + ปุ่มลองใหม่ |
| **Screen 3 (Actions Taken)** | Spinner ในตาราง, ปุ่มถูกปิด | ตาราง 1 แถว "ยังไม่มีประวัติการดำเนินงาน" | Inline form: ขอบแดงพร้อมข้อความข้างฟิลด์ (`aria-describedby`) | `role="status"` / `aria-live="polite"` แจ้ง "บันทึก Action สำเร็จ" | ซ่อนปุ่มสร้าง/แก้ไข แสดงข้อความ "คุณไม่มีสิทธิ์" | แบนเนอร์ `role="alert"` "ไม่พบ Action" + reload รายการ | แบนเนอร์ "ตั๋วถูกอัปเดตโดยผู้อื่น" `role="alert"` + ปุ่ม "โหลดซ้ำ" (ข้อมูลที่พิมพ์ถูกเก็บไว้) | แบนเนอร์ `role="alert"` + ปุ่ม Retry |
| **Screen 4 (Status & Owner)** | Spinner ที่ Dropdown ขณะโหลด allowed-transitions | — | RESOLUTION_GATE_FAILED / INVALID_TRANSITION (422) → inline banner แสดง `reason` จากเซิร์ฟเวอร์ | สถานะ badge อัปเดตทันที; `aria-live="polite"` แจ้ง "อัปเดตสำเร็จ" | แสดง "การดำเนินการไม่ได้รับอนุญาต" ซ่อนปุ่ม | แบนเนอร์ `role="alert"` "ไม่พบตั๋ว" | 409 CONFLICT → banner "ตั๋วถูกอัปเดตโดยผู้อื่น" + ปุ่ม "โหลดซ้ำ"; 409 INVALID_TICKET_STATE / TICKET_LOCKED → banner แสดงสาเหตุ `role="alert"` | แบนเนอร์ `role="alert"` "Network failure" + ปุ่มลองใหม่ |
| **Actions Create/Edit Form (Inline)** | ปุ่ม "บันทึก" แสดง Spinner, ปิดการใช้งาน | — | ฟิลด์ขอบแดง + ข้อความข้างฟิลด์ เชื่อมด้วย `aria-describedby` | ฟอร์มปิด; `aria-live="polite"` แจ้งสำเร็จ | ปิดไม่ให้กด Submit | — | 409 CONFLICT → banner "ตั๋วถูกอัปเดตโดยผู้อื่น" + ปุ่ม "โหลดซ้ำ" + รักษาข้อมูลที่พิมพ์; 409 TICKET_LOCKED → banner อธิบาย | แบนเนอร์ `role="alert"` |

---

## 4. กฎของคีย์บอร์ด, Focus และ ARIA

- **Keyboard Access:** ทุก interactive element เข้าถึงได้ด้วย Tab ตามลำดับที่สมเหตุสมผล
- **Focus Ring:** ทุก element โฟกัสได้ต้องมีวงแหวนโฟกัสที่มองเห็นชัด: `outline: 2px solid var(--zen-color-focus); outline-offset: 2px`
- **Validation Messages:** แสดงข้างฟิลด์ทันที เชื่อมด้วย `aria-describedby`; ประกาศผ่าน `aria-live="polite"` ให้ Screen Reader
- **Blocking Errors:** ใช้ `role="alert"` เสมอ
- **Success Messages:** ใช้ `role="status"` หรือ `aria-live="polite"`
- **Modal / Dialog:** กัก focus ไว้ภายใน, ปิดด้วย Esc, คืน focus ไปที่ trigger element เมื่อปิด

---

## 5. รายการตรวจสอบภาพและการเข้าถึง (Visual and Accessibility Checklist)

- [ ] ใช้ CSS Variables จาก `zen-green.css` ถูกต้องครบถ้วน ไม่มีสีที่เหลือจาก Lab ก่อนหน้า (หลักฐาน: STY-01, REG-04, `artifacts/lab-04/screenshots/`)
- [ ] ไม่มี UI ที่ค้างมาจาก Lab ก่อนหน้า ไม่มี placeholder หรือ stub ที่ยังไม่เสร็จ (หลักฐาน: REG-04)
- [ ] แดชบอร์ด IT Staff: ตัวเลข, การ์ด 5 bucket สถานะ (รวม REOPENED), drill-down links ทำงานถูกต้อง (หลักฐาน: SD-01, UI-01, `artifacts/lab-04/screenshots/staff-dashboard/`)
- [ ] แดชบอร์ด Requester: ตัวเลข, การ์ด 3 ใบ, drill-down links ทำงานถูกต้อง (หลักฐาน: RD-01, UI-03, `artifacts/lab-04/screenshots/requester-dashboard/`)
- [ ] Loading state ของแดชบอร์ด: แสดง skeleton (หลักฐาน: UI-02, UI-04)
- [ ] Empty state ของแดชบอร์ด: แสดง 0 หรือข้อความว่างเปล่า (หลักฐาน: SD-02, RD-03)
- [ ] Forbidden state: หน้า 403 ที่ถูกต้องพร้อมลิงก์กลับตามบทบาท (หลักฐาน: AUTHZ-06, SD-03)
- [ ] Safe-failure / network error: banner พร้อมปุ่มลองใหม่ (หลักฐาน: UI-02)
- [ ] ปุ่ม "รีเฟรช" บนแดชบอร์ดทั้งสอง: มี `aria-label`, โฟกัสด้วยคีย์บอร์ดได้, แสดง spinner ขณะโหลด (หลักฐาน: A11Y-01)
- [ ] Metric cards มี accessible name ที่รวมค่าและป้ายกำกับ เช่น "ยังไม่ได้มอบหมาย 5 รายการ" (หลักฐาน: A11Y-01)
- [ ] Actions Taken: เรียงตาราง (1280/768px) → card ที่ 360px ไม่มี horizontal scroll (หลักฐาน: RESP-01, UI-05, `artifacts/lab-04/screenshots/actions-taken/`)
- [ ] Actions Taken: Conditional field — "บันทึกการติดตามผล" ปรากฏและเป็น Required เมื่อสวิตช์เปิด (หลักฐาน: UI-06)
- [ ] Actions Taken: ตาราง semantic (`<caption>` + `<th scope="col">`) (หลักฐาน: A11Y-02)
- [ ] ฟิลด์แก้ไขได้: พื้นขาว + ขอบ vs. ฟิลด์อ่านอย่างเดียว: พื้น `--zen-bg-readonly` + italic (หลักฐาน: STY-01, UI-06)
- [ ] Validation messages แสดงข้างฟิลด์ เชื่อม `aria-describedby` และประกาศให้ Screen Reader (หลักฐาน: A11Y-01, UI-06)
- [ ] ข้อมูลในฟอร์มถูกเก็บไว้หาก request ล้มเหลวแบบกู้คืนได้ (Recoverable failure) (หลักฐาน: UI-14, AC-45)
- [ ] Keyboard focus ring มองเห็นได้ทุก element (หลักฐาน: A11Y-01, A11Y-02)
- [ ] Modal (Confirmation dialog): focus-trap, ปิดด้วย Esc, คืน focus ที่ trigger (หลักฐาน: A11Y-02)
- [ ] เมนูนำทาง mobile (360px): Hamburger button พร้อม `aria-expanded`/`aria-controls`, Esc ปิด, คืน focus ที่ toggle (หลักฐาน: RESP-01, A11Y-01)
- [ ] Active nav item มี `aria-current="page"` (หลักฐาน: UI-13, A11Y-01)
- [ ] ไม่มี clipping, ไม่มีการซ้อนทับกัน, ไม่มี horizontal scroll ที่ 360/768/1280px (หลักฐาน: RESP-01, AC-47)
- [ ] สถานะและความสำคัญสื่อด้วยข้อความ + สีเสมอ ไม่ใช่สีอย่างเดียว (หลักฐาน: STY-01, A11Y-01)
- [ ] Internal Notes แสดงด้วยพื้นสีอำพัน + ไอคอนแม่กุญแจ แตกต่างชัดเจนจาก Public Comments (หลักฐาน: STY-01, WF-10)
