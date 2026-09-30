import os

path = r'server/src/tickets/ticket.routes.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import { authMiddleware } from \"../middlewares/auth.middleware.js\";', 'import { requireAuth, requireRole } from \"../middleware/auth.js\";')
content = content.replace('ticketRouter.use(authMiddleware);', '')
content = content.replace('ticketRouter.get(\"/\", getTickets);', 'ticketRouter.get(\"/\", requireAuth, requireRole(\"REQUESTER\"), getTickets);')
content = content.replace('ticketRouter.post(\"/\", createTicket);', 'ticketRouter.post(\"/\", requireAuth, requireRole(\"REQUESTER\"), createTicket);')
content = content.replace('ticketRouter.get(\"/:id\", getTicketById);', 'ticketRouter.get(\"/:id\", requireAuth, requireRole(\"REQUESTER\"), getTicketById);')
content = content.replace('import { getTickets, createTicket, getTicketById } from \"./ticket.controller.js\";', 'import { getTickets, createTicket, getTicketById, postComment, getComments, setResolvedFlag, postNote, getNotes } from \"./ticket.controller.js\";')

add_routes = \"\"\"
ticketRouter.post(\"/:id/comments\", requireAuth, postComment);
ticketRouter.get(\"/:id/comments\", requireAuth, getComments);
ticketRouter.patch(\"/:id/resolved-flag\", requireAuth, requireRole(\"REQUESTER\"), setResolvedFlag);
ticketRouter.post(\"/:id/notes\", requireAuth, requireRole(\"IT_STAFF\", \"ADMINISTRATOR\"), postNote);
ticketRouter.get(\"/:id/notes\", requireAuth, requireRole(\"IT_STAFF\", \"ADMINISTRATOR\"), getNotes);
\"\"\"
if 'postComment' not in content:
    content += add_routes

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done ticket.routes.ts')
