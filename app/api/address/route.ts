import { pool } from "@/lib/db"
import { ok, fail } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

export const runtime = "nodejs"

const ensureTable = async (conn: any) => {
  await conn.query(
    "CREATE TABLE IF NOT EXISTS Address (id INT AUTO_INCREMENT PRIMARY KEY, line1 VARCHAR(255), line2 VARCHAR(255), line3 VARCHAR(255), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
  )
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limitParam = url.searchParams.get("limit")
    const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam) || 0)) : undefined
    const offset = Math.max(0, Number(url.searchParams.get("offset") || "0") || 0)
    const conn = await pool.getConnection()
    try {
      await ensureTable(conn)
      let sql = "SELECT * FROM Address ORDER BY updatedAt DESC, id DESC"
      const args: any[] = []
      if (typeof limit !== "undefined") {
        sql += " LIMIT ? OFFSET ?"
        args.push(limit, offset)
      }
      const [rows]: any = await conn.query(sql, args)
      return ok(req, { addresses: rows })
    } finally {
      conn.release()
    }
  } catch (e: any) {
    console.error("Address GET failed", e)
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const body = await req.json()
    const schema = z.object({
      line1: z.string().min(1),
      line2: z.string().default(""),
      line3: z.string().default(""),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const v = parsed.data
    const conn = await pool.getConnection()
    try {
      await ensureTable(conn)
      await conn.query("INSERT INTO Address (line1, line2, line3, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())", [v.line1, v.line2, v.line3])
      return ok(req, { created: true }, "Created", "SUCCESS", 201)
    } finally {
      conn.release()
    }
  } catch (e: any) {
    console.error("Address POST failed", e)
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
