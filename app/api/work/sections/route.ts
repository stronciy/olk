import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

export const runtime = "nodejs"

export async function GET() {
  try {
    const slugs = ["paint", "prints", "mask", "carpet", "spare"]
    const conn = await pool.getConnection()
    try {
      await conn.query(
        "CREATE TABLE IF NOT EXISTS WorkSection (id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(255) UNIQUE, name VARCHAR(255), position INT DEFAULT 0, visible BOOLEAN DEFAULT TRUE, seoTitle VARCHAR(255), seoDescription TEXT, seoKeywords TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
      )
      for (let i = 0; i < slugs.length; i++) {
        const slug = slugs[i]
        await conn.query(
          "INSERT IGNORE INTO WorkSection (slug, name, position) VALUES (?, ?, ?)",
          [slug, slug.toUpperCase(), i]
        )
      }
      const [rows] = await conn.query("SELECT * FROM WorkSection ORDER BY position ASC")
      return NextResponse.json({ sections: rows })
    } finally {
      conn.release()
    }
  } catch (_e) {
    return NextResponse.json({ sections: [] })
  }
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const schema = z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    position: z.number().int().optional(),
    visible: z.boolean().optional(),
    seoTitle: z.string().nullable().optional(),
    seoDescription: z.string().nullable().optional(),
    seoKeywords: z.string().nullable().optional(),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const v = parsed.data
  const conn = await pool.getConnection()
  try {
    const [result]: any = await conn.query(
      "INSERT INTO WorkSection (slug, name, position, visible, seoTitle, seoDescription, seoKeywords) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        v.slug,
        v.name,
        v.position ?? 0,
        v.visible ?? true,
        v.seoTitle ?? null,
        v.seoDescription ?? null,
        v.seoKeywords ?? null,
      ]
    )
    return NextResponse.json({ section: { id: result.insertId, ...v } }, { status: 201 })
  } finally {
    conn.release()
  }
}

export async function PATCH(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const schema = z.object({ ids: z.array(z.number().int()) })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { ids } = parsed.data
  const conn = await pool.getConnection()
  try {
    for (let i = 0; i < ids.length; i++) {
      await conn.query("UPDATE WorkSection SET position = ? WHERE id = ?", [i, ids[i]])
    }
    return NextResponse.json({ updated: ids.length })
  } finally {
    conn.release()
  }
}
