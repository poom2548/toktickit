import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const EXPIRY = process.env.JWT_EXPIRY || '24h'

export interface TokenPayload {
  userId: string
  role: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: EXPIRY as jwt.SignOptions['expiresIn'] })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
}
