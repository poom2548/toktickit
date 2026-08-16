import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// 1. เพิ่ม Mocking ฐานข้อมูลตรงนี้ตามที่เพื่อนรีวิวมา
vi.mock("../../src/prisma.js", () => {
  return {
    getPrisma: vi.fn().mockReturnValue({
      category: {
        findMany: vi.fn().mockResolvedValue([
          { id: 1, name: "Account and Access" },
          { id: 2, name: "Hardware" },
          { id: 3, name: "Software" },
          { id: 4, name: "Network" },
        ]),
      },
    }),
  };
});

describe("GET /api/categories", () => {
  it("returns the four seeded categories in id order", async () => {
    // 2. จำลองการยิง GET request ไปที่เส้นทาง /api/categories
    const res = await request(app).get("/api/categories");
    
    // 3. คาดหวังว่าต้องได้ HTTP Status 200 (OK)
    expect(res.status).toBe(200);
    
    // 4. ตรวจสอบว่าเป็น Array และมีข้อมูล 4 ตัวตามที่ Seed (Mock) ไว้
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);
    
    // 5. ตรวจสอบรายชื่อว่ามาเรียงตาม ID ถูกต้องไหม
    expect(res.body[0].name).toBe("Account and Access");
    expect(res.body[1].name).toBe("Hardware");
    expect(res.body[2].name).toBe("Software");
    expect(res.body[3].name).toBe("Network");
  });
});
