import { useState, useEffect, useRef, FormEvent } from "react";
import {
  Category,
  RelatedSystem,
  Priority,
  Ticket,
  ApiError,
  Requester,
  getRelatedSystems,
  createTicket,
  uploadAttachment,
} from "./api.js";


// ---------------------------------------------------------------------------
// Zen Green colour tokens (mirrors DevRequesterSelector)
// ---------------------------------------------------------------------------
const ZEN = {
  primary: "#006B3C",          // Primary Green (submit button)
  primaryLight: "#e8f5ee",     // Soft gray-green (read-only inputs)
  errorText: "#8b0000",        // Dark red (inline error messages)
  errorBorder: "#dc3545",      // Red asterisk / error border
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormState = "idle" | "submitting" | "success";

interface FormValues {
  categoryId: string;
  relatedSystemId: string;
  requestedPriority: Priority | "";
  summary: string;
  description: string;
}

interface FormErrors {
  categoryId?: string;
  relatedSystemId?: string;
  requestedPriority?: string;
  summary?: string;
  description?: string;
  _form?: string; // non-field level error (e.g. network failure)
}

interface Props {
  /** The currently authenticated requester (used for display + auth header). */
  requester: Requester;
  /** Available categories fetched by the parent (App.tsx already has them). */
  categories: Category[];
  /** Called when the user clicks Cancel or after a successful submission. */
  onDone: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_VALUES: FormValues = {
  categoryId: "",
  relatedSystemId: "",
  requestedPriority: "",
  summary: "",
  description: "",
};

/** Required-field label with a red asterisk. */
function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="form-label fw-semibold">
      {children}
      {/* aria-hidden hides the asterisk from screen readers — the field's
          required attribute already communicates the requirement. */}
      <span aria-hidden="true" style={{ color: ZEN.errorBorder, marginLeft: 2 }}>
        *
      </span>
    </label>
  );
}

/** Inline error message rendered below an invalid field. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mb-0 mt-1 small"
      style={{ color: ZEN.errorText }}
    >
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Attachment constants & helpers
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.pdf";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ATTACHMENTS = 5;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Returns a validation error message for a given file, or null when the file
 * is acceptable. Called before adding a file to the staged list.
 */
function validateFile(file: File, currentCount: number): string | null {
  if (currentCount >= MAX_ATTACHMENTS) {
    return `You may attach at most ${MAX_ATTACHMENTS} files per ticket.`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `"${file.name}" is not allowed. Only JPG, PNG, WEBP, and PDF files are accepted.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" exceeds the 5 MB size limit (${formatBytes(file.size)}).`;
  }
  return null;
}

/** File icon based on MIME type */
function fileIcon(mime: string): string {
  if (mime === "application/pdf") return "📄";
  return "🖼️";
}

// ---------------------------------------------------------------------------
// AttachmentSection sub-component
// ---------------------------------------------------------------------------

interface AttachmentSectionProps {
  stagedFiles: File[];
  attachmentError: string | null;
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
}

function AttachmentSection({
  stagedFiles,
  attachmentError,
  onAdd,
  onRemove,
  disabled,
}: AttachmentSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onAdd(e.target.files);
      // Reset input so the same file can be re-selected after removal
      e.target.value = "";
    }
  }

  return (
    <div className="mb-4">
      <label className="form-label fw-semibold">Attachments</label>

      {/* Drop zone / click-to-browse area */}
      <div
        style={{
          border: `2px dashed ${attachmentError ? "#dc3545" : "#adb5bd"}`,
          borderRadius: 8,
          padding: "16px",
          textAlign: "center",
          background: "#fafafa",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color 0.2s",
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Select files to attach"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            inputRef.current?.click();
          }
        }}
      >
        <span style={{ fontSize: 28 }}>📎</span>
        <p className="mb-1 mt-1 small fw-semibold" style={{ color: "#495057" }}>
          Click to browse files
        </p>
        <p className="mb-0 small text-muted">
          JPG, PNG, WEBP, PDF — max 5 MB each, up to {MAX_ATTACHMENTS} files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS}
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={disabled || stagedFiles.length >= MAX_ATTACHMENTS}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Inline validation error */}
      {attachmentError && (
        <p role="alert" className="mb-0 mt-1 small" style={{ color: "#8b0000" }}>
          {attachmentError}
        </p>
      )}

      {/* Staged file list */}
      {stagedFiles.length > 0 && (
        <ul className="list-group mt-2" style={{ borderRadius: 8 }}>
          {stagedFiles.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="list-group-item d-flex align-items-center gap-2 py-2 px-3"
              style={{ fontSize: 14 }}
            >
              <span>{fileIcon(file.type)}</span>
              <span
                className="flex-grow-1 text-truncate"
                style={{ maxWidth: "65%" }}
                title={file.name}
              >
                {file.name}
              </span>
              <span className="text-muted small ms-auto me-2" style={{ whiteSpace: "nowrap" }}>
                {formatBytes(file.size)}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                style={{ borderRadius: 6, padding: "2px 8px", lineHeight: 1.4 }}
                onClick={() => onRemove(idx)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
              >
                ✕ Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* File count indicator */}
      <div className="text-end mt-1">
        <small className="text-muted">
          {stagedFiles.length} / {MAX_ATTACHMENTS} files staged
        </small>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * CreateTicketForm — Issue 3
 *
 * Zen Green themed form that submits to POST /api/tickets.
 * Features:
 * - Red asterisks on every required field label
 * - Read-only requester field styled with soft gray-green background
 * - Submit button disabled + spinner while awaiting the API response
 * - Dark red inline error messages below invalid fields (client + server)
 */
export default function CreateTicketForm({ requester, categories: categoriesProp, onDone }: Props) {
  const [systems, setSystems] = useState<RelatedSystem[]>([]);
  const [systemsError, setSystemsError] = useState<string | null>(null);
  // Self-fetch categories if parent hasn't loaded them yet (e.g. "Check System" never clicked)
  const [localCategories, setLocalCategories] = useState<Category[]>(categoriesProp);

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formState, setFormState] = useState<FormState>("idle");
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  // Attachment staging state
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Use categories from prop when available, fall back to self-fetched list
  const categories = categoriesProp.length > 0 ? categoriesProp : localCategories;

  // Fetch related systems (always) and categories (only when prop is empty)
  useEffect(() => {
    getRelatedSystems()
      .then(setSystems)
      .catch(() => setSystemsError("Unable to load related systems. Is the backend running?"));

    if (categoriesProp.length === 0) {
      fetch("/api/categories")
        .then((r) => r.json())
        .then((data: Category[]) => setLocalCategories(data))
        .catch(() => {/* categories will stay empty, form shows no options */});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Client-side validation
  // ---------------------------------------------------------------------------
  function validate(vals: FormValues): FormErrors {
    const errs: FormErrors = {};

    if (!vals.categoryId) {
      errs.categoryId = "Category is required.";
    }
    if (!vals.relatedSystemId) {
      errs.relatedSystemId = "Related system is required.";
    }
    if (!vals.requestedPriority) {
      errs.requestedPriority = "Priority is required.";
    }
    if (!vals.summary.trim()) {
      errs.summary = "Summary is required.";
    } else if (vals.summary.length > 100) {
      errs.summary = "Summary must not exceed 100 characters.";
    }
    if (!vals.description.trim()) {
      errs.description = "Description is required.";
    } else if (vals.description.length > 1000) {
      errs.description = "Description must not exceed 1000 characters.";
    }

    return errs;
  }

  // ---------------------------------------------------------------------------
  // Attachment handlers
  // ---------------------------------------------------------------------------
  function handleAddFiles(fileList: FileList) {
    setAttachmentError(null);
    const toAdd: File[] = [];
    let firstError: string | null = null;

    for (const file of Array.from(fileList)) {
      const err = validateFile(file, stagedFiles.length + toAdd.length);
      if (err) {
        firstError = err;
        break; // Report the first violation and stop processing
      }
      toAdd.push(file);
    }

    if (firstError) setAttachmentError(firstError);
    if (toAdd.length > 0) setStagedFiles((prev) => [...prev, ...toAdd]);
  }

  function handleRemoveFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
    setAttachmentError(null);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear field error as the user edits
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // 1. Client-side validation
    const clientErrors = validate(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return; // Do NOT call the API
    }

    // 2. Create ticket
    setFormState("submitting");
    setErrors({});

    try {
      const ticket = await createTicket({
        categoryId: Number(values.categoryId),
        relatedSystemId: Number(values.relatedSystemId),
        requestedPriority: values.requestedPriority as Priority,
        summary: values.summary.trim(),
        description: values.description.trim(),
      });

      // 3. Upload staged attachments sequentially
      for (const file of stagedFiles) {
        try {
          await uploadAttachment(ticket.id, file);
        } catch {
          // Non-fatal: log and continue uploading remaining files.
          // The ticket has already been created successfully.
          console.warn(`Failed to upload attachment "${file.name}"`);
        }
      }

      setCreatedTicket(ticket);
      setFormState("success");
      setValues(EMPTY_VALUES);
      setStagedFiles([]);
      setAttachmentError(null);
    } catch (err) {
      setFormState("idle");
      if (err instanceof ApiError && err.status === 400) {
        // Map server field errors back to form
        const serverErrors: FormErrors = {};
        for (const detail of err.details) {
          serverErrors[detail.field as keyof FormErrors] = detail.message;
        }
        setErrors(serverErrors);
      } else {
        setErrors({ _form: "An unexpected error occurred. Please try again." });
      }
    }
  }

  const isSubmitting = formState === "submitting";

  // ---------------------------------------------------------------------------
  // Success banner
  // ---------------------------------------------------------------------------
  if (formState === "success" && createdTicket) {
    return (
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body p-4 text-center">
          <div style={{ fontSize: 48 }}>🎟️</div>
          <h2 className="h4 mt-2 fw-bold" style={{ color: ZEN.primary }}>
            Ticket Created!
          </h2>
          <p className="text-muted mb-1">Your ticket number is:</p>
          <p
            className="fw-bold fs-3"
            style={{ color: ZEN.primary, letterSpacing: 2 }}
          >
            {createdTicket.ticketNumber}
          </p>
          <p className="text-muted small mb-3">{createdTicket.summary}</p>
          <button
            type="button"
            className="btn text-white fw-semibold me-2"
            style={{ background: ZEN.primary, borderRadius: 8 }}
            onClick={() => {
              setFormState("idle");
              setCreatedTicket(null);
            }}
          >
            Create Another Ticket
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            style={{ borderRadius: 8 }}
            onClick={onDone}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
      {/* Header */}
      <div
        className="card-header border-0 text-white px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${ZEN.primary} 0%, #004d2b 100%)`,
          borderRadius: "12px 12px 0 0",
        }}
      >
        <h2 className="h5 mb-0 fw-bold">🎟️ Create New Ticket</h2>
      </div>

      <div className="card-body px-4 py-4">
        {/* Systems load error */}
        {systemsError && (
          <div className="alert alert-danger" role="alert">
            {systemsError}
          </div>
        )}

        {/* Non-field form error */}
        {errors._form && (
          <div className="alert alert-danger" role="alert">
            {errors._form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Requester (read-only) ── */}
          <div className="mb-3">
            <label htmlFor="requester" className="form-label fw-semibold">
              Requester
            </label>
            <input
              id="requester"
              type="text"
              className="form-control"
              value={`${requester.name} (${requester.email})`}
              readOnly
              tabIndex={-1}
              style={{ background: ZEN.primaryLight, cursor: "default" }}
              aria-label="Requester (read-only)"
            />
          </div>

          {/* ── Category ── */}
          <div className="mb-3">
            <RequiredLabel htmlFor="categoryId">Category</RequiredLabel>
            <select
              id="categoryId"
              name="categoryId"
              className="form-select"
              value={values.categoryId}
              onChange={handleChange}
              required
              aria-describedby={errors.categoryId ? "categoryId-error" : undefined}
              style={errors.categoryId ? { borderColor: ZEN.errorBorder } : undefined}
            >
              <option value="">— Select a category —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.categoryId} />
          </div>

          {/* ── Related System ── */}
          <div className="mb-3">
            <RequiredLabel htmlFor="relatedSystemId">Related System</RequiredLabel>
            <select
              id="relatedSystemId"
              name="relatedSystemId"
              className="form-select"
              value={values.relatedSystemId}
              onChange={handleChange}
              required
              aria-describedby={errors.relatedSystemId ? "relatedSystemId-error" : undefined}
              style={errors.relatedSystemId ? { borderColor: ZEN.errorBorder } : undefined}
            >
              <option value="">— Select a system —</option>
              {systems.map((sys) => (
                <option key={sys.id} value={sys.id}>
                  {sys.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.relatedSystemId} />
          </div>

          {/* ── Priority ── */}
          <div className="mb-3">
            <RequiredLabel htmlFor="requestedPriority">Priority</RequiredLabel>
            <select
              id="requestedPriority"
              name="requestedPriority"
              className="form-select"
              value={values.requestedPriority}
              onChange={handleChange}
              required
              aria-describedby={errors.requestedPriority ? "requestedPriority-error" : undefined}
              style={errors.requestedPriority ? { borderColor: ZEN.errorBorder } : undefined}
            >
              <option value="">— Select a priority —</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <FieldError message={errors.requestedPriority} />
          </div>

          {/* ── Summary ── */}
          <div className="mb-3">
            <RequiredLabel htmlFor="summary">Summary</RequiredLabel>
            <input
              id="summary"
              name="summary"
              type="text"
              className="form-control"
              value={values.summary}
              onChange={handleChange}
              maxLength={100}
              required
              placeholder="Brief description of the issue (max 100 characters)"
              aria-describedby={errors.summary ? "summary-error" : undefined}
              style={errors.summary ? { borderColor: ZEN.errorBorder } : undefined}
            />
            <div className="d-flex justify-content-between">
              <FieldError message={errors.summary} />
              <small className="text-muted ms-auto">
                {values.summary.length}/100
              </small>
            </div>
          </div>

          {/* ── Description ── */}
          <div className="mb-4">
            <RequiredLabel htmlFor="description">Description</RequiredLabel>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={values.description}
              onChange={handleChange}
              maxLength={1000}
              required
              rows={5}
              placeholder="Full details of the issue (max 1000 characters)"
              aria-describedby={errors.description ? "description-error" : undefined}
              style={errors.description ? { borderColor: ZEN.errorBorder } : undefined}
            />
            <div className="d-flex justify-content-between">
              <FieldError message={errors.description} />
              <small className="text-muted ms-auto">
                {values.description.length}/1000
              </small>
            </div>
          </div>

          {/* ── Attachments ── */}
          <AttachmentSection
            stagedFiles={stagedFiles}
            attachmentError={attachmentError}
            onAdd={handleAddFiles}
            onRemove={handleRemoveFile}
            disabled={isSubmitting}
          />

          {/* ── Actions ── */}
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn text-white fw-semibold px-4"
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? "#4a9e73" : ZEN.primary,
                border: "none",
                borderRadius: 8,
                minWidth: 140,
                transition: "background 0.2s",
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Submitting…
                </>
              ) : (
                "Submit Ticket"
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              style={{ borderRadius: 8 }}
              disabled={isSubmitting}
              onClick={onDone}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
