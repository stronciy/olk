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
        "CREATE TABLE IF NOT EXISTS InformationWebsites (id INT AUTO_INCREMENT PRIMARY KEY, url TEXT, label VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [rows]: any = await conn.query("SELECT * FROM InformationWebsites ORDER BY position ASC, id ASC")
      if (!rows.length) {
        const seed: Array<{ url: string; label: string }> = [
          { url: "https://www.homofaber.com/en/ecollection/oksana-levchenya-207", label: "www.homofaber.com/en/ecollection/oksana-levchenya-207" },
          { url: "https://www.1stdibs.com/dealers/olk-manufactory", label: "www.1stdibs.com/dealers/olk-manufactory" },
          { url: "https://archello.com/olk-manufactory", label: "archello.com/olk-manufactory" },
          { url: "https://artsy.net/artist/oksana-levchenya", label: "artsy.net/artist/oksana-levchenya" },
          { url: "https://artsy.net/show/port-agency-totem-of-recycling-show-by-ukrainian-artist-oksana-levchenya", label: "artsy.net/show/port-agency-totem-of-recycling-show-by-ukrainian-artist-oksana-levchenya" },
        ]
        for (let i = 0; i < seed.length; i++) {
          const it = seed[i]
          await conn.query("INSERT INTO InformationWebsites (url, label, position, updatedAt) VALUES (?, ?, ?, NOW())", [it.url, it.label, i])
        }
        const [ret]: any = await conn.query("SELECT * FROM InformationWebsites ORDER BY position ASC, id ASC")
        return ok(req, { websites: ret })
      }
      return ok(req, { websites: rows })
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
      websites: z.array(z.object({ url: z.string().min(1), label: z.string().default(""), position: z.number().int().nonnegative().optional() })),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const arr = parsed.data.websites
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationWebsites (id INT AUTO_INCREMENT PRIMARY KEY, url TEXT, label VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      await conn.beginTransaction()
      await conn.query("DELETE FROM InformationWebsites")
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        await conn.query("INSERT INTO InformationWebsites (url, label, position, updatedAt) VALUES (?, ?, ?, NOW())", [it.url, it.label, it.position ?? i])
      }
      await conn.commit()
      return ok(req, { saved: arr.length }, "Updated")
    } catch (e) {
      try { await conn.rollback() } catch {}
      throw e
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
