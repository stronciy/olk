import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sectionSlug = searchParams.get("section") || "paint"
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS WorkItem (id INT AUTO_INCREMENT PRIMARY KEY, sectionId INT, slug VARCHAR(255) UNIQUE, title VARCHAR(255), location VARCHAR(255), description TEXT, year INT, type VARCHAR(255), collaborators VARCHAR(255), position INT DEFAULT 0, published BOOLEAN DEFAULT TRUE, seoTitle VARCHAR(255), seoDescription TEXT, seoKeywords TEXT, canonicalUrl VARCHAR(255), ogImageUrl VARCHAR(255), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      await conn.query(
        "CREATE TABLE IF NOT EXISTS WorkMedia (id INT AUTO_INCREMENT PRIMARY KEY, itemId INT, type ENUM('IMAGE','VIDEO'), url TEXT, thumbnail TEXT, caption TEXT, alt TEXT, position INT DEFAULT 0, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [sections]: any = await conn.query("SELECT * FROM WorkSection WHERE slug = ? LIMIT 1", [sectionSlug])
      if (!sections.length) return NextResponse.json({ items: [] })
      const section = sections[0]
      const [items]: any = await conn.query(
        "SELECT * FROM WorkItem WHERE sectionId = ? AND published = 1 ORDER BY position ASC",
        [section.id]
      )
      const itemIds = items.map((i: any) => i.id)
      let mediaByItem: Record<number, any[]> = {}
      if (itemIds.length) {
        const [media]: any = await conn.query(
          `SELECT * FROM WorkMedia WHERE itemId IN (${itemIds.map(() => "?").join(",")}) ORDER BY position ASC`,
          itemIds
        )
        for (const m of media) {
          if (!mediaByItem[m.itemId]) mediaByItem[m.itemId] = []
          mediaByItem[m.itemId].push(m)
        }
      }
      const result = items.map((i: any) => ({ ...i, media: mediaByItem[i.id] || [] }))
      return NextResponse.json({ items: result })
    } finally {
      conn.release()
    }
  } catch (_e) {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    const schema = z.object({
      sectionId: z.number(),
      slug: z.string().min(1),
      title: z.string().min(1),
      position: z.number().int().nonnegative().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const v = parsed.data
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS WorkItem (id INT AUTO_INCREMENT PRIMARY KEY, sectionId INT, slug VARCHAR(255) UNIQUE, title VARCHAR(255), location VARCHAR(255), description TEXT, year INT, type VARCHAR(255), collaborators VARCHAR(255), position INT DEFAULT 0, published BOOLEAN DEFAULT TRUE, seoTitle VARCHAR(255), seoDescription TEXT, seoKeywords TEXT, canonicalUrl VARCHAR(255), ogImageUrl VARCHAR(255), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      const [sections]: any = await conn.query("SELECT id FROM WorkSection WHERE id = ? LIMIT 1", [v.sectionId])
      if (!sections.length) return NextResponse.json({ error: "Section not found" }, { status: 400 })
      const [dups]: any = await conn.query("SELECT id FROM WorkItem WHERE slug = ? LIMIT 1", [v.slug])
      if (dups.length) return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      const [result]: any = await conn.query(
        "INSERT INTO WorkItem (sectionId, slug, title, position, published, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())",
        [v.sectionId, v.slug, v.title, v.position ?? 0]
      )
      return NextResponse.json({ item: { id: result.insertId, ...v } }, { status: 201 })
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    const schema = z.object({ ids: z.array(z.number().int()) })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const ids = parsed.data.ids
    if (!ids.length) return NextResponse.json({ updated: 0 })
    const conn = await pool.getConnection()
    try {
      const [rows]: any = await conn.query(
        `SELECT id, sectionId FROM WorkItem WHERE id IN (${ids.map(() => "?").join(",")})`,
        ids
      )
      if (rows.length !== ids.length) return NextResponse.json({ error: "Some items not found" }, { status: 404 })
      const sectionId = rows[0].sectionId
      const sameSection = rows.every((r: any) => r.sectionId === sectionId)
      if (!sameSection) return NextResponse.json({ error: "Items must belong to the same section" }, { status: 400 })
      for (let i = 0; i < ids.length; i++) {
        await conn.query("UPDATE WorkItem SET position = ?, updatedAt = NOW() WHERE id = ?", [i, ids[i]])
      }
      return NextResponse.json({ updated: ids.length })
    } finally {
      conn.release()
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 })
  }
}
