import { useState, FormEvent } from 'react'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; role: string }
}

interface PublicCommentsPaneProps {
  ticketId: string
  comments: Comment[]
  onCommentsUpdate: (comments: Comment[]) => void
}

export function PublicCommentsPane({ ticketId, comments, onCommentsUpdate }: PublicCommentsPaneProps) {
  const [newComment, setNewComment] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString()

  async function handlePost(e: FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) { setCommentError('Comment cannot be empty.'); return }
    setCommentError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        const newEntry = await res.json()
        setIsSubmitting(false)
        setNewComment('')
        onCommentsUpdate([...comments, newEntry])
      } else {
        const err = await res.json()
        setCommentError(err.error)
        setIsSubmitting(false)
      }
    } catch {
      setCommentError('Failed to post comment.')
      setIsSubmitting(false)
    }
  }

  return (
    <section className="public-comments-pane" aria-label="Public Comments">
      <h2 className="pane-title pane-title--public">
        💬 Public Comments
        <span className="pane-subtitle">Visible to Requester, IT Staff, and Administrator</span>
      </h2>
      {comments.length === 0 && <p className="empty-pane">No comments yet.</p>}
      <ul className="comment-list">
        {comments.map(c => (
          <li key={c.id} className="comment-item">
            <span className="comment-author">{c.author.name}</span>
            <span className="comment-role badge">{c.author.role}</span>
            <span className="comment-time">{formatDate(c.createdAt)}</span>
            <p className="comment-content">{c.content}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={handlePost} className="comment-form">
        <label htmlFor={`comment-${ticketId}`}>Add a comment</label>
        <textarea
          id={`comment-${ticketId}`}
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          rows={3}
          maxLength={2000}
          disabled={isSubmitting}
          placeholder="Write a public comment visible to the Requester…"
        />
        {commentError && <span className="field-error" role="alert">{commentError}</span>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Posting…' : 'Post Comment'}
        </button>
      </form>
    </section>
  )
}
