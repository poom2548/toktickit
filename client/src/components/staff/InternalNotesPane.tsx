import { useState, FormEvent } from 'react'

interface Note {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; role: string }
}

interface InternalNotesPaneProps {
  ticketId: string
  notes: Note[]
  onNotesUpdate: (notes: Note[]) => void
}

export function InternalNotesPane({ ticketId, notes, onNotesUpdate }: InternalNotesPaneProps) {
  const [newNote, setNewNote] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString()

  async function handlePost(e: FormEvent) {
    e.preventDefault()
    if (!newNote.trim()) { setNoteError('Note cannot be empty.'); return }
    setNoteError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      })
      if (res.ok) {
        const newEntry = await res.json()
        setIsSubmitting(false)
        setNewNote('')
        onNotesUpdate([...notes, newEntry])
      } else {
        const err = await res.json()
        setNoteError(err.error)
        setIsSubmitting(false)
      }
    } catch {
      setNoteError('Failed to post note.')
      setIsSubmitting(false)
    }
  }

  return (
    <section className="internal-notes-pane" aria-label="Internal Notes">
      <h2 className="pane-title pane-title--internal">
        🔒 Internal Notes
        <span className="pane-subtitle">Visible to IT Staff and Administrator only</span>
      </h2>
      {notes.length === 0 && <p className="empty-pane">No internal notes yet.</p>}
      <ul className="note-list">
        {notes.map(n => (
          <li key={n.id} className="note-item">
            <span className="note-author">{n.author.name}</span>
            <span className="note-time">{formatDate(n.createdAt)}</span>
            <p className="note-content">{n.content}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={handlePost} className="note-form">
        <label htmlFor={`note-${ticketId}`}>Add an internal note</label>
        <textarea
          id={`note-${ticketId}`}
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          rows={3}
          maxLength={2000}
          disabled={isSubmitting}
          placeholder="Write a private note for IT Staff only…"
        />
        {noteError && <span className="field-error" role="alert">{noteError}</span>}
        <button type="submit" className="btn-primary btn-sm" disabled={isSubmitting || !newNote.trim()}>
          {isSubmitting ? 'Saving…' : 'Add Note'}
        </button>
      </form>
    </section>
  )
}
