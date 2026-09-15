export const PRIORITY_LABELS: Record<string, string> = {
  LOW:      'Low',
  MEDIUM:   'Medium',
  HIGH:     'High',
  CRITICAL: 'Critical',
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`badge badge--priority badge--${priority.toLowerCase()}`}>
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  )
}
