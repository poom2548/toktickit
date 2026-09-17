import { useState, useEffect } from 'react'
import './StaffTicketDetail.css'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { TicketInfoSection } from '../../components/staff/TicketInfoSection'
import { OperationalSection } from '../../components/staff/OperationalSection'
import { PublicCommentsPane } from '../../components/shared/PublicCommentsPane'
import { InternalNotesPane } from '../../components/staff/InternalNotesPane'
import { AttachmentsSection } from '../../components/staff/AttachmentsSection'

export interface TicketDetail {
  id: string
  ticketNumber: string
  summary: string
  description: string | null
  requestedPriority: string
  itPriority: string | null
  status: string
  problemAppearsResolved: boolean
  createdAt: string
  updatedAt: string
  requester: { id: string; name: string; email: string; role: string }
  owner: { id: string; name: string; role: string } | null
  category: { id: string; name: string } | null
  publicComments: Comment[]
  internalNotes: Note[]
  attachments: Attachment[]
}

interface Comment { id: string; content: string; createdAt: string; author: { id: string; name: string; role: string } }
interface Note    { id: string; content: string; createdAt: string; author: { id: string; name: string; role: string } }
interface Attachment { id: string; filename: string; mimetype: string; size: number; createdAt: string }

type FetchState = 'loading' | 'success' | 'error' | 'not-found'

export function StaffTicketDetailPage() {
  const { id: ticketId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!ticketId) return
    fetchTicket()
  }, [ticketId])

  async function fetchTicket() {
    setFetchState('loading')
    try {
      const res = await fetch(`/staff/tickets/${ticketId}`, { credentials: 'include' })
      if (res.status === 401) { window.location.href = '/login'; return }
      if (res.status === 403) { setFetchState('error'); setErrorMessage('forbidden'); return }
      if (res.status === 404) { setFetchState('not-found'); return }
      if (!res.ok) { setFetchState('error'); setErrorMessage('Unable to load ticket.'); return }

      const data = await res.json()
      setTicket(data)
      setFetchState('success')
    } catch {
      setFetchState('error')
      setErrorMessage('Unable to load ticket. Please check your connection.')
    }
  }

  if (fetchState === 'loading') return <div className="loading-skeleton" aria-busy="true" />
  if (fetchState === 'not-found') return <div className="not-found-message"><h2>Ticket Not Found</h2></div>
  if (fetchState === 'error' && errorMessage === 'forbidden') return <div className="forbidden-message"><h2>Access Denied</h2></div>
  if (fetchState === 'error') return <div className="error-message" role="alert"><p>{errorMessage}</p><button onClick={fetchTicket}>Retry</button></div>
  if (!ticket) return null

  return (
    <div className="staff-ticket-detail">
      <button onClick={() => navigate('/staff/tickets')} className="back-btn">← Back to Queue</button>

      <TicketInfoSection ticket={ticket} />
      <OperationalSection ticket={ticket} onTicketUpdate={(updated) => setTicket(updated)} />
      
      <PublicCommentsPane
        ticketId={ticket.id}
        comments={ticket.publicComments}
        onCommentsUpdate={(comments) => setTicket(prev => prev ? { ...prev, publicComments: comments } : prev)}
      />

      <InternalNotesPane
        ticketId={ticket.id}
        notes={ticket.internalNotes}
        onNotesUpdate={(notes) => setTicket(prev => prev ? { ...prev, internalNotes: notes } : prev)}
      />

      <AttachmentsSection attachments={ticket.attachments} ticketId={ticket.id} />
    </div>
  )
}
