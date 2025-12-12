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
        "CREATE TABLE IF NOT EXISTS InformationGroup (id INT AUTO_INCREMENT PRIMARY KEY, year INT, title VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [rows]: any = await conn.query("SELECT * FROM InformationGroup ORDER BY position ASC, id ASC")
      if (!rows.length) {
        const seed: Array<{ year: string; title: string }> = [
          { year: "2021", title: "Art Fashion Days, Avant-garden Gallery, Kyiv, Ukraine" },
          { year: "2019", title: "Milan Design Week, Modern_ism, Milan, Italy. Ukrainian Object Design" },
          { year: "2019", title: "Revelations, International Fine Craft and Creation Bienale, Grand Paleis, Paris, France. Textile, hand woven tapestry, objects." },
          { year: "2018", title: "Art Laguna Prize 13th edition, finalists show. \"Space cossaks\", Arsenale, Venice, Italy" },
          { year: "2018", title: "Modern_ism, Dutch Design week, Eindhoven, Netherlands. Textile, handwoven kilims" },
          { year: "2017", title: "Royal Arts Prize, Find Your Tribe And Love Them Hard, London, UK" },
          { year: "2017", title: "Lost&Found at Fondamenta degli Incurabili, Venice, Italy" },
          { year: "2017", title: "London Art Biennial 2017, Soul Searching, winner. Gagliardi Gallery, London, UK" },
          { year: "2015", title: "Art Kyiv Contemporary Soul Searching, Mystetskiy Arsenal, Kyiv, Ukraine" },
          { year: "2014", title: "Art Kyiv Contemporary project Greed, Mystetskiy Arsenal, Kyiv, Ukraine" },
          { year: "2013", title: "Art Southampton, NY, USA" },
          { year: "2013", title: "ARTPALMBEACH-2012, Miami, USA" },
          { year: "2012", title: "Art Kyiv Contemporary, Mystetskiy Arsenal, Kyiv, Ukraine" },
          { year: "2012", title: "Kyiv Biennial 2012 - Arsenale 2012, Mystetskiy Arsenal, Kyiv, Ukraine" },
          { year: "2012", title: "Great expectations, FineArt Gallery, Kiev, Ukraine" },
          { year: "2011", title: "Collider Art-Kiev, Arsenal, Kiev, Ukraine" },
          { year: "2010", title: "Screenshot Art-Kiev Contemporary Fair, Arsenal, Kiev, Ukraine" },
          { year: "2010", title: "Diktators for VogdeLenie, Ukrainian House, Kiev, Ukraine" },
          { year: "2010", title: "Participate of \"Ukrainian paradox\", ArtByGeneva Fair, Geneva, Switzerland" },
          { year: "2009", title: "Sotscapitalism Art Kiev, Ukrainian House, Kiev, Ukraine" },
          { year: "2009", title: "Torn World project curated by Adam Nankervis, MuseumMAN, Bereznitska and Partners Gallery, Kiev, Ukraine" },
        ]
        for (let i = 0; i < seed.length; i++) {
          const it = seed[i]
          const y = Number(it.year)
          await conn.query("INSERT INTO InformationGroup (year, title, position, updatedAt) VALUES (?, ?, ?, NOW())", [
            Number.isFinite(y) ? y : null,
            it.title,
            i,
          ])
        }
        const [ret]: any = await conn.query("SELECT * FROM InformationGroup ORDER BY position ASC, id ASC")
        return ok(req, { group: ret })
      }
      return ok(req, { group: rows })
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
      group: z.array(z.object({ year: z.union([z.number().int().min(0), z.null()]), title: z.string().min(1), position: z.number().int().nonnegative().optional() })),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const arr = parsed.data.group
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationGroup (id INT AUTO_INCREMENT PRIMARY KEY, year INT, title VARCHAR(255), position INT DEFAULT 0, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      await conn.beginTransaction()
      await conn.query("DELETE FROM InformationGroup")
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        await conn.query("INSERT INTO InformationGroup (year, title, position, updatedAt) VALUES (?, ?, ?, NOW())", [it.year, it.title, it.position ?? i])
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
