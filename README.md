# TokTickIT 
## วิธีการตั้งค่าและรันโปรเจกต์
1. เข้าไปที่โฟลเดอร์ client และ server แล้วรัน `npm install`
2. สร้างไฟล์ `.env` ในโฟลเดอร์ server และใส่รหัสผ่านเชื่อมต่อ PostgreSQL
3. รันคำสั่ง `npx prisma db push` ในโฟลเดอร์ server เพื่อเตรียมฐานข้อมูล
4. รันคำสั่ง `npm run dev` เพื่อเปิดใช้งานระบบ