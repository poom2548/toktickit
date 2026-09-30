interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface PaginationProps {
  pagination: PaginationMeta | null
  page: number
  onPageChange: (page: number) => void
}

export function Pagination({ pagination, page, onPageChange }: PaginationProps) {
  if (!pagination || pagination.totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="Ticket list pagination">
      <button
        className="btn-secondary btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <span className="pagination-info">
        Page {page} of {pagination.totalPages} ({pagination.total} tickets)
      </span>

      <button
        className="btn-secondary btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pagination.totalPages}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  )
}
