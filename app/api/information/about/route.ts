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
      await conn.query("CREATE TABLE IF NOT EXISTS `information_about` (id INT PRIMARY KEY, text LONGTEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)")
      await conn.query("CREATE TABLE IF NOT EXISTS `information_about_revisions` (id INT AUTO_INCREMENT PRIMARY KEY, text MEDIUMTEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)")
      const [rows]: any = await conn.query("SELECT * FROM `information_about` WHERE id = 1")
      if (!rows.length) {
        await conn.query("REPLACE INTO `information_about` (id, text, updatedAt) VALUES (1, '', NOW())")
        const res = ok(req, { about: { text: "" } })
        res.headers.set("Cache-Control", "no-store")
        return res
      }
      const res = ok(req, { about: { text: rows[0].text || "" } })
      res.headers.set("Cache-Control", "no-store")
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
    if (incomingText.length > 5_000_000) {
      return fail(req, 400, "VALIDATION_ERROR", "Text is too long", { type: "ValidationError", details: [{ field: "text", message: "Max length 5,000,000" }] })
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
      await conn.query("CREATE TABLE IF NOT EXISTS `information_about` (id INT PRIMARY KEY, text LONGTEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)")
      await conn.query("CREATE TABLE IF NOT EXISTS `information_about_revisions` (id INT AUTO_INCREMENT PRIMARY KEY, text MEDIUMTEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)")
      try { await conn.query("ALTER TABLE `information_about` MODIFY text LONGTEXT") } catch {}
      try {
        const [cols]: any = await conn.query("SHOW COLUMNS FROM `information_about_revisions`")
        const idCol = (cols || []).find((c: any) => String(c.Field) === "id")
        const autoInc = String(idCol?.Extra || "").includes("auto_increment")
        if (!autoInc) {
          await conn.query("ALTER TABLE `information_about_revisions` MODIFY id INT AUTO_INCREMENT PRIMARY KEY")
        }
      } catch {}
      const [rows]: any = await conn.query("SELECT text FROM `information_about` WHERE id = 1")
      if (rows?.length && typeof rows[0]?.text === "string") {
        await conn.query("INSERT INTO `information_about_revisions` (text, createdAt) VALUES (?, NOW())", [rows[0].text])
      }
      await conn.query("INSERT INTO `information_about` (id, text, updatedAt) VALUES (1, ?, NOW()) ON DUPLICATE KEY UPDATE text = VALUES(text), updatedAt = NOW()", [safeText])
      return ok(req, { saved: true }, "Updated")
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
