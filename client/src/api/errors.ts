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
}

const SAFE_CODE_MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: 'ข้อมูลที่ระบุไม่ถูกต้อง กรุณาตรวจสอบข้อมูลในฟอร์ม',
  CONFLICT: 'ตั๋วหรือรายการถูกแก้ไขโดยผู้อื่น กรุณาโหลดซ้ำเพื่อรับข้อมูลล่าสุด',
  TICKET_LOCKED: 'ตั๋วอยู่ในสถานะปิดใช้งาน (Closed หรือ Cancelled) ไม่สามารถดำเนินการต่อได้',
  INVALID_TRANSITION: 'ไม่สามารถเปลี่ยนสถานะไปยังสถานะที่เลือกได้',
  RESOLUTION_GATE_FAILED: 'ไม่ผ่านเงื่อนไขการปิดงาน',
  INVALID_ASSIGNEE: 'ไม่สามารถมอบหมายให้ผู้ใช้นี้ได้ (เฉพาะ IT Staff หรือ Administrator ที่ยังทำงานอยู่เท่านั้น)',
  IDEMPOTENCY_KEY_REUSED: 'คำขอถูกส่งซ้ำด้วยข้อมูลที่แตกต่างกัน',
  INVALID_TICKET_STATE: 'การดำเนินการนี้ไม่ได้รับอนุญาตในสถานะปัจจุบันของตั๋ว',
  FORBIDDEN: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
  NOT_FOUND: 'ไม่พบข้อมูลที่ระบุ',
  UNAUTHENTICATED: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ',
  INTERNAL_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
}

export function parseApiError(res: Response, body: any): NormalizedApiError {
  const status = res.status

  // 1. Lab 4 envelope: { error: { code, message, fields?, currentVersion?, reason? } }
  if (body?.error && typeof body.error === 'object') {
    const errObj = body.error
    const code = errObj.code
    const message = errObj.reason || SAFE_CODE_MESSAGES[code] || errObj.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'

    return {
      code,
      message,
      fields: errObj.fields,
      currentVersion: errObj.currentVersion,
      reason: errObj.reason,
      status,
      isConflict: code === 'CONFLICT' || status === 409,
      isLocked: code === 'TICKET_LOCKED',
      isGateFailed: code === 'RESOLUTION_GATE_FAILED',
      isValidation: code === 'VALIDATION_FAILED' || status === 422,
    }
  }

  // 2. Lab 3 shape: { error: "text" }
  if (typeof body?.error === 'string') {
    const rawError = body.error
    let message = 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
    let isConflict = status === 409
    let isLocked = false
    let isValidation = status === 422 || status === 400

    if (rawError.toLowerCase().includes('inactive')) {
      message = SAFE_CODE_MESSAGES.INVALID_ASSIGNEE
    } else if (rawError.toLowerCase().includes('requester as ticket owner')) {
      message = SAFE_CODE_MESSAGES.INVALID_ASSIGNEE
    } else if (rawError.toLowerCase().includes('locked')) {
      message = SAFE_CODE_MESSAGES.TICKET_LOCKED
      isLocked = true
    } else if (rawError.toLowerCase().includes('conflict')) {
      message = SAFE_CODE_MESSAGES.CONFLICT
      isConflict = true
    } else if (status === 403) {
      message = SAFE_CODE_MESSAGES.FORBIDDEN
    } else if (status === 404) {
      message = SAFE_CODE_MESSAGES.NOT_FOUND
    } else {
      message = rawError
    }

    return {
      message,
      status,
      isConflict,
      isLocked,
      isGateFailed: false,
      isValidation,
    }
  }

  // 3. Fallback based on HTTP status
  let message = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
  if (status === 403) message = SAFE_CODE_MESSAGES.FORBIDDEN
  else if (status === 404) message = SAFE_CODE_MESSAGES.NOT_FOUND
  else if (status === 409) message = SAFE_CODE_MESSAGES.CONFLICT

  return {
    message,
    status,
    isConflict: status === 409,
    isLocked: false,
    isGateFailed: false,
    isValidation: status === 422,
  }
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'idem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
}
