import { TicketStatus } from '@prisma/client';
import { OPEN_TICKET_STATUSES } from '../dashboard/dashboard.constants.js';

export { OPEN_TICKET_STATUSES };

/**
 * Normalizes status strings from query parameters.
 * Accepts legacy values ("New", "In Progress", "Resolved", "Closed") and
 * the 8 Prisma TicketStatus enum values (case-insensitive).
 * Returns the matching TicketStatus or undefined if invalid.
 */
export function normalizeTicketStatus(raw: unknown): TicketStatus | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, '_');

  switch (trimmed) {
    case 'NEW':
      return TicketStatus.NEW;
    case 'OPEN':
      return TicketStatus.OPEN;
    case 'IN_PROGRESS':
      return TicketStatus.IN_PROGRESS;
    case 'WAITING_FOR_REQUESTER':
      return TicketStatus.WAITING_FOR_REQUESTER;
    case 'RESOLVED':
      return TicketStatus.RESOLVED;
    case 'CLOSED':
      return TicketStatus.CLOSED;
    case 'REOPENED':
      return TicketStatus.REOPENED;
    case 'CANCELLED':
      return TicketStatus.CANCELLED;
    default:
      return undefined;
  }
}

/**
 * Builds Prisma where condition for recently resolved tickets.
 * Requires ticket to be currently RESOLVED and have a statusHistory entry
 * transitioning to RESOLVED on or after cutoffDate.
 */
export function buildRecentlyResolvedWhere(cutoffDate: Date) {
  return {
    status: TicketStatus.RESOLVED,
    statusHistory: {
      some: {
        toStatus: TicketStatus.RESOLVED,
        changedAt: { gte: cutoffDate },
      },
    },
  };
}
