import { StatusBadge } from '../shared/StatusBadge'
import { PriorityBadge } from '../shared/PriorityBadge'
import { TicketSummary } from '../../types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString()
}

export function QueueCardList({ tickets, onOpenDetail }: { tickets: TicketSummary[], onOpenDetail: (id: string) => void }) {
  return (
    <ul className="queue-card-list" role="list">
      {tickets.map(ticket => (
        <li key={ticket.id} className="queue-card">
          <div className="card-header">
            <span className="ticket-number">{ticket.ticketNumber}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="card-summary">{ticket.summary}</p>
          <div className="card-meta">
            <span>Category: {ticket.category?.name ?? '—'}</span>
            <span>Owner: {ticket.owner?.name ?? 'Unassigned'}</span>
          </div>
          <div className="card-priorities">
            <span>Req. Priority: <PriorityBadge priority={ticket.requestedPriority} /></span>
            {ticket.itPriority && <span>IT Priority: <PriorityBadge priority={ticket.itPriority} /></span>}
          </div>
          <div className="card-dates">
            <span>Created: {formatDate(ticket.createdAt)}</span>
            <span>Updated: {formatDate(ticket.updatedAt)}</span>
          </div>
          <button
            onClick={() => onOpenDetail(ticket.id)}
            className="open-detail-btn"
            aria-label={`Open detail for ticket ${ticket.ticketNumber}`}
          >
            Open Detail
          </button>
        </li>
      ))}
    </ul>
  )
}
