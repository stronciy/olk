"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Search, X, Menu, ChevronLeft, ChevronRight, Play } from "lucide-react"

type Media = { id?: number; type: "image" | "video"; url: string; thumbnail?: string | null; alt?: string | null }
type WorkItem = {
  id: number
  title: string
  slug: string
  location?: string | null
  description?: string | null
  year?: number | null
  type?: string | null
  collaborators?: string | null
  media: Media[]
}

type Section = {
  id: number
  slug: string
  name: string
  position: number
  visible: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
}

const sidebarProjects = [
  "LIBRARY OF LIGHT",
  "LADY GAGA COACHELLA",
  "FACE TO FACE",
  "MAX RICHTER",
  "CONGREGATION",
  "CORIOLANUS",
  "GUCCI COSMOS",
  "SURFACING - ART BASEL",
  "BAD BUNNY - MOST WANTED TOUR",
  "AN ATLAS OF Oksana Levchenya - COOPE...",
  "AN ATLAS OF Oksana Levchenya",
  "U2 - THE SPHERE",
  "RENAISSANCE - WORLD TOUR",
  "SALAMANDER - BRISBANE FESTIVAL",
  "THE CRUCIBLE",
  "THE WEEKND - EUROPEAN STADI...",
]

 

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

export default function WorkPage() {
  const [projects, setProjects] = useState<WorkItem[]>([])
  const [selectedProject, setSelectedProject] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<"work" | "information">("work")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const mediaContainerRef = useRef<HTMLDivElement | null>(null)
  const [imageError, setImageError] = useState(false)
  const stageVideoRef = useRef<HTMLVideoElement | null>(null)
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null)
  const currentMedia = projects[selectedProject]?.media || []
  const [stageCursor, setStageCursor] = useState<"zoom-in" | "e-resize" | "w-resize">("zoom-in")
  const fullscreenWrapperRef = useRef<HTMLDivElement | null>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null)
  const [zoomOverlayColor, setZoomOverlayColor] = useState<"black" | "white">("white")
  const [zoomOverlaySize, setZoomOverlaySize] = useState<number>(0)
  const [sections, setSections] = useState<Section[]>([])
  const [infoCategory, setInfoCategory] = useState<
    | "about"
    | "news"
    | "contacts"
    | "awards"
    | "solo"
    | "group"
    | "fairs"
    | "websites"
  >("about")
  const [activeWorkSubcategory, setActiveWorkSubcategory] = useState<string>("paint")
  const [showThumbs, setShowThumbs] = useState(false)
  const [newsModalOpen, setNewsModalOpen] = useState(false)
  const [selectedNewsIndex, setSelectedNewsIndex] = useState<number | null>(null)
  const [visibleNewsCount, setVisibleNewsCount] = useState(6)
  const newsSentinelRef = useRef<HTMLDivElement | null>(null)
  const [newsItems, setNewsItems] = useState<{ id: number; title: string; date: string; text: string; summary: string; content: string; previewUrl?: string }[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [fairs, setFairs] = useState<{ year: number | null; title: string }[]>([])
  const [awards, setAwards] = useState<{ year: number | null; title: string }[]>([])
  const [solo, setSolo] = useState<{ year: number | null; title: string }[]>([])
  const [group, setGroup] = useState<{ year: number | null; title: string }[]>([])
  const [websites, setWebsites] = useState<{ url: string; label: string }[]>([])
  const [websitesLoading, setWebsitesLoading] = useState(false)
  const [websitesError, setWebsitesError] = useState<string | null>(null)
  const [websitesRefreshTick, setWebsitesRefreshTick] = useState(0)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsError, setContactsError] = useState<string | null>(null)
  const [contactsEmail, setContactsEmail] = useState("")
  const [contactsPhone, setContactsPhone] = useState("")
  const [contactsAddressLine1, setContactsAddressLine1] = useState("")
  const [contactsAddressLine2, setContactsAddressLine2] = useState("")
  const [contactsAddressLine3, setContactsAddressLine3] = useState("")
  const [contactsInstagram, setContactsInstagram] = useState("")
  const [contactsFacebook, setContactsFacebook] = useState("")
  const [contactsWebsite, setContactsWebsite] = useState("")
  const [aboutHtml, setAboutHtml] = useState("")
  const [aboutLoading, setAboutLoading] = useState(false)
  const [aboutError, setAboutError] = useState<string | null>(null)
  const mobileThumbsRef = useRef<HTMLDivElement | null>(null)
  const [mobileThumbCanScrollUp, setMobileThumbCanScrollUp] = useState(false)
  const [mobileThumbCanScrollDown, setMobileThumbCanScrollDown] = useState(false)
  const [loadedThumbs, setLoadedThumbs] = useState<Set<number>>(new Set())
  const [mediaLoading, setMediaLoading] = useState(false)
  const [visibleThumbs, setVisibleThumbs] = useState<Set<number>>(new Set())
  const thumbObserversRef = useRef<Map<number, IntersectionObserver>>(new Map())
  const thumbElementsRef = useRef<Map<number, HTMLElement>>(new Map())
  const infoScrollRef = useRef<HTMLDivElement | null>(null)
  const [infoCanScrollUp, setInfoCanScrollUp] = useState(false)
  const [infoCanScrollDown, setInfoCanScrollDown] = useState(false)

  const fetchWebsites = async () => {
    setWebsitesLoading(true)
    setWebsitesError(null)
    try {
      const r = await fetch("/api/information/websites?sort=position", { cache: "no-store" })
      if (!r.ok) {
        const t = await r.text().catch(() => "")
        throw new Error(t || "Ошибка загрузки")
      }
      const j = await r.json().catch(() => ({}))
      const arr = j?.data?.websites || j?.websites || []
      setWebsites(arr.map((it: any) => ({ url: String(it.url || ""), label: String(it.label || "") })))
      setWebsitesRefreshTick((x) => x + 1)
    } catch (e: any) {
      setWebsitesError(typeof e?.message === "string" ? e.message : "Ошибка загрузки")
    } finally {
      setWebsitesLoading(false)
    }
  }
  const fetchContacts = async () => {
    setContactsLoading(true)
    setContactsError(null)
    try {
      const r = await fetch("/api/information/contacts", { cache: "no-store" })
      if (!r.ok) {
        const t = await r.text().catch(() => "")
        throw new Error(t || "Ошибка загрузки")
      }
      const j = await r.json().catch(() => ({}))
      const c = j?.data?.contacts || j?.contacts || {}
      setContactsEmail(String(c.email || ""))
      setContactsPhone(String(c.phone || ""))
      setContactsAddressLine1(String(c.addressLine1 || ""))
      setContactsAddressLine2(String(c.addressLine2 || ""))
      setContactsAddressLine3(String(c.addressLine3 || ""))
      setContactsInstagram(String(c.instagram || ""))
      setContactsFacebook(String(c.facebook || ""))
      setContactsWebsite(String(c.website || ""))
    } catch (e: any) {
      setContactsError(typeof e?.message === "string" ? e.message : "Ошибка загрузки")
    } finally {
      setContactsLoading(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreenOpen) return

      if (e.key === "Escape") {
        setFullscreenOpen(false)
      } else if (e.key === "ArrowLeft") {
        handlePrevMedia()
      } else if (e.key === "ArrowRight") {
        handleNextMedia()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [fullscreenOpen, currentMediaIndex, selectedProject])

  const handlePrevMedia = () => {
    const currentMedia = projects[selectedProject]?.media || []
    setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const handleNextMedia = () => {
    const currentMedia = projects[selectedProject]?.media || []
    setCurrentMediaIndex((prev) => (prev < currentMedia.length - 1 ? prev + 1 : 0))
  }

  useEffect(() => {
    setCurrentMediaIndex(0)
  }, [selectedProject])

  useEffect(() => {
    setImageError(false)
  }, [fullscreenOpen])

  useEffect(() => {
    setMediaLoading(true)
  }, [selectedProject, currentMediaIndex, activeWorkSubcategory])

  useEffect(() => {
    const el = infoScrollRef.current
    if (!el || activeSection !== "information") return
    const onScroll = () => {
      const top = el.scrollTop
      const max = el.scrollHeight - el.clientHeight
      setInfoCanScrollUp(top > 2)
      setInfoCanScrollDown(max - top > 2)
    }
    onScroll()
    el.addEventListener("scroll", onScroll, { passive: true } as any)
    const RZ = (typeof window !== "undefined" && (window as any).ResizeObserver) || null
    const ro = RZ ? new RZ(onScroll) : null
    if (ro) ro.observe(el)
    return () => {
      el.removeEventListener("scroll", onScroll)
      if (ro) ro.disconnect()
    }
  }, [activeSection, infoCategory, aboutHtml, newsItems.length, websites.length])
  const registerThumbRef = (idx: number) => (el: HTMLElement | null) => {
    if (!el) return
    const existing = thumbObserversRef.current.get(idx)
    if (existing) {
      try { existing.disconnect() } catch {}
      thumbObserversRef.current.delete(idx)
    }
    thumbElementsRef.current.set(idx, el)
    const rootEl = mobileThumbsRef.current || null
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setVisibleThumbs((prev) => {
            const next = new Set(prev)
            next.add(idx)
            if (idx > 0) next.add(idx - 1)
            next.add(idx + 1)
            return next
          })
        }
      },
      { root: rootEl, threshold: 0.1 }
    )
    obs.observe(el)
    thumbObserversRef.current.set(idx, obs)
  }

  // moved below filteredProjects declaration to avoid using before declaration

  useEffect(() => {
    const load = async () => {
      const r = await fetch("/api/work/sections")
      const data = r.ok ? await r.json() : { sections: [] }
      const arr: Section[] = (data.sections || [])
        .filter((s: any) => s && s.slug)
        .map((s: any) => ({
          id: Number(s.id ?? 0),
          slug: String(s.slug || ""),
          name: String(s.name || ""),
          position: Number(s.position ?? 0),
          visible: Boolean(s.visible),
          seoTitle: typeof s.seoTitle === "string" ? s.seoTitle : null,
          seoDescription: typeof s.seoDescription === "string" ? s.seoDescription : null,
          seoKeywords: typeof s.seoKeywords === "string" ? s.seoKeywords : null,
        }))
      setSections(arr)
      const slugs = arr.map((s) => s.slug)
      if (!slugs.includes(activeWorkSubcategory)) {
        if (slugs.length > 0) {
          setActiveWorkSubcategory(slugs[0])
        }
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadInfo = async () => {
      if (activeSection !== "information") return
      if (infoCategory === "fairs" && fairs.length === 0) {
        const r = await fetch("/api/information/fairs").then((x) => x.json()).catch(() => null)
        const arr = r?.data?.fairs || r?.fairs || []
        setFairs(arr.map((it: any) => ({ year: typeof it.year === "number" ? it.year : null, title: String(it.title || "") })))
      } else if (infoCategory === "awards" && awards.length === 0) {
        const r = await fetch("/api/information/awards").then((x) => x.json()).catch(() => null)
        const arr = r?.data?.awards || r?.awards || []
        setAwards(arr.map((it: any) => ({ year: typeof it.year === "number" ? it.year : null, title: String(it.title || "") })))
      } else if (infoCategory === "solo" && solo.length === 0) {
        const r = await fetch("/api/information/solo").then((x) => x.json()).catch(() => null)
        const arr = r?.data?.solo || r?.solo || []
        setSolo(arr.map((it: any) => ({ year: typeof it.year === "number" ? it.year : null, title: String(it.title || "") })))
      } else if (infoCategory === "group" && group.length === 0) {
        const r = await fetch("/api/information/group").then((x) => x.json()).catch(() => null)
        const arr = r?.data?.group || r?.group || []
        setGroup(arr.map((it: any) => ({ year: typeof it.year === "number" ? it.year : null, title: String(it.title || "") })))
      } else if (infoCategory === "websites" && websites.length === 0) {
        await fetchWebsites()
      } else if (infoCategory === "contacts" && contactsEmail === "" && contactsPhone === "" && contactsAddressLine1 === "" && contactsInstagram === "" && contactsWebsite === "") {
        await fetchContacts()
      } else if (infoCategory === "about") {
        setAboutLoading(true)
        setAboutError(null)
        try {
          const r = await fetch(`/api/information/about?ts=${Date.now()}`, { cache: "no-store" })
          if (!r.ok) {
            const t = await r.text().catch(() => "")
            throw new Error(t || "Ошибка загрузки")
          }
          const j = await r.json().catch(() => ({}))
          const t = j?.data?.about?.text || j?.about?.text || ""
          const rewritten = String(t).replace(/src="\/uploads\/about\/([^"]+)"/g, 'src="/api/information/about/file/$1"')
          setAboutHtml(rewritten)
        } catch (e: any) {
          setAboutError(typeof e?.message === "string" ? e.message : "Ошибка загрузки")
        } finally {
          setAboutLoading(false)
        }
      } else if (infoCategory === "news" && newsItems.length === 0) {
        setNewsLoading(true)
        setNewsError(null)
        try {
          const r = await fetch("/api/information/news?sort=date&limit=100&nocache=1", { cache: "no-store" })
          if (!r.ok) {
            const t = await r.text().catch(() => "")
            throw new Error(t || "Ошибка загрузки")
          }
          const j = await r.json().catch(() => ({}))
          const arr = j?.data?.news || j?.news || []
          const mapped = arr.map((n: any) => {
            const id = Number(n.id || 0)
            const title = String(n.title || "")
            const date = String(n.date || "")
            const text = String(n.text || "")
            const summary = String(n.summary || "")
            const content = String(n.content || "")
            const previewUrl = String(n.previewUrl || "")
            const m = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)
            const contentImg = m?.[1] || ""
            const tileUrl = previewUrl || contentImg || ""
            return { id, title, date, text, summary, content, previewUrl: tileUrl }
          })
          setNewsItems(mapped)
          setVisibleNewsCount(6)
        } catch (e: any) {
          setNewsError(typeof e?.message === "string" ? e.message : "Ошибка загрузки")
        } finally {
          setNewsLoading(false)
        }
      }
    }
    loadInfo()
  }, [activeSection, infoCategory])

  useEffect(() => {
    const m = currentMedia[currentMediaIndex]
    if (m?.type === "video") {
      const v = fullscreenOpen ? fullscreenVideoRef.current : stageVideoRef.current
      v?.play().catch(() => {})
    }
  }, [currentMediaIndex, currentMedia, fullscreenOpen])

  useEffect(() => {
    if (!fullscreenOpen) return
    const overlayEl = document.getElementById("work-media-fullscreen-overlay")
    const target = overlayEl || fullscreenWrapperRef.current
    const bg = target ? window.getComputedStyle(target).backgroundColor : "rgb(0,0,0)"
    const m = bg.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)/)
    if (m) {
      const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10)
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
      setZoomOverlayColor(luminance > 128 ? "black" : "white")
    } else {
      setZoomOverlayColor("white")
    }
  }, [fullscreenOpen, currentMediaIndex])

  useEffect(() => {
    if (!fullscreenOpen) return
    const updateSize = () => {
      const rect = fullscreenContainerRef.current?.getBoundingClientRect()
      if (!rect) return
      const size = Math.floor(Math.min(rect.width, rect.height))
      setZoomOverlaySize(size)
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [fullscreenOpen])

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/work/items?section=${activeWorkSubcategory}`)
      const raw = await res.json().catch(() => ({}))
      const srcItems = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.data?.items) ? raw.data.items : []
      const normalized: WorkItem[] = srcItems.map((i: any) => ({
        id: Number(i?.id ?? 0),
        title: String(i?.title || ""),
        slug: String(i?.slug || ""),
        location: typeof i?.location === "string" ? i.location : null,
        description: typeof i?.description === "string" ? i.description : null,
        year: typeof i?.year === "number" ? i.year : null,
        type: typeof i?.type === "string" ? i.type : null,
        collaborators: typeof i?.collaborators === "string" ? i.collaborators : null,
        media: (i?.media || []).map((m: any) => ({
          id: Number(m?.id ?? 0),
          type: String(m?.type).toLowerCase() === "video" ? "video" : "image",
          url: String(m?.url || ""),
          thumbnail: typeof m?.thumbnail === "string" ? m.thumbnail : null,
          alt: typeof m?.alt === "string" ? m.alt : null,
        })),
      }))
      setProjects(normalized)
      setSelectedProject(0)
      setCurrentMediaIndex(0)
    }
    load()
  }, [activeWorkSubcategory])

  const filteredProjects = projects
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => (searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) : true))

  useEffect(() => {
    return () => {
      thumbObserversRef.current.forEach((o) => {
        try { o.disconnect() } catch {}
      })
      thumbObserversRef.current.clear()
    }
  }, [filteredProjects.length, activeSection])

  useEffect(() => {
    const el = mobileThumbsRef.current
    if (!el) return
    const onScroll = () => {
      const top = el.scrollTop
      const max = el.scrollHeight - el.clientHeight
      setMobileThumbCanScrollUp(top > 2)
      setMobileThumbCanScrollDown(max - top > 2)
    }
    onScroll()
    el.addEventListener("scroll", onScroll, { passive: true } as any)
    const RZ = (typeof window !== "undefined" && (window as any).ResizeObserver) || null
    const ro = RZ ? new RZ(onScroll) : null
    if (ro) ro.observe(el)
    return () => {
      el.removeEventListener("scroll", onScroll)
      if (ro) ro.disconnect()
    }
  }, [filteredProjects.length, activeSection])

  useEffect(() => {
    const container = mobileThumbsRef.current
    if (!container || activeSection !== "work") return
    let timer: any
    const focusNearest = () => {
      const rect = container.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2
      let bestIdx: number | null = null
      let bestDist = Infinity
      thumbElementsRef.current.forEach((el, idx) => {
        const r = el.getBoundingClientRect()
        const y = r.top + r.height / 2
        const d = Math.abs(y - centerY)
        if (d < bestDist) {
          bestDist = d
          bestIdx = idx
        }
      })
      if (bestIdx !== null) {
        const el = thumbElementsRef.current.get(bestIdx)
        if (el) {
          try { el.focus() } catch {}
        }
      }
    }
    const onScroll = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(focusNearest, 120)
    }
    container.addEventListener("scroll", onScroll, { passive: true } as any)
    focusNearest()
    return () => {
      container.removeEventListener("scroll", onScroll)
      if (timer) clearTimeout(timer)
    }
  }, [filteredProjects.length, activeSection])
  const openFullscreen = (mediaIndex: number) => {
    setCurrentMediaIndex(mediaIndex)
    setFullscreenOpen(true)
  }

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleNextMedia()
    } else if (isRightSwipe) {
      handlePrevMedia()
    }
  }


  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = mediaContainerRef.current
    const mediaEl = container?.querySelector("img, video") as HTMLElement | null
    const r = mediaEl?.getBoundingClientRect()
    if (mediaEl && r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      openFullscreen(currentMediaIndex)
      return
    }
    if (stageCursor === "e-resize") {
      handleNextMedia()
      return
    }
    if (stageCursor === "w-resize") {
      handlePrevMedia()
      return
    }
  }

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = mediaContainerRef.current
    const mediaEl = container?.querySelector("img, video") as HTMLElement | null
    const r = mediaEl?.getBoundingClientRect()
    if (!r) {
      setStageCursor("zoom-in")
      return
    }
    const x = e.clientX
    if (x < r.left) {
      setStageCursor("w-resize")
    } else if (x > r.right) {
      setStageCursor("e-resize")
    } else {
      setStageCursor("zoom-in")
    }
  }

  useEffect(() => {
    if (infoCategory !== "news") return
    const sentinel = newsSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleNewsCount((prev) => Math.min(prev + 6, newsItems.length))
        }
      })
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [infoCategory, newsItems.length])

  useEffect(() => {
    if (infoCategory !== "news") {
      setVisibleNewsCount(6)
    }
  }, [infoCategory])

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      <header className="md:hidden bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-sm font-medium tracking-wide">Oksana Levchenya</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-neutral-100 rounded-sm transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex border-t border-neutral-200">
          <button
            onClick={() => {
              setActiveSection("work")
              setMobileMenuOpen(false)
            }}
            className={`flex-1 text-center px-4 py-3 text-xs font-medium transition-colors ${
              activeSection === "work" ? "bg-yellow-400" : "hover:bg-neutral-100"
            }`}
          >
            WORK
          </button>
          <button
            onClick={() => {
              setActiveSection("information")
              setMobileMenuOpen(false)
            }}
            className={`flex-1 text-center px-4 py-3 text-xs font-medium transition-colors border-l border-neutral-200 ${
              activeSection === "information" ? "bg-yellow-400" : "hover:bg-neutral-100"
            }`}
          >
            INFORMATION
          </button>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="px-4 py-3 text-xs text-neutral-400 hover:text-neutral-600 transition-colors border-l border-neutral-200"
          >
            <Search className="w-4 h-4" />
          </button>
        </nav>
      </header>

      {activeSection === "information" && (
        <div className="md:hidden sticky top-[56px] z-20 border-b border-neutral-200 bg-white">
          <div className="flex overflow-x-auto gap-2 p-2 snap-x snap-mandatory scroll-smooth">
            {(["about", "news", "contacts", "fairs", "awards", "solo", "group", "websites"] as const).map((cat) => (
              <button
                key={cat}
                onClick={async () => {
                  setInfoCategory(cat as any)
                  if (cat === "websites") {
                    await fetchWebsites()
                  } else if (cat === "contacts") {
                    await fetchContacts()
                  }
                }}
                className={`snap-start px-3 py-2 text-[11px] rounded-sm border transition-all ${
                  infoCategory === cat
                    ? "bg-yellow-400 text-neutral-900"
                    : "bg-white text-neutral-700 hover:bg-neutral-100 active:scale-95"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
      {activeSection === "work" && (
        <div className="md:hidden border-b border-neutral-200 bg-white">
          <div className="flex overflow-x-auto gap-2 p-2 snap-x snap-mandatory scroll-smooth">
            {sections.map((s) => (
              <button
                key={s.slug}
                onClick={() => {
                  setActiveWorkSubcategory(s.slug)
                  setSelectedProject(0)
                }}
                className={`snap-start px-3 py-2 text-[11px] rounded-sm border transition-all ${
                  activeWorkSubcategory === s.slug
                    ? "bg-yellow-400 text-neutral-900"
                    : "bg-white text-neutral-700 hover:bg-neutral-100 active:scale-95"
                }`}
              >
                {String(s.name || s.slug).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeSection === "work" && (
        <div className="md:hidden w-full">
          <div
            ref={mobileThumbsRef}
            className="h-[calc(100vh-56px)] overflow-y-scroll snap-y snap-mandatory scroll-smooth overscroll-contain"
            style={{
              WebkitOverflowScrolling: "touch",
              willChange: "scroll-position",
              scrollPaddingTop: "8px",
              scrollPaddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 32px)"
            } as any}
          >
            <div className="flex flex-col gap-2 p-2 pb-16">
              {filteredProjects.map(({ p: project, idx }) => (
                <button
                  key={idx}
                  ref={registerThumbRef(idx)}
                  tabIndex={0}
                  onClick={() => {
                    setSelectedProject(idx)
                    setFullscreenOpen(true)
                  }}
                  className={`relative snap-start w-full transition-transform duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                    idx === selectedProject ? "" : ""
                  }`}
                >
                  <div className="relative w-[80%] mx-auto aspect-[2/3] rounded-sm overflow-hidden">
                    {!loadedThumbs.has(idx) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 animate-pulse">
                        <div className="w-5 h-5 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                      </div>
                    )}
                    <img
                      src={visibleThumbs.has(idx) ? (project.media[0]?.thumbnail || project.media[0]?.url || "/placeholder.svg") : "/placeholder.svg"}
                      alt={project.title}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"
                      }}
                      onLoad={() => {
                        setLoadedThumbs((prev) => {
                          const next = new Set(prev)
                          next.add(idx)
                          return next
                        })
                      }}
                    />
                  </div>
                </button>
              ))}
              <div className="relative snap-start w-full transition-transform duration-150" aria-hidden="true" role="presentation">
                <div className="w-[80%] mx-auto aspect-[2/3] rounded-sm overflow-hidden bg-white border border-neutral-200" />
              </div>
            </div>
          </div>
        </div>
      )}

      {mobileMenuOpen && activeSection === "work" && (
        <div className="md:hidden bg-white border-b border-neutral-200 p-4 text-xs text-neutral-500">
          Select subcategory in the content header below.
        </div>
      )}
      {mobileMenuOpen && activeSection === "information" && (
        <div className="md:hidden bg-white border-b border-neutral-200 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-1 text-xs rounded-sm border bg-white hover:bg-neutral-100"
              onClick={async () => {
                setActiveSection("information")
                setInfoCategory("about")
                setMobileMenuOpen(false)
                await fetchContacts()
              }}
            >
              ABOUT
            </button>
            <button
              className="px-3 py-1 text-xs rounded-sm border bg-white hover:bg-neutral-100"
              onClick={async () => {
                setActiveSection("information")
                setInfoCategory("news")
                setMobileMenuOpen(false)
              }}
            >
              NEWS
            </button>
            <button
              className="px-3 py-1 text-xs rounded-sm border bg-white hover:bg-neutral-100"
              onClick={async () => {
                setActiveSection("information")
                setInfoCategory("contacts")
                setMobileMenuOpen(false)
                await fetchContacts()
              }}
            >
              CONTACTS
            </button>
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-48 bg-white border-r border-neutral-200 flex-col fixed h-full z-10">
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-sm font-medium tracking-wide">Oksana Levchenya</h1>
        </div>
        <div className="border-b border-neutral-200">
          <button
            onClick={() => setActiveSection("work")}
            className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
              activeSection === "work" ? "bg-yellow-400 hover:bg-yellow-500" : "hover:bg-neutral-100"
            }`}
          >
            WORK
          </button>
          <button
            onClick={() => setActiveSection("information")}
            className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
              activeSection === "information" ? "bg-yellow-400 hover:bg-yellow-500" : "hover:bg-neutral-100"
            }`}
          >
            INFORMATION
          </button>
          <div className="w-full px-4 py-3 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <Search className="w-3 h-3 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH"
                className="w-full bg-transparent text-xs text-neutral-700 placeholder:text-neutral-400 outline-none"
              />
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {activeSection === "work" && (
            <div className="mt-2">
              <button
                onClick={() => setShowThumbs((v) => !v)}
                className="w-full text-left px-4 py-1 text-[10px] text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                00 THUMBS
              </button>
              {projects.length > 0 ? (
                showThumbs ? (
                  <div className="p-2 grid grid-cols-1 gap-2">
                    {filteredProjects.map(({ p: project, idx }) => (
                      <button
                        key={idx}
                        ref={registerThumbRef(idx)}
                        onClick={() => setSelectedProject(idx)}
                        className={`relative aspect-[4/3] rounded-sm overflow-hidden group ${
                          idx === selectedProject ? "ring-2 ring-yellow-400" : ""
                        }`}
                      >
                        {!loadedThumbs.has(idx) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 animate-pulse">
                            <div className="w-5 h-5 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                          </div>
                        )}
                        <img
                          src={project.media[0].thumbnail || project.media[0]?.url || "/placeholder.svg"}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg"
                          }}
                          onLoad={() => {
                            setLoadedThumbs((prev) => {
                              const next = new Set(prev)
                              next.add(idx)
                              return next
                            })
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-1">
                          <span className="text-white text-[9px] font-medium leading-tight uppercase">
                            {project.title}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1">
                    {filteredProjects.map(({ p: project, idx }) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedProject(idx)}
                        className={`w-full text-left px-4 py-2 text-[11px] transition-colors ${
                          idx === selectedProject
                            ? "bg-yellow-100 text-neutral-900"
                            : "text-neutral-600 hover:bg-neutral-100"
                        }`}
                      >
                        {project.title}
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div className="px-4 py-2 text-[11px] text-neutral-500">No works yet</div>
              )}
            </div>
          )}
          {activeSection === "information" && <div className="mt-2" />}
        </nav>
      </aside>

      <main className={`flex-1 md:ml-48 md:pl-0 ${activeSection === "information" ? "pl-0" : "pl-20"}`}>
        {activeSection === "work" ? (
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="text-xs font-medium tracking-wider">WORK</div>
              <div className="flex flex-wrap gap-2">
                {sections.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => {
                      setActiveWorkSubcategory(s.slug)
                      setSelectedProject(0)
                      setSearchQuery("")
                    }}
                    className={`px-3 py-1 text-[11px] rounded-sm border ${
                      activeWorkSubcategory === s.slug ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"
                    }`}
                  >
                    {String(s.name || s.slug).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:hidden mb-4">
              <div className="grid grid-cols-3 gap-2">
                {filteredProjects.map(({ p: project, idx }) => (
                  <button
                    key={idx}
                    className={`relative aspect-[2/3] rounded-sm overflow-hidden transition-transform duration-150 active:scale-95 ${
                      idx === selectedProject ? "ring-2 ring-yellow-400" : ""
                    }`}
                    onClick={() => {
                      setSelectedProject(idx)
                      openFullscreen(0)
                    }}
                  >
                    {!loadedThumbs.has(idx) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 animate-pulse">
                        <div className="w-5 h-5 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                      </div>
                    )}
                    <img
                      src={project.media[0]?.thumbnail || project.media[0]?.url || "/placeholder.svg"}
                      alt={project.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"
                      }}
                      onLoad={() => {
                        setLoadedThumbs((prev) => {
                          const next = new Set(prev)
                          next.add(idx)
                          return next
                        })
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
            {projects.length > 0 ? (
              <>
                <div className="mb-4 md:mb-8">
                  <h2 className="text-xs md:text-sm font-medium tracking-wider mb-1">
                    {(projects[selectedProject]?.title || "").toUpperCase()} - {(projects[selectedProject]?.location || "").toUpperCase()}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-green-600">{currentMediaIndex + 1} / {currentMedia.length}</span>
                    <button
                      onClick={() => setDetailsOpen(!detailsOpen)}
                      className="text-xs text-green-600 hover:text-green-700 transition-colors"
                    >
                      {detailsOpen ? "HIDE DETAILS" : "DETAILS"}
                    </button>
                  </div>
                </div>

            {false}

            <div className="mb-4">
              <div
                id={"work-media-stage"}
                className="relative bg-transparent rounded-sm overflow-hidden group h-[50vh] md:h-[60vh] md:flex hidden items-center justify-center"
                onClick={handleStageClick}
              >
                {currentMedia.length > 0 && currentMedia[currentMediaIndex]?.type === "image" && (
                  <div id={"work-media-stage-overlay"} className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-transparent">
                    <div className="absolute inset-0 -rotate-45 origin-center">
                      {Array.from({ length: 192 }).map((_, rowIdx) => (
                        <div
                          key={rowIdx}
                          className="absolute left-[-100%] w-[100%] whitespace-nowrap text-[32px] leading-[0px] text-neutral-100"
                          style={{ top: rowIdx * 60 - 200 }}
                        >
                          {"OKSANA LEVCHENYA ".repeat(320)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div
                  ref={mediaContainerRef}
                  id={`work-media-stage-${projects[selectedProject]?.id ?? "unknown"}-${currentMedia[currentMediaIndex]?.id ?? "unknown"}-container`}
                  className="relative z-10 h-full md:flex hidden items-center justify-center transition-[cursor] duration-150"
                  style={{ cursor: stageCursor }}
                  onMouseMove={handleStageMouseMove}
                  onMouseLeave={() => setStageCursor("zoom-in")}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStageClick(e)
                  }}
                >
                  {mediaLoading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10">
                      <div className="w-6 h-6 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
                    </div>
                  )}
                  <div className={`absolute inset-y-0 left-0 w-1/2 pointer-events-none transition-opacity duration-200 ${stageCursor === "w-resize" ? "opacity-40" : "opacity-0"} bg-gradient-to-r from-neutral-200/40 to-transparent`} />
                  <div className={`absolute inset-y-0 right-0 w-1/2 pointer-events-none transition-opacity duration-200 ${stageCursor === "e-resize" ? "opacity-40" : "opacity-0"} bg-gradient-to-l from-neutral-200/40 to-transparent`} />
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-200 ${stageCursor === "w-resize" ? "opacity-100" : "opacity-0"}`}>
                    <ChevronLeft className="w-8 h-8 text-neutral-700" />
                  </div>
                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-200 ${stageCursor === "e-resize" ? "opacity-100" : "opacity-0"}`}>
                    <ChevronRight className="w-8 h-8 text-neutral-700" />
                  </div>
                  {currentMedia.length > 0 && currentMedia[currentMediaIndex] ? (
                    currentMedia[currentMediaIndex]?.type === "image" ? (
                      imageError || !currentMedia[currentMediaIndex].url ? (
                        <div className="text-white text-center p-4">
                          <div className="text-sm">Something going wrong, please inform us about this</div>
                          <div className="text-sm">Thanks for visit</div>
                          <div className="text-sm">"OKSANA LEVCHENYA" website</div>
                          <div className="text-sm">we lobe you</div>
                          <div className="text-sm">Stand with Ukraine !</div>
                        </div>
                      ) : (
                        <img
                          src={currentMedia[currentMediaIndex]?.url}
                          alt=""
                          className="h-full w-auto object-contain"
                          loading="eager"
                          decoding="async"
                          onError={() => setImageError(true)}
                          onLoad={() => setMediaLoading(false)}
                        />
                      )
                    ) : (
                      <video
                        src={currentMedia[currentMediaIndex]?.url}
                        controls
                        autoPlay
                        muted
                        playsInline
                        preload="metadata"
                        ref={stageVideoRef}
                        className="max-h-full max-w-full object-contain"
                        onLoadedData={() => setMediaLoading(false)}
                      />
                    )
                  ) : (
                    <div className="text-neutral-300 text-sm">No media</div>
                  )}
                </div>
                {currentMedia.length > 0 && (
                  <div className="absolute bottom-2 right-2 text-[11px] px-2 py-1 rounded-sm bg-black/50 text-white">
                    {currentMediaIndex + 1} / {currentMedia.length}
                  </div>
                )}
                {detailsOpen && (
                  <div className="absolute inset-x-0 top-0 z-50 max-h-full overflow-auto bg-white border border-neutral-200 rounded-sm shadow-md animate-in slide-in-from-top duration-200">
                    <div className="p-4 md:p-6 relative">
                      <button
                        onClick={() => setDetailsOpen(false)}
                        className="absolute top-4 right-4 text-green-600 hover:text-green-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <h3 className="text-xs font-medium tracking-wider mb-4 text-green-800">PROJECT DETAILS</h3>
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-xs text-green-600 mb-1">DESCRIPTION</p>
                          <p className="text-green-700 leading-relaxed">{projects[selectedProject]?.description}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-green-600 mb-1">YEAR</p>
                            <p className="text-green-800">{projects[selectedProject]?.year}</p>
                          </div>
                          <div>
                            <p className="text-xs text-green-600 mb-1">TYPE</p>
                            <p className="text-green-800">{projects[selectedProject]?.type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-green-600 mb-1">LOCATION</p>
                            <p className="text-green-800">{projects[selectedProject]?.location}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-green-600 mb-1">COLLABORATORS</p>
                          <p className="text-green-800">{projects[selectedProject]?.collaborators}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 md:mt-6">
              <button
                onClick={handlePrevMedia}
                disabled={currentMediaIndex === 0}
                className="text-xs text-green-700 hover:text-green-800 transition-colors disabled:opacity-30"
              >
                ← PREVIOUS
              </button>
              <button
                onClick={handleNextMedia}
                disabled={currentMedia.length <= 1}
                className="text-xs text-green-700 hover:text-green-800 transition-colors disabled:opacity-30"
              >
                NEXT →
              </button>
            </div>
              </>
            ) : (
              <div className="text-sm text-neutral-600">No works yet</div>
            )}
          </div>
        ) : (
          <div ref={infoScrollRef} className="relative w-full px-4 md:px-8 pr-0 md:overflow-visible md:h-auto overflow-y-auto scroll-smooth h-[calc(100vh-56px-44px)]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="text-xs font-medium tracking-wider">INFORMATION</div>
              <div className="hidden md:flex flex-wrap gap-2">
                {(["about", "news", "contacts", "fairs", "awards", "solo", "group", "websites"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={async () => {
                      setInfoCategory(cat as any)
                      if (cat === "websites") {
                        await fetchWebsites()
                      } else if (cat === "contacts") {
                        await fetchContacts()
                      }
                    }}
                    className={
                      "px-3 py-1 text-[11px] rounded-sm border " +
                      (infoCategory === cat ? "bg-yellow-400" : "bg-white hover:bg-neutral-100")
                    }
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {infoCanScrollUp && (
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent" />
            )}

              {infoCategory === "fairs" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Year</TableHead>
                        <TableHead>Event</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fairs.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-neutral-900">{item.year ?? "—"}</TableCell>
                          <TableCell className="text-neutral-700">{item.title}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {infoCanScrollDown && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
              )}
              {infoCategory === "about" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-4">
                  {aboutLoading && <div className="text-xs text-neutral-500">Loading…</div>}
                  {aboutError && <div className="text-xs text-red-600">{aboutError}</div>}
                  {!aboutLoading && !aboutError && (
                    <div className="prose prose-sm max-w-none text-neutral-700" dangerouslySetInnerHTML={{ __html: aboutHtml }} />
                  )}
                </div>
              )}
              {infoCategory === "contacts" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-4 text-sm">
                  {contactsLoading && <div className="text-xs text-neutral-500 animate-in fade-in duration-200">Loading…</div>}
                  {contactsError && <div className="text-xs text-red-600 animate-in fade-in duration-200">{contactsError}</div>}
                  {!contactsLoading && !contactsError && (
                    <div className="text-neutral-700 space-y-4 animate-in fade-in duration-200">
                      <div>
                        <div className="text-xs text-neutral-500">Address</div>
                        <address className="not-italic leading-5">
                          {contactsAddressLine1 && <div>{contactsAddressLine1}</div>}
                          {contactsAddressLine2 && <div>{contactsAddressLine2}</div>}
                          {contactsAddressLine3 && <div>{contactsAddressLine3}</div>}
                        </address>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Phone</div>
                        <div className="text-sm">{contactsPhone}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Email</div>
                        <div className="text-sm">{contactsEmail}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Social</div>
                        <div className="flex items-center gap-4">
                          {contactsInstagram && (
                            <a
                              href={contactsInstagram.startsWith("http") ? contactsInstagram : `https://${contactsInstagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Instagram"
                              className="inline-flex items-center justify-center rounded-sm hover:scale-[1.05] transition-transform"
                            >
                              <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z" stroke="#16a34a" strokeWidth="2"/>
                                <circle cx="12" cy="12" r="3.5" stroke="#16a34a" strokeWidth="2"/>
                                <circle cx="17.5" cy="6.5" r="1.5" fill="#16a34a"/>
                              </svg>
                            </a>
                          )}
                          {contactsFacebook && (
                            <a
                              href={contactsFacebook.startsWith("http") ? contactsFacebook : `https://${contactsFacebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Facebook"
                              className="inline-flex items-center justify-center rounded-sm hover:scale-[1.05] transition-transform"
                            >
                              <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.5 10H16l.5-3h-3V5.5c0-.8.2-1.5 1.5-1.5H16V1.2S14.8 1 13.7 1C11.3 1 10 2.7 10 5.2V7H7v3h3v9h3.5v-9Z" fill="#16a34a"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {infoCategory === "news" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-4">
                  {newsLoading && <div className="text-xs text-neutral-500">Loading…</div>}
                  {newsError && <div className="text-xs text-red-600">{newsError}</div>}
                  {!newsLoading && !newsError && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {newsItems.slice(0, visibleNewsCount).map((item, idx) => (
                      <div
                        key={idx}
                        className="group border rounded-sm overflow-hidden bg-white hover:shadow-md transition-shadow animate-in fade-in duration-200"
                      >
                        <div className="p-3">
                          <div className="text-xs text-neutral-500 mb-1">{new Date(item.date).toLocaleDateString()}</div>
                          <div className="text-sm font-medium mb-1">{item.title}</div>
                          <div className="text-sm text-neutral-700 mb-2">{clampText(item.text, 150)}</div>
                      </div>
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.title}
                            loading="lazy"
                            className="w-full aspect-[4/3] object-cover"
                          />
                        ) : (
                          <div className="px-3 pb-3 text-sm text-neutral-700">{clampText(item.text || "", 150)}</div>
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
                  )}
                  <div ref={newsSentinelRef} className="h-8" />
                </div>
              )}

              {infoCategory === "websites" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-4 text-sm">
                  {websitesLoading && <div className="text-xs text-neutral-500 animate-in fade-in duration-200">Loading…</div>}
                  {websitesError && <div className="text-xs text-red-600 animate-in fade-in duration-200">{websitesError}</div>}
                  {!websitesLoading && !websitesError && (
                    <ul className={`list-disc pl-5 space-y-2 transition-opacity duration-200 ${websitesRefreshTick ? "opacity-100" : "opacity-100"}`}>
                      {websites.map((w, idx) => (
                        <li key={`${w.url}-${idx}`} className="animate-in fade-in duration-200">
                          <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">{w.label || w.url}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {infoCategory === "awards" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Year</TableHead>
                        <TableHead>Award</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {awards.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-neutral-900">{item.year ?? "—"}</TableCell>
                          <TableCell className="text-neutral-700">{item.title}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {infoCategory === "solo" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Year</TableHead>
                        <TableHead>Title</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solo.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-neutral-900">{item.year ?? "—"}</TableCell>
                          <TableCell className="text-neutral-700">{item.title}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {infoCategory === "group" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Year</TableHead>
                        <TableHead>Title</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-neutral-900">{item.year ?? "—"}</TableCell>
                          <TableCell className="text-neutral-700">{item.title}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
          </div>
        )}
      </main>

      {fullscreenOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          ref={fullscreenWrapperRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => setFullscreenOpen(false)}
            className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-300 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={handlePrevMedia}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 transition-colors z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={handleNextMedia}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 transition-colors z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm z-10">
            {currentMediaIndex + 1} / {currentMedia.length}
          </div>

          <div
            id={`work-media-fullscreen-${projects[selectedProject]?.id ?? "unknown"}-${currentMedia[currentMediaIndex]?.id ?? "unknown"}-container`}
            className="relative w-full h-full flex items-center justify-center p-8"
            ref={fullscreenContainerRef}
          >
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-out will-change-transform"
              style={{ opacity: fullscreenOpen ? 1 : 0, transform: fullscreenOpen ? "scale(1)" : "scale(0.96)" }}
            >
              <div
                className="pointer-events-none border-2 transition-transform duration-300 ease-out will-change-transform"
                style={{ width: zoomOverlaySize, height: zoomOverlaySize, backgroundColor: zoomOverlayColor, borderColor: zoomOverlayColor === "white" ? "#e5e7eb" : "#111827", transform: fullscreenOpen ? "scale(1)" : "scale(0.98)" }}
              />
            </div>
            {currentMedia.length > 0 && currentMedia[currentMediaIndex]?.type === "image" && (
              <div id={"work-media-fullscreen-overlay"} className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-white">
                <div className="absolute inset-0 -rotate-45 origin-center">
                  {Array.from({ length: 96 }).map((_, rowIdx) => (
                    <div
                      key={rowIdx}
                      className="absolute left-[-100%] w-[300%] whitespace-nowrap text-[32px] leading-[80px] text-neutral-100"
                      style={{ top: rowIdx * 80 - 160 }}
                    >
                      {"OKSANA LEVCHENYA ".repeat(160)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {currentMedia[currentMediaIndex]?.type === "image" ? (
              imageError || !currentMedia[currentMediaIndex].url ? (
                <div className="text-white text-center p-4">
                  <div className="text-sm">Something going wrong, please inform us about this</div>
                  <div className="text-sm">Thanks for visit</div>
                  <div className="text-sm">"OKSANA LEVCHENYA" website</div>
                  <div className="text-sm">we lobe you</div>
                  <div className="text-sm">Stand with Ukraine !</div>
                </div>
              ) : (
                <img
                  src={currentMedia[currentMediaIndex]?.url}
                  alt=""
                  className="h-full w-auto object-contain relative z-10"
                  onClick={handleNextMedia}
                  onError={() => setImageError(true)}
                />
              )
            ) : (
              <video
                src={currentMedia[currentMediaIndex]?.url}
                controls
                autoPlay
                muted
                playsInline
                preload="metadata"
                ref={fullscreenVideoRef}
                className="max-w-full max-h-full object-contain"
              />
            )}
            {currentMedia.length > 1 && (
              <div className="absolute left-0 right-0 bottom-0 z-10 p-2">
                <div className="overflow-x-auto snap-x snap-mandatory scroll-smooth">
                  <div className="flex gap-2">
                    {currentMedia.map((m, i) => (
                      <button
                        key={m.id ?? i}
                        className={`relative w-14 h-14 rounded-sm overflow-hidden snap-start transition-transform active:scale-95 ${
                          i === currentMediaIndex ? "ring-2 ring-yellow-400" : ""
                        }`}
                        onClick={() => setCurrentMediaIndex(i)}
                      >
                        {!loadedThumbs.has(i) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 animate-pulse">
                            <div className="w-4 h-4 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                          </div>
                        )}
                        {m.type === "image" ? (
                          <img
                            src={m.thumbnail || m.url || "/placeholder.svg"}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            onLoad={() => {
                              setLoadedThumbs((prev) => {
                                const next = new Set(prev)
                                next.add(i)
                                return next
                              })
                            }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-black flex items-center justify-center text-[10px] text-white">VIDEO</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="absolute bottom-8 left-8 z-10">
              <button onClick={handlePrevMedia} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">← PREVIOUS</button>
            </div>
            <div className="absolute bottom-8 right-8 z-10">
              <button onClick={handleNextMedia} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">NEXT →</button>
            </div>
          </div>
        </div>
      )}
      {newsModalOpen && selectedNewsIndex !== null && infoCategory === "news" && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-sm w-full max-w-2xl max-h-[calc(100vh-40px)] overflow-hidden flex flex-col shadow-lg animate-in fade-in zoom-in-95">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
              <div>
                <div className="text-xs text-neutral-500">{new Date(newsItems[selectedNewsIndex].date).toLocaleDateString()}</div>
                <div className="text-sm font-medium">{newsItems[selectedNewsIndex].title}</div>
                <div className="text-xs text-neutral-700 mt-1">{newsItems[selectedNewsIndex].text}</div>
              </div>
              <button
                onClick={() => setNewsModalOpen(false)}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {newsItems[selectedNewsIndex].previewUrl && (
                <img
                  src={newsItems[selectedNewsIndex].previewUrl}
                  alt={newsItems[selectedNewsIndex].title}
                  loading="lazy"
                  className="w-full object-cover"
                />
              )}
              <div className="p-4 text-sm text-neutral-700">
                <div dangerouslySetInnerHTML={{ __html: newsItems[selectedNewsIndex].content || newsItems[selectedNewsIndex].summary }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
