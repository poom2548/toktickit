import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketDetailPage from "../../src/TicketDetailPage.js";
import * as api from "../../src/api.js";

// Mock the API client
vi.mock("../../src/api.js", () => ({
  getTicketById: vi.fn(),
  uploadAttachment: vi.fn(),
  removeAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
}));

const mockRequester = { id: 1, name: "Test User", email: "test@example.com" };
const mockTicket = {
  id: 1,
  ticketNumber: "TKT-0001",
  summary: "Test Summary",
  description: "Test Description",
  status: "New",
  requestedPriority: "Low",
  categoryId: 1,
  relatedSystemId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: { id: 1, name: "Hardware" },
  relatedSystem: { id: 1, name: "Network" },
  attachments: [
    { id: 1, ticketId: 1, filename: "test.pdf", mimetype: "application/pdf", size: 1024, createdAt: new Date().toISOString() }
  ],
};

const mockOnBack = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (api.getTicketById as any).mockResolvedValue(mockTicket);
});

describe("TicketDetailPage", () => {
  it("LD1 & LD2 — Shows spinner while loading, then displays ticket details", async () => {
    // Delay resolution to see spinner
    (api.getTicketById as any).mockImplementation(() => new Promise(res => setTimeout(() => res(mockTicket), 10)));
    
    render(<TicketDetailPage ticketId={1} requester={mockRequester} onBack={mockOnBack} />);
    
    // LD1: Spinner should be visible initially
    expect(screen.getByText(/Loading ticket details/i)).toBeInTheDocument();
    
    // LD2: Spinner disappears and data shows
    await waitFor(() => {
      expect(screen.queryByText(/Loading ticket details/i)).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("TKT-0001")).toBeInTheDocument();
    });
  });

  it("L1, L2, L3 — All inputs are readonly, styled correctly, with no submit button", async () => {
    render(<TicketDetailPage ticketId={1} requester={mockRequester} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByDisplayValue("TKT-0001")).toBeInTheDocument());

    // L1: Inputs have readOnly attribute
    const inputs = screen.getAllByRole("textbox");
    inputs.forEach(input => {
      expect(input).toHaveAttribute("readonly");
    });

    // L3: No "Submit" button for the form details
    expect(screen.queryByRole("button", { name: /Submit/i })).not.toBeInTheDocument();
  });

  it("A1 — Upload valid file updates the attachment list", async () => {
    render(<TicketDetailPage ticketId={1} requester={mockRequester} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText("test.pdf")).toBeInTheDocument());

    const newAttachment = { 
      id: 2, ticketId: 1, filename: "new.png", mimetype: "image/png", size: 2048, createdAt: new Date().toISOString() 
    };
    (api.uploadAttachment as any).mockResolvedValue(newAttachment);

    const file = new File(["hello"], "new.png", { type: "image/png" });
    const fileInput = screen.getByTestId("file-upload-input");
    const uploadButton = screen.getByRole("button", { name: "Upload" });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(api.uploadAttachment).toHaveBeenCalled();
      expect(screen.getByText("new.png")).toBeInTheDocument();
      expect(screen.getByText(/Attachment uploaded successfully/i)).toBeInTheDocument();
    });
  });

  it("A2 — Rejects file exceeding 5MB client-side", async () => {
    render(<TicketDetailPage ticketId={1} requester={mockRequester} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText("test.pdf")).toBeInTheDocument());

    // 6MB file
    const file = new File([new ArrayBuffer(6 * 1024 * 1024)], "large.pdf", { type: "application/pdf" });
    const fileInput = screen.getByTestId("file-upload-input");
    const uploadButton = screen.getByRole("button", { name: "Upload" });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/File size exceeds 5 MB limit/i)).toBeInTheDocument();
      expect(api.uploadAttachment).not.toHaveBeenCalled();
    });
  });

  it("A3 — Rejects invalid file type client-side", async () => {
    render(<TicketDetailPage ticketId={1} requester={mockRequester} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText("test.pdf")).toBeInTheDocument());

    const file = new File(["content"], "test.gif", { type: "image/gif" });
    const fileInput = screen.getByTestId("file-upload-input");
    const uploadButton = screen.getByRole("button", { name: "Upload" });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/Only JPEG, PNG, WebP and PDF files are allowed/i)).toBeInTheDocument();
      expect(api.uploadAttachment).not.toHaveBeenCalled();
    });
  });

  it("S1, S2 — Soft-remove flow", async () => {
    // Auto-confirm window.confirm
    window.confirm = vi.fn(() => true);
    (api.removeAttachment as any).mockResolvedValue();

    render(<TicketDetailPage ticketId={1} requester={mockRequester} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText("test.pdf")).toBeInTheDocument());

    const removeButton = screen.getByRole("button", { name: "Remove" });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(api.removeAttachment).toHaveBeenCalledWith(1);
      expect(screen.queryByText("test.pdf")).not.toBeInTheDocument();
      expect(screen.getByText(/No attachments yet/i)).toBeInTheDocument();
    });
  });

  it("G1 — Redirects if requester changes", async () => {
    const { rerender } = render(<TicketDetailPage ticketId={1} requester={mockRequester} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByDisplayValue("TKT-0001")).toBeInTheDocument());

    // Rerender with a different requester
    const newRequester = { id: 2, name: "Other User", email: "other@example.com" };
    rerender(<TicketDetailPage ticketId={1} requester={newRequester} onBack={mockOnBack} />);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it("E1 — 403 shows not authorized alert", async () => {
    (api.getTicketById as any).mockRejectedValue({ status: 403 });
    render(<TicketDetailPage ticketId={1} requester={mockRequester} onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText(/You are not authorized to view this ticket/i)).toBeInTheDocument();
    });
  });

  it("E2 — 404 shows not found alert", async () => {
    (api.getTicketById as any).mockRejectedValue({ status: 404 });
    render(<TicketDetailPage ticketId={1} requester={mockRequester} onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText(/Ticket not found/i)).toBeInTheDocument();
    });
  });
});
