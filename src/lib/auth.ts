import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const COOKIE_NAME = "bills-session"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET não está definido")
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

export async function getSession(): Promise<Record<string, unknown> | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}

export function validatePassword(input: string): boolean {
  const password = process.env.AUTH_PASSWORD
  if (!password) throw new Error("AUTH_PASSWORD não está definido")
  return input === password
}

export { COOKIE_NAME, COOKIE_MAX_AGE }
