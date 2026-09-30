import os

path = r'server/src/attachments/attachment.routes.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import { authMiddleware } from \"../middlewares/auth.middleware.js\";', 'import { requireAuth, requireRole } from \"../middleware/auth.js\";')
content = content.replace('attachmentRouter.use(authMiddleware);', 'attachmentRouter.use(requireAuth, requireRole(\"REQUESTER\"));')
content = content.replace('attachmentRouter.get(\"/attachments/:id/download\", authMiddleware, downloadAttachment);', 'attachmentRouter.get(\"/attachments/:id/download\", downloadAttachment);')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done attachment.routes.ts')
