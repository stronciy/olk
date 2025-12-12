import { pool } from "@/lib/db"
import { ok, fail } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

export const runtime = "nodejs"

async function ensureNewsSchema(conn: any) {
  const createSql =
    "CREATE TABLE IF NOT EXISTS InformationNews (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), date DATETIME, text TEXT NOT NULL, content MEDIUMTEXT, summary TEXT, draft TINYINT DEFAULT 0, category VARCHAR(64), coverUrl VARCHAR(255), previewUrl VARCHAR(255), position INT DEFAULT 0, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
  const tryEnsure = async () => {
    await conn.query(createSql)
    const [cols]: any = await conn.query("SHOW COLUMNS FROM InformationNews")
    const names = new Set((cols || []).map((c: any) => String(c.Field)))
    if (!names.has("text")) {
      await conn.query("ALTER TABLE InformationNews ADD COLUMN text TEXT NOT NULL AFTER date")
    } else {
      const textCol = (cols || []).find((c: any) => String(c.Field) === "text")
      const nullOk = String(textCol?.Null || "").toUpperCase() === "YES"
      if (nullOk) {
        await conn.query("UPDATE InformationNews SET text = '' WHERE text IS NULL")
        await conn.query("ALTER TABLE InformationNews MODIFY COLUMN text TEXT NOT NULL")
      }
    }
    if (!names.has("content")) {
      await conn.query("ALTER TABLE InformationNews ADD COLUMN content MEDIUMTEXT AFTER text")
    }
    if (!names.has("summary")) {
      await conn.query("ALTER TABLE InformationNews ADD COLUMN summary TEXT AFTER content")
    }
    if (!names.has("draft")) {
      await conn.query("ALTER TABLE InformationNews ADD COLUMN draft TINYINT DEFAULT 0 AFTER summary")
    }
    if (!names.has("category")) {
      await conn.query("ALTER TABLE InformationNews ADD COLUMN category VARCHAR(64) AFTER draft")
    }
    if (!names.has("coverUrl")) {
      await conn.query("ALTER TABLE InformationNews ADD COLUMN coverUrl VARCHAR(255) AFTER category")
    }
    if (!names.has("previewUrl")) {
      await conn.query("ALTER TABLE InformationNews ADD COLUMN previewUrl VARCHAR(255) AFTER coverUrl")
    }
    if (!names.has("position")) {
      await conn.query("ALTER TABLE InformationNews ADD COLUMN position INT DEFAULT 0 AFTER previewUrl")
    }
    if (!names.has("createdAt")) {
      await conn.query("ALTER TABLE InformationNews ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP AFTER position")
    }
    if (!names.has("updatedAt")) {
      await conn.query("ALTER TABLE InformationNews ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt")
    }
    const dateCol = (cols || []).find((c: any) => String(c.Field) === "date")
    const dateType = String(dateCol?.Type || "").toLowerCase()
    if (dateCol && dateType.includes("date") && !dateType.includes("datetime")) {
      await conn.query("ALTER TABLE InformationNews MODIFY COLUMN date DATETIME")
    }
  }
  const repairIfCorrupt = async () => {
    try { await conn.query("REPAIR TABLE InformationNews") } catch {}
    try { await conn.query("ANALYZE TABLE InformationNews") } catch {}
    const ts = Date.now()
    try {
      await conn.query(`RENAME TABLE InformationNews TO InformationNews_corrupt_backup_${ts}`)
    } catch {
      // if rename fails, drop as last resort to restore functionality
      try { await conn.query("DROP TABLE IF EXISTS InformationNews") } catch {}
    }
    await conn.query(createSql)
  }
  try {
    await tryEnsure()
  } catch (e: any) {
    const msg = String(e?.message || "").toLowerCase()
    if (msg.includes("incorrect information in file") || msg.includes(".frm")) {
      await repairIfCorrupt()
    } else {
      throw e
    }
  }
}

function isFrmCorruptError(e: any) {
  const msg = String(e?.message || "").toLowerCase()
  return msg.includes("incorrect information in file") || msg.includes(".frm")
}

async function recreateNewsTable(conn: any) {
  const createSql =
    "CREATE TABLE IF NOT EXISTS InformationNews (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), date DATETIME, text TEXT NOT NULL, content MEDIUMTEXT, summary TEXT, draft TINYINT DEFAULT 0, category VARCHAR(64), coverUrl VARCHAR(255), previewUrl VARCHAR(255), position INT DEFAULT 0, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
  try { await conn.query("DROP TABLE IF EXISTS InformationNews") } catch {}
  await conn.query(createSql)
}

async function runWithRepair<T>(conn: any, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e: any) {
    if (isFrmCorruptError(e)) {
      await recreateNewsTable(conn)
      return await fn()
    }
    throw e
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const includeTrash = (url.searchParams.get("include") || "").toLowerCase() === "trash"
    const noCache = (url.searchParams.get("nocache") || "") === "1"
    const limitParam = url.searchParams.get("limit")
    const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam) || 0)) : undefined
    const offset = Math.max(0, Number(url.searchParams.get("offset") || "0") || 0)
    const sort = (url.searchParams.get("sort") || "position").toLowerCase()
    const conn = await pool.getConnection()
    try {
      await ensureNewsSchema(conn)
      await runWithRepair(conn, async () => {
        await conn.query("CREATE TABLE IF NOT EXISTS InformationNewsRevisions (id INT AUTO_INCREMENT PRIMARY KEY, newsId INT, title VARCHAR(255), date DATETIME, text TEXT, content MEDIUMTEXT, summary TEXT, draft TINYINT, category VARCHAR(64), coverUrl VARCHAR(255), previewUrl VARCHAR(255), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)")
        await conn.query("CREATE TABLE IF NOT EXISTS InformationNewsTrash (newsId INT PRIMARY KEY, deletedAt DATETIME DEFAULT CURRENT_TIMESTAMP)")
      })
      const where = includeTrash ? "" : "WHERE id NOT IN (SELECT newsId FROM InformationNewsTrash)"
      const order = sort === "date" ? "ORDER BY date DESC, id DESC" : sort === "updated" ? "ORDER BY updatedAt DESC, id DESC" : "ORDER BY position ASC, id ASC"
      let sql = `SELECT * FROM InformationNews ${where} ${order}`
      const args: any[] = []
      if (typeof limit !== "undefined") {
        sql += " LIMIT ? OFFSET ?"
        args.push(limit, offset)
      }
      const [rows]: any = await runWithRepair(conn, async () => conn.query(sql, args))
      const res = ok(req, { news: rows })
      res.headers.set("Cache-Control", noCache ? "no-store" : "public, max-age=600, stale-while-revalidate=3600")
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
      news: z.array(z.object({
        title: z.string().min(1),
        date: z.string().min(1),
        text: z.string().min(1).max(250),
        summary: z.string().default(""),
        content: z.string().default(""),
        draft: z.boolean().default(false),
        category: z.string().optional(),
        coverUrl: z.string().optional(),
        previewUrl: z.string().optional(),
        position: z.number().int().nonnegative().optional(),
      })),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const arr = parsed.data.news
    const conn = await pool.getConnection()
    try {
      await ensureNewsSchema(conn)
      await runWithRepair(conn, async () => {
        await conn.beginTransaction()
        await conn.query("DELETE FROM InformationNews")
        for (let i = 0; i < arr.length; i++) {
          const it = arr[i]
          await conn.query("INSERT INTO InformationNews (title, date, text, content, summary, draft, category, coverUrl, previewUrl, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())", [it.title, it.date, it.text, it.content, it.summary, it.draft ? 1 : 0, it.category || null, it.coverUrl || null, it.previewUrl || null, it.position ?? i])
        }
        await conn.commit()
      })
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

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const body = await req.json()
    const schema = z.object({
      title: z.string().min(1),
      date: z.string().min(1),
      text: z.string().min(1).max(250),
      summary: z.string().default(""),
      content: z.string().default(""),
      draft: z.boolean().default(false),
      category: z.string().optional(),
      coverUrl: z.string().optional(),
      previewUrl: z.string().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const v = parsed.data
    const conn = await pool.getConnection()
    try {
      await ensureNewsSchema(conn)
      const [countRows]: any = await runWithRepair(conn, async () => conn.query("SELECT COUNT(*) as c FROM InformationNews"))
      const pos = Number(countRows?.[0]?.c || 0)
      await runWithRepair(conn, async () =>
        conn.query("INSERT INTO InformationNews (title, date, text, content, summary, draft, category, coverUrl, previewUrl, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())", [v.title, v.date, v.text, v.content, v.summary, v.draft ? 1 : 0, v.category || null, v.coverUrl || null, v.previewUrl || null, pos])
      )
      return ok(req, { created: true }, "Created", "SUCCESS", 201)
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
      id: z.number().int().positive(),
      update: z.object({
        title: z.string().optional(),
        date: z.string().optional(),
        text: z.string().min(1).max(250).optional(),
        summary: z.string().optional(),
        content: z.string().optional(),
        draft: z.boolean().optional(),
        category: z.string().optional(),
        coverUrl: z.string().optional(),
        previewUrl: z.string().optional(),
      })
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const { id, update } = parsed.data
    const conn = await pool.getConnection()
    try {
      await ensureNewsSchema(conn)
      await runWithRepair(conn, async () => conn.query("CREATE TABLE IF NOT EXISTS InformationNewsRevisions (id INT AUTO_INCREMENT PRIMARY KEY, newsId INT, title VARCHAR(255), date DATETIME, text TEXT, content MEDIUMTEXT, summary TEXT, draft TINYINT, category VARCHAR(64), coverUrl VARCHAR(255), previewUrl VARCHAR(255), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)"))
      const [rows]: any = await runWithRepair(conn, async () => conn.query("SELECT * FROM InformationNews WHERE id = ?", [id]))
      if (!rows.length) return fail(req, 404, "NOT_FOUND", "News not found", { type: "NotFoundError" })
      const cur = rows[0]
      await runWithRepair(conn, async () => conn.query("INSERT INTO InformationNewsRevisions (newsId, title, date, text, content, summary, draft, category, coverUrl, previewUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())", [id, cur.title, cur.date, cur.text, cur.content, cur.summary, cur.draft, cur.category, cur.coverUrl, cur.previewUrl]))
      const sets: string[] = []
      const args: any[] = []
      if (typeof update.title === "string") { sets.push("title = ?"); args.push(update.title) }
      if (typeof update.date === "string") { sets.push("date = ?"); args.push(update.date) }
      if (typeof update.text === "string") { sets.push("text = ?"); args.push(update.text) }
      if (typeof update.summary === "string") { sets.push("summary = ?"); args.push(update.summary) }
      if (typeof update.content === "string") { sets.push("content = ?"); args.push(update.content) }
      if (typeof update.category === "string") { sets.push("category = ?"); args.push(update.category) }
      if (typeof update.coverUrl === "string") { sets.push("coverUrl = ?"); args.push(update.coverUrl) }
      if (typeof update.previewUrl === "string") { sets.push("previewUrl = ?"); args.push(update.previewUrl) }
      if (typeof update.draft === "boolean") { sets.push("draft = ?"); args.push(update.draft ? 1 : 0) }
      if (!sets.length) return ok(req, { updated: false }, "No changes")
      args.push(id)
      await runWithRepair(conn, async () => conn.query(`UPDATE InformationNews SET ${sets.join(", ")}, updatedAt = NOW() WHERE id = ?`, args))
      return ok(req, { updated: true }, "Updated")
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
      await conn.query("CREATE TABLE IF NOT EXISTS InformationNewsTrash (newsId INT PRIMARY KEY, deletedAt DATETIME DEFAULT CURRENT_TIMESTAMP)")
      await conn.query("INSERT INTO InformationNewsTrash (newsId, deletedAt) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE deletedAt = VALUES(deletedAt)", [id])
      return ok(req, { trashed: true }, "Trashed")
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
