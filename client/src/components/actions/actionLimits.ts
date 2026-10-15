/**
 * Maximum lengths accepted by the Actions Taken API (characters, measured
 * after trimming). Defined once and shared by the create and edit forms.
 */
export const ACTION_LIMITS = {
  description: 2000,
  result: 2000,
  followUpNote: 1000,
  attachmentNotes: 1000,
} as const

export type ActionLimitField = keyof typeof ACTION_LIMITS

const FIELD_LABELS: Record<ActionLimitField, string> = {
  description: 'คำอธิบาย',
  result: 'ผลลัพธ์',
  followUpNote: 'บันทึกการติดตามผล',
  attachmentNotes: 'บันทึกไฟล์แนบ',
}

/** Returns the visible error for an over-long value, or undefined when it fits. */
export function lengthError(field: ActionLimitField, value: string): string | undefined {
  const limit = ACTION_LIMITS[field]
  if (value.trim().length > limit) {
    return `${FIELD_LABELS[field]}ความยาวเกินกำหนด (ไม่เกิน ${limit} ตัวอักษร)`
  }
  return undefined
}
