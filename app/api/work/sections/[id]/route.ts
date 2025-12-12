import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const body = await req.json()
  const schema = z.object({
    slug: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    position: z.number().int().optional(),
    visible: z.boolean().optional(),
    seoTitle: z.string().nullable().optional(),
    seoDescription: z.string().nullable().optional(),
    seoKeywords: z.string().nullable().optional(),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data as Record<string, any>
  const fields: string[] = []
  const values: any[] = []
  for (const key of ["slug", "name", "position", "visible", "seoTitle", "seoDescription", "seoKeywords"]) {
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
    const [result]: any = await conn.query(`UPDATE WorkSection SET ${fields.join(", ")} WHERE id = ?`, values)
    return NextResponse.json({ updated: result.affectedRows })
  } finally {
    conn.release()
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const conn = await pool.getConnection()
  try {
    const [items]: any = await conn.query("SELECT id FROM WorkItem WHERE sectionId = ?", [id])
    const itemIds = items.map((x: any) => x.id)
    if (itemIds.length) {
      await conn.query(`DELETE FROM WorkMedia WHERE itemId IN (${itemIds.map(() => "?").join(",")})`, itemIds)
      await conn.query(`DELETE FROM WorkItem WHERE id IN (${itemIds.map(() => "?").join(",")})`, itemIds)
    }
    const [result]: any = await conn.query("DELETE FROM WorkSection WHERE id = ?", [id])
    return NextResponse.json({ deleted: result.affectedRows })
  } finally {
    conn.release()
  }
}
