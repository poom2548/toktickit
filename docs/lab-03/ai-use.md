# Lab 3 — AI Use Documentation

## LLM Used

| Field | Value |
|---|---|
| **Name** | Google Gemini (via Antigravity IDE) |
| **Model** | Gemini 3.1 Pro (High) |
| **Access Period** | September 2026 |
| **Role** | Specification agent (Issue #1) and coding/debugging agent (Issues #2–#9) |

---

## Selected Key Prompts (6–10)

### Prompt 1 — Specification Documents (Issue #1)

**Context:** Transforming the Lab 3 handout into engineering specification documents.

**Prompt:**
> "I want to build all documents in Issue #1 based on this implementation_plan_lab3.md. Please write specification.md, ui-spec.md, api-spec.md, and tests.md in Thai language."

**Output:** Complete specification files with numbered FRs, BRs, authorization matrix, acceptance criteria in Given/When/Then format, and test plan structure.

**What I changed:** Reviewed and tightened the status transition matrix, added missing edge cases for the ownership guard (403 vs 404).

---

### Prompt 2 — Database Evolution (Issue #2)

**Context:** Evolving Lab 2 Prisma schema to support users, authentication, and roles without losing existing data.

**Prompt:**
> "Please write a detailed prompt for Gemini to execute Issue #2 based on this implementation_plan_lab3.md. Prompt in English."

**Output:** Step-by-step guide covering User model additions, migration from Lab 2 requester records, idempotent seed with bcrypt-hashed passwords.

**What I changed:** Kept the `upsert` seed pattern the AI recommended — it prevents duplicates on repeated runs.

---

### Prompt 3 — Fixing the Infinite React Re-Render Loop (Issue #3)

**Context:** After implementing auth, Playwright tests showed "element was detached from the DOM" in a continuous loop.

**Prompt:**
> "I accidentally stopped the Gemini process. Please write a prompt for Gemini to solve this Playwright test error: [pasted full error log]"

**Output:** Identified the root cause — `refreshUser` in `AuthContext` not wrapped in `useCallback([])` caused a new function reference each render, triggering the mount `useEffect` infinitely. Provided exact code fixes for `AuthContext`, `ProtectedRoute`, and `LoginPage`.

**What I learned:** Always provide the complete error log, not just the summary. The specific DOM detach pattern pointed directly to the re-render loop.

---

### Prompt 4 — IT Staff Queue Responsive Layout (Issue #5)

**Context:** Building a queue that shows a table on desktop and card list on mobile.

**Prompt:**
> "Please write a detailed prompt for Gemini to execute Issue #5 based on this implementation_plan_lab3.md. Prompt in English."

**Output:** Dual-layout component with CSS media queries, the strict mode `.first()` fix, and complete pagination implementation.

**What I learned:** Both layouts were rendering simultaneously — CSS `display: none` at the right breakpoint was the fix.

---

### Prompt 5 — Playwright Test Debugging — Wrong Ticket IDs (Issues #5–#6)

**Context:** After login was fixed, 7 tests still failed because fallback ticket IDs `|| 1` and `|| 2` don't exist in a UUID database.

**Prompt:**
> "Now I got 4 errors, 4 passed. Please write prompt for Gemini to solve these problems: [pasted error output]"

**Output:** Identified 3 root causes: numeric fallback IDs, element ID mismatches, and `Update Status` button disabled due to stale ticket state from previous run. Recommended `globalSetup.ts` for test isolation.

**What I learned:** E2E tests must be designed for repeatability — mutating tests need a reset step.

---

### Prompt 6 — Admin Safety Guards (Issue #7)

**Context:** Implementing self-deactivation prevention and last-admin protection.

**Prompt:**
> "Please write a detailed prompt for Gemini to execute Issue #7 based on this implementation_plan_lab3.md. Prompt in English."

**Output:** Self-deactivation guard compares `targetId === requesterId` → 403. Last-admin guard counts active admins before the change — if `activeAdminCount <= 1` → 409. UI disables checkbox when editing self.

**What I learned:** The two guards have different HTTP status codes (403 vs 409) for different conceptual reasons — policy violation vs system state conflict.

---

### Prompt 7 — Screenshot Bug Detection (Issue #8)

**Context:** After taking screenshots, I uploaded them for review.

**Prompt:**
> "These are screenshot pictures in artifacts/lab-03. I think they have mistakes. Please check if this conflicts with the requirements in Lab_3_sheet.pdf and implementation_plan_lab3.md."

**Output:** Identified 4 bugs: `/tickets` Vite proxy conflict, malformed ticket number, wrong admin credentials in E2E tests, and all buttons missing Zen Green styling.

**What I learned:** Screenshots caught bugs that no automated test was checking for — specifically the Vite proxy issue and the button color violation.

---

### Prompt 8 — Combined Bug Fix + Screenshot Redo (Issue #9)

**Context:** Needed one prompt to fix all 4 bugs, replace incorrect screenshots, and complete the release.

**Prompt:**
> "Please write a detailed prompt for Gemini to execute Issue #9 based on this implementation_plan_lab3.md. I encountered an issue where the UI screenshot doesn't match the lab sheet, and the screenshots from Issue #8 still show the incorrect webpage view. Please remove and correct them, then commit along with the issue-9 branch."

**Output:** This prompt — combining 3 phases (bug fixes, screenshot re-take, release integration) in the correct sequence.

**What I learned:** The order matters — taking screenshots before fixing bugs produces wrong evidence. Phase sequencing is critical.

---

## My Reflection

### Specification-Agent Phase (Issue #1)

Using Gemini as a specification agent saved significant time on the boilerplate structure — numbered requirements, business rules, and acceptance criteria in Given/When/Then format would have taken hours to write manually. The agent was particularly effective at identifying implementation choices that the handout left open (session mechanism, exact HTTP status codes for each error condition, status transition matrix) and proposing specific, justified answers.

The main limitation: the specification agent could not execute the code, so some specification choices that seemed clean in documents revealed practical problems during implementation. For example, the decision to make Internal Notes return 403 (not 404) for Requesters required careful frontend error handling to display a user-friendly message. I learned to review AI-generated specs critically — particularly to remove over-constraints (exact pixel widths, specific timing requirements) that would unnecessarily restrict the implementation.

### Coding-Agent Phase (Issues #2–#9)

The coding agent was most effective for: Prisma schema evolution, Express controller boilerplate, React component scaffolding, and test file generation. It consistently applied security patterns correctly — always excluding `passwordHash` from responses, always using `credentials: 'include'` on authenticated fetch calls, always checking `isLoading` before redirecting in ProtectedRoute.

The biggest value came from debugging. When I provided complete error logs (Playwright output, not just "it's broken"), the agent's diagnosis was accurate and specific. The React re-render loop diagnosis (from the DOM detach pattern in the Playwright log) was particularly impressive — I would not have found it quickly without the AI's pattern recognition.

The clearest limitation was in the screenshot review — the initial screenshots showed bugs that the agent didn't flag during code generation. The agent could not actually "see" the running application, only the source code. This reinforced that human visual review of running screens is essential and cannot be fully replaced by automated tests alone.

**Overall assessment:** The AI coding agent compressed 2–3 weeks of solo implementation into approximately 1 week, while maintaining higher code quality than I would have produced alone under time pressure. The key discipline: always provide precise inputs (exact error messages, complete logs, specific file contents) rather than vague descriptions.
