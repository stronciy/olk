import Link from "next/link"

export const revalidate = 600

const formatDateForView = (s: string) => {
  const v = s?.includes("T") ? s : s?.replace(" ", "T")
  const d = v ? new Date(v) : null
  if (!d || Number.isNaN(d.getTime())) return s || ""
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = String(d.getFullYear())
  return `${dd}.${mm}.${yyyy}`
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

async function fetchNews(id: number) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/information/news/${id}`, { next: { revalidate } })
  if (!r.ok) {
    try {
      const t = await r.text()
      throw new Error(t || "Failed to load")
    } catch {
      throw new Error("Failed to load")
    }
  }
  const j = await r.json()
  return j?.data?.news || null
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isFinite(id) || id <= 0) return {}
  try {
    const n = await fetchNews(id)
    const title = String(n?.title || "News")
    const description = String(n?.summary || n?.text || "")
    const img = String(n?.previewUrl || extractFirstImageSrc(String(n?.content || "")) || "")
    return {
      title: `${title} — News`,
      description: description.slice(0, 160),
      openGraph: {
        title,
        description: description.slice(0, 160),
        images: img ? [img] : [],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: description.slice(0, 160),
        images: img ? [img] : [],
      },
    }
  } catch {
    return {}
  }
}

export default async function NewsItemPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const n = Number.isFinite(id) && id > 0 ? await fetchNews(id) : null
  const title = String(n?.title || "")
  const date = String(n?.date || "")
  const summary = String(n?.summary || "")
  const shortText = String(n?.text || "")
  const content = String(n?.content || "")
  const previewUrl = String(n?.previewUrl || extractFirstImageSrc(content) || PLACEHOLDER_IMG)

  return (
    <div className="min-h-screen bg-white text-black">
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <header className="flex items-center justify-between mb-10 text-[11px] tracking-[0.2em] uppercase">
          <Link href="/" className="hover:text-gray-500">
            Oksana Levchenya
          </Link>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-gray-500">
              Work
            </Link>
            <Link href="/news" className="hover:text-gray-500 font-semibold">
              News
            </Link>
            <Link href="/contacts" className="hover:text-gray-500">
              Contacts
            </Link>
          </nav>
        </header>

        {n ? (
          <article className="flex flex-col gap-8">
            <div className="w-full aspect-video bg-gray-100 overflow-hidden">
              <img
                src={previewUrl}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG
                }}
              />
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs text-gray-400 uppercase tracking-widest">
                {formatDateForView(date)}
              </span>
              <h1 className="text-3xl md:text-4xl font-light uppercase tracking-wide">
                {title}
              </h1>
              {shortText && (
                <p className="text-gray-600 font-light leading-relaxed">
                  {shortText}
                </p>
              )}
            </div>

            <div
              className="prose prose-gray max-w-none font-light leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content || summary }}
            />

            <div>
              <Link
                href="/news"
                className="text-xs tracking-[0.2em] uppercase border-b border-gray-300 pb-1 hover:text-gray-600"
              >
                Back to all news
              </Link>
            </div>
          </article>
        ) : (
          <div className="text-xs text-red-600">News not found</div>
        )}
      </main>
    </div>
  )
}
