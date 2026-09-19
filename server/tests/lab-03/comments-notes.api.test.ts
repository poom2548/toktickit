process.env.JWT_SECRET = 'test_secret_for_jwt_long_enough_256'
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function loginAndGetCookie(email, password) {
  const res = await request(app).post('/auth/login').send({ email, password })
  return res.headers['set-cookie']
}

describe('Comments and Notes API', () => {
  let aliceCookie
  let aliceUserId
  let aliceTicketId

  beforeAll(async () => {
    aliceCookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
    const aliceUser = await prisma.user.findUnique({ where: { email: 'alice@toktick.dev' } })
    aliceUserId = aliceUser!.id

    const category = await prisma.category.findFirst()
    const system = await prisma.relatedSystem.findFirst()
    
    // create a ticket for Alice
    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', aliceCookie)
      .send({
        summary: 'Comments test ticket',
        description: 'Testing comments',
        requestedPriority: 'Low',
        categoryId: category!.id,
        relatedSystemId: system!.id
      })
    aliceTicketId = res.body.id
  })

  describe('POST /tickets/:id/comments', () => {

    it('stores comment with correct authorId and returns 201', async () => {
      const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .post(`/api/tickets/${aliceTicketId}/comments`)
        .set('Cookie', cookie)
        .send({ content: 'This is a test comment.' })

      expect(res.status).toBe(201)
      expect(res.body.authorId).toBe(aliceUserId)
      expect(res.body.content).toBe('This is a test comment.')
      expect(res.body).toHaveProperty('createdAt')
      expect(res.body.author).toMatchObject({ id: aliceUserId, name: expect.any(String) })
      // Append-only: no updatedAt
      expect(res.body).not.toHaveProperty('updatedAt')
    })

    it('returns 422 for empty content', async () => {
      const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .post(`/api/tickets/${aliceTicketId}/comments`)
        .set('Cookie', cookie)
        .send({ content: '' })
      expect(res.status).toBe(422)
      expect(res.body).not.toHaveProperty('id')  // comment was not stored
    })

    it('returns 422 for whitespace-only content', async () => {
      const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .post(`/api/tickets/${aliceTicketId}/comments`)
        .set('Cookie', cookie)
        .send({ content: '   ' })
      expect(res.status).toBe(422)
    })

    it('returns 422 when content exceeds max length', async () => {
      const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .post(`/api/tickets/${aliceTicketId}/comments`)
        .set('Cookie', cookie)
        .send({ content: 'x'.repeat(2001) })
      expect(res.status).toBe(422)
    })

    it('returns 403 when Requester comments on another user ticket', async () => {
      const carolCookie = await loginAndGetCookie('carol@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .post(`/api/tickets/${aliceTicketId}/comments`)  // Alice's ticket
        .set('Cookie', carolCookie)
        .send({ content: 'Bob trying to comment on Alice ticket.' })
      expect(res.status).toBe(403)
    })

    it('allows IT_STAFF to comment on any ticket', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .post(`/api/tickets/${aliceTicketId}/comments`)
        .set('Cookie', staffCookie)
        .send({ content: 'IT Staff comment on Alice ticket.' })
      expect(res.status).toBe(201)
    })

    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app)
        .post(`/api/tickets/${aliceTicketId}/comments`)
        .send({ content: 'No auth.' })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /tickets/:id/comments', () => {
    it('returns list of comments in chronological order for ticket owner', async () => {
      const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .get(`/api/tickets/${aliceTicketId}/comments`)
        .set('Cookie', cookie)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.comments)).toBe(true)
      const timestamps = res.body.comments.map((c) => new Date(c.createdAt).getTime())
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1])
      }
    })

    it('returns 403 for non-owner Requester', async () => {
      const carolCookie = await loginAndGetCookie('carol@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .get(`/api/tickets/${aliceTicketId}/comments`)
        .set('Cookie', carolCookie)
      expect(res.status).toBe(403)
    })
  })

  describe('Internal Notes', () => {
    it('POST /tickets/:id/notes allows IT_STAFF to post an internal note', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .post(`/api/tickets/${aliceTicketId}/notes`)
        .set('Cookie', staffCookie)
        .send({ content: 'Internal note by IT staff.' })

      expect(res.status).toBe(201)
      expect(res.body.content).toBe('Internal note by IT staff.')
      expect(res.body.author.role).toBe('IT_STAFF')
      expect(res.body).toHaveProperty('createdAt')
    })

    it('GET /tickets/:id/notes allows IT_STAFF to view internal notes', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .get(`/api/tickets/${aliceTicketId}/notes`)
        .set('Cookie', staffCookie)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.notes)).toBe(true)
      const hasOurNote = res.body.notes.some((n) => n.content === 'Internal note by IT staff.')
      expect(hasOurNote).toBe(true)
    })

    it('POST /tickets/:id/notes returns 403 for REQUESTER (no note content in error)', async () => {
      const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .post(`/api/tickets/${aliceTicketId}/notes`)
        .set('Cookie', cookie)
        .send({ content: 'Requester trying to post a note.' })

      expect(res.status).toBe(403)
      expect(res.body).not.toHaveProperty('content')
      expect(res.body).not.toHaveProperty('notes')
      expect(JSON.stringify(res.body)).not.toContain('Requester trying to post a note.')
    })

    it('GET /tickets/:id/notes returns 403 for REQUESTER (no note content in error)', async () => {
      const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .get(`/api/tickets/${aliceTicketId}/notes`)
        .set('Cookie', cookie)

      expect(res.status).toBe(403)
      expect(res.body).not.toHaveProperty('notes')
      expect(res.body).not.toHaveProperty('content')
    })
  })

  describe('PATCH /tickets/:id/resolved-flag', () => {
    it('sets problemAppearsResolved flag without changing ticket status', async () => {
      const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')

      const beforeRes = await request(app)
        .get(`/api/tickets/${aliceTicketId}`)
        .set('Cookie', cookie)
      const originalStatus = beforeRes.body.status

      const res = await request(app)
        .patch(`/api/tickets/${aliceTicketId}/resolved-flag`)
        .set('Cookie', cookie)
        .send({ problemAppearsResolved: true })

      expect(res.status).toBe(200)
      expect(res.body.problemAppearsResolved).toBe(true)
      expect(res.body.status).toBe(originalStatus)
      expect(res.body.status).not.toBe('RESOLVED')
    })

    it('returns 403 for non-owner Requester', async () => {
      const carolCookie = await loginAndGetCookie('carol@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .patch(`/api/tickets/${aliceTicketId}/resolved-flag`)
        .set('Cookie', carolCookie)
        .send({ problemAppearsResolved: true })
      expect(res.status).toBe(403)
    })

    it('returns 403 for IT_STAFF (not their action)', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .patch(`/api/tickets/${aliceTicketId}/resolved-flag`)
        .set('Cookie', staffCookie)
        .send({ problemAppearsResolved: true })
      expect(res.status).toBe(403)
    })

    it('returns 400 when problemAppearsResolved is not a boolean', async () => {
      const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
      const res = await request(app)
        .patch(`/api/tickets/${aliceTicketId}/resolved-flag`)
        .set('Cookie', cookie)
        .send({ problemAppearsResolved: 'yes' })
      expect(res.status).toBe(400)
    })

    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app)
        .patch(`/api/tickets/${aliceTicketId}/resolved-flag`)
        .send({ problemAppearsResolved: true })
      expect(res.status).toBe(401)
    })
  })
})
