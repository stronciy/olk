import path from "path"
import fs from "fs/promises"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(_: Request, ctx: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await ctx.params
    const safe = path.basename(name)
    const dir = path.join(process.cwd(), "public", "uploads", "about")
    const full = path.join(dir, safe)
    const buf = await fs.readFile(full)
    const ext = safe.split(".").pop()?.toLowerCase()
    const type =
      ext === "png" ? "image/png" :
      ext === "webp" ? "image/webp" :
      "image/jpeg"
    const res = new NextResponse(buf, { status: 200 })
    res.headers.set("Content-Type", type)
    res.headers.set("Content-Length", String(buf.length))
    res.headers.set("Cache-Control", "public, max-age=31536000, immutable")
    return res
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}

export async function HEAD(_: Request, ctx: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await ctx.params
    const safe = path.basename(name)
    const dir = path.join(process.cwd(), "public", "uploads", "about")
    const full = path.join(dir, safe)
    const stat = await (await import("fs/promises")).stat(full)
    const ext = safe.split(".").pop()?.toLowerCase()
    const type =
      ext === "png" ? "image/png" :
      ext === "webp" ? "image/webp" :
      "image/jpeg"
    const res = new NextResponse(null, { status: 200 })
    res.headers.set("Content-Type", type)
    res.headers.set("Content-Length", String(stat.size))
    res.headers.set("Cache-Control", "public, max-age=31536000, immutable")
    return res
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
