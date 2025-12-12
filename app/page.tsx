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
  const [fairs, setFairs] = useState<{ year: number | null; title: string }[]>([])
  const [awards, setAwards] = useState<{ year: number | null; title: string }[]>([])
  const [solo, setSolo] = useState<{ year: number | null; title: string }[]>([])
  const [group, setGroup] = useState<{ year: number | null; title: string }[]>([])
  const [websites, setWebsites] = useState<{ url: string; label: string }[]>([])

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
    const load = async () => {
      const r = await fetch("/api/work/sections")
      const data = r.ok ? await r.json() : { sections: [] }
      const arr: Section[] = (data.sections || []).filter((s: any) => s && s.slug)
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
        const r = await fetch("/api/information/websites").then((x) => x.json()).catch(() => null)
        const arr = r?.data?.websites || r?.websites || []
        setWebsites(arr.map((it: any) => ({ url: String(it.url || ""), label: String(it.label || "") })))
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
      const data = await res.json()
      const normalized: WorkItem[] = (data.items || []).map((i: any) => ({
        ...i,
        media: (i.media || []).map((m: any) => ({
          id: m.id,
          type: String(m.type).toLowerCase() === "video" ? "video" : "image",
          url: m.url,
          thumbnail: m.thumbnail ?? null,
          alt: m.alt ?? null,
        })),
      }))
      setProjects(normalized)
      setSelectedProject(0)
      setCurrentMediaIndex(0)
    }
    load()
  }, [activeWorkSubcategory])

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
          setVisibleNewsCount((prev) => Math.min(prev + 6, newsData.length))
        }
      })
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [infoCategory])

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

      {mobileMenuOpen && activeSection === "work" && (
        <div className="md:hidden bg-white border-b border-neutral-200 p-4 text-xs text-neutral-500">
          Select subcategory in the content header below.
        </div>
      )}
      {mobileMenuOpen && activeSection === "information" && (
        <div className="md:hidden bg-white border-b border-neutral-200 p-4">
          <div className="flex flex-wrap gap-2">
            <Link href="/about" className="px-3 py-1 text-xs rounded-sm border bg-white hover:bg-neutral-100" onClick={() => setMobileMenuOpen(false)}>ABOUT</Link>
            <Link href="/news" className="px-3 py-1 text-xs rounded-sm border bg-white hover:bg-neutral-100" onClick={() => setMobileMenuOpen(false)}>NEWS</Link>
            <Link href="/contacts" className="px-3 py-1 text-xs rounded-sm border bg-white hover:bg-neutral-100" onClick={() => setMobileMenuOpen(false)}>CONTACTS</Link>
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
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-full text-left px-4 py-3 text-xs text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-2 border-t border-neutral-200"
          >
            <Search className="w-3 h-3" />
            SEARCH
          </button>
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
              {activeWorkSubcategory === "paint" ? (
                showThumbs ? (
                  <div className="p-2 grid grid-cols-1 gap-2">
                    {projects.map((project, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedProject(idx)}
                        className={`relative aspect-[4/3] rounded-sm overflow-hidden group ${
                          idx === selectedProject ? "ring-2 ring-yellow-400" : ""
                        }`}
                      >
                        <img
                          src={project.media[0].thumbnail || "/placeholder.svg"}
                          alt={project.title}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg"
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
                    {projects.map((project, idx) => (
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

      <main className="flex-1 md:ml-48">
        {activeSection === "work" ? (
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="text-xs font-medium tracking-wider">WORK</div>
              <div className="flex flex-wrap gap-2">
                {sections.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => setActiveWorkSubcategory(s.slug)}
                    className={`px-3 py-1 text-[11px] rounded-sm border ${
                      activeWorkSubcategory === s.slug ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"
                    }`}
                  >
                    {(s.name || s.slug).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {activeWorkSubcategory === "paint" ? (
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
                className="relative bg-white rounded-sm overflow-hidden group h-[50vh] md:h-[60vh] flex items-center justify-center"
                onClick={handleStageClick}
              >
                {currentMedia.length > 0 && currentMedia[currentMediaIndex]?.type === "image" && (
                  <div id={"work-media-stage-overlay"} className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-white">
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
                  className="relative z-10 h-full flex items-center justify-center transition-[cursor] duration-150"
                  style={{ cursor: stageCursor }}
                  onMouseMove={handleStageMouseMove}
                  onMouseLeave={() => setStageCursor("zoom-in")}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStageClick(e)
                  }}
                >
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
                        ref={stageVideoRef}
                        className="max-h-full max-w-full object-contain"
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
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="text-xs font-medium tracking-wider">INFORMATION</div>
              <div className="flex flex-wrap gap-2">
                {(["about", "news", "contacts", "fairs", "awards", "solo", "group", "websites"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setInfoCategory(cat as any)}
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
              {infoCategory === "about" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-4">
                  <h3 className="text-lg font-medium mb-4">Oksana Levchenya-Konstantinovska</h3>
                  <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
                    <p>
                      Oksana Levchenya-Konstantinovska was born in 1975 in Bershad, Vinnitsa Region, Ukraine in a family where medical practice has been a tradition. Even so, from the very childhood Levchenya has started being interested in art through exploration of the home collection of books that has included the history of art and the works of successful artists.
                    </p>
                    <p>
                      From the age of 17, however, for the sake of family legacy, she has begun to pursue the medical profession working as a junior nurse. In a few years later, Levchenya has moved to Kyiv, where she has entered A. A. Bogomolets National Medical University, and has taken a training route to become a surgeon. Yet, over the years of discovering who she really is, Levchenya has turned back to art and, in 2005, has graduated from the School of Architectural design in Kyiv.
                    </p>
                    <p>
                      A turning point in Levchenya’s artist career has been marked by the acquaintance with a renowned Kyiv city painter and graphic artist Alexandra Prakhova, member of the National Union of Artists of Ukraine. Sasha, as Alexandra Prakhova called herself, represented the dynasty of Prakhov in the fourth generation, has taught Levchenya the art of painting.
                    </p>
                    <p>
                      In 2009, Levchenya has been invited as a guest to the exhibition at Bereznytska & Partners Art Gallery, at that time curated by the Australian artist Adam Nankervis, nomadic museum MuseumMAN, where she has showed her paintings to Adam. The artist has appreciated Levchenya’s talent and has included her work to the exhibition Torn World that, later the same year, has been also exhibited in Ukrainian House in Kyiv, Ukraine. Since then, Levchenya’s works have been seen around the world in such notable art venues as ArtByGeneva Fair in Geneva; National Cultural-Art Museum Complex Mystetskyi Arsenal, FineArt Gallery, Ukrainian House, Bereznytska & Partners Art Gallery in Kyiv, Ukraine; Art gallery Sady Pobedy in Odesa, Ukraine; Art Southampton, New York; Gagliardi Gallery, London; ARTPALMBEACH-2012, Miami; Fondamenta degli Incurabili, Venice.
                    </p>
                    <p>
                      In 2017, Levchenya was awarded a Special Mention for Excellence at the London Art Biennale. The same year, the artist’s personal journey led her to another project that combined scientific approach and artistic thinking. Exhibition named Find your tribe and love them hard at Shcherbenko Art Center (Kyiv, Ukraine) is a manifest of social identity, first proposed by British psychologists Henri Tajfel and John Turner in 1979. The theory discusses a person's sense of belonging to a particular social group. Through the set of photographs, where Levchenya has worn ritual makeup of African, South African and Australian tribes, she has explored people’s eagerness to classify themselves as a specific group member and to be equated to a particular nation, occupation and gender.
                    </p>
                    <p>
                      For a while after, within the conceptual framework of anthropological approach of national cultural patterns, Levchenya has launched OLK MANUFACTORY. The Company produces traditional and modern hand-woven rugs and tapestries. OLK’s manufacturing process preserves an extremely intricate manual weaving technique, ranging back to the 16th century.
                    </p>
                    <p>
                      As well as earlier photography exhibition Find your tribe and love them hard, Levchenya’s new solo exhibition Nonexistent Tribes, held in November 2018 at BURSA gallery, Kyiv, has demonstrated her continuing interest in exploring the theory of social identity. Represented costumes and masks embody a mythological image of a person who doesn’t belong to any community, thus is released from stereotypes imposed by social principles. The most recent exhibition Totem of Recycling, which has begun around the same time as the previous, tackles the problem of over consumption and consumerist lifestyle of the modern society.
                    </p>
                    <p>
                      In March 2019, a reimagined Ukrainian kilim Space Cossacks, created by Levchenya’s OLK MANUFACTORY, has been shortlisted for the Arte Laguna Prize in the Design category.
                    </p>
                    <p>
                      The artist extracted the ornaments from the regional folk kilims of the 19th century and redrew them, blurring the line between the past and the present.
                    </p>
                  </div>
                </div>
              )}
              {infoCategory === "contacts" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-4 text-sm text-neutral-500">No data yet</div>
              )}
              {infoCategory === "news" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {newsData.slice(0, visibleNewsCount).map((item, idx) => (
                      <div
                        key={idx}
                        className="group border rounded-sm overflow-hidden bg-white hover:shadow-md transition-shadow animate-in fade-in duration-200"
                      >
                        <div className="p-3">
                          <div className="text-xs text-neutral-500 mb-1">{new Date(item.date).toLocaleDateString()}</div>
                          <div className="text-sm font-medium mb-2">{item.title}</div>
                        </div>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            className="w-full aspect-[4/3] object-cover"
                          />
                        ) : (
                          <div className="px-3 pb-3 text-sm text-neutral-700">{clampText(item.text || "")}</div>
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
                  <div ref={newsSentinelRef} className="h-8" />
                </div>
              )}

              {infoCategory === "websites" && (
                <div className="bg-white border border-neutral-200 rounded-sm p-4 text-sm">
                  <ul className="list-disc pl-5 space-y-2">
                    {websites.map((w, idx) => (
                      <li key={idx}>
                        <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">{w.label}</a>
                      </li>
                    ))}
                  </ul>
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="text-xs text-neutral-500">{new Date(newsData[selectedNewsIndex].date).toLocaleDateString()}</div>
                <div className="text-sm font-medium">{newsData[selectedNewsIndex].title}</div>
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
            <div className="p-4 text-sm text-neutral-700">
              {newsData[selectedNewsIndex].text}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
