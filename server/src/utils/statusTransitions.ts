import { TicketStatus, Role } from '@prisma/client';

export interface TransitionRule {
  from: TicketStatus;
  to: TicketStatus;
  roles: Role[];
  requesterOwnOnly?: boolean;
  gated?: boolean;
}

export const TRANSITION_MATRIX: TransitionRule[] = [
  { from: 'NEW', to: 'OPEN', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'NEW', to: 'CANCELLED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'], requesterOwnOnly: true },
  { from: 'OPEN', to: 'IN_PROGRESS', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'OPEN', to: 'WAITING_FOR_REQUESTER', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'OPEN', to: 'CANCELLED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'], requesterOwnOnly: true },
  { from: 'IN_PROGRESS', to: 'WAITING_FOR_REQUESTER', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'IN_PROGRESS', to: 'RESOLVED', roles: ['IT_STAFF', 'ADMINISTRATOR'], gated: true },
  { from: 'IN_PROGRESS', to: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'WAITING_FOR_REQUESTER', to: 'IN_PROGRESS', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'WAITING_FOR_REQUESTER', to: 'RESOLVED', roles: ['IT_STAFF', 'ADMINISTRATOR'], gated: true },
  { from: 'WAITING_FOR_REQUESTER', to: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'RESOLVED', to: 'CLOSED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'RESOLVED', to: 'REOPENED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'], requesterOwnOnly: true },
  { from: 'REOPENED', to: 'OPEN', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'REOPENED', to: 'IN_PROGRESS', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'REOPENED', to: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
];

export function getAllowedTransitions(
  status: TicketStatus,
  role: Role,
  isTicketOwnerRequester: boolean
): TicketStatus[] {
  return TRANSITION_MATRIX.filter(rule => {
    if (rule.from !== status) return false;
    if (!rule.roles.includes(role)) return false;
    if (role === 'REQUESTER' && rule.requesterOwnOnly && !isTicketOwnerRequester) return false;
    return true;
  }).map(r => r.to);
}

export function findTransition(from: TicketStatus, to: TicketStatus): TransitionRule | undefined {
  return TRANSITION_MATRIX.find(rule => rule.from === from && rule.to === to);
}

export function isLockedStatus(status: TicketStatus): boolean {
  return status === 'CLOSED' || status === 'CANCELLED';
}

export function isOpenNonNewStatus(status: TicketStatus): boolean {
  return ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED'].includes(status);
}
