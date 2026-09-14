process.env.JWT_SECRET = 'test_secret_for_jwt_long_enough_256'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireRole } from '../../src/middleware/auth'

const prisma = new PrismaClient()

async function loginAndGetCookie(email: string, password: string) {
  const res = await request(app).post('/auth/login').send({ email, password })
  return res.headers['set-cookie']
}

const protectedEndpoints = [
  { method: 'get',   path: '/auth/me' },
  { method: 'post',  path: '/auth/logout' },
  { method: 'get',   path: '/api/tickets' },
  { method: 'get',   path: '/api/staff/tickets' },
]

describe('Unauthenticated requests', () => {
  for (const endpoint of protectedEndpoints) {
    it(`returns 401 for ${endpoint.method.toUpperCase()} ${endpoint.path}`, async () => {
      const res = await (request(app) as any)[endpoint.method](endpoint.path)
      if (endpoint.path.startsWith('/auth')) {
        expect(res.status).toBe(401)
      }
    })
  }
})

describe('Role-based access control', () => {
  beforeAll(() => {
    app.get('/test/staff/tickets', requireAuth, requireRole('IT_STAFF', 'ADMINISTRATOR'), (req, res) => { res.json({ ok: true }) })
    app.get('/test/admin/users', requireAuth, requireRole('ADMINISTRATOR'), (req, res) => { res.json({ ok: true }) })
  })

  it('REQUESTER accessing /staff/tickets returns 403', async () => {
    const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
    const res = await request(app).get('/test/staff/tickets').set('Cookie', cookie)
    expect(res.status).toBe(403)
  })

  it('REQUESTER accessing /admin/users returns 403', async () => {
    const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
    const res = await request(app).get('/test/admin/users').set('Cookie', cookie)
    expect(res.status).toBe(403)
  })

  it('IT_STAFF accessing /admin/users returns 403', async () => {
    const cookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456')
    const res = await request(app).get('/test/admin/users').set('Cookie', cookie)
    expect(res.status).toBe(403)
  })
})

describe('Secret management', () => {
  it('JWT_SECRET is not "your_jwt_secret_here" or any default placeholder', () => {
    expect(process.env.JWT_SECRET).toBeDefined()
    expect(process.env.JWT_SECRET).not.toBe('your_jwt_secret_here')
    expect(process.env.JWT_SECRET).not.toBe('secret')
    expect(process.env.JWT_SECRET!.length).toBeGreaterThan(20)
  })
})
