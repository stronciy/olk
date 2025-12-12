"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

type Website = { id?: number; url: string; label: string }

export default function WebsitesPage() {
  const [data, setData] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/information/websites?sort=position&limit=100`, { cache: "no-store" })
      const j = await r.json()
      const arr = j?.data?.websites || []
      setData(arr.map((w: any) => ({ id: Number(w.id || 0), url: String(w.url || ""), label: String(w.label || "") })))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return data
    return data.filter((w) => w.url.toLowerCase().includes(q) || w.label.toLowerCase().includes(q))
  }, [data, filter])

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
            <Link href="/news" className="w-full block text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-neutral-100">NEWS</Link>
            <Link href="/contacts" className="w-full block text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-neutral-100">CONTACTS</Link>
            <Link
              href="/websites"
              prefetch={false}
              className="w-full block text-left px-4 py-2 text-xs font-medium transition-colors bg-yellow-400 hover:bg-yellow-500"
            >
              WEBSITES
            </Link>
          </div>
        </nav>
      </aside>

      <main className="max-w-5xl mx-auto p-4 md:p-8 md:ml-48">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium tracking-wide">Websites</h2>
          <div className="flex items-center gap-2">
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Поиск" className="border rounded-sm px-2 py-1 text-sm w-48" />
            <button onClick={load} className="text-xs px-3 py-1 rounded-sm border bg-white hover:bg-neutral-100">Обновить</button>
          </div>
        </div>
        {loading ? (
          <div className="text-xs text-neutral-500">Loading…</div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((w, idx) => (
              <li key={`${w.id}-${idx}`} className="bg-white border rounded-sm p-3 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium text-green-700">{w.label || w.url}</div>
                  <a href={w.url} target="_blank" rel="noreferrer" className="text-xs text-green-600">{w.url}</a>
                </div>
                <a href={w.url} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-sm border bg-white hover:bg-neutral-100">Open</a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
