import { Request, Response } from 'express'
import { getPrisma } from '../prisma.js'
import { OPEN_TICKET_STATUSES } from '../dashboard/dashboard.constants.js'

const VALID_STATUSES = [
  'NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER',
  'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED',
] as const

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
const VALID_STAFF_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNSET'] as const

const VALID_SORT_FIELDS = [
  'createdAt', 'updatedAt', 'ticketNumber', 'status',
  'requestedPriority', 'itPriority',
] as const

const DEFAULT_SORT_FIELD = 'createdAt'
const DEFAULT_SORT_DIRECTION = 'desc'
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function getStaffTickets(req: Request, res: Response): Promise<any> {
  const {
    search,
    status,
    statusGroup,
    assignee,
    priority,
    requestedPriority,
    ownerId,
    sort = DEFAULT_SORT_FIELD,
    direction = DEFAULT_SORT_DIRECTION,
    page,
    pageSize,
  } = req.query as Record<string, string>

  // ─── Input Validation ──────────────────────────────────────────────────────

  // Validate status filter (if provided)
  if (status && !VALID_STATUSES.includes(status as any)) {
    return res.status(400).json({
      error: `Invalid status value: "${status}". Valid values are: ${VALID_STATUSES.join(', ')}.`,
    })
  }

  // Validate statusGroup filter (if provided)
  if (statusGroup !== undefined && statusGroup !== 'open') {
    return res.status(400).json({
      error: `Invalid statusGroup value: "${statusGroup}". Valid value is: "open".`,
    })
  }

  // Validate assignee filter (if provided)
  if (assignee !== undefined && assignee !== 'unassigned' && assignee !== 'me') {
    return res.status(400).json({
      error: `Invalid assignee value: "${assignee}". Valid values are: "unassigned", "me".`,
    })
  }

  // Validate priority filter (if provided)
  if (priority && !VALID_STAFF_PRIORITIES.includes(priority as any)) {
    return res.status(400).json({
      error: `Invalid priority value: "${priority}". Valid values are: ${VALID_STAFF_PRIORITIES.join(', ')}.`,
    })
  }

  if (requestedPriority && !VALID_PRIORITIES.includes(requestedPriority as any)) {
    return res.status(400).json({
      error: `Invalid requestedPriority value: "${requestedPriority}". Valid values are: ${VALID_PRIORITIES.join(', ')}.`,
    })
  }

  // Validate sort field (if provided)
  if (sort && !VALID_SORT_FIELDS.includes(sort as any)) {
    return res.status(400).json({
      error: `Invalid sort field: "${sort}". Valid fields are: ${VALID_SORT_FIELDS.join(', ')}.`,
    })
  }

  // Validate direction
  if (direction && !['asc', 'desc'].includes(direction)) {
    return res.status(400).json({
      error: 'Invalid direction. Must be "asc" or "desc".',
    })
  }

  // Parse pagination
  const parsedPage = parseInt(page ?? String(DEFAULT_PAGE), 10)
  const parsedPageSize = parseInt(pageSize ?? String(DEFAULT_PAGE_SIZE), 10)

  if (isNaN(parsedPage) || parsedPage < 1) {
    return res.status(400).json({ error: 'page must be a positive integer.' })
  }
  if (isNaN(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > MAX_PAGE_SIZE) {
    return res.status(400).json({
      error: `pageSize must be between 1 and ${MAX_PAGE_SIZE}.`,
    })
  }

  // ─── Build Prisma Where Clause ─────────────────────────────────────────────

  const andConditions: any[] = []

  // search: case-insensitive match on summary OR ticketNumber
  if (search && search.trim().length > 0) {
    andConditions.push({
      OR: [
        { summary: { contains: search.trim(), mode: 'insensitive' } },
        { ticketNumber: { contains: search.trim(), mode: 'insensitive' } },
      ],
    })
  }

  // status filter
  if (status) {
    andConditions.push({ status })
  }

  // statusGroup filter
  if (statusGroup === 'open') {
    andConditions.push({ status: { in: [...OPEN_TICKET_STATUSES] } })
  }

  // priority filter (searches itPriority)
  if (priority) {
    if (priority === 'UNSET') {
      andConditions.push({ itPriority: null })
    } else {
      andConditions.push({ itPriority: priority })
    }
  }

  if (requestedPriority) {
    andConditions.push({ requestedPriority })
  }

  // assignee filter
  if (assignee) {
    if (assignee === 'unassigned') {
      andConditions.push({ ownerId: null })
    } else if (assignee === 'me') {
      andConditions.push({ ownerId: req.user?.id })
    }
  } else if (ownerId) {
    andConditions.push({ ownerId })
  }

  const where: any = andConditions.length > 0 ? { AND: andConditions } : {}

  // ─── Build OrderBy ─────────────────────────────────────────────────────────

  const orderBy: any = { [sort]: direction }

  // ─── Execute Count + Data Queries ─────────────────────────────────────────

  const skip = (parsedPage - 1) * parsedPageSize

  try {
    const prisma = getPrisma()
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: parsedPageSize,
        select: {
          id: true,
          ticketNumber: true,
          createdAt: true,
          updatedAt: true,
          summary: true,
          status: true,
          requestedPriority: true,
          itPriority: true,
          category: {
            select: { id: true, name: true },
          },
          owner: {
            select: { id: true, name: true },
          },
        },
      }),
    ])

    const totalPages = Math.ceil(total / parsedPageSize)

    return res.status(200).json({
      tickets,
      pagination: {
        page: parsedPage,
        pageSize: parsedPageSize,
        total,
        totalPages,
      },
    })
  } catch (err) {
    console.error('Get staff tickets error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' })
  }
}

export async function getAssignableUsers(_req: Request, res: Response): Promise<any> {
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ['IT_STAFF', 'ADMINISTRATOR'] },
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: [
        { name: 'asc' },
        { id: 'asc' },
      ],
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ users });
  } catch (err) {
    console.error('Get assignable users error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
  }
}

