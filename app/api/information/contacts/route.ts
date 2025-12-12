import { pool } from "@/lib/db"
import { ok, fail } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationContacts (id INT PRIMARY KEY, email VARCHAR(255), phone VARCHAR(255), address TEXT, instagram VARCHAR(255), facebook VARCHAR(255), website VARCHAR(255), updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [rows]: any = await conn.query("SELECT * FROM InformationContacts WHERE id = 1")
      if (!rows.length) {
        await conn.query("INSERT INTO InformationContacts (id, email, phone, address, instagram, facebook, website, updatedAt) VALUES (1, '', '', '', '', '', '', NOW())")
        return ok(req, { contacts: { email: "", phone: "", address: "", instagram: "", facebook: "", website: "" } })
      }
      const r = rows[0]
      return ok(req, { contacts: { email: r.email || "", phone: r.phone || "", address: r.address || "", instagram: r.instagram || "", facebook: r.facebook || "", website: r.website || "" } })
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
    const schema = z.object({
      email: z.string().default(""),
      phone: z.string().default(""),
      address: z.string().default(""),
      instagram: z.string().default(""),
      facebook: z.string().default(""),
      website: z.string().default(""),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const v = parsed.data
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationContacts (id INT PRIMARY KEY, email VARCHAR(255), phone VARCHAR(255), address TEXT, instagram VARCHAR(255), facebook VARCHAR(255), website VARCHAR(255), updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      await conn.query("INSERT INTO InformationContacts (id, email, phone, address, instagram, facebook, website, updatedAt) VALUES (1, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE email=VALUES(email), phone=VALUES(phone), address=VALUES(address), instagram=VALUES(instagram), facebook=VALUES(facebook), website=VALUES(website), updatedAt=NOW()", [v.email, v.phone, v.address, v.instagram, v.facebook, v.website])
      return ok(req, { saved: true }, "Updated")
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}

