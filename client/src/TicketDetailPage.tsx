import { useState, useEffect, useRef } from "react";
import {
  Ticket,
  Requester,
  getTicketById,
  uploadAttachment,
  removeAttachment,
  downloadAttachment,
} from "./api.js";

// ---------------------------------------------------------------------------
// Zen Green colour tokens
// ---------------------------------------------------------------------------
const ZEN = {
  primary: "#006B3C",
  primaryLight: "#e8f5ee",
  errorText: "#dc3545",
  successText: "#198754",
} as const;

interface Props {
  ticketId: number;
  requester: Requester;
  onBack: () => void;
}

export default function TicketDetailPage({ ticketId, requester, onBack }: Props) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Remove state
  const [removingId, setRemovingId] = useState<number | null>(null);

  // ── Requester change guard ────────────────────────────────────────────────
  const initialRequesterId = useRef(requester.id);
  useEffect(() => {
    if (requester.id !== initialRequesterId.current) {
      // User changed active requester mid-session; redirect to avoid stale/unauthorized data
      onBack();
    }
  }, [requester.id, onBack]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    getTicketById(ticketId)
      .then((data) => {
        setTicket(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.status === 404) setError("Ticket not found.");
        else if (err.status === 403) setError("You are not authorized to view this ticket.");
        else setError("Unable to load ticket details.");
        setLoading(false);
      });
  }, [ticketId]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !ticket) return;

    setUploadError(null);
    setUploadSuccess(false);

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPEG, PNG, WebP and PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5 MB limit.");
      return;
    }
    if ((ticket.attachments?.length || 0) >= 5) {
      setUploadError("A ticket may not have more than 5 active attachments.");
      return;
    }

    setUploading(true);
    try {
      const newAttachment = await uploadAttachment(ticketId, file);
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attachments: [newAttachment, ...(prev.attachments || [])],
        };
      });
      setFile(null);
      setUploadSuccess(true);
      // Auto-hide success message
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(attachmentId: number) {
    if (!confirm("Are you sure you want to remove this attachment?")) return;

    setRemovingId(attachmentId);
    setUploadError(null);
    try {
      await removeAttachment(attachmentId);
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attachments: prev.attachments?.filter((a) => a.id !== attachmentId),
        };
      });
    } catch (err: any) {
      setUploadError(err.message || "Failed to remove attachment");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleDownload(attachmentId: number, filename: string) {
    try {
      await downloadAttachment(attachmentId, filename);
    } catch (err: any) {
      alert(err.message || "Failed to download attachment");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: ZEN.primary }} role="status" />
        <p className="mt-3 text-muted">Loading ticket details…</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="alert alert-danger">
        {error || "An unknown error occurred."}
      </div>
    );
  }

  // Format date helper
  const createdStr = new Date(ticket.createdAt).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
      <div className="card-body p-4">
        <h2 className="h4 mb-4" style={{ color: ZEN.primary }}>
          Ticket Details
        </h2>

        {/* Read-only form layout */}
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Ticket No.</label>
            <input
              type="text"
              className="form-control"
              value={ticket.ticketNumber}
              readOnly
              style={{ backgroundColor: ZEN.primaryLight }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Created Date</label>
            <input
              type="text"
              className="form-control"
              value={createdStr}
              readOnly
              style={{ backgroundColor: ZEN.primaryLight }}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold">Status</label>
            <input
              type="text"
              className="form-control"
              value={ticket.status}
              readOnly
              style={{ backgroundColor: ZEN.primaryLight }}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Category</label>
            <input
              type="text"
              className="form-control"
              value={ticket.category?.name || "Unknown"}
              readOnly
              style={{ backgroundColor: ZEN.primaryLight }}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Priority</label>
            <input
              type="text"
              className="form-control"
              value={ticket.requestedPriority}
              readOnly
              style={{ backgroundColor: ZEN.primaryLight }}
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Summary</label>
            <input
              type="text"
              className="form-control"
              value={ticket.summary}
              readOnly
              style={{ backgroundColor: ZEN.primaryLight }}
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Description</label>
            <textarea
              className="form-control"
              rows={4}
              value={ticket.description}
              readOnly
              style={{ backgroundColor: ZEN.primaryLight }}
            />
          </div>
        </div>

        <hr className="my-5" />

        {/* Attachments Section */}
        <h3 className="h5 mb-4" style={{ color: ZEN.primary }}>
          Attachments
        </h3>

        {/* Upload Error / Success */}
        {uploadError && (
          <div className="alert alert-danger py-2" role="alert">
            {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div className="alert alert-success py-2" role="alert">
            Attachment uploaded successfully!
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="mb-4 d-flex gap-2 align-items-center flex-wrap">
          <input
            type="file"
            className="form-control w-auto flex-grow-1"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={uploading}
            data-testid="file-upload-input"
          />
          <button
            type="submit"
            className="btn text-white"
            style={{ backgroundColor: ZEN.primary }}
            disabled={!file || uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {/* Attachment List */}
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">Filename</th>
                <th scope="col" style={{ width: 120 }}>Size</th>
                <th scope="col" style={{ width: 150 }}>Uploaded</th>
                <th scope="col" style={{ width: 180 }} className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!ticket.attachments || ticket.attachments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    No attachments yet.
                  </td>
                </tr>
              ) : (
                ticket.attachments.map((att) => (
                  <tr key={att.id} data-testid={`attachment-row-${att.id}`}>
                    <td>
                      <span className="text-truncate d-inline-block" style={{ maxWidth: 250 }}>
                        {att.filename}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {(att.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="small text-muted">
                      {new Date(att.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleDownload(att.id, att.filename)}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemove(att.id)}
                          disabled={removingId === att.id}
                        >
                          {removingId === att.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
