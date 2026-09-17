import { PrismaClient, Role, Priority, TicketStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const devPassword = await bcrypt.hash('Dev@123456', 12)
  const initPassword = await bcrypt.hash('InitPass@1', 12)

  const usersToSeed = [
    { name: 'Alice Requester', email: 'alice@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: false },
    { name: 'Bob Requester', email: 'bob@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: false },
    { name: 'Carol Requester', email: 'carol@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: false },
    { name: 'Dave Requester', email: 'dave@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: false },
    { name: 'Eve Requester', email: 'eve@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { name: 'Frank IT', email: 'frank@toktick.dev', role: Role.IT_STAFF, isActive: true, requiresPasswordChange: false },
    { name: 'Grace IT', email: 'grace@toktick.dev', role: Role.IT_STAFF, isActive: true, requiresPasswordChange: false },
    { name: 'Hank IT', email: 'hank@toktick.dev', role: Role.IT_STAFF, isActive: true, requiresPasswordChange: false },
    { name: 'Ivy IT (inactive)', email: 'ivy@toktick.dev', role: Role.IT_STAFF, isActive: false, requiresPasswordChange: true },
    { name: 'Admin One', email: 'admin@toktick.dev', role: Role.ADMINISTRATOR, isActive: true, requiresPasswordChange: false },
  ]

  const createdUsers = []
  for (const u of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash: u.requiresPasswordChange ? initPassword : devPassword,
        role: u.role,
        isActive: u.isActive,
        requiresPasswordChange: u.requiresPasswordChange,
      },
    })
    createdUsers.push(user)
  }
  
  const alice = createdUsers.find(u => u.email === 'alice@toktick.dev')!
  const bob = createdUsers.find(u => u.email === 'bob@toktick.dev')!
  const carol = createdUsers.find(u => u.email === 'carol@toktick.dev')!
  const dave = createdUsers.find(u => u.email === 'dave@toktick.dev')!
  const frank = createdUsers.find(u => u.email === 'frank@toktick.dev')!
  const grace = createdUsers.find(u => u.email === 'grace@toktick.dev')!
  
  // Seed categories
  const categories = ["Account and Access", "Hardware", "Software", "Network"]
  const createdCats = []
  for (const catName of categories) {
    const c = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    })
    createdCats.push(c)
  }
  
  // Seed related systems
  const relatedSystems = ["ERP System", "HR Portal", "CRM", "IT Helpdesk Portal", "Email Server"]
  const createdSys = []
  for (const sysName of relatedSystems) {
    const s = await prisma.relatedSystem.upsert({
      where: { name: sysName },
      update: {},
      create: { name: sysName },
    })
    createdSys.push(s)
  }

  // --- Tickets ---
  const ticketsToSeed = [
    { ticketNumber: 'TKT-001', summary: 'Cannot access VPN', requestedPriority: Priority.HIGH, itPriority: Priority.HIGH, status: TicketStatus.IN_PROGRESS, requesterId: alice.id, ownerId: frank.id, categoryId: createdCats[3].id, sysId: createdSys[0].id, problemAppearsResolved: false },
    { ticketNumber: 'TKT-002', summary: 'Need new laptop', requestedPriority: Priority.MEDIUM, itPriority: Priority.LOW, status: TicketStatus.NEW, requesterId: bob.id, ownerId: null, categoryId: createdCats[1].id, sysId: createdSys[1].id, problemAppearsResolved: false },
    { ticketNumber: 'TKT-003', summary: 'Password reset', requestedPriority: Priority.HIGH, itPriority: Priority.CRITICAL, status: TicketStatus.RESOLVED, requesterId: carol.id, ownerId: grace.id, categoryId: createdCats[0].id, sysId: createdSys[0].id, problemAppearsResolved: true },
    { ticketNumber: 'TKT-004', summary: 'Software install error', requestedPriority: Priority.LOW, itPriority: Priority.LOW, status: TicketStatus.OPEN, requesterId: dave.id, ownerId: frank.id, categoryId: createdCats[2].id, sysId: createdSys[2].id, problemAppearsResolved: false },
    { ticketNumber: 'TKT-005', summary: 'Network down', requestedPriority: Priority.CRITICAL, itPriority: Priority.CRITICAL, status: TicketStatus.WAITING_FOR_REQUESTER, requesterId: alice.id, ownerId: grace.id, categoryId: createdCats[3].id, sysId: createdSys[0].id, problemAppearsResolved: false },
    { ticketNumber: 'TKT-006', summary: 'Email sync issue', requestedPriority: Priority.MEDIUM, itPriority: Priority.MEDIUM, status: TicketStatus.CLOSED, requesterId: bob.id, ownerId: frank.id, categoryId: createdCats[2].id, sysId: createdSys[4].id, problemAppearsResolved: false },
    { ticketNumber: 'TKT-007', summary: 'Broken monitor', requestedPriority: Priority.LOW, itPriority: Priority.LOW, status: TicketStatus.REOPENED, requesterId: carol.id, ownerId: grace.id, categoryId: createdCats[1].id, sysId: createdSys[1].id, problemAppearsResolved: false },
    { ticketNumber: 'TKT-008', summary: 'Cannot access HR portal', requestedPriority: Priority.HIGH, itPriority: Priority.HIGH, status: TicketStatus.CANCELLED, requesterId: dave.id, ownerId: frank.id, categoryId: createdCats[0].id, sysId: createdSys[1].id, problemAppearsResolved: false },
    { ticketNumber: 'TKT-009', summary: 'Need CRM access', requestedPriority: Priority.MEDIUM, itPriority: Priority.MEDIUM, status: TicketStatus.OPEN, requesterId: alice.id, ownerId: null, categoryId: createdCats[0].id, sysId: createdSys[2].id, problemAppearsResolved: false },
    { ticketNumber: 'TKT-010', summary: 'Laptop randomly shuts down', requestedPriority: Priority.HIGH, itPriority: Priority.HIGH, status: TicketStatus.IN_PROGRESS, requesterId: bob.id, ownerId: grace.id, categoryId: createdCats[1].id, sysId: createdSys[1].id, problemAppearsResolved: true }
  ]
  
  const createdTickets = []
  for (const t of ticketsToSeed) {
    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {},
      create: {
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        description: 'Description for ' + t.summary,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        status: t.status,
        requesterId: t.requesterId,
        ownerId: t.ownerId,
        categoryId: t.categoryId,
        relatedSystemId: t.sysId,
        problemAppearsResolved: t.problemAppearsResolved
      },
    })
    createdTickets.push(ticket)
  }

  // --- Attachments ---
  const tkt3 = createdTickets[2] // Password reset (RESOLVED)
  if (tkt3) {
    const existingAttachments = await prisma.attachment.count({ where: { ticketId: tkt3.id } })
    if (existingAttachments === 0) {
      await prisma.attachment.create({
        data: {
          ticketId: tkt3.id,
          filename: 'error-screenshot.png',
          mimetype: 'image/png',
          size: 1048576
        }
      })
    }
  }

  // --- Public Comments ---
  const tkt1 = createdTickets[0]
  if (tkt1) {
    const existingComments = await prisma.publicComment.count({ where: { ticketId: tkt1.id } })
    if (existingComments === 0) {
      await prisma.publicComment.createMany({
        data: [
          { ticketId: tkt1.id, authorId: frank.id, content: "We have received your ticket and are investigating the issue." },
          { ticketId: tkt1.id, authorId: alice.id, content: "Thank you for the quick response." },
          { ticketId: tkt1.id, authorId: frank.id, content: "Could you provide more details about when this started?" }
        ]
      })
    }
  }

  // --- Internal Notes ---
  const tkt5 = createdTickets[4] // WAITING_FOR_REQUESTER
  if (tkt5) {
    const existingNotes = await prisma.internalNote.count({ where: { ticketId: tkt5.id } })
    if (existingNotes === 0) {
      await prisma.internalNote.createMany({
        data: [
          { ticketId: tkt5.id, authorId: grace.id, content: "Escalated to network team — awaiting their response." },
          { ticketId: tkt5.id, authorId: grace.id, content: "Replicated locally on dev machine. Root cause identified." }
        ]
      })
    }
  }

  console.log('✅ Seeding complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
