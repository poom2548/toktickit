# Lab 3 — Code Review Record

## Reviewer Identity

| Field | Value |
|---|---|
| **Reviewer Name** | Suppakit Poomsawas |
| **GitHub Username** | @SuppakitPoomsawas |
| **Relationship** | Classmate — CPE334, KMUTT, Semester 1/2026 |

---

## Pull Requests Reviewed

### Issue #2 — Database & Prisma Evolution
| | |
|---|---|
| **PR** | https://github.com/poom2548/toktickit/pull/2 |
| **Branch** | `feature/issue-2-db-evolution` → `lab3-staging` |
| **Status** | ✅ Approved and merged |

**Reviewer Comments:**
> Seed is idempotent — verified by running twice. Schema relationships are correct. Recommend adding unique index on ticketNumber to prevent duplicates.

**Author Response:**
> Added unique index on ticketNumber in schema.prisma as suggested.

---

### Issue #3 — Authentication Foundation
| | |
|---|---|
| **PR** | https://github.com/poom2548/toktickit/pull/3 |
| **Branch** | `feature/issue-3-auth` → `lab3-staging` |
| **Status** | ✅ Approved and merged |

**Reviewer Comments:**
> HttpOnly cookie correctly set. requiresPasswordChange redirect works. Passwords hashed with bcrypt — never stored in plaintext.

**Author Response:**
> No changes needed. All items confirmed correct.

---

### Issue #4 — Requester Regression & Public Comments
| | |
|---|---|
| **PR** | https://github.com/poom2548/toktickit/pull/4 |
| **Branch** | `feature/issue-4-requester` → `lab3-staging` |
| **Status** | ✅ Approved and merged |

**Reviewer Comments:**
> Ownership guard returns 403 for wrong requester — verified via API test. Comments are append-only — no edit/delete endpoint exists.

**Author Response:**
> No changes needed.

---

### Issue #5 — IT Staff Ticket Queue
| | |
|---|---|
| **PR** | https://github.com/poom2548/toktickit/pull/5 |
| **Branch** | `feature/issue-5-staff-queue` → `lab3-staging` |
| **Status** | ✅ Approved and merged |

**Reviewer Comments:**
> Responsive: table shows on desktop, cards on mobile. Pagination works. Sort by Last Updated descending by default — correct.

**Author Response:**
> Fixed tablet breakpoint after reviewer noted table overflowed at 900px.

---

### Issue #6 — IT Staff Ticket Detail
| | |
|---|---|
| **PR** | https://github.com/poom2548/toktickit/pull/6 |
| **Branch** | `feature/issue-6-staff-detail` → `lab3-staging` |
| **Status** | ✅ Approved and merged |

**Reviewer Comments:**
> Claim, status, priority, comments, notes all working. Internal Notes return 403 for Requester — verified. Status transition matrix enforced backend.

**Author Response:**
> No changes needed.

---

### Issue #7 — Administrator User Management
| | |
|---|---|
| **PR** | https://github.com/poom2548/toktickit/pull/7 |
| **Branch** | `feature/issue-7-admin` → `lab3-staging` |
| **Status** | ✅ Approved and merged |

**Reviewer Comments:**
> Self-deactivation blocked at UI (checkbox disabled) and backend (403). Last-admin prevention tested — 409 returned. passwordHash excluded from all responses.

**Author Response:**
> No changes needed.

---

### Issue #8 — Zen Green Visual QA
| | |
|---|---|
| **PR** | https://github.com/poom2548/toktickit/pull/8 |
| **Branch** | `feature/issue-8-visual-qa` → `lab3-staging` |
| **Status** | ✅ Approved and merged |

**Reviewer Comments:**
> All buttons now green. No horizontal overflow at mobile. Badge colors consistent. Initial screenshots were taken before bug fixes — reviewer confirmed new screenshots are correct.

**Author Response:**
> Confirmed. Deleted old screenshots and re-took all after fixes.

---

### Issue #9 — Release Integration
| | |
|---|---|
| **PR** | https://github.com/poom2548/toktickit/pull/9 |
| **Branch** | `feature/issue-9-release-integration` → `lab3-staging` |
| **Status** | ✅ Approved and merged |

**Reviewer Comments:**
> All tests pass. reviewer.md and ai-use.md are complete. Merge flow is correct.

**Author Response:**
> No changes needed.

---

## Final Release PR — `lab3-staging` → `main`

| | |
|---|---|
| **PR** | https://github.com/poom2548/toktickit/pull/10 |
| **Status** | ✅ Approved and merged |
| **Note** | All 9 feature/fix branches merged to lab3-staging first. This PR completes the release to main. |
