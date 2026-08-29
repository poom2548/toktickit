import { useState, useEffect, FormEvent } from "react";
import {
  Category,
  RelatedSystem,
  Priority,
  Ticket,
  ApiError,
  Requester,
  getRelatedSystems,
  createTicket,
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

    // 2. Call API
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

      setCreatedTicket(ticket);
      setFormState("success");
      setValues(EMPTY_VALUES);
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
