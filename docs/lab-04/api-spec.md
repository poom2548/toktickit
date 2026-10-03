# Lab 4 API Specification

## 1. Concurrency, Idempotency, and Safe Errors
- **Optimistic Concurrency:** Endpoints that mutate existing records (e.g., updating an Action Taken or changing a Ticket's status) require the current `version` token in the request body. A mismatch results in a `409 Conflict`.
- **Idempotency:** Creation endpoints support an optional `Idempotency-Key` header. The server will de-duplicate requests with the same key within a specific timeframe to prevent duplicate records from double-clicks or network retries.
- **Safe Error Envelope:** All errors return a standardized JSON envelope. Stack traces, SQL errors, or deep server internals are never exposed.
  ```json
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "The provided data is invalid.",
      "fields": {
        "followUpNote": "Required when follow-up is needed."
      }
    }
  }
  ```
  For conflicts:
  ```json
  {
    "error": {
      "code": "CONFLICT",
      "message": "The record has been modified by another user. Please reload and try again.",
      "currentVersion": 3
    }
  }
  ```

## 2. Actions Taken Endpoints

### `GET /api/tickets/:ticketId/actions-taken`
- **Auth required:** Yes (Requester for own Ticket, IT Staff, Admin).
- **Success (200):** Returns a list of Actions Taken in stable order (actionAt ASC, createdAt ASC, id ASC).
  ```json
  {
    "actions": [
      {
        "id": "cuid...",
        "actionAt": "2026-10-03T10:00:00Z",
        "description": "Investigated the network issue.",
        "result": "Restarted the router.",
        "performedBy": { "id": "...", "name": "IT Staff Member" },
        "followUpRequired": false,
        "followUpNote": null,
        "attachmentNotes": "See network_logs.txt",
        "version": 1,
        "createdAt": "2026-10-03T10:05:00Z"
      }
    ]
  }
  ```
- **Errors:** 401 (Unauthenticated), 403 (Requester accessing foreign ticket), 404 (Ticket not found).

### `POST /api/tickets/:ticketId/actions-taken`
- **Auth required:** Yes (IT Staff, Admin).
- **Headers:** `Idempotency-Key` (optional string).
- **Request body:**
  ```json
  {
    "actionAt": "2026-10-03T10:00:00Z",
    "description": "Investigated the network issue.",
    "result": "Restarted the router.",
    "followUpRequired": true,
    "followUpNote": "Check again in 2 hours.",
    "attachmentNotes": null
  }
  ```
  *(Note: `performedBy` is populated automatically from the session. Any `performedBy` in the payload is ignored.)*
- **Success (201):** Returns the created Action Taken.
- **Errors:** 400/422 (Validation failed), 401 (Unauthenticated), 403 (Requester attempt), 404 (Ticket not found), 409 (Ticket is CLOSED or CANCELLED).

### `PATCH /api/tickets/:ticketId/actions-taken/:actionId`
- **Auth required:** Yes (IT Staff, Admin).
- **Request body:** Requires `version` and the fields to update.
  ```json
  {
    "version": 1,
    "description": "Investigated the network issue extensively.",
    "result": "Restarted the router and updated firmware."
  }
  ```
- **Success (200):** Returns the updated Action Taken with `version` incremented.
- **Errors:** 400/422 (Validation failed), 401 (Unauthenticated), 403 (Requester attempt), 404 (Action/Ticket not found), 409 (Stale version).

## 3. Ticket Workflow Endpoints

### `POST /api/tickets/:ticketId/status` (or `PATCH /api/tickets/:ticketId/status`)
- **Auth required:** Yes (IT Staff, Admin, or Requester for permitted cancelation of own ticket).
- **Request body:** Requires `version` and new `status`.
  ```json
  {
    "version": 2,
    "status": "RESOLVED"
  }
  ```
- **Success (200):** Returns the updated Ticket summary.
- **Errors:** 401, 403 (Forbidden role), 404, 409 (Stale version), 422 (Invalid transition or fails resolution gate).

### `GET /api/tickets/:ticketId/allowed-transitions`
- **Auth required:** Yes (Requester for own Ticket, IT Staff, Admin).
- **Success (200):** Returns the transitions allowed for the current user and the current Ticket status.
  ```json
  {
    "allowedTransitions": ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"]
  }
  ```

### `POST /api/tickets/:ticketId/requester-resolved-indication` (or `PATCH`)
- **Auth required:** Yes (Requester for own Ticket).
- **Request body:**
  ```json
  {
    "problemAppearsResolved": true
  }
  ```
- **Success (200):** Returns updated Ticket summary. Does not change the status enum.
- **Errors:** 401, 403, 404.

## 4. Dashboard Endpoints

### `GET /api/dashboard/requester`
- **Auth required:** Yes (Requester).
- **Success (200):**
  ```json
  {
    "metrics": {
      "openTickets": {
        "label": "My Open Tickets",
        "value": 3,
        "drillDown": "/my-tickets?status=open"
      },
      "waitingForMe": {
        "label": "Waiting for Me",
        "value": 1,
        "drillDown": "/my-tickets?status=waiting"
      },
      "recentlyResolved": {
        "label": "Recently Resolved (Last 7 Days)",
        "value": 2,
        "drillDown": "/my-tickets?status=resolved"
      }
    },
    "recentlyUpdated": [
      {
        "id": "123",
        "ticketNumber": "TKT-001",
        "title": "Cannot access VPN",
        "status": "OPEN",
        "priority": "MEDIUM",
        "updatedAt": "2026-10-03T09:00:00Z"
      }
    ]
  }
  ```
- **Errors:** 401 (Unauthenticated), 403 (Staff/Admin attempt).

### `GET /api/dashboard/staff`
- **Auth required:** Yes (IT Staff, Admin).
- **Success (200):**
  ```json
  {
    "metrics": {
      "unassigned": {
        "label": "Unassigned",
        "value": 5,
        "drillDown": "/staff/queue?filter=unassigned"
      },
      "myOwned": {
        "label": "My Owned",
        "value": 4,
        "drillDown": "/staff/queue?filter=mine"
      },
      "statusCounts": {
        "label": "By Status",
        "values": { "NEW": 2, "OPEN": 5, "IN_PROGRESS": 3, "WAITING_FOR_REQUESTER": 1 },
        "drillDownBase": "/staff/queue?status="
      },
      "priorityCounts": {
        "label": "By IT Priority",
        "values": { "CRITICAL": 1, "HIGH": 2, "MEDIUM": 5, "LOW": 3 },
        "drillDownBase": "/staff/queue?priority="
      }
    },
    "userCounts": {
       "label": "User Accounts (Admin Only)",
       "active": 20,
       "inactive": 2
    },
    "recentlyUpdated": [
       // Capped list of tickets
    ]
  }
  ```
- **Errors:** 401 (Unauthenticated), 403 (Requester attempt).

## 5. System Endpoints
### `GET /api/health`
- **Auth required:** No.
- **Success (200):**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-03T10:00:00Z"
  }
  ```

## 6. Preserved Lab 2-3 Endpoints
The following endpoints from previous labs must continue to function exactly as specified:
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/change-password`
- `POST /tickets`
- `GET /tickets`
- `GET /tickets/:id`
- `POST /tickets/:id/attachments`
- `GET /tickets/:id/attachments/:attachmentId`
- `POST /tickets/:id/comments`
- `GET /tickets/:id/comments`
- `POST /tickets/:id/notes`
- `GET /tickets/:id/notes`
- `GET /staff/tickets`
- `GET /staff/tickets/:id`
- `PATCH /staff/tickets/:id/owner`
- `PATCH /staff/tickets/:id/priority`
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `PATCH /admin/users/:id/password`
