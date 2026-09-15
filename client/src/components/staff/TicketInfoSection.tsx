import { PriorityBadge } from '../shared/PriorityBadge'
import { TicketDetail } from '../../pages/staff/StaffTicketDetailPage'

export function TicketInfoSection({ ticket }: { ticket: TicketDetail }) {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString()

  return (
    <section className="ticket-info-section">
      <h1 className="ticket-title">
        {ticket.ticketNumber} — {ticket.summary}
      </h1>

      {ticket.problemAppearsResolved && (
        <div className="resolved-flag-indicator" role="status">
          ⚠️ The Requester has indicated this problem appears resolved.
        </div>
      )}

      <dl className="ticket-fields">
        <div className="field-row">
          <dt>Requester</dt>
          <dd>{ticket.requester.name} ({ticket.requester.email})</dd>
        </div>
        <div className="field-row">
          <dt>Category</dt>
          <dd>{ticket.category?.name ?? '—'}</dd>
        </div>
        <div className="field-row">
          <dt>Description</dt>
          <dd>{ticket.description || <em>No description provided.</em>}</dd>
        </div>
        <div className="field-row">
          <dt>Requested Priority</dt>
          <dd><PriorityBadge priority={ticket.requestedPriority} /></dd>
        </div>
        <div className="field-row">
          <dt>Created</dt>
          <dd>{formatDate(ticket.createdAt)}</dd>
        </div>
        <div className="field-row">
          <dt>Last Updated</dt>
          <dd>{formatDate(ticket.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  )
}
