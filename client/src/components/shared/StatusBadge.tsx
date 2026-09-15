export const STATUS_LABELS: Record<string, string> = {
  NEW:                    'New',
  OPEN:                   'Open',
  IN_PROGRESS:            'In Progress',
  WAITING_FOR_REQUESTER:  'Waiting for Requester',
  RESOLVED:               'Resolved',
  CLOSED:                 'Closed',
  REOPENED:               'Reopened',
  CANCELLED:              'Cancelled',
}

import './badges.css'

// CSS class determines color — defined in Zen Green token stylesheet
// e.g., .badge--new { background: var(--zen-status-new-bg); color: var(--zen-status-new-text); }
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge--status badge--${status.toLowerCase().replace('_', '-')}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
