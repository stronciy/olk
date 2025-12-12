import Link from "next/link"

export const revalidate = 600

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
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/news/${id}`
  const shareTitle = encodeURIComponent(title)
  const shareLink = encodeURIComponent(shareUrl)
  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="mb-4">
          <Link href="/news" className="text-xs px-3 py-1 rounded-sm border bg-white hover:bg-neutral-100">← Back to News</Link>
        </div>
        {n ? (
          <article className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
            <img
              src={previewUrl}
              alt={title}
              loading="lazy"
              className="w-full object-cover aspect-[4/3]"
              onError={(e) => ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG)}
            />
            <div className="p-4">
          <div className="text-xs text-green-600">{formatDateForView(date)}</div>
          <h1 className="text-lg font-medium text-green-700 mt-1">{title}</h1>
          {shortText && <p className="text-sm text-green-700 mt-2">{shortText}</p>}
          <div className="text-sm text-green-700 mt-3" dangerouslySetInnerHTML={{ __html: content || summary }} />
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1 rounded-sm border bg-white hover:bg-neutral-100"
                >
                  Share Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${shareLink}&text=${shareTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1 rounded-sm border bg-white hover:bg-neutral-100"
                >
                  Share Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1 rounded-sm border bg-white hover:bg-neutral-100"
                >
                  Share LinkedIn
                </a>
              </div>
            </div>
          </article>
        ) : (
          <div className="text-xs text-red-600">News not found</div>
        )}
      </main>
    </div>
  )
}
