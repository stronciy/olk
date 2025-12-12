import { NextResponse } from "next/server"
import { createAdminSession } from "@/lib/auth"
import { pool } from "@/lib/db"
import bcrypt from "bcryptjs"
import { ok, fail } from "@/lib/api"
import crypto from "crypto"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const username = String(body.username || "")
    const password = String(body.password || "")
    if (!username || !password) return fail(req, 400, "VALIDATION_ERROR", "Missing credentials", { type: "ValidationError" })
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS Users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) UNIQUE, passwordHash VARCHAR(255), role VARCHAR(50), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [rows]: any = await conn.query("SELECT * FROM Users WHERE username = ? LIMIT 1", [username])
      if (!rows.length) return fail(req, 401, "UNAUTHORIZED", "Invalid credentials", { type: "AuthenticationError" })
      const user = rows[0]
      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) return fail(req, 401, "UNAUTHORIZED", "Invalid credentials", { type: "AuthenticationError" })
      const token = createAdminSession(user.username)
      const res = ok(req, { user: { username: user.username, role: user.role } }, "Login successful")
      res.cookies.set("admin_session", token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60,
      })
      const csrf = crypto.randomBytes(16).toString("hex")
      res.cookies.set("csrf_token", csrf, {
        httpOnly: false,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60,
      })
      return res
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
