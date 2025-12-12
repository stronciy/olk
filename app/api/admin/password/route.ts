import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { requireAdmin, getAdminUsername } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { ok, fail } from "@/lib/api"

export const runtime = "nodejs"

export async function PUT(req: Request) {
  if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
  const username = getAdminUsername(req)
  if (!username) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
  const body = await req.json()
  const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6) })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
  const { currentPassword, newPassword } = parsed.data
  const conn = await pool.getConnection()
  try {
    const [rows]: any = await conn.query("SELECT * FROM Users WHERE username = ? LIMIT 1", [username])
    if (!rows.length) return fail(req, 404, "NOT_FOUND", "User not found", { type: "NotFoundError" })
    const user = rows[0]
    const okPwd = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!okPwd) return fail(req, 401, "UNAUTHORIZED", "Invalid current password", { type: "AuthenticationError" })
    const newHash = await bcrypt.hash(newPassword, 10)
    await conn.query("UPDATE Users SET passwordHash = ? WHERE id = ?", [newHash, user.id])
    return ok(req, {}, "Password updated")
  } finally {
    conn.release()
  }
}
