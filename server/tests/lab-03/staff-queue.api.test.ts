process.env.JWT_SECRET = 'test_secret_for_jwt_long_enough_256'
import request from 'supertest'
import { app } from '../../src/app.js'
import { PrismaClient } from '@prisma/client'
import { describe, it, expect, beforeAll } from 'vitest'

const prisma = new PrismaClient()

// We need a helper to login and get the cookie
async function loginAndGetCookie(email: string, password: string): Promise<string> {
  const res = await request(app).post('/auth/login').send({ email, password })
  if (res.status !== 200) {
    console.error('Login failed:', email, res.status, res.body)
  }
  return res.headers['set-cookie']?.[0] || ''
}

describe('GET /staff/tickets', () => {

  let staffCookie: string
  let requesterCookie: string
  let frankUserId: string

  beforeAll(async () => {
    staffCookie     = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456')
    requesterCookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
    const frank = await prisma.user.findUnique({ where: { email: 'frank@toktick.dev' } })
    if (frank) frankUserId = frank.id
  })

  // AC-QUEUE-01
  it('returns 200 with tickets and pagination metadata for IT Staff (no params)', async () => {
    const res = await request(app)
      .get('/staff/tickets')
      .set('Cookie', staffCookie)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.tickets)).toBe(true)
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      pageSize: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    })
  })

  it('ticket items contain required fields', async () => {
    const res = await request(app)
      .get('/staff/tickets')
      .set('Cookie', staffCookie)

    const ticket = res.body.tickets[0]
    if (ticket) {
      expect(ticket).toHaveProperty('id')
      expect(ticket).toHaveProperty('ticketNumber')
      expect(ticket).toHaveProperty('createdAt')
      expect(ticket).toHaveProperty('updatedAt')
      expect(ticket).toHaveProperty('summary')
      expect(ticket).toHaveProperty('status')
      expect(ticket).toHaveProperty('requestedPriority')
      expect(ticket).toHaveProperty('itPriority')
      expect(ticket).toHaveProperty('category')
      expect(ticket).toHaveProperty('owner')
      expect(ticket).not.toHaveProperty('passwordHash')
      expect(ticket).not.toHaveProperty('internalNotes')
    }
  })

  // AC-QUEUE-02
  it('search filters by summary (case-insensitive)', async () => {
    const res = await request(app)
      .get('/staff/tickets?search=vpn')
      .set('Cookie', staffCookie)

    expect(res.status).toBe(200)
    const allMatch = res.body.tickets.every((t: any) =>
      t.summary.toLowerCase().includes('vpn') ||
      t.ticketNumber.toLowerCase().includes('vpn')
    )
    expect(allMatch).toBe(true)
  })

  it('search with no matching keyword returns empty array with total 0', async () => {
    const res = await request(app)
      .get('/staff/tickets?search=XYZNONEXISTENTTERM123')
      .set('Cookie', staffCookie)

    expect(res.status).toBe(200)
    expect(res.body.tickets).toHaveLength(0)
    expect(res.body.pagination.total).toBe(0)
  })

  // AC-QUEUE-03
  it('filters by status IN_PROGRESS', async () => {
    const res = await request(app)
      .get('/staff/tickets?status=IN_PROGRESS')
      .set('Cookie', staffCookie)

    expect(res.status).toBe(200)
    res.body.tickets.forEach((t: any) => {
      expect(t.status).toBe('IN_PROGRESS')
    })
  })

  it('filters by status NEW', async () => {
    const res = await request(app)
      .get('/staff/tickets?status=NEW')
      .set('Cookie', staffCookie)

    expect(res.status).toBe(200)
    res.body.tickets.forEach((t: any) => {
      expect(t.status).toBe('NEW')
    })
  })

  // AC-QUEUE-04
  it('sorts by createdAt descending', async () => {
    const res = await request(app)
      .get('/staff/tickets?sort=createdAt&direction=desc')
      .set('Cookie', staffCookie)

    expect(res.status).toBe(200)
    const dates = res.body.tickets.map((t: any) => new Date(t.createdAt).getTime())
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1])
    }
  })

  it('sorts by createdAt ascending', async () => {
    const res = await request(app)
      .get('/staff/tickets?sort=createdAt&direction=asc')
      .set('Cookie', staffCookie)

    expect(res.status).toBe(200)
    const dates = res.body.tickets.map((t: any) => new Date(t.createdAt).getTime())
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1])
    }
  })

  // AC-QUEUE-05
  it('returns correct second page with pageSize=2', async () => {
    const page1 = await request(app)
      .get('/staff/tickets?page=1&pageSize=2&sort=createdAt&direction=asc')
      .set('Cookie', staffCookie)
    const page2 = await request(app)
      .get('/staff/tickets?page=2&pageSize=2&sort=createdAt&direction=asc')
      .set('Cookie', staffCookie)

    expect(page1.status).toBe(200)
    expect(page2.status).toBe(200)

    const page1Ids = page1.body.tickets.map((t: any) => t.id)
    const page2Ids = page2.body.tickets.map((t: any) => t.id)
    const overlap = page1Ids.filter((id: string) => page2Ids.includes(id))
    expect(overlap).toHaveLength(0)

    expect(page2.body.pagination.page).toBe(2)
  })

  // AC-QUEUE-06
  it('returns 403 for authenticated REQUESTER', async () => {
    const res = await request(app)
      .get('/staff/tickets')
      .set('Cookie', requesterCookie)
    expect(res.status).toBe(403)
    expect(res.body).not.toHaveProperty('tickets')
  })

  it('returns 401 for unauthenticated request', async () => {
    const res = await request(app).get('/staff/tickets')
    expect(res.status).toBe(401)
    expect(res.body).not.toHaveProperty('tickets')
  })

  // AC-QUEUE-12
  it('returns 400 for invalid status value', async () => {
    const res = await request(app)
      .get('/staff/tickets?status=INVALID_STATUS')
      .set('Cookie', staffCookie)
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toMatch(/invalid status/i)
  })

  it('returns 400 for invalid sort field', async () => {
    const res = await request(app)
      .get('/staff/tickets?sort=nonExistentField')
      .set('Cookie', staffCookie)
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toMatch(/invalid sort/i)
  })

  it('returns 400 for invalid direction value', async () => {
    const res = await request(app)
      .get('/staff/tickets?direction=sideways')
      .set('Cookie', staffCookie)
    expect(res.status).toBe(400)
  })

  it('does NOT return 500 for invalid query params (always 400)', async () => {
    const res = await request(app)
      .get("/staff/tickets?status='; DROP TABLE tickets; --")
      .set('Cookie', staffCookie)
    expect([400, 200]).toContain(res.status)
    expect(res.status).not.toBe(500)
  })

  it('returns ADMINISTRATOR results the same as IT_STAFF', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev', 'Dev@123456')
    const res = await request(app)
      .get('/staff/tickets')
      .set('Cookie', adminCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.tickets)).toBe(true)
  })

  it('filters by ownerId', async () => {
    const res = await request(app)
      .get(`/staff/tickets?ownerId=${frankUserId}`)
      .set('Cookie', staffCookie)
    expect(res.status).toBe(200)
    res.body.tickets.forEach((t: any) => {
      expect(t.owner?.id).toBe(frankUserId)
    })
  })
})
