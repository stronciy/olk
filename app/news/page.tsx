"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

type NewsItem = {
  title: string
  date: string
  image?: string
  text?: string
}

const newsData: NewsItem[] = [
  {
    title: "Totem of Recycling opens at Port Agency",
    date: "2025-06-12",
    image: "/architectural-light-installation-art-museum.jpg",
    text:
      "The exhibition tackles the problem of over consumption and consumerist lifestyle of the modern society, featuring large-scale installations and performative environments.",
  },
  {
    title: "Non-existent Tribes at BURSA gallery",
    date: "2018-11-05",
    text:
      "Levchenya’s solo exhibition demonstrates continuing interest in exploring the theory of social identity. Costumes and masks embody a mythological image of a person without community.",
  },
  {
    title: "Homo Faber Venice showcase",
    date: "2022-09-21",
    image: "/max-richter-concert-stage-design.jpg",
    text:
      "Selected works presented in Venice highlighting intricate manual techniques ranging back to the 16th century, blending contemporary design with heritage craftsmanship.",
  },
  {
    title: "Find Your Tribe project — recap",
    date: "2017-04-10",
    text:
      "A manifest of social identity first proposed by Tajfel and Turner. Through photographs with ritual makeup, Levchenya explores people’s eagerness to classify themselves into groups.",
  },
  {
    title: "Phillips Auction London: Indigo Chief",
    date: "2022-03-05",
    text:
      "Significant placement at Phillips Auction London with the Indigo Chief piece, marking ongoing recognition across international venues.",
  },
  {
    title: "Sotheby’s London: Collider 2011",
    date: "2022-07-14",
    image: "/lady-gaga-coachella-stage-design.jpg",
    text:
      "A special auction appearance in London reflecting the evolution of the artist’s textile vocabulary and modular spatial forms.",
  },
]

const clampText = (text: string, max = 250) =>
  text.length > max ? text.slice(0, max) + "…" : text

export default function NewsPage() {
  const [newsModalOpen, setNewsModalOpen] = useState(false)
  const [selectedNewsIndex, setSelectedNewsIndex] = useState<number | null>(null)
  const [visibleNewsCount, setVisibleNewsCount] = useState(6)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleNewsCount((prev) => Math.min(prev + 6, newsData.length))
        }
      })
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newsData.slice(0, visibleNewsCount).map((item, idx) => (
            <div
              key={idx}
              className="group border rounded-sm overflow-hidden bg-white hover:shadow-md transition-shadow animate-in fade-in duration-200"
            >
              <div className="p-3">
                <div className="text-xs text-green-600 mb-1">{new Date(item.date).toLocaleDateString()}</div>
                <div className="text-sm font-medium mb-2 text-green-700">{item.title}</div>
              </div>
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover"
                />
              ) : (
                <div className="px-3 pb-3 text-sm text-green-700">{clampText(item.text || "")}</div>
              )}
              <div className="p-3">
                <button
                  onClick={() => {
                    setSelectedNewsIndex(idx)
                    setNewsModalOpen(true)
                  }}
                  className="text-xs px-3 py-1 rounded-sm border bg-white hover:bg-neutral-100 transition-colors"
                >
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>
        <div ref={sentinelRef} className="h-8" />
      </main>

      {newsModalOpen && selectedNewsIndex !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="text-xs text-green-600">{new Date(newsData[selectedNewsIndex].date).toLocaleDateString()}</div>
                <div className="text-sm font-medium text-green-700">{newsData[selectedNewsIndex].title}</div>
              </div>
              <button
                onClick={() => setNewsModalOpen(false)}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {newsData[selectedNewsIndex].image && (
              <img
                src={newsData[selectedNewsIndex].image}
                alt={newsData[selectedNewsIndex].title}
                loading="lazy"
                className="w-full object-cover"
              />
            )}
            <div className="p-4 text-sm text-green-700">
              {newsData[selectedNewsIndex].text}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
