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
        "CREATE TABLE IF NOT EXISTS InformationSolo (id INT AUTO_INCREMENT PRIMARY KEY, year INT, title VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [rows]: any = await conn.query("SELECT * FROM InformationSolo ORDER BY position ASC, id ASC")
      if (!rows.length) {
        const seed: Array<{ year: string; title: string }> = [
          { year: "2020", title: "Solo exhibition, on the occasion of the 27th Aniversary of the Independence of Ukraine. Gothic Hall, Brussel, Belgium" },
          { year: "2018", title: "Non-existent tribes, Gallery Bursa, Kyiv, Ukraine. Textile sculptures, installations, video art" },
          { year: "2017", title: "Find Your tribe and love them hard solo exhibition, Invogue Gallery, Odessa, Ukraine. Photo, textile art, tapestries" },
          { year: "2017", title: "Art Ukraine Gallery “Quasi-Evolution”, Kyiv, Ukraine. Tapestries" },
          { year: "2016", title: "Soul Searching, Bulgari, Kyiv, Ukraine" },
          { year: "2016", title: "Soul Searching, Bogomolets National Medical University, Kyiv, Ukraine" },
          { year: "2012", title: "Great expectations, FineArt Gallery, Kyiv, Ukraine" },
          { year: "2011", title: "Warlike feminism, FineArt Gallery, Kyiv, Ukraine" },
          { year: "2010", title: "Schastiye (Happiness) Luxury Gallery SadyPobedy, Odessa, Ukraine" },
          { year: "2010", title: "Screenshot, Arsenal, Kyiv, Ukraine" },
          { year: "2009", title: "SotsCapitalism, Ukrainian House, Kyiv, Ukraine" },
        ]
        for (let i = 0; i < seed.length; i++) {
          const it = seed[i]
          const y = Number(it.year)
          await conn.query("INSERT INTO InformationSolo (year, title, position, updatedAt) VALUES (?, ?, ?, NOW())", [
            Number.isFinite(y) ? y : null,
            it.title,
            i,
          ])
        }
        const [ret]: any = await conn.query("SELECT * FROM InformationSolo ORDER BY position ASC, id ASC")
        return ok(req, { solo: ret })
      }
      return ok(req, { solo: rows })
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
      solo: z.array(z.object({ year: z.union([z.number().int().min(0), z.null()]), title: z.string().min(1), position: z.number().int().nonnegative().optional() })),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const arr = parsed.data.solo
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationSolo (id INT AUTO_INCREMENT PRIMARY KEY, year INT, title VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      await conn.beginTransaction()
      await conn.query("DELETE FROM InformationSolo")
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        await conn.query("INSERT INTO InformationSolo (year, title, position, updatedAt) VALUES (?, ?, ?, NOW())", [it.year, it.title, it.position ?? i])
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
