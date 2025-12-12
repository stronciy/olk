import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

export const runtime = "nodejs"

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const body = await req.json()
  const schema = z.object({
    type: z.enum(["IMAGE", "VIDEO"]).optional(),
    url: z.string().optional(),
    thumbnail: z.string().nullable().optional(),
    caption: z.string().nullable().optional(),
    alt: z.string().nullable().optional(),
    position: z.number().int().optional(),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data as Record<string, any>
  const fields: string[] = []
  const values: any[] = []
  for (const key of ["type", "url", "thumbnail", "caption", "alt", "position"]) {
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
    const [result]: any = await conn.query(`UPDATE WorkMedia SET ${fields.join(", ")} WHERE id = ?`, values)
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
    const [result]: any = await conn.query("DELETE FROM WorkMedia WHERE id = ?", [id])
    return NextResponse.json({ deleted: result.affectedRows })
  } finally {
    conn.release()
  }
}
