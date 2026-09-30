import os
import re

path = r'server/src/attachments/attachment.controller.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace res.locals.requesterId with req.user!.id
content = content.replace('String(res.locals.requesterId)', 'req.user!.id')

# Fix assertTicketOwnership
assert_old = '''  if (!ticket) {
    const err: AppError = Object.assign(new Error("Ticket not found"), { status: 404 });
    throw err;
  }

  if (ticket.requesterId !== String(requesterId)) {
    const err: AppError = Object.assign(
      new Error("Forbidden: you do not own this ticket"),
      { status: 403 }
    );
    throw err;
  }'''
assert_new = '''  if (!ticket || ticket.requesterId !== String(requesterId)) {
    const err: AppError = Object.assign(
      new Error("Access denied."),
      { status: 403 }
    );
    throw err;
  }'''
content = content.replace(assert_old, assert_new)

# Fix downloadAttachment 404
dl_old = '''    if (!attachment) {
      const err: AppError = Object.assign(new Error("Attachment not found"), { status: 404 });
      return next(err);
    }'''
dl_new = '''    if (!attachment) {
      const err: AppError = Object.assign(new Error("Access denied."), { status: 403 });
      return next(err);
    }'''
content = content.replace(dl_old, dl_new)

# Fix removeAttachment 404
rm_old = '''    if (!attachment) {
      const err: AppError = Object.assign(new Error("Attachment not found"), { status: 404 });
      return next(err);
    }'''
rm_new = '''    if (!attachment) {
      const err: AppError = Object.assign(new Error("Access denied."), { status: 403 });
      return next(err);
    }'''
content = content.replace(rm_old, rm_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done attachment.controller.ts')
