# TokTickIT - IT Service Desk (Lab 1)

## ขั้นตอนการติดตั้งและการรันระบบ (Getting Started)

### 1. การตั้งค่าระบบหลังบ้าน (Backend Setup)
1. เข้าไปยังโฟลเดอร์ `server`: `cd server`
2. ติดตั้ง Dependencies: `npm install`
3. **การตั้งค่า Environment Variables:**
   - คัดลอกไฟล์ `.env.example` แล้วเปลี่ยนชื่อเป็น `.env`
   - **คำเตือนความปลอดภัย:** ห้าม Commit ไฟล์ `.env` หรือไฟล์ความลับใดๆ ขึ้น GitHub เด็ดขาด
   - ตั้งค่า `DATABASE_URL` ให้ตรงกับ PostgreSQL ของคุณ
4. ตรวจสอบความถูกต้องของ Prisma Schema: `npx prisma validate`
5. ตรวจสอบการเชื่อมต่อโดยใช้ `npx prisma migrate status`
6. เริ่มต้นรัน Backend Server: `npm run dev`

### 2. การตั้งค่าระบบหน้าบ้าน (Frontend Setup)
1. เปิด Terminal ใหม่แล้วเข้าไปยังโฟลเดอร์ `client`: `cd client`
2. ติดตั้ง Dependencies (รวมถึง Bootstrap): `npm install`
3. เริ่มต้นรัน Frontend Client: `npm run dev`

### การรันชุดทดสอบ (Running Tests)
- รันชุดทดสอบฝั่ง Backend: เข้าไปที่โฟลเดอร์ `server` แล้วรัน `npm run test`
- รันชุดทดสอบฝั่ง Frontend: เข้าไปที่โฟลเดอร์ `client` แล้วรัน `npm run test`