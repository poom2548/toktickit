import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App.js";

// เปลี่ยนมาใช้ globalThis แทน global เพื่อให้ TypeScript ไม่แจ้งเตือน
globalThis.fetch = vi.fn();

describe("App", () => {
  // ล้างค่าข้อมูลที่จำลองไว้ทุกครั้งก่อนเริ่มเทสต์ข้อใหม่
  beforeEach(() => {
    vi.resetAllMocks();
    // Seed a requester into localStorage so the App renders the dashboard
    // (not the DevRequesterSelector) — the dashboard is what these tests target.
    localStorage.setItem(
      "toktickit_requester",
      JSON.stringify({ id: 1, name: "Alice Johnson", email: "alice@example.com" })
    );
  });


  // WORKED EXAMPLE — provided for you.
  it("renders the TokTickIT heading", async () => {
    // จำลองการยิง API ตอนโหลดหน้าเว็บครั้งแรก (Issue 2)
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", service: "TokTickIT API" }),
    });

    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // Issue 4: Tests
  // ---------------------------------------------------------

  it("shows Online and the seeded categories on success", async () => {
    // 1. จำลองการยิง API ตอนโหลดหน้าเว็บ (Issue 2)
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", service: "TokTickIT API" }),
    });
    
    // 2. จำลองการดึงข้อมูลหมวดหมู่ (Issue 4) แบบสำเร็จ
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" }
      ],
    });

    render(<App />);

    // จำลองการคลิกปุ่ม Check System
    const button = screen.getByRole("button", { name: /Check System/i });
    fireEvent.click(button);

    // ตรวจสอบว่ามีข้อความ Online และมีชื่อหมวดหมู่แสดงขึ้นมาจริงๆ
    await waitFor(() => {
      expect(screen.getByText(/System is Online/i)).toBeInTheDocument();
      expect(screen.getByText("Account and Access")).toBeInTheDocument();
      expect(screen.getByText("Hardware")).toBeInTheDocument();
    });
  });

  it("shows an Offline error message when the API is unavailable", async () => {
    // 1. จำลองการยิง API ตอนโหลดหน้าเว็บ (Issue 2)
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", service: "TokTickIT API" }),
    });

    // 2. จำลองการดึงข้อมูลหมวดหมู่ (Issue 4) แบบล้มเหลว (Server Error)
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    render(<App />);

    // จำลองการคลิกปุ่ม Check System
    const button = screen.getByRole("button", { name: /Check System/i });
    fireEvent.click(button);

    // ตรวจสอบว่ามีข้อความแจ้งเตือน Error แสดงขึ้นมา
    await waitFor(() => {
      expect(screen.getByText(/Offline: Unable to load categories/i)).toBeInTheDocument();
    });
  });
});
