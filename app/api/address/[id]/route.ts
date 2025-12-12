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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id) || id <= 0) return fail(req, 400, "VALIDATION_ERROR", "Invalid id", { type: "ValidationError" })
    const conn = await pool.getConnection()
    try {
      await ensureTable(conn)
      const [rows]: any = await conn.query("SELECT * FROM Address WHERE id = ?", [id])
      if (!rows.length) return fail(req, 404, "NOT_FOUND", "Address not found", { type: "NotFoundError" })
      return ok(req, { address: rows[0] })
    } finally {
      conn.release()
    }
  } catch (e: any) {
    console.error("Address GET by id failed", e)
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const id = Number(params.id)
    if (!Number.isFinite(id) || id <= 0) return fail(req, 400, "VALIDATION_ERROR", "Invalid id", { type: "ValidationError" })
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
      const [rows]: any = await conn.query("SELECT id FROM Address WHERE id = ?", [id])
      if (!rows.length) return fail(req, 404, "NOT_FOUND", "Address not found", { type: "NotFoundError" })
      await conn.query("UPDATE Address SET line1 = ?, line2 = ?, line3 = ?, updatedAt = NOW() WHERE id = ?", [v.line1, v.line2, v.line3, id])
      return ok(req, { updated: true }, "Updated")
    } finally {
      conn.release()
    }
  } catch (e: any) {
    console.error("Address PUT failed", e)
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const id = Number(params.id)
    if (!Number.isFinite(id) || id <= 0) return fail(req, 400, "VALIDATION_ERROR", "Invalid id", { type: "ValidationError" })
    const conn = await pool.getConnection()
    try {
      await ensureTable(conn)
      await conn.query("DELETE FROM Address WHERE id = ?", [id])
      return ok(req, { deleted: true }, "Deleted")
    } finally {
      conn.release()
    }
  } catch (e: any) {
    console.error("Address DELETE failed", e)
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
