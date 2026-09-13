process.env.JWT_SECRET = 'test_secret_for_jwt_long_enough_256'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../../src/utils/password'

const prisma = new PrismaClient()

beforeAll(async () => {
  const initHash = await hashPassword('InitPass@1')
  await prisma.user.upsert({
    where: { email: 'test_pwchange@toktick.dev' },
    update: { passwordHash: initHash, requiresPasswordChange: true, isActive: true },
    create: {
      name: 'Test PwChange',
      email: 'test_pwchange@toktick.dev',
      role: 'REQUESTER',
      passwordHash: initHash,
      isActive: true,
      requiresPasswordChange: true,
    }
  })
})

async function loginAndGetCookie(email: string, password: string) {
  const res = await request(app).post('/auth/login').send({ email, password })
  return res.headers['set-cookie']
}

describe('POST /auth/login', () => {
  it('returns 200 with user identity (no passwordHash) for valid active user', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'alice@toktick.dev',
      password: 'Dev@123456',
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('name')
    expect(res.body).toHaveProperty('role')
    expect(res.body).toHaveProperty('requiresPasswordChange')
    expect(res.body).not.toHaveProperty('passwordHash')
    expect(res.body).not.toHaveProperty('password')
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('includes requiresPasswordChange:true when user must change password', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'test_pwchange@toktick.dev',
      password: 'InitPass@1',
    })
    expect(res.status).toBe(200)
    expect(res.body.requiresPasswordChange).toBe(true)
  })

  it('returns 401 with generic message for inactive user', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'ivy@toktick.dev',
      password: 'Dev@123456',
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid email or password.')
  })

  it('returns 401 with identical generic message for wrong password', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'alice@toktick.dev',
      password: 'WrongPassword!',
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid email or password.')
    expect(res.body).not.toHaveProperty('passwordHash')
  })

  it('does not reveal account existence for unknown email', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'nobody@toktick.dev',
      password: 'SomePassword1',
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid email or password.')
  })
})

describe('POST /auth/logout', () => {
  it('invalidates session so subsequent requests return 401', async () => {
    const loginRes = await request(app).post('/auth/login').send({
      email: 'alice@toktick.dev', password: 'Dev@123456',
    })
    const cookie = loginRes.headers['set-cookie']

    const logoutRes = await request(app)
      .post('/auth/logout')
      .set('Cookie', cookie)
    expect(logoutRes.status).toBe(200)

    const meRes = await request(app)
      .get('/auth/me')
      .set('Cookie', cookie)
    expect(meRes.status).toBe(401)
  })
})

describe('GET /auth/me', () => {
  it('returns user identity without passwordHash for authenticated user', async () => {
    const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
    const res = await request(app).get('/auth/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      email: 'alice@toktick.dev',
      role: 'REQUESTER',
    })
    expect(res.body).not.toHaveProperty('passwordHash')
  })

  it('returns 401 (not 403 or 404) for unauthenticated request', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('POST /auth/change-password', () => {
  it('changes password and sets requiresPasswordChange to false on valid input', async () => {
    const cookie = await loginAndGetCookie('test_pwchange@toktick.dev', 'InitPass@1')
    const res = await request(app)
      .post('/auth/change-password')
      .set('Cookie', cookie)
      .send({ newPassword: 'NewStrong@99' })
    expect(res.status).toBe(200)
    
    const meRes = await request(app).get('/auth/me').set('Cookie', cookie)
    expect(meRes.body.requiresPasswordChange).toBe(false)
  })

  it('returns 422 with validation details when password is too short', async () => {
    const cookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456')
    const res = await request(app)
      .post('/auth/change-password')
      .set('Cookie', cookie)
      .send({ newPassword: 'abc' })
    expect(res.status).toBe(422)
    expect(res.body).toHaveProperty('details')
    expect(Array.isArray(res.body.details)).toBe(true)
  })

  it('returns 401 for unauthenticated request', async () => {
    const res = await request(app)
      .post('/auth/change-password')
      .send({ newPassword: 'NewStrong@99' })
    expect(res.status).toBe(401)
  })
})
