# Lab 1 — AI Use and Reflection  (fill this in)

**LLM/agent used:** <Gemini>

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | สอนทำ issue 1 แบบละเอียด โดยยึดเงื่อนไขของ Acceptance Criteria | นำมาใช้เป็นเช็คลิสต์โครงสร้างโปรเจกต์ และทำตามเป็นขั้น |
| 2 | ตั้งค่าให้ Vite เชื่อมกับ Express โดยไม่ Hardcode URL ต้องทำยังไง (Issue 2) | นำการตั้งค่า `server: { proxy: ... }` ไปเพิ่มใน `vite.config.ts` ทำให้หน้าเว็บดึงข้อมูล Health Check ได้ |
| 3 | จะเขียนไฟล์ `seed.ts` เพื่อเพิ่มข้อมูลลงฐานข้อมูลด้วย Prisma ต้องเขียนยังไง (Issue 3) | นำคำสั่ง `upsert` ไปเขียนวนลูปใน `seed.ts` เพื่อสร้างหมวดหมู่พื้นฐานทั้ง 4 รายการลงในฐานข้อมูล PostgreSQL |
| 4 | สอนทำ Issue 4 แบบละเอียด : สร้าง API ดึงข้อมูล `/api/categories` และแสดงผลบนเว็บ | นำโค้ด `findMany` ไปใช้ในแบคเอนด์ และปรับไฟล์ `App.tsx` ให้แสดงผลหมวดหมู่ตามสถานะ Loading / Success |
| 5 | ต้องเขียน Vitest ของ Issue 4 ยังไงให้ผ่านเกณฑ์การทดสอบ UI และตรงกับเงื่อนไขใน Acceptance Criteria| นำโค้ด Mock API `globalThis.fetch = vi.fn()` และการจำลองการคลิกปุ่มไปใช้ในไฟล์ `App.test.tsx` จนเทสต์ผ่าน |
| 6 | ไฟล์ `vite.config.ts` แจ้ง Error เส้นแดงจาก TypeScript ต้องแก้ยังไง | นำคำสั่ง `// @ts-nocheck` ไปใส่บรรทัดบนสุดของไฟล์ เพื่อแก้ปัญหา Tooling conflict ทำให้ระบบและเทสต์รันผ่านได้ |
## Reflection
-ตอน prompt ต้องส่ง Acceptance Criteria ให้ AI ดูด้วย จะได้ทำตามขั้นตอนให้ครบเงื่อนไขของ lab sheet 
-บางครั้งต้องส่งไฟล์ต้นแบบให้ AI ดูด้วย เพราะบางที่มันจะเขียนใหม่ทั้งหมด อาจจะทำให้เกิดบัค
