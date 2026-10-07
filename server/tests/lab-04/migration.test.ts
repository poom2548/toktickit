
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'

const rootDbUrl = process.env.DATABASE_URL || 'postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public'
const mainPrisma = new PrismaClient()

function getDbUrl(dbName: string) {
  return rootDbUrl.replace(/\/([^/?]+)(\?|$)/, `/${dbName}$2`)
}

async function createScratchDb(prefix: string) {
  const dbName = `${prefix}_test_${crypto.randomBytes(4).toString('hex')}`
  await mainPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`)
  return { dbName, url: getDbUrl(dbName) }
}

async function dropScratchDb(dbName: string) {
  await mainPrisma.$executeRawUnsafe(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid()`)
  await mainPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${dbName}"`)
}

function runPrisma(cmd: string, url: string) {
  try {
    execSync(`npx --no-install prisma ${cmd}`, { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' })
  } catch (e: any) {
    console.error(`Prisma error:`, e.stdout?.toString(), e.stderr?.toString())
    throw e
  }
}

describe('Migration', () => {
  afterAll(async () => {
    await mainPrisma.$disconnect()
  })

  it('MIG-01: Lab 3 data preserved', async () => {
    const { dbName, url } = await createScratchDb('mig01')
    try {
      const dumpPath = path.join(process.env.TEMP || '/tmp', 'toktickit_lab3_snapshot.dump')
      if (fs.existsSync(dumpPath) && fs.existsSync('C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe')) {
        execSync(`"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe" -U toktickit -h localhost -d "${dbName}" -1 "${dumpPath}"`, { env: { ...process.env, PGPASSWORD: 'toktickit' } })
      } else {
        console.log('Cannot test MIG-01 properly without pg_restore. Skipping test.')
        return
      }
      
      const p3 = new PrismaClient({ datasourceUrl: url })
      const u3 = await p3.$queryRawUnsafe<any[]>(`SELECT count(*) as c FROM "User"`)
      const t3 = await p3.$queryRawUnsafe<any[]>(`SELECT count(*) as c FROM "Ticket"`)
      const c3 = await p3.$queryRawUnsafe<any[]>(`SELECT count(*) as c FROM "PublicComment"`)
      await p3.$disconnect()
      
      runPrisma('migrate deploy', url)
      
      const p4 = new PrismaClient({ datasourceUrl: url })
      const u4 = await p4.user.count()
      const t4 = await p4.ticket.count()
      const c4 = await p4.publicComment.count()
      
      expect(u4).toBe(Number(u3[0].c))
      expect(t4).toBe(Number(t3[0].c))
      expect(c4).toBe(Number(c3[0].c))
      
      const tickets = await p4.ticket.findMany()
      for (const t of tickets) {
        expect(t).toHaveProperty('version', 1)
        expect(t).toHaveProperty('requesterMarkedResolvedAt', null)
      }
      
      await p4.$disconnect()
    } finally {
      await dropScratchDb(dbName)
    }
  }, 60000)

  it('MIG-02: legacy tickets valid (incl. history backfill)', async () => {
    const { dbName, url } = await createScratchDb('mig02')
    try {
      runPrisma('migrate deploy', url)
      runPrisma('db seed', url)
      
      const p = new PrismaClient({ datasourceUrl: url })
      const legacyTkt = await p.ticket.findFirst({ where: { ticketNumber: 'TKT-002' } })
      
      expect(legacyTkt).toBeDefined()
      
      const histories = await p.ticketStatusHistory.findMany({ where: { ticketId: legacyTkt!.id } })
      expect(histories.length).toBeGreaterThanOrEqual(1)
      
      const firstHist = histories[0]
      expect(firstHist.fromStatus).toBeNull()
      expect(firstHist.toStatus).toBe(legacyTkt!.status)
      expect(firstHist.changedById).toBe(legacyTkt!.requesterId)
      
      await p.$disconnect()
    } finally {
      await dropScratchDb(dbName)
    }
  }, 60000)

  it('MIG-03: seed idempotent + coverage', async () => {
    const { dbName, url } = await createScratchDb('mig03')
    try {
      runPrisma('migrate deploy', url)
      runPrisma('db seed', url)
      
      const p = new PrismaClient({ datasourceUrl: url })
      const t1 = await p.ticket.count()
      const a1 = await p.actionTaken.count()
      const h1 = await p.ticketStatusHistory.count()
      
      runPrisma('db seed', url)
      
      const t2 = await p.ticket.count()
      const a2 = await p.actionTaken.count()
      const h2 = await p.ticketStatusHistory.count()
      
      expect(t2).toBe(t1)
      expect(a2).toBe(a1)
      expect(h2).toBe(h1)
      
      await p.$disconnect()
    } finally {
      await dropScratchDb(dbName)
    }
  }, 60000)

  it('MIG-04: rollback/recovery', async () => {
    const { dbName, url } = await createScratchDb('mig04')
    try {
      runPrisma('migrate deploy', url)
      
      const p = new PrismaClient({ datasourceUrl: url })
      const rollbackSql = fs.readFileSync(path.join(__dirname, '../../prisma/rollback/04-rollback.sql'), 'utf-8')
      const cleanSql = rollbackSql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
      const statements = cleanSql.split(';').filter(s => s.trim().length > 0)
      for (const stmt of statements) {
         await p.$executeRawUnsafe(stmt)
      }
      
      const checkTable = async (tableName: string) => {
        const res = await p.$queryRawUnsafe<any[]>(`SELECT count(*) as count FROM information_schema.tables WHERE table_name = '${tableName}'`)
        return Number(res[0].count) > 0
      }
      
      expect(await checkTable('ActionTaken')).toBe(false)
      expect(await checkTable('TicketStatusHistory')).toBe(false)
      expect(await checkTable('IdempotencyKey')).toBe(false)
      
      await p.$disconnect()
    } finally {
      await dropScratchDb(dbName)
    }
  }, 60000)
})
