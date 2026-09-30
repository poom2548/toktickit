import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

/**
 * Hash a plaintext password. Never store the plaintext result.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS)
}

/**
 * Compare a plaintext candidate against a stored bcrypt hash.
 * Returns true if they match.
 */
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash)
}

/**
 * Validate password strength rules.
 * Returns an array of error messages (empty = valid).
 * Rules (must match what is defined in docs/lab-03/specification.md):
 *   - Minimum 8 characters
 *   - At least one uppercase letter
 *   - At least one lowercase letter
 *   - At least one digit
 */
export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = []
  if (password.length < 8) errors.push('Password must be at least 8 characters long.')
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter.')
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter.')
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one digit.')
  return errors
}
