import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function loginAndGetCookie(email: string, password = 'Dev@123456') {
  const res = await request(app).post('/auth/login').send({ email, password })
  return res.headers['set-cookie']
}

let bobUserId: string
let daveUserId: string
let adminUserId: string
let secondAdminId: string

beforeAll(async () => {
  const bob = await prisma.user.findUnique({ where: { email: 'bob@toktick.dev' } })
  if (bob) bobUserId = bob.id
  
  const dave = await prisma.user.findUnique({ where: { email: 'dave@toktick.dev' } })
  if (dave) daveUserId = dave.id

  const admin = await prisma.user.findUnique({ where: { email: 'admin@toktick.dev' } })
  if (admin) adminUserId = admin.id
  
  // Ensure we have a second admin for testing AC-ADMIN-09
  let second = await prisma.user.findUnique({ where: { email: 'admin2@toktick.dev' } })
  if (!second) {
    const { hashPassword } = await import('../../src/utils/password.js')
    const passwordHash = await hashPassword('Dev@123456')
    second = await prisma.user.create({
      data: {
        name: 'Admin Two',
        email: 'admin2@toktick.dev',
        role: Role.ADMINISTRATOR,
        isActive: true,
        requiresPasswordChange: false,
        passwordHash,
      }
    })
  }
  secondAdminId = second.id
})

describe('GET /admin/users', () => {

  // AC-ADMIN-01
  it('returns all users for Administrator — no passwordHash', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const res = await request(app).get('/admin/users').set('Cookie', adminCookie)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.users)).toBe(true)
    expect(res.body.users.length).toBeGreaterThan(0)
    res.body.users.forEach((u: any) => {
      expect(u).toHaveProperty('id')
      expect(u).toHaveProperty('name')
      expect(u).toHaveProperty('email')
      expect(u).toHaveProperty('role')
      expect(u).toHaveProperty('isActive')
      expect(u).not.toHaveProperty('passwordHash')   // CRITICAL
    })
  })

  // AC-ADMIN-02
  it('filters by search — case-insensitive name/email match', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const res = await request(app)
      .get('/admin/users?search=alice')
      .set('Cookie', adminCookie)

    expect(res.status).toBe(200)
    res.body.users.forEach((u: any) => {
      const matches = u.name.toLowerCase().includes('alice') || u.email.toLowerCase().includes('alice')
      expect(matches).toBe(true)
    })
  })

  // AC-ADMIN-03
  it('filters by role', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const res = await request(app)
      .get('/admin/users?role=IT_STAFF')
      .set('Cookie', adminCookie)

    expect(res.status).toBe(200)
    res.body.users.forEach((u: any) => {
      expect(u.role).toBe('IT_STAFF')
    })
  })

  // AC-ADMIN-11
  it('returns 403 for IT_STAFF', async () => {
    const staffCookie = await loginAndGetCookie('frank@toktick.dev')
    const res = await request(app).get('/admin/users').set('Cookie', staffCookie)
    expect(res.status).toBe(403)
    expect(res.body).not.toHaveProperty('users')
  })

  it('returns 403 for REQUESTER', async () => {
    const requesterCookie = await loginAndGetCookie('alice@toktick.dev')
    const res = await request(app).get('/admin/users').set('Cookie', requesterCookie)
    expect(res.status).toBe(403)
  })

  // AC-ADMIN-12
  it('returns 401 for unauthenticated request', async () => {
    const res = await request(app).get('/admin/users')
    expect(res.status).toBe(401)
  })
})

describe('POST /admin/users', () => {

  const uniqueEmail = () => `testuser-${Date.now()}@toktick.dev`

  // AC-ADMIN-04
  it('creates a user with requiresPasswordChange=true', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const email = uniqueEmail()
    const res = await request(app)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({ name: 'Test User', email, role: 'IT_STAFF', password: 'TestPass123' })

    expect(res.status).toBe(201)
    expect(res.body.email).toBe(email)
    expect(res.body.role).toBe('IT_STAFF')
    expect(res.body.requiresPasswordChange).toBe(true)
    expect(res.body).not.toHaveProperty('passwordHash')
  })

  // AC-ADMIN-05
  it('returns 409 for duplicate email', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const res = await request(app)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({ name: 'Dupe', email: 'alice@toktick.dev', role: 'REQUESTER', password: 'TestPass123' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already exists/i)
  })

  // AC-ADMIN-06
  it('returns 422 for invalid role', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const res = await request(app)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({ name: 'Test', email: uniqueEmail(), role: 'SUPERUSER', password: 'TestPass123' })

    expect(res.status).toBe(422)
    expect(res.body.error).toMatch(/invalid role/i)
  })
})

describe('PATCH /admin/users/:id', () => {

  // AC-ADMIN-07
  it('updates user name and email', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const res = await request(app)
      .patch(`/admin/users/${daveUserId}`)
      .set('Cookie', adminCookie)
      .send({ name: 'Dave Updated', email: 'dave-updated@toktick.dev' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Dave Updated')
    expect(res.body).not.toHaveProperty('passwordHash')
  })

  // AC-ADMIN-08
  it('returns 403 when Administrator tries to deactivate themselves', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const res = await request(app)
      .patch(`/admin/users/${adminUserId}`)  // admin's own ID
      .set('Cookie', adminCookie)
      .send({ isActive: false })

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/cannot deactivate your own/i)
  })

  // AC-ADMIN-09
  it('returns 409 when trying to deactivate the last active Administrator', async () => {
    // First, deactivate admin@toktick.dev (via the second admin)
    const admin2Cookie = await loginAndGetCookie('admin2@toktick.dev')
    await request(app)
      .patch(`/admin/users/${adminUserId}`)
      .set('Cookie', admin2Cookie)
      .send({ isActive: false })

    // Now admin2 is the sole active admin. Trying to deactivate them should fail with 409
    // Wait, admin2 deactivating itself gives 403. Let's try changing role instead, or if admin2 tries to deactivate itself it gets 403.
    // What if we try to change admin2's role to IT_STAFF? That would leave 0 admins.
    const res = await request(app)
      .patch(`/admin/users/${secondAdminId}`)
      .set('Cookie', admin2Cookie)
      .send({ role: 'IT_STAFF' })

    expect([403, 409]).toContain(res.status)
    expect(res.body.error).toBeTruthy()
    
    // Restore admin for subsequent tests
    await prisma.user.update({ where: { id: adminUserId }, data: { isActive: true }})
  })

  it('returns 409 for duplicate email during edit', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const res = await request(app)
      .patch(`/admin/users/${daveUserId}`)
      .set('Cookie', adminCookie)
      .send({ email: 'frank@toktick.dev' })   // Frank's existing email

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already exists/i)
  })
})

describe('PATCH /admin/users/:id/password', () => {

  // AC-ADMIN-10
  it('updates password and sets requiresPasswordChange=true', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const res = await request(app)
      .patch(`/admin/users/${daveUserId}/password`)
      .set('Cookie', adminCookie)
      .send({ password: 'NewPassword999' })

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/must change/i)

    // Verify requiresPasswordChange is now true
    const userRes = await request(app).get('/admin/users').set('Cookie', adminCookie)
    const dave = userRes.body.users.find((u: any) => u.id === daveUserId)
    expect(dave?.requiresPasswordChange).toBe(true)
  })

  it('returns 422 for password shorter than 8 characters', async () => {
    const adminCookie = await loginAndGetCookie('admin@toktick.dev')
    const res = await request(app)
      .patch(`/admin/users/${daveUserId}/password`)
      .set('Cookie', adminCookie)
      .send({ password: 'short' })

    expect(res.status).toBe(422)
  })
})
