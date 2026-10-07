import { PrismaClient, Role, Priority, TicketStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('๐ฑ Seeding database...')

  try {
    await prisma.$executeRaw`CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 100`
  } catch (e) {
    console.log("Could not create sequence, it may already exist or DB doesn't support it.")
  }

  const devPassword = await bcrypt.hash('SecurePass@123', 12)
  const initPassword = await bcrypt.hash('InitPass@1', 12)

  const usersToSeed = [
    { name: 'Alice Requester', email: 'alice@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: false },
    { name: 'Bob Requester', email: 'bob@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: false },
    { name: 'Carol Requester', email: 'carol@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: false },
    { name: 'Dave Requester', email: 'dave@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: false },
    { name: 'Eve Requester', email: 'eve@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { name: 'Zack Requester', email: 'zack@toktick.dev', role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { name: 'Inactive Requester', email: 'inactive@toktick.dev', role: Role.REQUESTER, isActive: false, requiresPasswordChange: false },
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
          { ticketId: tkt5.id, authorId: grace.id, content: "Escalated to network team โ€” awaiting their response." },
          { ticketId: tkt5.id, authorId: grace.id, content: "Replicated locally on dev machine. Root cause identified." }
        ]
      })
    }
  }


  // ========================
  // LAB 4 SEED DATA
  // ========================
  
  // Create TKT-011 for Alice (RESOLVED outside 7 days)
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const ticket11 = await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-011' },
    update: {},
    create: {
      ticketNumber: 'TKT-011',
      summary: 'Legacy resolved ticket',
      description: 'Resolved a long time ago',
      requestedPriority: Priority.LOW,
      itPriority: Priority.LOW,
      status: TicketStatus.RESOLVED,
      requesterId: alice.id,
      ownerId: grace.id,
      categoryId: createdCats[0].id,
      relatedSystemId: createdSys[0].id,
      createdAt: tenDaysAgo,
      updatedAt: tenDaysAgo
    }
  });
  
  // Set requesterMarkedResolvedAt for TKT-010
  await prisma.ticket.update({
    where: { ticketNumber: 'TKT-010' },
    data: { requesterMarkedResolvedAt: new Date() }
  });

  // Action helpers using stable IDs
  const createSeedAction = async (id: string, ticketId: number, performedById: string, actionAt: Date, desc: string, result: string, followUp: boolean, followNote: string | null = null, attachNote: string | null = null) => {
    return prisma.actionTaken.upsert({
      where: { id },
      update: {},
      create: { id, ticketId, performedById, actionAt, description: desc, result, followUpRequired: followUp, followUpNote: followNote, attachmentNotes: attachNote }
    });
  };

  const createSeedHistory = async (id: string, ticketId: number, from: TicketStatus | null, to: TicketStatus, changedById: string, changedAt: Date) => {
    return prisma.ticketStatusHistory.upsert({
      where: { id },
      update: {},
      create: { id, ticketId, fromStatus: from, toStatus: to, changedById, changedAt }
    });
  };

  const tkt1Id = tkt1.id;
  await createSeedHistory('seed-hist-TKT-001-1', tkt1Id, null, TicketStatus.NEW, alice.id, new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
  await createSeedHistory('seed-hist-TKT-001-2', tkt1Id, TicketStatus.NEW, TicketStatus.OPEN, frank.id, new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
  await createSeedHistory('seed-hist-TKT-001-3', tkt1Id, TicketStatus.OPEN, TicketStatus.IN_PROGRESS, frank.id, new Date(Date.now() - 1 * 24 * 60 * 60 * 1000));
  
  await createSeedAction('seed-act-TKT-001-1', tkt1Id, frank.id, new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 'Investigated VPN logs', 'Found timeout errors', true, 'Check firewall rules tomorrow', null);
  await createSeedAction('seed-act-TKT-001-2', tkt1Id, grace.id, new Date(Date.now() - 36 * 60 * 60 * 1000), 'Checked firewall', 'Rules look fine', false, null, 'Attached firewall config');
  await createSeedAction('seed-act-TKT-001-3', tkt1Id, frank.id, new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 'Contacted ISP', 'Awaiting response', false, null, null);

  await createSeedHistory('seed-hist-TKT-002-1', createdTickets[1].id, null, TicketStatus.NEW, bob.id, new Date());

  const tkt3Id = tkt3.id;
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  await createSeedHistory('seed-hist-TKT-003-1', tkt3Id, null, TicketStatus.RESOLVED, grace.id, twoDaysAgo);
  await prisma.ticket.update({ where: { id: tkt3Id }, data: { updatedAt: twoDaysAgo } });
  await createSeedAction('seed-act-TKT-003-1', tkt3Id, grace.id, twoDaysAgo, 'Reset password in AD', 'Password reset successfully', false, null, null);

  await createSeedHistory('seed-hist-TKT-011-1', ticket11.id, null, TicketStatus.RESOLVED, grace.id, tenDaysAgo);
  await createSeedAction('seed-act-TKT-011-1', ticket11.id, grace.id, tenDaysAgo, 'Fixed issue', 'Done', false, null, null);

  // Per-table counts summary
  console.log('Tables: Users=' + await prisma.user.count() + ', Tickets=' + await prisma.ticket.count() + ', Actions=' + await prisma.actionTaken.count() + ', History=' + await prisma.ticketStatusHistory.count());

  console.log('✅ Seeding complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })


