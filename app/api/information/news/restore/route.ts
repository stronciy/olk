import { pool } from "@/lib/db"
import { ok, fail } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const body = await req.json()
    const schema = z.object({ id: z.number().int().positive() })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const conn = await pool.getConnection()
    try {
      await conn.query("CREATE TABLE IF NOT EXISTS InformationNewsTrash (newsId INT PRIMARY KEY, deletedAt DATETIME DEFAULT CURRENT_TIMESTAMP)")
      await conn.query("DELETE FROM InformationNewsTrash WHERE newsId = ?", [parsed.data.id])
      return ok(req, { restored: true }, "Restored")
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
