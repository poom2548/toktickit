import { StatusBadge } from '../shared/StatusBadge'
import { PriorityBadge } from '../shared/PriorityBadge'
import { TicketSummary, SortField, SortDirection } from '../../types'

interface QueueTableProps {
  tickets: TicketSummary[]
  onOpenDetail: (id: string) => void
  onSort: (field: SortField) => void
  sortField: SortField
  sortDir: SortDirection
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString()
}

export function QueueTable({ tickets, onOpenDetail, onSort, sortField, sortDir }: QueueTableProps) {
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span aria-hidden="true">↕</span>
    return <span aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <table className="queue-table" role="grid">
      <thead>
        <tr>
          <th>
            <button onClick={() => onSort('ticketNumber')} className="sort-btn">
              Ticket # <SortIndicator field="ticketNumber" />
            </button>
          </th>
          <th>
            <button onClick={() => onSort('createdAt')} className="sort-btn">
              Created Date <SortIndicator field="createdAt" />
            </button>
          </th>
          <th>Summary</th>
          <th>Category</th>
          <th>
            <button onClick={() => onSort('requestedPriority')} className="sort-btn">
              Req. Priority <SortIndicator field="requestedPriority" />
            </button>
          </th>
          <th>
            <button onClick={() => onSort('itPriority')} className="sort-btn">
              IT Priority <SortIndicator field="itPriority" />
            </button>
          </th>
          <th>
            <button onClick={() => onSort('status')} className="sort-btn">
              Status <SortIndicator field="status" />
            </button>
          </th>
          <th>Ticket Owner</th>
          <th>
            <button onClick={() => onSort('updatedAt')} className="sort-btn">
              Last Updated <SortIndicator field="updatedAt" />
            </button>
          </th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map(ticket => (
          <tr key={ticket.id}>
            <td>{ticket.ticketNumber}</td>
            <td>{formatDate(ticket.createdAt)}</td>
            <td className="summary-cell">{ticket.summary}</td>
            <td>{ticket.category?.name ?? '—'}</td>
            <td><PriorityBadge priority={ticket.requestedPriority} /></td>
            <td>{ticket.itPriority ? <PriorityBadge priority={ticket.itPriority} /> : <span>—</span>}</td>
            <td><StatusBadge status={ticket.status} /></td>
            <td>{ticket.owner?.name ?? <span className="unassigned">Unassigned</span>}</td>
            <td>{formatDate(ticket.updatedAt)}</td>
            <td>
              <button
                onClick={() => onOpenDetail(ticket.id)}
                className="btn-primary btn-sm"
                aria-label={`Open detail for ticket ${ticket.ticketNumber}`}
              >
                Open Detail
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
