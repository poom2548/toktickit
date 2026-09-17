import './badges.css'

export function RoleBadge({ role }: { role: string }) {
  const classes: Record<string, string> = {
    REQUESTER:     'role-badge role-badge--requester',
    IT_STAFF:      'role-badge role-badge--it-staff',
    ADMINISTRATOR: 'role-badge role-badge--admin',
  }
  const labels: Record<string, string> = {
    REQUESTER: 'Requester', IT_STAFF: 'IT Staff', ADMINISTRATOR: 'Administrator',
  }
  return <span className={classes[role] ?? 'role-badge'}>{labels[role] ?? role}</span>
}
