import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// ลบ .todo ออก เพื่อเปิดให้เทสต์ทำงานจริงๆ
describe("GET /api/categories", () => {
  it("returns the four seeded categories in id order", async () => {
    // 1. จำลองการยิง GET request ไปที่เส้นทาง /api/categories
    const res = await request(app).get("/api/categories");
    
    // 2. คาดหวังว่าต้องได้ HTTP Status 200 (OK)
    expect(res.status).toBe(200);
    
    // 3. ตรวจสอบว่าเป็น Array และมีข้อมูล 4 ตัวตามที่ Seed ไว้
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);
    
    // 4. ตรวจสอบรายชื่อว่ามาเรียงตาม ID ถูกต้องไหม
    expect(res.body[0].name).toBe("Account and Access");
    expect(res.body[1].name).toBe("Hardware");
    expect(res.body[2].name).toBe("Software");
    expect(res.body[3].name).toBe("Network");
  });
});
