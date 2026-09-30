interface Attachment {
  id: string
  filename: string
  mimetype: string
  size: number
  createdAt: string
}

export function AttachmentsSection({
  attachments, ticketId,
}: {
  attachments: Attachment[]
  ticketId: string
}) {
  if (!attachments || attachments.length === 0) {
    return (
      <section className="attachments-section">
        <h2>Attachments</h2>
        <p className="empty-pane">No attachments on this ticket.</p>
      </section>
    )
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <section className="attachments-section">
      <h2>Attachments ({attachments.length})</h2>
      <ul className="attachment-list">
        {attachments.map(a => (
          <li key={a.id} className="attachment-item">
            <span className="attachment-name">{a.filename}</span>
            <span className="attachment-size">{formatBytes(a.size)}</span>
            <a
              href={`/api/attachments/${a.id}/download`}
              download={a.filename}
              className="download-link"
              aria-label={`Download ${a.filename}`}
            >
              Download
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
