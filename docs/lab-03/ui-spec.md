# เอกสารข้อกำหนดส่วนต่อประสานผู้ใช้ (UI Specification) - Lab 3

## บัญชีรายชื่อหน้าจอ (Screen Inventory)

สำหรับแต่ละหน้าจอ จะมีการระบุเส้นทาง, บทบาทที่เข้าถึงได้, และโหมดที่รองรับ (สร้าง / ดู / แก้ไข) ดังนี้:

| ชื่อหน้าจอ (Screen) | เส้นทาง (Route) | บทบาทที่อนุญาต (Roles) | โหมดที่รองรับ (Modes) |
|---|---|---|---|
| ล็อกอิน (Login) | `/login` | ทุกบทบาท (ก่อนยืนยันตัวตน) | สร้าง (แบบฟอร์ม) |
| บังคับเปลี่ยนรหัสผ่าน (Mandatory Change Password) | `/change-password` | ทุกบทบาท (เมื่อใช้งานครั้งแรก) | สร้าง (แบบฟอร์ม) |
| โครงสร้างแอประบบ (App Shell / Navigation) | (เป็นส่วนห่อหุ้มคงที่) | ผู้ใช้ที่ยืนยันตัวตนแล้วทุกคน | ดู |
| รายการตั๋วของผู้ร้องขอ (Requester — Ticket List) | `/tickets` | `REQUESTER` | ดู |
| การสร้างตั๋วของผู้ร้องขอ (Requester — Create Ticket) | `/tickets/new` | `REQUESTER` | สร้าง |
| รายละเอียดตั๋วของผู้ร้องขอ (Requester — Ticket Detail) | `/tickets/:id` | `REQUESTER` (เฉพาะตั๋วตัวเอง) | ดู / แก้ไข (บางส่วน) |
| คิวตั๋วของเจ้าหน้าที่ (IT Staff — Ticket Queue) | `/staff/tickets` | `IT_STAFF`, `ADMINISTRATOR` | ดู |
| รายละเอียดตั๋วเจ้าหน้าที่ (IT Staff — Ticket Detail) | `/staff/tickets/:id` | `IT_STAFF`, `ADMINISTRATOR` | ดู / แก้ไข |
| การจัดการผู้ใช้งาน (Admin — User Management) | `/admin/users` | `ADMINISTRATOR` | ดู / สร้าง / แก้ไข |
| การปฏิเสธการเข้าถึง (Forbidden) | `/forbidden` (หรือแสดงแทนที่หน้า) | ผู้ใช้ใดๆ ที่พยายามเข้าเส้นทางที่ไม่มีสิทธิ์ | ดู |

## โหมดของส่วนประกอบ (Component Modes)
ในหน้าจอรายละเอียดตั๋ว (Ticket Detail) ที่รองรับหลายโหมด จะมีความแตกต่างทางการแสดงผลดังนี้:
- **โหมดอ่านอย่างเดียว (View-only) สำหรับ `REQUESTER`:** ฟิลด์ข้อมูลต่างๆ ของตั๋วจะแสดงเป็นข้อความปกติ ไม่มีกรอบป้อนข้อมูล (Input borders) หรือปุ่มดำเนินการ (Action buttons) ที่สงวนไว้สำหรับเจ้าหน้าที่
- **โหมดแก้ไข (Editable) สำหรับ `IT_STAFF` / `ADMINISTRATOR`:** ฟิลด์สถานะ, ความสำคัญ, และเจ้าของตั๋ว จะปรากฏในลักษณะของ Dropdown แบบมีกรอบแสดงให้เห็นว่าสามารถเปลี่ยนแปลงค่าได้

## กฎการออกแบบโทนสี Zen Green (Zen Green Design Token Rules)
เพื่อให้การออกแบบสอดคล้องกันตลอดทั้ง Lab 3 ระบบจะใช้ค่า Design Token จาก Lab 2 ดังนี้:

- **สี (Colors):**
  - Primary / Secondary / Accent / Error / Warning / Success ต้องใช้โค้ดสี Hex หรือ CSS Variables ของโครงสร้าง Lab 2 อย่างเคร่งครัด
- **รูปแบบตัวอักษร (Typography):**
  - ยึดสัดส่วนขนาดหัวเรื่อง (Headings), ข้อความเนื้อหา (Body), ป้ายกำกับ (Labels) และข้อความในตราสัญลักษณ์ (Badge text)
- **ระยะห่าง (Spacing Scale):**
  - ใช้ระยะห่างและแพดดิ้งเดิมเพื่อให้การวางตำแหน่งหน้าจอสม่ำเสมอ
- **ความโค้งของขอบ (Border Radius) และเงา (Shadow Levels):**
  - ใช้ขอบโค้งที่มีระดับเดียวกันในหน้าต่างหรือการ์ด รวมถึงความลึกของเงาตามมาตรฐานของ Zen Green
- **รูปแบบตราสัญลักษณ์ตามสถานะ (Badge color variants per status):**
  - ค่าคงที่ตามสถานะ: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED` ต้องแสดงสีพื้นหลังและตัวหนังสือให้สอดคล้องกัน
- **รูปแบบตราสัญลักษณ์ตามความสำคัญ (Badge color variants per priority):**
  - กำหนดระดับเช่น `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` ด้วยสีเฉพาะ (ตัวอย่างเช่น LOW สีเขียว, CRITICAL สีแดง)
- **ขอบแสดงสถานะโฟกัส (Focus Ring Style):**
  - เมื่อมีการกด Tab นำทาง ระบบต้องแสดงกรอบโฟกัสตามสไตล์ที่ชัดเจนของระบบออกแบบ

## จุดตัดการตอบสนองหน้าจอ (Responsive Breakpoints)

| ขนาดหน้าจอ (Breakpoint) | ช่วงความกว้าง (Range) | ข้อกำหนดเลย์เอาต์ (Layout Notes) |
|---|---|---|
| เดสก์ท็อป (Desktop) | ≥ 1024 px | หน้าคิวงานใช้เลย์เอาต์แบบตาราง (Table layout); หน้ารายละเอียดจัดหน้าจอแบบแบ่งสองฝั่ง (Side-by-side panels) |
| แท็บเล็ต (Tablet) | 768 – 1023 px | ปรับใช้เลย์เอาต์แบบเรียงซ้อน (Stacked layout) ตามความเหมาะสม; ต้องอ่านได้ชัดเจนโดยไม่ต้องเลื่อนหน้าจอแนวนอน |
| สมาร์ทโฟน (Mobile) | < 768 px | คิวงานแสดงแบบรายการการ์ด (Card-based list); เลย์เอาต์คอลัมน์เดียว; ขนาดปุ่มหรือเมนูต้องพอดีกับการสัมผัส (Touch-friendly targets) |

*หมายเหตุ:* ในหน้าคิวงาน เมื่อย่อขนาดจากเดสก์ท็อปไปสมาร์ทโฟน ตารางต้องถูกปรับไปเป็นรายการการ์ด

## รายการตรวจสอบทางสายตา (Visual Checklist)
รายการเหล่านี้จะถูกตรวจสอบในช่วง QA ของ Issue #8 โดยในตอนนี้สถานะของรายการทั้งหมดคือยังไม่ถูกตรวจสอบ (Unchecked):

- [x] หน้าจอทั้งหมดใช้ Design Token ของ Zen Green เท่านั้น โดยไม่มีการฝัง Inline styles ในโค้ด
- [x] ค่าสถานะ (Status) และความสำคัญ (Priority) แสดงในรูปแบบ Zen Green badge components แทนที่จะเป็นข้อความธรรมดา
- [x] ข้อผิดพลาดในการตรวจสอบข้อมูล (Validation errors) ถูกแสดงผลแบบอินไลน์ใกล้กับฟิลด์ที่เกี่ยวข้อง และใช้ดีไซน์กล่องข้อผิดพลาดของ Zen Green
- [x] ฟิลด์ที่แก้ไขได้ในหน้ารายละเอียดตั๋วสำหรับ `IT_STAFF` จะแสดงในรูปแบบอ่านอย่างเดียว (ไม่มีกรอบกล่องข้อความ) เมื่อผู้ใช้งานเข้าชมคือ `REQUESTER`
- [x] แถบ Focus rings มองเห็นได้ชัดเจนในทุกปุ่มปฏิสัมพันธ์ (ปุ่ม, อินพุต, ลิงก์)
- [x] ไม่มีการล้นของเนื้อหาแนวนอน (Horizontal overflow), ไม่มีเนื้อหาโดนตัด หรือซ้อนทับกัน ในขนาดหน้าจอเดสก์ท็อป
- [x] ไม่มีการล้นของเนื้อหาแนวนอน (Horizontal overflow), ไม่มีเนื้อหาโดนตัด หรือซ้อนทับกัน ในขนาดหน้าจอแท็บเล็ต
- [x] ไม่มีการล้นของเนื้อหาแนวนอน (Horizontal overflow), ไม่มีเนื้อหาโดนตัด หรือซ้อนทับกัน ในขนาดหน้าจอสมาร์ทโฟน
- [x] คิวตั๋วของ IT Staff: แสดงผลเป็นตารางในหน้าจอเดสก์ท็อป; แสดงเป็นรายการการ์ดในหน้าจอแท็บเล็ต/สมาร์ทโฟน
- [x] กล่องข้อความแสดงความคิดเห็นสาธารณะ (Public Comments) และบันทึกข้อความภายใน (Internal Notes) ต้องมีความแตกต่างทางสายตาอย่างชัดเจน
- [x] เมนูนำทาง (Nav items) ที่ถูกจำกัดสิทธิ์จะไม่ถูกแสดงผล (Not rendered) ให้แก่ผู้ใช้ที่ไม่มีบทบาทเกี่ยวข้อง
- [x] หน้าจอการล็อกอิน: มีช่องใส่อีเมล รหัสผ่าน แสดงสถานะการโหลดและข้อความผิดพลาดอย่างถูกต้อง
- [x] หน้าจอเปลี่ยนรหัสผ่าน: มีช่องใส่รหัสผ่านใหม่ ยืนยันรหัสผ่านใหม่ กฎการตั้งรหัสผ่านปรากฏชัดเจน (และมีช่องรหัสผ่านปัจจุบันหากต้องการ)
- [x] หน้าจอถูกปฏิเสธสิทธิ์ (Forbidden) ปรากฏขึ้นอย่างถูกต้องเมื่อมีความพยายามเข้าถึงหน้าที่ไม่มีสิทธิ์
- [x] รูปภาพบันทึกหน้าจอ (Screenshots) ในทุกหน้าและทุกขนาดจุดตัด (Breakpoint) ถูกบันทึกลงไปใน `artifacts/lab-03/screenshots/`
 
 # #   V i s u a l   Q A   V e r i f i c a t i o n   C h e c k l i s t  
  
 # # #   1 .   T o k e n   A u d i t   &   B a d g e   A u d i t  
 -   [ x ]   A l l   h a r d c o d e d   i n l i n e   s t y l e s   ( c o l o r s ,   b o r d e r - r a d i i ,   b a c k g r o u n d s )   a r e   r e p l a c e d   w i t h   Z e n   G r e e n   C S S   v a r i a b l e s   ( ` - - z e n - c o l o r - * ` ,   ` - - z e n - r a d i u s - * ` ,   e t c . ) .  
 -   [ x ]   A l l   r a w   t e x t   t i c k e t   s t a t u s e s   a r e   r e p l a c e d   w i t h   ` < S t a t u s B a d g e > `   c o m p o n e n t .  
 -   [ x ]   A l l   r a w   t e x t   t i c k e t   p r i o r i t i e s   a r e   r e p l a c e d   w i t h   ` < P r i o r i t y B a d g e > `   c o m p o n e n t .  
 -   [ x ]   M y T i c k e t s P a g e   l o c a l   ` B a d g e `   a n d   ` S T A T U S _ C O L O R S ` / ` P R I O R I T Y _ C O L O R S `   c o n s t a n t s   r e m o v e d .  
 -   [ x ]   U s e r   T a b l e   r o l e   i s   r e n d e r e d   u s i n g   a   R o l e B a d g e   v a r i a n t   w i t h   Z e n   G r e e n   c o l o r s .  
 -   [ x ]   U s e r   T a b l e   a c t i v e / i n a c t i v e   s t a t u s   i s   r e n d e r e d   u s i n g   Z e n   G r e e n   s t a t u s   s t y l i n g .  
  
 # # #   2 .   F u n c t i o n a l   V i s u a l   R u l e s  
 -   [ x ]   A C - U I - 0 5 :   V a l i d a t i o n   e r r o r s   a r e   i n l i n e   a d j a c e n t   t o   f i e l d s   ( L o g i n ,   C h a n g e   P a s s w o r d ,   C r e a t e   U s e r ) .   N o   g l o b a l   t o a s t s   f o r   f i e l d   e r r o r s .  
 -   [ x ]   A C - U I - 0 6 :   E d i t a b l e   o p e r a t i o n a l   f i e l d s   i n   t h e   S t a f f   T i c k e t   D e t a i l   s c r e e n   a r e   r e a d - o n l y   ( v i s u a l l y   d i s t i n c t ,   n o   i n p u t / s e l e c t )   w h e n   v i e w e d   b y   a   R e q u e s t e r .  
 -   [ x ]   A C - U I - 0 8 :   G l o b a l   C S S   r u l e s   d o   N O T   i n c l u d e   ` o u t l i n e :   n o n e `   o r   ` o u t l i n e :   0 ` .   K e y b o a r d   f o c u s   r i n g s   m u s t   b e   v i s i b l e .  
  
 # # #   3 .   S c r e e n s h o t s   G e n e r a t e d  
 -   [ x ]   L o g i n   s c r e e n  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / l o g i n / l o g i n - d e s k t o p . p n g `  
     -   T a b l e t :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / l o g i n / l o g i n - t a b l e t . p n g `  
     -   M o b i l e :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / l o g i n / l o g i n - m o b i l e . p n g `  
 -   [ x ]   L o g i n   s c r e e n   B�    v a l i d a t i o n   e r r o r   s t a t e  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / l o g i n / l o g i n - e r r o r - d e s k t o p . p n g `  
 -   [ x ]   C h a n g e   P a s s w o r d   s c r e e n  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / c h a n g e - p a s s w o r d / c h a n g e - p a s s w o r d - d e s k t o p . p n g `  
     -   T a b l e t :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / c h a n g e - p a s s w o r d / c h a n g e - p a s s w o r d - t a b l e t . p n g `  
     -   M o b i l e :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / c h a n g e - p a s s w o r d / c h a n g e - p a s s w o r d - m o b i l e . p n g `  
 -   [ x ]   R e q u e s t e r   T i c k e t   D e t a i l  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / r e q u e s t e r - d e t a i l / r e q u e s t e r - d e t a i l - d e s k t o p . p n g `  
     -   T a b l e t :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / r e q u e s t e r - d e t a i l / r e q u e s t e r - d e t a i l - t a b l e t . p n g `  
     -   M o b i l e :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / r e q u e s t e r - d e t a i l / r e q u e s t e r - d e t a i l - m o b i l e . p n g `  
 -   [ x ]   I T   S t a f f   T i c k e t   Q u e u e  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / s t a f f - q u e u e / s t a f f - q u e u e - d e s k t o p . p n g `  
     -   T a b l e t :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / s t a f f - q u e u e / s t a f f - q u e u e - t a b l e t . p n g `  
     -   M o b i l e :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / s t a f f - q u e u e / s t a f f - q u e u e - m o b i l e . p n g `  
 -   [ x ]   I T   S t a f f   Q u e u e   B�    e m p t y   r e s u l t s   s t a t e  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / s t a f f - q u e u e / s t a f f - q u e u e - e m p t y - d e s k t o p . p n g `  
 -   [ x ]   I T   S t a f f   T i c k e t   D e t a i l  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / s t a f f - d e t a i l / s t a f f - d e t a i l - d e s k t o p . p n g `  
     -   T a b l e t :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / s t a f f - d e t a i l / s t a f f - d e t a i l - t a b l e t . p n g `  
     -   M o b i l e :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / s t a f f - d e t a i l / s t a f f - d e t a i l - m o b i l e . p n g `  
 -   [ x ]   I T   S t a f f   T i c k e t   D e t a i l   B�    a s   R e q u e s t e r   ( r e a d - o n l y   v i e w )  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / s t a f f - d e t a i l / s t a f f - d e t a i l - r e q u e s t e r - v i e w - d e s k t o p . p n g `  
 -   [ x ]   A d m i n   U s e r   M a n a g e m e n t  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / u s e r - m a n a g e m e n t / u s e r - m a n a g e m e n t - d e s k t o p . p n g `  
     -   T a b l e t :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / u s e r - m a n a g e m e n t / u s e r - m a n a g e m e n t - t a b l e t . p n g `  
     -   M o b i l e :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / u s e r - m a n a g e m e n t / u s e r - m a n a g e m e n t - m o b i l e . p n g `  
 -   [ x ]   A d m i n   B�    C r e a t e   U s e r   m o d a l  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / u s e r - m a n a g e m e n t / c r e a t e - u s e r - m o d a l - d e s k t o p . p n g `  
 -   [ x ]   A d m i n   B�    E d i t   U s e r   m o d a l  
     -   D e s k t o p :   ` a r t i f a c t s / l a b - 0 3 / s c r e e n s h o t s / u s e r - m a n a g e m e n t / e d i t - u s e r - m o d a l - d e s k t o p . p n g `  
 