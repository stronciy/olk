import { pool } from "@/lib/db"
import { ok, fail } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationAbout (id INT PRIMARY KEY, text TEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [rows]: any = await conn.query("SELECT * FROM InformationAbout WHERE id = 1")
      if (!rows.length) {
        await conn.query("INSERT INTO InformationAbout (id, text, updatedAt) VALUES (1, '', NOW())")
        return ok(req, { about: { text: "" } })
      }
      return ok(req, { about: { text: rows[0].text || "" } })
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}

export async function PUT(req: Request) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const body = await req.json()
    const schema = z.object({ text: z.string().default("") })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const { text } = parsed.data
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationAbout (id INT PRIMARY KEY, text TEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      await conn.query("INSERT INTO InformationAbout (id, text, updatedAt) VALUES (1, ?, NOW()) ON DUPLICATE KEY UPDATE text = VALUES(text), updatedAt = NOW()", [text])
      return ok(req, { saved: true }, "Updated")
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}

