export interface NormalizedApiError {
  code?: string
  message: string
  fields?: Record<string, string>
  currentVersion?: number
  reason?: string
  status: number
  isConflict: boolean
  isLocked: boolean
  isGateFailed: boolean
  isValidation: boolean
  isNetwork: boolean
}

const MAX_SERVER_TEXT = 300

export const SAFE_MESSAGES = {
  validation: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่',
  unauthenticated: 'กรุณาเข้าสู่ระบบอีกครั้ง',
  forbidden: 'คุณไม่มีสิทธิ์ดำเนินการนี้',
  notFound: 'ไม่พบข้อมูลที่ต้องการ',
  conflict: 'ข้อมูลถูกเปลี่ยนแปลงแล้ว กรุณาโหลดซ้ำ',
  server: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง',
  network: 'เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
  generic: 'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง',
} as const

// Messages for the known Lab 4 error codes.
const CODE_MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: 'ข้อมูลที่ระบุไม่ถูกต้อง กรุณาตรวจสอบข้อมูลในฟอร์ม',
  CONFLICT: 'ตั๋วถูกอัปเดตโดยผู้อื่น (The ticket was modified by another user.) กรุณาโหลดซ้ำเพื่อรับข้อมูลล่าสุด',
  TICKET_LOCKED: 'ตั๋วอยู่ในสถานะปิดใช้งาน (Closed หรือ Cancelled) ไม่สามารถดำเนินการต่อได้',
  INVALID_TRANSITION: 'ไม่สามารถเปลี่ยนสถานะไปยังสถานะที่เลือกได้',
  RESOLUTION_GATE_FAILED: 'ไม่ผ่านเงื่อนไขการปิดงาน',
  INVALID_ASSIGNEE: 'ไม่สามารถมอบหมายให้ผู้ใช้นี้ได้ (เฉพาะ IT Staff หรือ Administrator ที่ยังทำงานอยู่เท่านั้น)',
  IDEMPOTENCY_KEY_REUSED: 'คำขอถูกส่งซ้ำด้วยข้อมูลที่แตกต่างกัน กรุณาลองใหม่อีกครั้ง',
  INVALID_TICKET_STATE: 'การดำเนินการนี้ไม่ได้รับอนุญาตในสถานะปัจจุบันของตั๋ว',
  FORBIDDEN: SAFE_MESSAGES.forbidden,
  NOT_FOUND: SAFE_MESSAGES.notFound,
  UNAUTHENTICATED: SAFE_MESSAGES.unauthenticated,
  INTERNAL_ERROR: SAFE_MESSAGES.server,
}

// The specification allows the server "reason" to be shown for these codes only.
const REASON_CODES = new Set(['RESOLUTION_GATE_FAILED', 'INVALID_TRANSITION', 'INVALID_TICKET_STATE'])

/** Plain text only: no markup, no control characters, capped length. */
export function safeText(value: unknown, max = MAX_SERVER_TEXT): string | undefined {
  if (typeof value !== 'string') return undefined
  const cleaned = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return undefined
  return cleaned.length > max ? cleaned.slice(0, max) + '…' : cleaned
}

function messageForStatus(status: number): string {
  if (status === 400 || status === 422) return SAFE_MESSAGES.validation
  if (status === 401) return SAFE_MESSAGES.unauthenticated
  if (status === 403) return SAFE_MESSAGES.forbidden
  if (status === 404) return SAFE_MESSAGES.notFound
  if (status === 409) return SAFE_MESSAGES.conflict
  if (status >= 500 && status <= 599) return SAFE_MESSAGES.server
  return SAFE_MESSAGES.generic
}

function safeFields(fields: unknown): Record<string, string> | undefined {
  if (!fields || typeof fields !== 'object') return undefined
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(fields as Record<string, unknown>)) {
    const text = safeText(value)
    if (text) out[key] = text
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function build(
  status: number,
  message: string,
  extra: Partial<NormalizedApiError> = {}
): NormalizedApiError {
  const code = extra.code
  return {
    message,
    status,
    isConflict: code === 'CONFLICT' || status === 409,
    isLocked: code === 'TICKET_LOCKED',
    isGateFailed: code === 'RESOLUTION_GATE_FAILED',
    isValidation: code === 'VALIDATION_FAILED' || status === 422,
    isNetwork: false,
    ...extra,
  }
}

/**
 * Turns a failed HTTP response into an error that is safe to show. The raw
 * server string is never copied into the result: only mapped messages, the
 * HTTP status, the error code and (for the codes the specification names)
 * a capped plain-text reason or field messages.
 */
export function parseApiError(res: { status: number }, body: any): NormalizedApiError {
  const status = res.status

  // Lab 4 envelope: { error: { code, message, fields?, currentVersion?, reason? } }
  if (body && typeof body === 'object' && body.error && typeof body.error === 'object') {
    const errObj = body.error
    const code: string | undefined = typeof errObj.code === 'string' ? errObj.code : undefined
    const reason = code && REASON_CODES.has(code) ? safeText(errObj.reason) : undefined
    const message = reason || (code && CODE_MESSAGES[code]) || messageForStatus(status)
    return build(status, message, {
      code,
      reason,
      fields: safeFields(errObj.fields),
      currentVersion: typeof errObj.currentVersion === 'number' ? errObj.currentVersion : undefined,
    })
  }

  // Lab 3 shape: { error: "text" }. The text is only used to pick a mapped message.
  if (body && typeof body === 'object' && typeof body.error === 'string') {
    const lower = body.error.toLowerCase()
    let message = messageForStatus(status)
    let isLocked = false
    let isConflict = status === 409
    if (lower.includes('inactive') || lower.includes('requester as ticket owner')) {
      message = CODE_MESSAGES.INVALID_ASSIGNEE
    } else if (lower.includes('locked')) {
      message = CODE_MESSAGES.TICKET_LOCKED
      isLocked = true
    } else if (lower.includes('conflict')) {
      message = CODE_MESSAGES.CONFLICT
      isConflict = true
    }
    return build(status, message, { isLocked, isConflict })
  }

  // Anything else (empty, plain text, HTML, invalid JSON): map by status only.
  return build(status, messageForStatus(status))
}

/** The error shown when the request never reached the server. */
export function networkError(): NormalizedApiError {
  return build(0, SAFE_MESSAGES.network, { isNetwork: true })
}

/** Normalizes anything thrown by the API client into a safe error. */
export function toApiError(err: unknown): NormalizedApiError {
  if (err && typeof err === 'object' && 'isNetwork' in err && 'isConflict' in err && 'message' in err) {
    return err as NormalizedApiError
  }
  return build(0, SAFE_MESSAGES.generic)
}

/** fetch that reports a network failure as a safe error instead of the raw exception. */
export async function safeFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch {
    throw networkError()
  }
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'idem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
}
