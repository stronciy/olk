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
        "CREATE TABLE IF NOT EXISTS InformationAwards (id INT AUTO_INCREMENT PRIMARY KEY, year INT, title VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [rows]: any = await conn.query("SELECT * FROM InformationAwards ORDER BY position ASC, id ASC")
      if (!rows.length) {
        const seed: Array<{ year: string; title: string }> = [
          { year: "2019", title: "Elle Decoration International Design Award Ukraine – winner — “Floor covering”, Synchronicity carpet" },
          { year: "2019", title: "Art Laguna Prize – Finalist" },
          { year: "2017", title: "London Art Biennale – winner" },
          { year: "2017", title: "Royal Arts Prize, Shortlisted Artists, London, UK – shortlisted" },
          { year: "2017", title: "Royal Art Prize – shortlisted" },
          { year: "2017", title: "London Art Biennale – winner" },
          { year: "—", title: "Art Laguna Prize – finalist" },
          { year: "—", title: "EDIDA – winner" },
        ]
        for (let i = 0; i < seed.length; i++) {
          const it = seed[i]
          const y = Number(it.year)
          await conn.query("INSERT INTO InformationAwards (year, title, position, updatedAt) VALUES (?, ?, ?, NOW())", [
            Number.isFinite(y) ? y : null,
            it.title,
            i,
          ])
        }
        const [ret]: any = await conn.query("SELECT * FROM InformationAwards ORDER BY position ASC, id ASC")
        return ok(req, { awards: ret })
      }
      return ok(req, { awards: rows })
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
      awards: z.array(z.object({ year: z.union([z.number().int().min(0), z.null()]), title: z.string().min(1), position: z.number().int().nonnegative().optional() })),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const arr = parsed.data.awards
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationAwards (id INT AUTO_INCREMENT PRIMARY KEY, year INT, title VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      await conn.beginTransaction()
      await conn.query("DELETE FROM InformationAwards")
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        await conn.query("INSERT INTO InformationAwards (year, title, position, updatedAt) VALUES (?, ?, ?, NOW())", [it.year, it.title, it.position ?? i])
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
