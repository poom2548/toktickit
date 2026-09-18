import { useState, useEffect, useRef } from "react";
import {
  Ticket,
  getTicketById,
  uploadAttachment,
  removeAttachment,
  downloadAttachment,
  PublicComment,
  getComments,
  postComment,
  markResolved
} from "./api";

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
  onBack: () => void;
}

export default function TicketDetailPage({ ticketId, onBack }: Props) {
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

  // Comments & resolved state
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [resolving, setResolving] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getTicketById(ticketId),
      getComments(ticketId)
    ])
      .then(([data, commentsData]) => {
        setTicket(data);
        setComments(commentsData);
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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.");
      return;
    }

    if ((ticket.attachments?.length || 0) >= 5) {
      setUploadError("Maximum of 5 attachments allowed.");
      return;
    }

    setUploading(true);
    try {
      const newAtt = await uploadAttachment(ticket.id, file);
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attachments: [...(prev.attachments || []), newAtt],
        };
      });
      setUploadSuccess(true);
      setFile(null);
      (document.querySelector('input[type="file"]') as HTMLInputElement).value = "";
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(attachmentId: number) {
    if (!window.confirm("Are you sure you want to remove this attachment?")) return;

    setRemovingId(attachmentId);
    setUploadSuccess(false);
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

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const comment = await postComment(ticketId, newComment);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (err: any) {
      alert(err.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  }

  async function handleMarkResolved() {
    setResolving(true);
    try {
      const res = await markResolved(ticketId);
      setTicket((prev) => prev ? { ...prev, problemAppearsResolved: res.problemAppearsResolved } : prev);
    } catch (err: any) {
      alert(err.message || "Failed to mark resolved");
    } finally {
      setResolving(false);
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
        <button className="btn-secondary ms-3" onClick={onBack}>Go Back</button>
      </div>
    );
  }

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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h4 mb-0" style={{ color: ZEN.primary }}>
            Ticket Details
          </h2>
          <button className="btn-secondary" onClick={onBack}>
            Back to List
          </button>
        </div>

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
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={ticket.status}
                readOnly
                style={{ backgroundColor: ZEN.primaryLight }}
              />
              {!ticket.problemAppearsResolved && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && ticket.status !== 'CANCELLED' && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleMarkResolved}
                  disabled={resolving}
                >
                  {resolving ? "Marking..." : "Resolve"}
                </button>
              )}
            </div>
            {ticket.problemAppearsResolved && (
              <small className="text-success mt-1 d-block">User indicated problem is resolved.</small>
            )}
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

        <h3 className="h5 mb-4" style={{ color: ZEN.primary }}>
          Public Comments
        </h3>
        
        <div className="mb-4">
          {comments.length === 0 ? (
            <p className="text-muted">No comments yet.</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {comments.map((c) => (
                <div key={c.id} className="card bg-light border-0">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <strong className="text-primary">{c.author.name} ({c.author.role})</strong>
                      <small className="text-muted">{new Date(c.createdAt).toLocaleString()}</small>
                    </div>
                    <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handlePostComment} className="mb-4">
          <div className="form-group mb-2">
            <textarea 
              className="form-control" 
              rows={3} 
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              disabled={postingComment}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={postingComment || !newComment.trim()}>
            {postingComment ? "Posting..." : "Post Comment"}
          </button>
        </form>

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
            className="btn-primary"
            disabled={uploading || !file}
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
                          className="btn-secondary btn-sm"
                          onClick={() => handleDownload(att.id, att.filename)}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
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
