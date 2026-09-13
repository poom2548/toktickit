import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const EXPIRY = process.env.JWT_EXPIRY || '24h'

export interface TokenPayload {
  userId: string
  role: string
}

export function signToken(payload: TokenPayload): string {
  // Use process.env.JWT_SECRET directly in case it is loaded late
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
}
