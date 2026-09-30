import { getPrisma } from '../prisma.js'

export async function generateTicketNumber(): Promise<string> {
  const prisma = getPrisma()
  try {
    const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval('ticket_number_seq')
    `;
    return `TKT-${String(Number(result[0].nextval)).padStart(4, '0')}`;
  } catch (e) {
    console.error("QUERY RAW ERROR:", e)
    // Fallback if sequence doesn't exist (e.g. in some test environments)
    const lastTicket = await prisma.ticket.findFirst({
      where: { ticketNumber: { startsWith: 'TKT-' } },
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    })
  
    let nextNumber = 1
  
    if (lastTicket?.ticketNumber) {
      const match = lastTicket.ticketNumber.match(/^TKT-(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }
  
    return `TKT-${String(nextNumber).padStart(4, '0')}`
  }
}
