import { pool } from "@/lib/db"
import { ok, fail } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get("q") || "").trim()
    const limitParam = url.searchParams.get("limit")
    const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam) || 100)) : undefined
    const offset = Math.max(0, Number(url.searchParams.get("offset") || "0") || 0)
    const sort = (url.searchParams.get("sort") || "position").toLowerCase()
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationWebsites (id INT AUTO_INCREMENT PRIMARY KEY, url TEXT, label VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const where = q ? "WHERE (LOWER(url) LIKE ? OR LOWER(label) LIKE ?)" : ""
      const order =
        sort === "label"
          ? "ORDER BY label ASC, id ASC"
          : sort === "updated"
          ? "ORDER BY updatedAt DESC, id DESC"
          : "ORDER BY position ASC, id ASC"
      const args: any[] = []
      if (q) {
        const s = `%${q.toLowerCase()}%`
        args.push(s, s)
      }
      let sql = `SELECT * FROM InformationWebsites ${where} ${order}`
      if (typeof limit !== "undefined") {
        sql += " LIMIT ? OFFSET ?"
        args.push(limit, offset)
      }
      const [rows]: any = await conn.query(sql, args)
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
        const res = ok(req, { websites: ret })
        res.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
        return res
      }
      const res = ok(req, { websites: rows })
      res.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
      return res
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
      const res = ok(req, { saved: arr.length }, "Updated")
      res.headers.set("Cache-Control", "no-store")
      return res
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

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const body = await req.json()
    const schema = z.object({ url: z.string().min(1), label: z.string().default("") })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationWebsites (id INT AUTO_INCREMENT PRIMARY KEY, url TEXT, label VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [countRows]: any = await conn.query("SELECT COUNT(*) as c FROM InformationWebsites")
      const pos = Number(countRows?.[0]?.c || 0)
      await conn.query("INSERT INTO InformationWebsites (url, label, position, updatedAt) VALUES (?, ?, ?, NOW())", [parsed.data.url, parsed.data.label, pos])
      const res = ok(req, { created: 1 }, "Created", "SUCCESS", 201)
      res.headers.set("Cache-Control", "no-store")
      return res
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}

export async function DELETE(req: Request) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const url = new URL(req.url)
    const id = Number(url.searchParams.get("id") || "0")
    if (!Number.isFinite(id) || id <= 0) return fail(req, 400, "VALIDATION_ERROR", "Invalid id", { type: "ValidationError" })
    const conn = await pool.getConnection()
    try {
      await conn.query("DELETE FROM InformationWebsites WHERE id = ?", [id])
      const res = ok(req, { deleted: 1 }, "Deleted", "SUCCESS", 200)
      res.headers.set("Cache-Control", "no-store")
      return res
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}

export async function PATCH(req: Request) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const body = await req.json()
    const schema = z.object({
      ids: z.array(z.number().int().positive()).optional(),
      update: z.object({ id: z.number().int().positive(), url: z.string().min(1).optional(), label: z.string().optional() }).optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationWebsites (id INT AUTO_INCREMENT PRIMARY KEY, url TEXT, label VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      if (parsed.data.ids && parsed.data.ids.length) {
        for (let i = 0; i < parsed.data.ids.length; i++) {
          const id = parsed.data.ids[i]
          await conn.query("UPDATE InformationWebsites SET position = ?, updatedAt = NOW() WHERE id = ?", [i, id])
        }
      }
      if (parsed.data.update) {
        const { id, url, label } = parsed.data.update
        const sets: string[] = []
        const args: any[] = []
        if (typeof url === "string") { sets.push("url = ?"); args.push(url) }
        if (typeof label === "string") { sets.push("label = ?"); args.push(label) }
        if (sets.length) {
          args.push(id)
          await conn.query(`UPDATE InformationWebsites SET ${sets.join(", ")}, updatedAt = NOW() WHERE id = ?`, args)
        }
      }
      const res = ok(req, { updated: true }, "Updated")
      res.headers.set("Cache-Control", "no-store")
      return res
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
