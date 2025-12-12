import { ok, fail } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import path from "path"
import fs from "fs/promises"
import sharp from "sharp"

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return fail(req, 400, "VALIDATION_ERROR", "No file", { type: "ValidationError" })
    const type = file.type.toLowerCase()
    if (!["image/jpeg", "image/png", "image/webp"].includes(type)) return fail(req, 400, "VALIDATION_ERROR", "Unsupported file type", { type: "ValidationError" })
    const buf = Buffer.from(await file.arrayBuffer())
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "about")
    await fs.mkdir(uploadsDir, { recursive: true })
    const nameBase = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg"
    const fullPath = path.join(uploadsDir, `${nameBase}.${ext}`)
    const previewPath = path.join(uploadsDir, `${nameBase}-preview.${ext}`)
    await sharp(buf).resize({ width: 1920, withoutEnlargement: true }).toFile(fullPath)
    await sharp(buf).resize(300, 200, { fit: "cover" }).toFile(previewPath)
    const fullUrl = `/api/information/about/file/${path.basename(fullPath)}`
    const previewUrl = `/api/information/about/file/${path.basename(previewPath)}`
    const res = ok(req, { coverUrl: fullUrl, previewUrl }, "Uploaded", "SUCCESS", 201)
    res.headers.set("Cache-Control", "no-store")
    return res
  } catch (e: any) {
    return fail(req, 500, "INTERNAL_ERROR", e?.message || "Internal error", { type: "InternalError" })
  }
}
