interface QueueControlsProps {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusChange: (v: string) => void
  priorityFilter: string
  onPriorityChange: (v: string) => void
}

export function QueueControls({
  search, onSearchChange,
  statusFilter, onStatusChange,
  priorityFilter, onPriorityChange,
}: QueueControlsProps) {
  return (
    <div className="queue-controls">
      {/* Search */}
      <div className="control-group">
        <label htmlFor="queue-search">Search</label>
        <input
          id="queue-search"
          type="search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by summary or ticket #…"
        />
      </div>

      {/* Status filter */}
      <div className="control-group">
        <label htmlFor="status-filter">Status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={e => onStatusChange(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="REOPENED">Reopened</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Priority filter */}
      <div className="control-group">
        <label htmlFor="priority-filter">Priority</label>
        <select
          id="priority-filter"
          value={priorityFilter}
          onChange={e => onPriorityChange(e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>
    </div>
  )
}
