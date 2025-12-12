import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || ""
    const r = await fetch(`${base}/api/information/news?sort=date&limit=100`, { cache: "no-store" })
    const j = await r.json().catch(() => ({}))
    const arr = (j?.data?.news || []) as any[]
    const itemsXml = arr
      .map((n) => {
        const id = Number(n.id || 0)
        const title = String(n.title || "")
        const date = new Date(String(n.date || "")).toUTCString()
        const summary = String(n.summary || n.text || "")
        const link = `${base}/news/${id}`
        return `
  <item>
    <title><![CDATA[${title}]]></title>
    <link>${link}</link>
    <guid>${link}</guid>
    <pubDate>${date}</pubDate>
    <description><![CDATA[${summary}]]></description>
  </item>`
      })
      .join("\n")
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>News</title>
  <link>${base}/news</link>
  <description>Latest news</description>
${itemsXml}
</channel>
</rss>`
    return new NextResponse(xml, {
      status: 200,
      headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600, stale-while-revalidate=3600" },
    })
  } catch (e: any) {
    return new NextResponse("Error", { status: 500 })
  }
}
