import { pool } from "@/lib/db"
import { ok, fail } from "@/lib/api"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const conn = await pool.getConnection()
    try {
      await conn.query("SELECT 1")
    } finally {
      conn.release()
    }
    return ok(req, { database: { status: "ok" } }, "Health OK")
  } catch (e: any) {
    return fail(req, 503, "SERVICE_UNAVAILABLE", "Database error", { type: "DatabaseError", details: e?.message })
  }
}

