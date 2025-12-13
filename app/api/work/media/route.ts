import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"
import fs from "fs"
import path from "path"
import sharp from "sharp"
import { resizeAndCompressImage } from "@/lib/utils/image"
import { ok, fail } from "@/lib/api"
import ffmpegStatic from "ffmpeg-static"
import { execFile } from "node:child_process"

export const runtime = "nodejs"

const FFMPEG_BIN = ffmpegStatic as string

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const ct = req.headers.get("content-type") || ""
    const conn = await pool.getConnection()
    try {
      if (ct.includes("multipart/form-data")) {
        const form = await req.formData()
        const itemId = Number(form.get("itemId"))
        const type = String(form.get("type") || "IMAGE")
        const caption = form.get("caption") ? String(form.get("caption")) : null
        const alt = form.get("alt") ? String(form.get("alt")) : null
        const position = form.get("position") ? Number(form.get("position")) : 0
        const file = form.get("file") as File | null
        if (!Number.isFinite(itemId)) return fail(req, 400, "VALIDATION_ERROR", "Invalid itemId", { type: "ValidationError" })
        if (!file) return fail(req, 400, "VALIDATION_ERROR", "File required", { type: "ValidationError" })
        const bytes = Buffer.from(await file.arrayBuffer())
        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        const thumbsDir = path.join(uploadsDir, "thumbs")
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
        if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true })
        const nameBase = `media_${Date.now()}_${Math.random().toString(36).slice(2)}`
        let name = `${nameBase}.webp`
        let fullPath = path.join(uploadsDir, name)
        if (type === "IMAGE") {
          const optimized = await resizeAndCompressImage(bytes, "image/webp", 1024)
          await sharp(optimized).webp({ quality: 90 }).toFile(fullPath)
        } else {
          const ext = (file.name.split(".").pop() || "mp4").toLowerCase()
          name = `${nameBase}.${ext}`
          fullPath = path.join(uploadsDir, name)
          fs.writeFileSync(fullPath, bytes)
        }
        const url = `/uploads/${name}`
        let thumbnail: string | null = null
        if (type === "IMAGE") {
          const thumbName = `thumb_${Date.now()}_${Math.random().toString(36).slice(2)}.webp`
          const thumbPath = path.join(thumbsDir, thumbName)
          try {
            await sharp(bytes).resize({ width: 320 }).webp({ quality: 80 }).toFile(thumbPath)
            thumbnail = `/uploads/thumbs/${thumbName}`
          } catch {
            thumbnail = null
          }
        } else {
          const tmpDir = path.join(uploadsDir, "tmp")
          if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
          const snapName = `snap_${Date.now()}_${Math.random().toString(36).slice(2)}.png`
          const snapPath = path.join(tmpDir, snapName)
          const avifName = `thumb_${Date.now()}_${Math.random().toString(36).slice(2)}.avif`
          const avifPath = path.join(thumbsDir, avifName)
          try {
            await new Promise<void>((resolve, reject) => {
              execFile(
                FFMPEG_BIN,
                ["-y", "-ss", "00:00:01", "-i", fullPath, "-frames:v", "1", "-vf", "scale=320:-1", snapPath],
                (err) => (err ? reject(err) : resolve())
              )
            })
            await sharp(snapPath).avif({ quality: 60 }).toFile(avifPath)
            thumbnail = `/uploads/thumbs/${avifName}`
          } catch {
            thumbnail = null
          } finally {
            try { if (fs.existsSync(snapPath)) fs.unlinkSync(snapPath) } catch {}
          }
        }
        const [result]: any = await conn.query(
          "INSERT INTO WorkMedia (itemId, type, url, thumbnail, caption, alt, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
          [itemId, type, url, thumbnail, caption, alt, position]
        )
        return ok(req, { media: { id: result.insertId, itemId, type, url, thumbnail, caption, alt, position } }, "Created", "CREATED", 201)
      } else {
        const body = await req.json()
        const schema = z.object({
          itemId: z.number(),
          type: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
          url: z.string().min(1),
          thumbnail: z.string().nullable().optional(),
          caption: z.string().nullable().optional(),
          alt: z.string().nullable().optional(),
          position: z.number().int().nonnegative().optional(),
        })
        const parsed = schema.safeParse(body)
        if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
        const v = parsed.data
        const [result]: any = await conn.query(
          "INSERT INTO WorkMedia (itemId, type, url, thumbnail, caption, alt, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
          [v.itemId, v.type, v.url, v.thumbnail ?? null, v.caption ?? null, v.alt ?? null, v.position ?? 0]
        )
        return ok(req, { media: { id: result.insertId, ...v } }, "Created", "CREATED", 201)
      }
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
    const schema = z.object({ ids: z.array(z.number().int()) })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(req, 400, "VALIDATION_ERROR", "Invalid input", { type: "ValidationError", details: parsed.error.flatten() })
    const ids = parsed.data.ids
    if (!ids.length) return ok(req, { updated: 0 }, "No changes")
    const conn = await pool.getConnection()
    try {
      const [rows]: any = await conn.query(
        `SELECT id, itemId FROM WorkMedia WHERE id IN (${ids.map(() => "?").join(",")})`,
        ids
      )
      if (rows.length !== ids.length) return fail(req, 404, "NOT_FOUND", "Some media not found", { type: "NotFoundError" })
      const itemId = rows[0].itemId
      const sameItem = rows.every((r: any) => r.itemId === itemId)
      if (!sameItem) return fail(req, 400, "VALIDATION_ERROR", "Media must belong to the same item", { type: "ValidationError" })
      for (let i = 0; i < ids.length; i++) {
        await conn.query("UPDATE WorkMedia SET position = ?, updatedAt = NOW() WHERE id = ?", [i, ids[i]])
      }
      return ok(req, { updated: ids.length }, "Order updated")
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
