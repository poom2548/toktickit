import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import TicketDetailPage from "../../TicketDetailPage";
import React from "react";

const mockTicket = {
  id: 1,
  ticketNumber: "TKT-001",
  summary: "Test Summary",
  description: "Test Description",
  status: "IN_PROGRESS",
  requestedPriority: "Medium",
  categoryId: 1,
  relatedSystemId: 1,
  problemAppearsResolved: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: { id: 1, name: "Network" },
  relatedSystem: { id: 1, name: "VPN" },
  attachments: [],
};

const mockComments = [
  {
    id: "c1",
    content: "First comment",
    createdAt: new Date().toISOString(),
    author: { id: "a1", name: "Alice", role: "REQUESTER" },
  }
];

beforeEach(() => {
  global.fetch = vi.fn(async (url: any, options: any) => {
    if (url.includes("/comments") && options?.method === "POST") {
      const body = JSON.parse(options.body);
      return {
        ok: true,
        status: 201,
        json: async () => ({
          id: "c2",
          content: body.content,
          createdAt: new Date().toISOString(),
          author: { id: "a1", name: "Alice", role: "REQUESTER" }
        })
      };
    }
    if (url.includes("/comments")) {
      return { ok: true, status: 200, json: async () => ({ comments: mockComments }) };
    }
    if (url.includes("/resolved-flag")) {
      return { ok: true, status: 200, json: async () => ({ problemAppearsResolved: true }) };
    }
    if (url.includes("/tickets/1")) {
      return { ok: true, status: 200, json: async () => mockTicket };
    }
    return { ok: false, status: 404, json: async () => ({ error: "Not found" }) };
  }) as any;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TicketDetailPage (Requester)", () => {
  it("fetches ticket and comments on mount", async () => {
    render(<TicketDetailPage ticketId={1} onBack={() => {}} />);
    expect(screen.getByText(/Loading ticket details/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("TKT-001")).toBeInTheDocument();
    });
    
    expect(screen.getByText("First comment")).toBeInTheDocument();
    expect(screen.getByText(/Alice.*REQUESTER/)).toBeInTheDocument();
  });

  it("renders 'Resolve' button if not resolved and not closed/cancelled", async () => {
    render(<TicketDetailPage ticketId={1} onBack={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("TKT-001")).toBeInTheDocument();
    });
    
    const resolveBtn = screen.getByRole("button", { name: "Resolve" });
    expect(resolveBtn).toBeInTheDocument();
  });

  it("clicks 'Resolve' button and marks ticket as resolved", async () => {
    render(<TicketDetailPage ticketId={1} onBack={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("TKT-001")).toBeInTheDocument();
    });
    
    const resolveBtn = screen.getByRole("button", { name: "Resolve" });
    fireEvent.click(resolveBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/User indicated problem is resolved./i)).toBeInTheDocument();
    });
    
    expect(screen.queryByRole("button", { name: "Resolve" })).not.toBeInTheDocument();
  });

  it("posts a new comment", async () => {
    render(<TicketDetailPage ticketId={1} onBack={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("TKT-001")).toBeInTheDocument();
    });
    
    const input = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(input, { target: { value: "A new comment" } });
    
    const postBtn = screen.getByRole("button", { name: "Post Comment" });
    fireEvent.click(postBtn);
    
    await waitFor(() => {
      expect(screen.getByText("A new comment")).toBeInTheDocument();
    });
  });
});
