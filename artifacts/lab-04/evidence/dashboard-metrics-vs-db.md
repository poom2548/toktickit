# Dashboard Metrics vs Database Audit Trail (Evidence)

## 1. Overview
This document records the side-by-side verification comparing the aggregated metrics rendered by the TokTickIT dashboards (via `/api/requester/dashboard` and `/api/staff/dashboard`) with raw PostgreSQL database queries on the standard seeded dataset.

- **Verification Date:** 2026-10-18
- **Database Engine:** PostgreSQL 18
- **Associated Acceptance Criteria:** AC-29 (IT Staff metrics match DB), AC-30 (Requester metrics match DB), SD-01, RD-01, RD-02

---

## 2. Requester Dashboard: Alice Johnson (`alice@toktick.dev`)

| Metric Card | Dashboard UI / API Value | Database Query (SQL) | Raw Database Count | Verification Status |
|---|---|---|---|---|
| **My Open Tickets** | 128 | `SELECT count(*) FROM "Ticket" WHERE "requesterId" = 'cmuun5hph000013d0oe0p8nbu' AND "status" IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED');` | 128 | **Match (PASS)** |
| **Waiting for Me** | 1 | `SELECT count(*) FROM "Ticket" WHERE "requesterId" = 'cmuun5hph000013d0oe0p8nbu' AND "status" = 'WAITING_FOR_REQUESTER';` | 1 | **Match (PASS)** |
| **Recently Resolved (Last 7 Days)** | 0 | `SELECT count(*) FROM "Ticket" WHERE "requesterId" = 'cmuun5hph000013d0oe0p8nbu' AND "status" = 'RESOLVED' AND "updatedAt" >= NOW() - INTERVAL '7 days';` | 0 | **Match (PASS)** |

---

## 3. IT Staff Dashboard: Frank IT (`frank@toktick.dev`)

| Metric / Bucket | Dashboard UI / API Value | Database Query (SQL) | Raw Database Count | Verification Status |
|---|---|---|---|---|
| **Unassigned Tickets** | 237 | `SELECT count(*) FROM "Ticket" WHERE "ownerId" IS NULL AND "status" IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED');` | 237 | **Match (PASS)** |
| **My Owned Tickets** | 1 | `SELECT count(*) FROM "Ticket" WHERE "ownerId" = 'cmuun5hph000013d0oe0p8nbw' AND "status" IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED');` | 1 | **Match (PASS)** |
| **Status: NEW** | 142 | `SELECT count(*) FROM "Ticket" WHERE "status" = 'NEW';` | 142 | **Match (PASS)** |
| **Status: OPEN** | 25 | `SELECT count(*) FROM "Ticket" WHERE "status" = 'OPEN';` | 25 | **Match (PASS)** |
| **Status: IN_PROGRESS** | 30 | `SELECT count(*) FROM "Ticket" WHERE "status" = 'IN_PROGRESS';` | 30 | **Match (PASS)** |
| **Status: WAITING_FOR_REQUESTER** | 24 | `SELECT count(*) FROM "Ticket" WHERE "status" = 'WAITING_FOR_REQUESTER';` | 24 | **Match (PASS)** |
| **Status: REOPENED** | 21 | `SELECT count(*) FROM "Ticket" WHERE "status" = 'REOPENED';` | 21 | **Match (PASS)** |
| **IT Priority: CRITICAL** | 3 | `SELECT count(*) FROM "Ticket" WHERE "itPriority" = 'CRITICAL' AND "status" IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED');` | 3 | **Match (PASS)** |
| **IT Priority: HIGH** | 6 | `SELECT count(*) FROM "Ticket" WHERE "itPriority" = 'HIGH' AND "status" IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED');` | 6 | **Match (PASS)** |
| **IT Priority: MEDIUM** | 105 | `SELECT count(*) FROM "Ticket" WHERE "itPriority" = 'MEDIUM' AND "status" IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED');` | 105 | **Match (PASS)** |
| **IT Priority: LOW** | 3 | `SELECT count(*) FROM "Ticket" WHERE "itPriority" = 'LOW' AND "status" IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED');` | 3 | **Match (PASS)** |
| **IT Priority: UNSET** | 125 | `SELECT count(*) FROM "Ticket" WHERE "itPriority" IS NULL AND "status" IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED');` | 125 | **Match (PASS)** |

---

## 4. Administrator Metrics: User Accounts (`admin@toktick.dev`)

| Metric Item | Dashboard UI / API Value | Database Query (SQL) | Raw Database Count | Verification Status |
|---|---|---|---|---|
| **Active Users** | 101 | `SELECT count(*) FROM "User" WHERE "isActive" = true;` | 101 | **Match (PASS)** |
| **Inactive Users** | 3 | `SELECT count(*) FROM "User" WHERE "isActive" = false;` | 3 | **Match (PASS)** |

---

## 5. Audit Conclusion
Every metric card, counter badge, and priority distribution rendered on both the Requester and IT Staff/Admin Dashboards matches 1:1 with the underlying PostgreSQL database queries. No N+1 queries, discrepancies, or stale counts were observed.
