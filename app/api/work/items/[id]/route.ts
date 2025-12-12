import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"
import fs from "fs"
import path from "path"

export const runtime = "nodejs"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await ctx.params
    const id = Number(idStr)
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    const conn = await pool.getConnection()
    try {
      const [items]: any = await conn.query("SELECT * FROM WorkItem WHERE id = ?", [id])
      if (!items.length) return NextResponse.json({ item: null }, { status: 404 })
      const item = items[0]
      const [media]: any = await conn.query("SELECT * FROM WorkMedia WHERE itemId = ? ORDER BY position ASC", [id])
      return NextResponse.json({ item: { ...item, media } })
    } finally {
      conn.release()
    }
  } catch (_e) {
    return NextResponse.json({ item: null }, { status: 500 })
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const body = await req.json()
  const schema = z.object({
    slug: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    location: z.string().optional(),
    description: z.string().optional().nullable(),
    year: z.number().int().optional().nullable(),
    type: z.string().optional(),
    collaborators: z.string().optional(),
    position: z.number().int().optional().nullable(),
    published: z.boolean().optional(),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
    seoKeywords: z.string().optional().nullable(),
    canonicalUrl: z.string().optional().nullable(),
    ogImageUrl: z.string().optional().nullable(),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data as Record<string, any>
  const fields: string[] = []
  const values: any[] = []
  for (const key of [
    "slug",
    "title",
    "location",
    "description",
    "year",
    "type",
    "collaborators",
    "position",
    "published",
    "seoTitle",
    "seoDescription",
    "seoKeywords",
    "canonicalUrl",
    "ogImageUrl",
  ]) {
    if (key in data) {
      fields.push(`${key} = ?`)
      // @ts-ignore
      values.push((data as any)[key])
    }
  }
  if (!fields.length) return NextResponse.json({ updated: 0 })
  values.push(id)
  const conn = await pool.getConnection()
  try {
    const [result]: any = await conn.query(`UPDATE WorkItem SET ${fields.join(", ")} WHERE id = ?`, values)
    return NextResponse.json({ updated: result.affectedRows })
  } finally {
    conn.release()
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(_req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const conn = await pool.getConnection()
  try {
    const [mediaRows]: any = await conn.query("SELECT id, url, thumbnail FROM WorkMedia WHERE itemId = ?", [id])
    for (const m of mediaRows) {
      const urls: string[] = []
      if (typeof m.url === "string" && m.url.startsWith("/uploads/")) urls.push(m.url)
      if (typeof m.thumbnail === "string" && m.thumbnail.startsWith("/uploads/")) urls.push(m.thumbnail)
      for (const u of urls) {
        try {
          const full = path.join(process.cwd(), "public", u.replace(/^\//, ""))
          if (fs.existsSync(full)) fs.unlinkSync(full)
        } catch {}
      }
    }
    await conn.query("DELETE FROM WorkMedia WHERE itemId = ?", [id])
    const [result]: any = await conn.query("DELETE FROM WorkItem WHERE id = ?", [id])
    return NextResponse.json({ deleted: result.affectedRows })
  } finally {
    conn.release()
  }
}
