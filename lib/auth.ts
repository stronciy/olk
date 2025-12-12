import crypto from "crypto"

function getSecret() {
  const s = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || ""
  return s
}

export function createAdminSession(userId: string) {
  const secret = getSecret()
  const payload = `${userId}:${Date.now()}`
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return `${payload}.${sig}`
}

export function verifyAdminSession(token?: string) {
  if (!token) return false
  const secret = getSecret()
  const parts = token.split(".")
  if (parts.length !== 2) return false
  const payload = parts[0]
  const sig = parts[1]
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  if (sig !== expected) return false
  const ts = Number(payload.split(":")[1] || 0)
  if (!ts) return false
  const maxAgeMs = 24 * 60 * 60 * 1000
  return Date.now() - ts < maxAgeMs
}

export function requireAdmin(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)admin_session=([^;]+)/)
  const token = m ? decodeURIComponent(m[1]) : undefined
  return verifyAdminSession(token)
}

export function getAdminUsernameFromToken(token?: string) {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const payload = parts[0]
  const username = payload.split(":")[0] || null
  return username || null
}

export function getAdminUsername(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)admin_session=([^;]+)/)
  const token = m ? decodeURIComponent(m[1]) : undefined
  return getAdminUsernameFromToken(token)
}
