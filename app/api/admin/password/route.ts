import { pool } from "@/lib/db"
import { requireAdmin, getAdminUsername } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { ok, fail } from "@/lib/api"
import type { PoolConnection } from "mysql2/promise"

export const runtime = "nodejs"

export async function PUT(req: Request) {
  if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
  const username = getAdminUsername(req)
  if (!username) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
  const csrfHeader = req.headers.get("x-csrf-token") || ""
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
  const csrfCookie = m ? decodeURIComponent(m[1]) : ""
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return fail(req, 403, "FORBIDDEN", "CSRF validation failed", { type: "AuthorizationError" })
  }
  const body = await req.json()
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .refine((s) => /[A-Z]/.test(s), "Must include at least one uppercase letter")
      .refine((s) => /[a-z]/.test(s), "Must include at least one lowercase letter")
      .refine((s) => /\d/.test(s), "Must include at least one digit"),
    confirmPassword: z.string().min(8),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
  const { currentPassword, newPassword } = parsed.data
  const conn = await pool.getConnection()
  try {
    await ensureTables(conn)
    const [rows]: any = await conn.query("SELECT * FROM Users WHERE username = ? LIMIT 1", [username])
    if (!rows.length) return fail(req, 404, "NOT_FOUND", "User not found", { type: "NotFoundError" })
    const user = rows[0]
    // rate limit: max 10 requests per minute per user
    const [attempts]: any = await conn.query("SELECT COUNT(*) AS cnt FROM PasswordChangeAttempts WHERE userId = ? AND createdAt > (NOW() - INTERVAL 1 MINUTE)", [user.id])
    if (Number(attempts?.[0]?.cnt || 0) >= 10) {
      const res = fail(req, 429, "TOO_MANY_REQUESTS", "Rate limit exceeded", { type: "RateLimitError" })
      res.headers.set("Retry-After", "60")
      return res
    }
    const okPwd = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!okPwd) return fail(req, 401, "UNAUTHORIZED", "Invalid current password", { type: "AuthenticationError" })
    // disallow using the same or previous passwords
    const [history]: any = await conn.query("SELECT passwordHash FROM UserPasswordHistory WHERE userId = ? ORDER BY id DESC LIMIT 5", [user.id])
    const previousHashes: string[] = [user.passwordHash, ...history.map((h: any) => String(h.passwordHash || ""))].filter(Boolean)
    for (const h of previousHashes) {
      const same = await bcrypt.compare(newPassword, h)
      if (same) return fail(req, 409, "CONFLICT", "New password must differ from previous passwords", { type: "ConflictError" })
    }
    // perform update in transaction
    await conn.beginTransaction()
    const newHash = await bcrypt.hash(newPassword, 10)
    // store current hash into history before updating
    await conn.query("INSERT INTO UserPasswordHistory (userId, passwordHash) VALUES (?, ?)", [user.id, user.passwordHash])
    await conn.query("UPDATE Users SET passwordHash = ? WHERE id = ?", [newHash, user.id])
    // trim history to last 5
    await conn.query("DELETE FROM UserPasswordHistory WHERE userId = ? AND id NOT IN (SELECT id FROM (SELECT id FROM UserPasswordHistory WHERE userId = ? ORDER BY id DESC LIMIT 5) AS t)", [user.id, user.id])
    // record attempt
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown"
    await conn.query("INSERT INTO PasswordChangeAttempts (userId, ip) VALUES (?, ?)", [user.id, ip])
    await conn.commit()
    return ok(req, {}, "Password updated")
  } finally {
    conn.release()
  }
}

async function ensureTables(conn: PoolConnection) {
  await conn.query(
    "CREATE TABLE IF NOT EXISTS Users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) UNIQUE, passwordHash VARCHAR(255), role VARCHAR(50), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
  )
  await conn.query(
    "CREATE TABLE IF NOT EXISTS UserPasswordHistory (id INT AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL, passwordHash VARCHAR(255) NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX(userId))"
  )
  await conn.query(
    "CREATE TABLE IF NOT EXISTS PasswordChangeAttempts (id INT AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL, ip VARCHAR(255) NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX(userId), INDEX(createdAt), INDEX(ip))"
  )
}
