process.env.JWT_SECRET = 'test_secret_for_jwt_long_enough_256'
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function loginAndGetCookie(email: string, password: string) {
  const res = await request(app).post('/auth/login').send({ email, password })
  if (!res.headers['set-cookie']) {
    console.log('LOGIN FAILED:', email, res.status, res.body)
  }
  return res.headers['set-cookie']
}

describe('Requester Regression', () => {
  let aliceCookie: any
  let carolCookie: any
  let aliceTicketId: number
  let testCategoryId: number
  let testSystemId: number
  let aliceUserId: string
  let carolUserId: string

  beforeAll(async () => {
    aliceCookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
    carolCookie   = await loginAndGetCookie('carol@toktick.dev',   'Dev@123456')
    
    const aliceUser = await prisma.user.findUnique({ where: { email: 'alice@toktick.dev' } })
    const carolUser = await prisma.user.findUnique({ where: { email: 'carol@toktick.dev' } })
    aliceUserId = aliceUser!.id
    carolUserId = carolUser!.id
    
    const category = await prisma.category.findFirst()
    testCategoryId = category!.id
    
    const system = await prisma.relatedSystem.findFirst()
    testSystemId = system!.id
  })

  it('POST /tickets creates a ticket using the authenticated requesterId', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', aliceCookie)
      .send({
        summary: 'Regression test ticket',
        description: 'Created in test suite',
        requestedPriority: 'Medium',
        categoryId: testCategoryId,
        relatedSystemId: testSystemId,
        requesterId: 'INJECTED_FAKE_ID',
      })
    expect(res.status).toBe(201)
    expect(res.body.requesterId).not.toBe('INJECTED_FAKE_ID')
    expect(res.body.requesterId).toBe(aliceUserId)
    aliceTicketId = res.body.id
  })

  it('requesterId in request body is silently ignored', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', aliceCookie)
      .send({
        summary: 'Another test ticket',
        description: 'Test description',
        requestedPriority: 'Low',
        categoryId: testCategoryId,
        relatedSystemId: testSystemId,
        requesterId: carolUserId,
      })
    expect(res.status).toBe(201)
    expect(res.body.requesterId).toBe(aliceUserId)
  })

  it('GET /tickets returns only the authenticated user tickets', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Cookie', aliceCookie)
    expect(res.status).toBe(200)
    const allBelongToAlice = res.body.data.every(
      (t: any) => t.requesterId === aliceUserId
    )
    expect(allBelongToAlice).toBe(true)
  })

  it('GET /tickets/:id returns 200 for the authenticated owner', async () => {
    const res = await request(app)
      .get(`/api/tickets/${aliceTicketId}`)
      .set('Cookie', aliceCookie)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(aliceTicketId)
  })

  it('GET /tickets/:id returns 403 (not 404) when accessing another user ticket', async () => {
    const res = await request(app)
      .get(`/api/tickets/${aliceTicketId}`)
      .set('Cookie', carolCookie)
    expect(res.status).toBe(403)
    expect(res.body).not.toHaveProperty('summary')
    expect(res.body).not.toHaveProperty('requesterId')
  })

  it('POST /tickets/:id/attachments uploads successfully for ticket owner', async () => {
    const res = await request(app)
      .post(`/api/tickets/${aliceTicketId}/attachments`)
      .set('Cookie', aliceCookie)
      .attach('file', Buffer.from('%PDF-1.4\n%EOF\n'), 'test.pdf')
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
  })

  it('POST /tickets/:id/attachments returns 403 for non-owner', async () => {
    const res = await request(app)
      .post(`/api/tickets/${aliceTicketId}/attachments`)
      .set('Cookie', carolCookie)
      .attach('file', Buffer.from('%PDF-1.4\n%EOF\n'), 'test.pdf')
    expect(res.status).toBe(403)
  })

  it('No endpoint accepts or acts on a client-supplied requesterId query parameter', async () => {
    const res = await request(app)
      .get(`/api/tickets?requesterId=${carolUserId}`)
      .set('Cookie', aliceCookie)
    expect(res.status).toBe(200)
    const allBelongToAlice = res.body.data.every(
      (t: any) => t.requesterId === aliceUserId
    )
    expect(allBelongToAlice).toBe(true)
  })
})
