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
        "CREATE TABLE IF NOT EXISTS InformationAbout (id INT PRIMARY KEY, text MEDIUMTEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [rows]: any = await conn.query("SELECT * FROM InformationAbout WHERE id = 1")
      if (!rows.length) {
        await conn.query("REPLACE INTO InformationAbout (id, text, updatedAt) VALUES (1, '', NOW())")
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
    const ct = req.headers.get("content-type") || ""
    let incomingText = ""
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({}))
      if (typeof body?.text === "string") incomingText = body.text
      else if (typeof body?.content === "string") incomingText = body.content
      else if (typeof body?.about === "string") incomingText = body.about
      else if (typeof body?.data?.text === "string") incomingText = body.data.text
      else incomingText = ""
    } else {
      incomingText = await req.text().catch(() => "")
    }
    if (typeof incomingText !== "string") incomingText = String(incomingText || "")
    if (incomingText.length > 1_000_000) {
      return fail(req, 400, "VALIDATION_ERROR", "Text is too long", { type: "ValidationError", details: [{ field: "text", message: "Max length 1,000,000" }] })
    }
    const sanitize = (html: string) => {
      let s = String(html || "")
      s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      s = s.replace(/on\w+="[^"]*"/gi, "")
      s = s.replace(/on\w+='[^']*'/gi, "")
      s = s.replace(/\s(href|src)\s*=\s*"(javascript:[^"]*)"/gi, ' $1="#"')
      s = s.replace(/\s(href|src)\s*=\s*'(javascript:[^']*)'/gi, " $1='#'")
      s = s.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
      s = s.replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
      return s
    }
    const safeText = sanitize(incomingText)
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS InformationAbout (id INT PRIMARY KEY, text MEDIUMTEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      await conn.query("CREATE TABLE IF NOT EXISTS InformationAboutRevisions (id INT AUTO_INCREMENT PRIMARY KEY, text MEDIUMTEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)")
      const [cols]: any = await conn.query("SHOW COLUMNS FROM InformationAboutRevisions")
      const idCol = (cols || []).find((c: any) => String(c.Field) === "id")
      const autoInc = String(idCol?.Extra || "").includes("auto_increment")
      if (!autoInc) {
        await conn.query("ALTER TABLE InformationAboutRevisions MODIFY id INT AUTO_INCREMENT PRIMARY KEY")
      }
      const [rows]: any = await conn.query("SELECT text FROM InformationAbout WHERE id = 1")
      if (rows?.length && typeof rows[0]?.text === "string") {
        await conn.query("INSERT INTO InformationAboutRevisions (text, createdAt) VALUES (?, NOW())", [rows[0].text])
      }
      await conn.query("INSERT INTO InformationAbout (id, text, updatedAt) VALUES (1, ?, NOW()) ON DUPLICATE KEY UPDATE text = VALUES(text), updatedAt = NOW()", [safeText])
      return ok(req, { saved: true }, "Updated")
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
