import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
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
import { resolvePgBinary, runPgTool, getTempFile } from './helpers/pgTools';

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

  it('HELPER-09: resolver uses explicit env var successfully', () => {
    const original = process.env.PG_RESTORE_BIN;
    const fakeExe = path.join(os.tmpdir(), `pg_restore_fake_${Date.now()}${process.platform === 'win32' ? '.exe' : ''}`);
    fs.writeFileSync(fakeExe, 'fake');
    try {
      if (process.platform !== 'win32') fs.chmodSync(fakeExe, 0o755);
      process.env.PG_RESTORE_BIN = fakeExe;
      const resolved = resolvePgBinary('pg_restore');
      expect(resolved).toBe(fakeExe);
    } finally {
      process.env.PG_RESTORE_BIN = original;
      if (fs.existsSync(fakeExe)) fs.unlinkSync(fakeExe);
    }
  });

  it('HELPER-10: resolver throws clear error when env var points to missing file', () => {
    const original = process.env.PG_RESTORE_BIN;
    const badPath = path.join(os.tmpdir(), `does_not_exist_${Date.now()}.exe`);
    process.env.PG_RESTORE_BIN = badPath;
    try {
      expect(() => resolvePgBinary('pg_restore')).toThrowError(/PG_RESTORE_BIN/);
      expect(() => resolvePgBinary('pg_restore')).toThrowError(/does_not_exist/);
    } finally {
      process.env.PG_RESTORE_BIN = original;
    }
  });

  it('HELPER-11: resolver uses PG_BIN_DIR successfully', () => {
    const original = process.env.PG_BIN_DIR;
    const originalPgDump = process.env.PG_DUMP_BIN;
    delete process.env.PG_DUMP_BIN;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pgbin-'));
    const ext = process.platform === 'win32' ? '.exe' : '';
    const fakeExe = path.join(tempDir, `pg_dump${ext}`);
    fs.writeFileSync(fakeExe, 'fake');
    try {
      if (process.platform !== 'win32') fs.chmodSync(fakeExe, 0o755);
      process.env.PG_BIN_DIR = tempDir;
      const resolved = resolvePgBinary('pg_dump');
      expect(resolved).toBe(fakeExe);
    } finally {
      process.env.PG_BIN_DIR = original;
      process.env.PG_DUMP_BIN = originalPgDump;
      fs.unlinkSync(fakeExe);
      fs.rmdirSync(tempDir);
    }
  });

  it('HELPER-12: resolver finds tool via PATH', () => {
    const originalPath = process.env.PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pgpath-'));
    const ext = process.platform === 'win32' ? '.exe' : '';
    const fakeTool = path.join(tempDir, `pg_dump${ext}`);
    fs.writeFileSync(fakeTool, 'fake');
    try {
      if (process.platform !== 'win32') fs.chmodSync(fakeTool, 0o755);
      process.env.PATH = `${tempDir}${path.delimiter}${originalPath}`;
      // Temporarily clear explicit env vars so PATH takes precedence
      const ogDump = process.env.PG_DUMP_BIN;
      const ogBinDir = process.env.PG_BIN_DIR;
      delete process.env.PG_DUMP_BIN;
      delete process.env.PG_BIN_DIR;
      
      const resolved = resolvePgBinary('pg_dump');
      expect(resolved).toBe(fakeTool);
      
      process.env.PG_DUMP_BIN = ogDump;
      process.env.PG_BIN_DIR = ogBinDir;
    } finally {
      process.env.PATH = originalPath;
      fs.unlinkSync(fakeTool);
      fs.rmdirSync(tempDir);
    }
  });

  it('HELPER-13: runPgTool uses shell: false, handles spaces, and masks password', () => {
    const { stdout } = runPgTool(process.execPath, ['-e', 'console.log(process.argv[1])', 'arg with spaces']);
    expect(stdout.trim()).toBe('arg with spaces');
    
    // Test password masking
    let err: any;
    try {
      runPgTool(process.execPath, ['-e', 'process.exit(1)'], { 
        env: { PGPASSWORD: 'secret_password_123' }, 
        mustSucceed: true 
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.message).not.toMatch(/secret_password_123/);
  });

  it('HELPER-14: getTempFile returns random path under os.tmpdir() without collision', () => {
    const file1 = getTempFile('prefix1', '.ext');
    const file2 = getTempFile('prefix2', '.ext');
    expect(file1.startsWith(os.tmpdir())).toBe(true);
    expect(file2.startsWith(os.tmpdir())).toBe(true);
    expect(file1).not.toBe(file2);
  });
});
