# AI Use Documentation

**LLM Used**: Gemini 3.1 Pro (High), Claude Sonnet 4.6 (Thinking)

## Key Prompts Used

| No. | Feature / Task | Prompt Snippet / Purpose | AI Contribution |
|-----|----------------|--------------------------|-----------------|
| 1 | UI Layout — User Management Page | "All content on the User Management page is clustered on the left side of the screen, making it look unattractive and difficult to read." | สร้างไฟล์ CSS ใหม่ `admin.css` สำหรับหน้า User Management พร้อม layout ที่ถูกต้องและ Design Tokens ของ Zen Green |
| 2 | Login Page Improvements | "Add a 'Forgot your password?' link and a show/hide password toggle to the Login page." | เพิ่ม Toggle แสดง/ซ่อนรหัสผ่าน และปุ่ม Forgot Password พร้อมข้อความช่วยเหลือใน `LoginPage.tsx` |
| 3 | Req. Priority Filter | "In the filter section next to the search button, the Req. Priority filter is missing." | เพิ่ม State, API Parameter และ UI Dropdown สำหรับ Req. Priority ใน `QueueControls.tsx` และ `StaffTicketQueuePage.tsx` |
| 4 | Backend Priority Filter | "Add support for the `requestedPriority` query parameter in `staff.controller.ts`." | แก้ไข Controller ให้รองรับการกรองด้วย `requestedPriority` พร้อม Validation |
| 5 | Playwright E2E Race Condition | "Race condition: `waitForResponse` was firing DOM events before listening for API response, causing timeouts." | วิเคราะห์และแก้ไข Race Condition ใน `user-administration.spec.ts` โดยจัด `waitForResponse` ให้เริ่มก่อน Action |
| 6 | E2E State Pollution | "Sequential E2E tests mutated Eve's and Bob's passwords in the database, breaking subsequent tests." | เพิ่ม Prisma Block ใน `global-setup.ts` เพื่อ Reset `passwordHash` และ `requiresPasswordChange` ก่อนทุก E2E Run |
| 7 | Force Password Change (Requester) | "I need for the system to force a password change whenever a Requester logs in using the default password." | เพิ่ม Logic ใน `POST /login` ใน `auth.ts` เพื่อตรวจจับ Default Password และตั้ง `requiresPasswordChange=true` เฉพาะ Role REQUESTER |


## My Reflection

**สิ่งที่ได้เรียนรู้และสะท้อนคิดจากการใช้ AI:**
ใน Lab นี้ AI มีบทบาทสำคัญมากทั้งในด้านการแก้ไข UI ให้ตรงกับ Design Spec และการดีบั๊ก Test Suite ที่ซับซ้อน

**AI ช่วยเหลืออย่างไร**
AI ช่วยวิเคราะห์ปัญหาที่ซ่อนอยู่ได้รวดเร็ว เช่น Race Condition ใน Playwright ที่เกิดจากลำดับการเรียก `waitForResponse` ที่ผิด หรือ State Pollution ระหว่าง Test Cases ที่ทำให้ค่าในฐานข้อมูลเปลี่ยนแปลงโดยไม่ตั้งใจ นอกจากนี้ AI(Claude) ยังช่วยวางโครงสร้าง CSS ใหม่ทั้งหมดสำหรับหน้า User Management ที่การจัดหน้าและสีเพี้ยน(ตอนแรกให้ Claude สั่ง Gemini ทำ แต่มันทำไม่ค่อยดีเลยให้ Claude ตรวจภาพรวมใหม่) ทำให้ประหยัดเวลาได้เยอะ

**อุปสรรคที่พบ**
บางครั้ง AI ไม่สามารถเห็นหน้าเวปจริงได้ ต้องอธิบายรายละเอียดหน้า UI ที่ต้องการแก้ให้มันเห็น หรือแคปรูปให้ดู เช่น บอกว่ามีปุ่มซ้ำกันอยู่ที่ไหนและแสดงเมื่อไหร่ จึงเรียนรู้ว่าการให้ข้อมูลที่ครบถ้วน เช่น ชื่อปุ่ม, สี, และฟังก์ชั่นที่ต้องมี จะทำให้ AI แก้ปัญหาได้ตรงจุดและรวดเร็วขึ้นมาก
