// server/src/utils/statusTransitions.ts

export const PERMITTED_TRANSITIONS: Record<string, string[]> = {
  NEW:                    ['OPEN', 'CANCELLED'],
  OPEN:                   ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'CANCELLED'],
  IN_PROGRESS:            ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  WAITING_FOR_REQUESTER:  ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED:               ['CLOSED', 'REOPENED'],
  CLOSED:                 [],
  REOPENED:               ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  CANCELLED:              [],
}

export function isTransitionPermitted(from: string, to: string): boolean {
  return (PERMITTED_TRANSITIONS[from] ?? []).includes(to)
}
