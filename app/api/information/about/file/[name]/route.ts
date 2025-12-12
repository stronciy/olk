import path from "path"
import fs from "fs/promises"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: { name: string } }) {
  try {
    const name = params?.name || ""
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
    res.headers.set("Cache-Control", "public, max-age=31536000, immutable")
    return res
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
