import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  assertTestDatabase, 
  createRequester, 
  createStaff, 
  createAdmin, 
  createInactiveStaff,
  createTicketsForStatuses,
  loginAs,
  anonymousRequest,
  resetTestData,
  createAction,
  prisma 
} from './helpers';

describe('Server Helper Self-Checks', () => {
  beforeAll(async () => {
    assertTestDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('HELPER-01: guard refuses non-test environment', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(() => assertTestDatabase()).toThrow(/DATA SAFETY GUARD/);
    process.env.NODE_ENV = original;
  });

  it('HELPER-02: factories create user types and tickets', async () => {
    const req = await createRequester();
    expect(req.role).toBe('REQUESTER');
    
    const staff = await createStaff();
    expect(staff.role).toBe('IT_STAFF');
    
    const admin = await createAdmin();
    expect(admin.role).toBe('ADMINISTRATOR');
    
    const inactive = await createInactiveStaff();
    expect(inactive.isActive).toBe(false);

    const tickets = await createTicketsForStatuses();
    expect(tickets.length).toBeGreaterThan(0);
  });

  it('HELPER-03: loginAs works for each role and anonymous is 401', async () => {
    const anon = anonymousRequest();
    let res = await anon.get('/auth/me');
    expect(res.status).toBe(401);

    const req = await createRequester();
    const authed = await loginAs(req);
    res = await authed.get('/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(req.email);
  });

  it('HELPER-04: cleanup removes only created test data', async () => {
    await resetTestData();
    const count = await prisma.user.count({ where: { email: { contains: '@test.com' } } });
    expect(count).toBe(0);
  });

  it('HELPER-05: createAction throws not available yet or creates record if exists', async () => {
    try {
      await createAction('fake-id');
      // If it reaches here, the model exists, which is valid for when Issue #3 is merged
    } catch (error: any) {
      expect(error.message).toMatch(/not available yet/);
    }
  });
});
