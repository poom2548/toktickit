const { PrismaClient } = require('../server/node_modules/@prisma/client');

export default async function globalSetup() {
  const prisma = new PrismaClient()

  // 1. Unclaim TEST_TICKET_ID
  const testTicketId = Number(process.env.TEST_TICKET_ID || 9)
  if (testTicketId) {
    await prisma.ticket.update({
      where: { id: testTicketId },
      data: { ownerId: null },
    })
    console.log('[globalSetup] Reset ticket ' + testTicketId + ' to unowned')
  }

  // 2. Reset NEW_TICKET_ID to NEW status
  const newTicketId = Number(process.env.NEW_TICKET_ID || 2)
  if (newTicketId) {
    await prisma.ticket.update({
      where: { id: newTicketId },
      data: { status: 'NEW' },
    })
    console.log('[globalSetup] Reset ticket ' + newTicketId + ' to NEW status')
  }

  // 3. Set problemAppearsResolved on RESOLVED_FLAG_TICKET_ID
  const resolvedTicketId = Number(process.env.RESOLVED_FLAG_TICKET_ID || 3)
  if (resolvedTicketId) {
    await prisma.ticket.update({
      where: { id: resolvedTicketId },
      data: { problemAppearsResolved: true },
    })
    console.log('[globalSetup] Set problemAppearsResolved=true on ticket ' + resolvedTicketId)
  }

  // 4. Ensure an attachment exists on TICKET_WITH_ATTACHMENT_ID
  const attachmentTicketId = Number(process.env.TICKET_WITH_ATTACHMENT_ID || 3)
  if (attachmentTicketId) {
    const existing = await prisma.attachment.findFirst({
      where: { ticketId: attachmentTicketId }
    })
    if (!existing) {
      await prisma.attachment.create({
        data: {
          ticketId: attachmentTicketId,
          filename: 'test-attachment.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          storagePath: 'test/path/test-attachment.pdf',
        }
      })
      console.log('[globalSetup] Created attachment on ticket ' + attachmentTicketId)
    }
  }

  // 5. Reset Eve and Bob to ensure E2E tests are reproducible
  const bcrypt = require('../server/node_modules/bcrypt')
  const initHash = await bcrypt.hash('InitPass@1', 10)
  const devHash = await bcrypt.hash('SecurePass@123', 10)

  await prisma.user.updateMany({
    where: { email: 'eve@toktick.dev' },
    data: { passwordHash: initHash, requiresPasswordChange: true }
  })
  console.log('[globalSetup] Reset eve@toktick.dev')

  // Make sure Bob exists with original email and password
  const bobExists = await prisma.user.findUnique({ where: { email: 'bob@toktick.dev' } })
  if (bobExists) {
    await prisma.user.update({
      where: { email: 'bob@toktick.dev' },
      data: { passwordHash: devHash, requiresPasswordChange: false }
    })
  } else {
    // If Bob was mutated to something else, we could try to mutate him back or just rely on the seed
    console.log('[globalSetup] bob@toktick.dev missing (mutated?), consider resetting DB')
  }

  await prisma.$disconnect()
}
