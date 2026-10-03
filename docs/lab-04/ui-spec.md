# Lab 4 UI Specification

## 1. Design System & Zen Green Tokens
The Lab 4 UI extends the existing Zen Green design language from Lab 3.
- **Tokens in Use:** `#006B3C` (Primary Green), `#0B7A46` (Secondary/Hover), `#F5F7F6` (Background), `#FFFFFF` (Cards), `#EAF6EF` (Pale Green/Highlight).
- **Private vs Shared Content:** Internal Notes and IT Staff-only components must be visually distinct using the `bg-amber-50 border-amber-300 text-amber-900` warning palette and a lock icon, preventing confusion with shared Public Comments and Actions.
- **Editable vs Read-Only:** Editable fields must have a distinct border (`border-gray-300`), white background, and visible focus rings (`focus:ring-2 focus:ring-[#006B3C]`). Read-only fields use a muted background (`bg-gray-50`) and lack borders.
- **Non-Color Status Cues:** All badges indicating Ticket Status, Priority, or Follow-up must include a semantic text label or recognizable icon alongside the color to ensure accessibility for color-blind users.

## 2. Screen Inventory

### Screen 1: IT Staff Dashboard (and Administrator)
*   **Layout (1280px):** Multi-column grid. Metric cards across the top. Below, a two-column layout: "Recently Updated Tickets" on the left (60%), "Quick Actions" on the right (40%).
*   **Layout (768px):** Metric cards wrap to a 2x2 grid. Main sections stack vertically.
*   **Layout (360px):** Single column. Metric cards stack vertically. Lists convert to stacked cards. No horizontal scroll.
*   **Elements:**
    *   **Metric Cards:** "Unassigned", "My Owned", "By Status", "By IT Priority". Administrators see an additional "User Accounts" card. Each card must act as a clickable drill-down link to the filtered queue.
    *   **Recently Updated List:** A capped list (e.g., top 5) of tickets. Includes Title, Status, Priority, and Updated time.
    *   **Quick Actions:** Buttons to "Create Ticket", "Search Tickets", "My Queue".
*   **States:** Loading (skeletons), Empty (zero state messaging), Error/Safe-Failure (banner with retry).

### Screen 2: Requester Dashboard
*   **Layout:** Similar responsive breakpoints to the IT Staff Dashboard.
*   **Elements:**
    *   **Metric Cards:** "My Open Tickets", "Waiting for Me", "Recently Resolved". Clicks drill down to the filtered "My Tickets" list.
    *   **My Recent Tickets:** A capped list of their own tickets.
    *   **Quick Actions:** "Create Ticket", "View All My Tickets".
*   **Role Behavior:** Accessing the IT Staff Dashboard returns a 403 Forbidden state with a safe, polite message and a link back to their own dashboard.

### Screen 3: Ticket Detail - Actions Taken Area
*   **Layout (1280px/768px):** Rendered as a Data Table below the ticket description.
*   **Layout (360px):** Table transforms into stacked mobile cards.
*   **Elements:**
    *   **Columns/Fields:** Date/Time, Description, Result, Performed By (read-only), Follow-Up (badge + note), Attachment Notes.
    *   **Create Mode (Staff/Admin):** Form appears inline or in a modal. Date defaults to now. "Follow-up Note" dynamically appears/becomes required when the "Follow-up Required" toggle is ON. Submit/Cancel buttons.
    *   **View/Edit Mode (Staff/Admin):** Clicking an action switches it to edit mode.
    *   **Read-Only Mode (Requester):** Requesters see the list of Actions on their ticket. No "Create" or "Edit" buttons are rendered.
*   **States:**
    *   **Loading:** Table skeletons.
    *   **Empty:** "No actions have been recorded yet." message.
    *   **Pending (Submit):** Submit button disables, shows spinner. Form data is preserved if submission fails.
    *   **Conflict (409):** A prominent banner appears above the edit form: "This action was updated by someone else. [Reload]". The user's typed text remains in the form fields.

### Screen 4: Ticket Status Controls
*   **Behavior:** The UI fetches `allowed-transitions` from the API. The transition dropdown/buttons render *only* the permitted options. The UI does not hardcode the transition matrix.
*   **Feedback:** Upon successful transition, the Ticket summary status badge refreshes immediately. If a 409 conflict or resolution gate failure occurs, an inline safe error banner explains the issue.
*   **Owner Assignment:** The dropdown lists only *active* IT Staff/Admin users.
*   **Requester Indication:** Requesters see a "Mark as appears resolved" button. Staff see a banner indicating "Requester marked this as resolved" if the flag is true.

### Screen 5: Navigation
*   **Role Behavior:** Navigation renders "Dashboard" pointing to the correct role-specific dashboard.
*   **Active Page Indication:** The active navigation item must have a distinct visual style (e.g., darker background, bold text, left border) and the `aria-current="page"` attribute.

## 3. Keyboard, Focus, and ARIA Rules
- All interactive elements (links, buttons, form fields) must be reachable via the `Tab` key.
- The visual focus ring (`focus:outline-none focus:ring-2 focus:ring-[#006B3C] focus:ring-offset-2`) must be clearly visible on all interactive elements.
- Form validation messages must be placed immediately adjacent to the input field and linked using `aria-describedby` or `aria-live="polite"` so screen readers announce them.
- If modals/dialogs are used (e.g., for creating an Action), they must trap focus within the modal while open, allow closing via the `Esc` key, and restore focus to the triggering element upon closing.

## 4. Visual and Accessibility Checklist

- [ ] **Design Consistency:** Zen Green tokens are applied correctly. No leftover/duplicate UI from earlier labs.
- [ ] **Dashboards:** Loading, empty, and safe-error states render correctly. Metric cards link to correct drill-down views.
- [ ] **Actions Taken:** Table transforms to cards on mobile (360px). Follow-up note field conditionally appears.
- [ ] **Form States:** Editable fields are distinct from read-only. Form data is preserved on recoverable failures (e.g., validation error).
- [ ] **Validation Placement:** Errors appear adjacent to fields and are announced to screen readers.
- [ ] **Keyboard Focus:** Focus rings are visible on all interactive elements. Dialogs trap and restore focus.
- [ ] **Layout (360/768/1280):** No clipped text, overlapping controls, or horizontal page scroll at any breakpoint.
- [ ] **Non-Color Cues:** Status, priority, follow-up, and private vs. shared content convey meaning via icons or text, not color alone.
