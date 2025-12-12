"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

type NewsItem = { id: number; title: string; date: string; text: string; summary: string; content: string; previewUrl?: string }

// Loaded from API

const clampText = (text: string, max = 250) =>
  text.length > max ? text.slice(0, max) + "…" : text

const formatDateForView = (s: string) => {
  const v = s?.includes("T") ? s : s?.replace(" ", "T")
  const d = v ? new Date(v) : null
  if (!d || Number.isNaN(d.getTime())) return s || ""
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = String(d.getFullYear())
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`
}

const extractFirstImageSrc = (html: string) => {
  if (!html) return undefined
  try {
    const m = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)
    return m?.[1]
  } catch {
    return undefined
  }
}

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-size="24" font-family="Arial, sans-serif">No image</text></svg>`
  )

export default function NewsPage() {
  const [newsModalOpen, setNewsModalOpen] = useState(false)
  const [selectedNewsIndex, setSelectedNewsIndex] = useState<number | null>(null)
  const [visibleNewsCount, setVisibleNewsCount] = useState(6)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [sortDesc, setSortDesc] = useState(true)
  const [category, setCategory] = useState<string>("")
  const [query, setQuery] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const r = await fetch("/api/information/news?sort=date&limit=100&nocache=1", { cache: "no-store" })
        if (!r.ok) {
          const t = await r.text().catch(() => "")
          throw new Error(t || "Failed to load news")
        }
        const j = await r.json()
        const arr = j?.data?.news || []
        const mapped = arr.map((n: any) => {
          const id = Number(n.id || 0)
          const title = String(n.title || "")
          const date = String(n.date || "")
          const text = String(n.text || "")
          const summary = String(n.summary || "")
          const content = String(n.content || "")
          const previewUrl = String(n.previewUrl || "")
          const contentImg = extractFirstImageSrc(content)
          const tileUrl = previewUrl || contentImg || PLACEHOLDER_IMG
          return { id, title, date, text, summary, content, previewUrl: tileUrl }
        })
        setItems(mapped)
      } catch (e: any) {
        setError(typeof e?.message === "string" ? e.message : "Failed to load news")
      } finally {
        setLoading(false)
      }
    }
    load()
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleNewsCount((prev) => Math.min(prev + 6, items.length))
        }
      })
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [items.length])

  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className="hidden md:flex w-48 bg-white border-r border-neutral-200 flex-col fixed h-full z-10">
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-sm font-medium tracking-wide">Oksana Levchenya</h1>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <Link href="/" className="w-full block text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-neutral-100">WORK</Link>
          <div className="mt-2 space-y-1">
            <Link href="/about" className="w-full block text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-neutral-100">ABOUT</Link>
            <Link href="/news" className="w-full block text-left px-4 py-2 text-xs font-medium transition-colors bg-yellow-400 hover:bg-yellow-500">NEWS</Link>
            <Link href="/contacts" className="w-full block text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-neutral-100">CONTACTS</Link>
          </div>
        </nav>
      </aside>

      <main className="max-w-5xl mx-auto p-4 md:p-8 md:ml-48">
        <h2 className="text-xl font-medium tracking-wide mb-4">News</h2>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setSortDesc((v) => !v)}
            className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
          >
            {sortDesc ? "Newest first" : "Oldest first"}
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="border rounded-sm px-2 py-1 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-sm px-2 py-1 text-sm"
          >
            <option value="">All categories</option>
            {[...new Set(items.map((i: any) => String((i as any).category || "")).filter(Boolean))].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="text-xs text-neutral-500">Loading…</div>
        ) : error ? (
          <div className="text-xs text-red-600">{error}</div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items
            .filter((i) => !category || (i as any).category === category)
            .filter((i) => !query || i.title.toLowerCase().includes(query.toLowerCase()) || i.text.toLowerCase().includes(query.toLowerCase()) || i.summary.toLowerCase().includes(query.toLowerCase()))
            .sort((a, b) => {
              const ad = new Date(a.date).getTime()
              const bd = new Date(b.date).getTime()
              return sortDesc ? bd - ad : ad - bd
            })
            .slice(0, visibleNewsCount)
            .map((item, idx) => (
            <div
              key={idx}
              className="group border rounded-sm overflow-hidden bg-white hover:shadow-md transition-shadow animate-in fade-in duration-200"
            >
              <div className="p-3">
                <div className="text-xs text-green-600 mb-1">{formatDateForView(item.date)}</div>
                <div className="text-sm font-medium mb-2 text-green-700">{item.title}</div>
              </div>
              <img
                src={item.previewUrl || PLACEHOLDER_IMG}
                alt={item.title}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG
                }}
              />
              <div className="px-3 pb-3 text-sm text-green-700">{clampText(item.text || "", 150)}</div>
              <div className="p-3">
                <Link href={`/news/${item.id}`} className="text-xs px-3 py-1 rounded-sm border bg-white hover:bg-neutral-100 transition-colors">
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
        )}
        <div ref={sentinelRef} className="h-8" />
      </main>

      {newsModalOpen && selectedNewsIndex !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="text-xs text-green-600">{formatDateForView(items[selectedNewsIndex].date)}</div>
                <div className="text-sm font-medium text-green-700">{items[selectedNewsIndex].title}</div>
              </div>
              <button
                onClick={() => setNewsModalOpen(false)}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={items[selectedNewsIndex].previewUrl || PLACEHOLDER_IMG}
              alt={items[selectedNewsIndex].title}
              loading="lazy"
              className="w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG
              }}
            />
            <div className="p-4 text-sm text-green-700">
              <div dangerouslySetInnerHTML={{ __html: items[selectedNewsIndex].content || items[selectedNewsIndex].summary }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
