export function UserFilters({
  search, roleFilter, onSearchChange, onRoleChange,
}: {
  search: string
  roleFilter: string
  onSearchChange: (v: string) => void
  onRoleChange: (v: string) => void
}) {
  return (
    <div className="user-filters">
      <div className="filter-field">
        <label htmlFor="user-search">Search</label>
        <input
          id="user-search"
          type="search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by name or email…"
          data-testid="user-search-input"
        />
      </div>

      <div className="filter-field">
        <label htmlFor="role-filter">Role</label>
        <select
          id="role-filter"
          value={roleFilter}
          onChange={e => onRoleChange(e.target.value)}
          data-testid="role-filter-select"
        >
          <option value="">All Roles</option>
          <option value="REQUESTER">Requester</option>
          <option value="IT_STAFF">IT Staff</option>
          <option value="ADMINISTRATOR">Administrator</option>
        </select>
      </div>
    </div>
  )
}
