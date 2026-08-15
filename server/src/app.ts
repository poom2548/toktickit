import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";

// ตรงนี้เราใช้ "Named Export" แบบเดียว เพื่อไม่ให้เกิดอาการ Mismatch
export const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Issue 2 — API health check
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "TokTickIT API"
  });
});

// ---------------------------------------------------------------------------
// Issue 4 — Category list
// ---------------------------------------------------------------------------
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    
    // ดึงข้อมูล ID และ Name จากตาราง Category
    const categories = await prisma.category.findMany({
      select: { 
        id: true, 
        name: true 
      },
      orderBy: { 
        id: 'asc' // เรียงลำดับตาม ID เสมอ
      },
    });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

