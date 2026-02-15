import { pool } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { ok, fail } from "@/lib/api"
import path from "path"
import fs from "fs"
import sharp from "sharp"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const form = await req.formData()
    const mediaId = Number(form.get("mediaId"))
    const file = form.get("file") as File | null
    if (!Number.isFinite(mediaId)) {
      return fail(req, 400, "VALIDATION_ERROR", "Invalid mediaId", { type: "ValidationError", details: [{ field: "mediaId", message: "Invalid id" }] })
    }
    if (!file) {
      return fail(req, 400, "VALIDATION_ERROR", "No file", { type: "ValidationError", details: [{ field: "file", message: "File required" }] })
    }
    const mime = (file as any).type || ""
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    if (typeof mime === "string" && mime && !allowed.includes(mime.toLowerCase())) {
      return fail(req, 400, "VALIDATION_ERROR", "Unsupported image type", { type: "ValidationError", details: [{ field: "file", message: "Only JPEG, PNG, WebP, AVIF allowed" }] })
    }
    const buf = Buffer.from(await file.arrayBuffer())
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    const thumbsDir = path.join(uploadsDir, "thumbs")
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
    if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true })
    const nameBase = `thumb_manual_${mediaId}_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const outName = `${nameBase}.webp`
    const outPath = path.join(thumbsDir, outName)
    await sharp(buf).resize({ width: 640 }).webp({ quality: 85 }).toFile(outPath)
    const url = `/uploads/thumbs/${outName}`
    const conn = await pool.getConnection()
    try {
      const [rows]: any = await conn.query("SELECT id, type FROM WorkMedia WHERE id = ? LIMIT 1", [mediaId])
      if (!rows.length) {
        return fail(req, 404, "NOT_FOUND", "Media not found", { type: "NotFoundError" })
      }
      await conn.query("UPDATE WorkMedia SET thumbnail = ?, updatedAt = NOW() WHERE id = ?", [url, mediaId])
    } finally {
      conn.release()
    }
    return ok(req, { thumbnail: url }, "Thumbnail updated")
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}

