import { pool } from "@/lib/db"
import { ok, fail } from "@/lib/api"

export const runtime = "nodejs"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id) || id <= 0) return fail(req, 400, "VALIDATION_ERROR", "Invalid id", { type: "ValidationError" })
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationNews (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), date DATETIME, text TEXT, content MEDIUMTEXT, summary TEXT, draft TINYINT DEFAULT 0, category VARCHAR(64), coverUrl VARCHAR(255), previewUrl VARCHAR(255), position INT DEFAULT 0, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      await conn.query("CREATE TABLE IF NOT EXISTS InformationNewsTrash (newsId INT PRIMARY KEY, deletedAt DATETIME DEFAULT CURRENT_TIMESTAMP)")
      const [rows]: any = await conn.query("SELECT * FROM InformationNews WHERE id = ? AND id NOT IN (SELECT newsId FROM InformationNewsTrash)", [id])
      if (!rows.length) return fail(req, 404, "NOT_FOUND", "News not found", { type: "NotFoundError" })
      return ok(req, { news: rows[0] })
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
