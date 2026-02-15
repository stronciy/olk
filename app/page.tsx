"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Info, Briefcase, Mail, X, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Types
type Section = {
  id: number
  slug: string
  name: string
}

type Media = {
  id?: number
  type: "image" | "video"
  url: string
  thumbnail?: string | null
}

type WorkItem = {
  id: number
  title: string
  slug: string
  description?: string
  year?: number
  type?: string
  location?: string
  collaborators?: string
  media: Media[]
}

const INFO_MENU_ITEMS = [
  "ABOUT",
  "NEWS",
  "CONTACTS",
  "FAIRS",
  "AWARDS",
  "SOLO",
  "GROUP",
  "WEBSITES",
]

export default function HomePage() {
  const [activeMenu, setActiveMenu] = useState<"info" | "works">("works")
  const [workSections, setWorkSections] = useState<Section[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>("all")
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // Info state
  const [activeInfoSection, setActiveInfoSection] = useState<string>("ABOUT")
  const [infoData, setInfoData] = useState<any>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  const [newsModalOpen, setNewsModalOpen] = useState(false)
  const [activeNewsItem, setActiveNewsItem] = useState<any | null>(null)

  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<Media[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeGalleryItem, setActiveGalleryItem] = useState<WorkItem | null>(null)

  // Fetch sections on mount
  useEffect(() => {
    fetch("/api/work/sections")
      .then((res) => res.json())
      .then((data) => {
        if (data.sections) {
          setWorkSections(data.sections)
        }
      })
      .catch((err) => console.error("Failed to fetch sections:", err))
  }, [])

  // Fetch items when category changes
  useEffect(() => {
    if (!activeCategory || activeMenu !== "works") return

    let ignore = false
    setLoadingItems(true)
    fetch(`/api/work/items?section=${activeCategory}`)
      .then((res) => res.json())
      .then((data) => {
        if (ignore || !data.items) return
        const mapped: WorkItem[] = (data.items as any[]).map((i: any) => ({
          id: Number(i?.id ?? 0),
          title: String(i?.title || ""),
          slug: String(i?.slug || ""),
          description: typeof i?.description === "string" ? i.description : undefined,
          year: typeof i?.year === "number" ? i.year : undefined,
          type: typeof i?.type === "string" ? i.type : undefined,
          location: typeof i?.location === "string" ? i.location : undefined,
          collaborators: typeof i?.collaborators === "string" ? i.collaborators : undefined,
          media: Array.isArray(i?.media)
            ? i.media.map((m: any) => ({
                id: Number(m?.id ?? 0),
                type: String(m?.type).toLowerCase() === "video" ? "video" : "image",
                url: String(m?.url || ""),
                thumbnail: typeof m?.thumbnail === "string" ? m.thumbnail : null,
              }))
            : [],
        }))
        setWorkItems(mapped)
      })
      .catch((err) => {
        if (!ignore) console.error("Failed to fetch items:", err)
      })
      .finally(() => {
        if (!ignore) setLoadingItems(false)
      })

    return () => {
      ignore = true
    }
  }, [activeCategory, activeMenu])

  // Fetch info data when section changes
  useEffect(() => {
    if (activeMenu !== "info" || !activeInfoSection) return

    let ignore = false
    setLoadingInfo(true)
    const endpoint = activeInfoSection.toLowerCase()
    fetch(`/api/information/${endpoint}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setInfoData(data.data || data)
      })
      .catch((err) => {
        if (!ignore) console.error(`Failed to fetch ${endpoint}:`, err)
      })
      .finally(() => {
        if (!ignore) setLoadingInfo(false)
      })

    return () => {
      ignore = true
    }
  }, [activeInfoSection, activeMenu])

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!galleryOpen) return

      if (e.key === "Escape") {
        setGalleryOpen(false)
      } else if (e.key === "ArrowLeft") {
        navigateGallery("prev")
      } else if (e.key === "ArrowRight") {
        navigateGallery("next")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [galleryOpen, currentImageIndex]) 

  const toggleMenu = (menu: "info" | "works") => {
    setActiveMenu(menu)
  }

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug)
  }

  // Gallery Logic
  const openGallery = (item: WorkItem) => {
    if (item.media && item.media.length > 0) {
      setGalleryImages(item.media)
      setCurrentImageIndex(0)
      setActiveGalleryItem(item)
      setGalleryOpen(true)
    }
  }

  const navigateGallery = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1))
    } else {
      setCurrentImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1))
    }
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-auto bg-white z-50 flex flex-col px-4 md:px-8 border-b border-gray-100 pb-2">
        <div className="flex items-center gap-4 h-16">
          <h1 className="text-lg md:text-xl font-bold tracking-wider uppercase cursor-pointer flex items-center gap-3" onClick={() => setActiveCategory("all")}>
            <img src="/icon0.svg" alt="" className="h-[1em] w-auto" />
            OKSANA LEVCHENYA
          </h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleMenu("info"); }}
              className={cn(
                "p-2 rounded-full transition-colors hover:bg-gray-100",
                activeMenu === "info" && "bg-gray-100"
              )}
              aria-label="Information"
            >
              <Info size={20} />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); toggleMenu("works"); }}
              className={cn(
                "p-2 rounded-full transition-colors hover:bg-gray-100",
                activeMenu === "works" && "bg-gray-100"
              )}
              aria-label="Works"
            >
              <Briefcase size={20} />
            </button>
            
            <button
              className="p-2 rounded-full transition-colors hover:bg-gray-100"
              aria-label="Contacts"
              onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu("info");
                  setActiveInfoSection("CONTACTS");
              }}
            >
              <Mail size={20} />
            </button>
          </div>
        </div>

        {/* Secondary Menu Row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 pb-2 text-sm tracking-widest uppercase transition-all duration-300">
           {activeMenu === "info" && (
             INFO_MENU_ITEMS.map((item) => (
                <button
                  key={item}
                  className={cn(
                    "hover:text-gray-500 transition-colors",
                    activeInfoSection === item && "font-semibold underline underline-offset-4"
                  )}
                  onClick={() => {
                    setActiveInfoSection(item)
                  }}
                >
                  {item}
                </button>
             ))
           )}

           {activeMenu === "works" && (
             <>
                <button
                  className={cn(
                    "hover:text-gray-500 transition-colors",
                    activeCategory === "all" && "font-semibold underline underline-offset-4"
                  )}
                  onClick={() => handleCategoryClick("all")}
                >
                  ALL
                </button>
                {workSections.map((section) => (
                  <button
                    key={section.id}
                    className={cn(
                      "hover:text-gray-500 transition-colors",
                      activeCategory === section.slug && "font-semibold underline underline-offset-4"
                    )}
                    onClick={() => handleCategoryClick(section.slug)}
                  >
                    {section.name}
                  </button>
                ))}
             </>
           )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-32 px-4 md:px-8 pb-12">
        {activeMenu === "works" && (
          <>
            {!activeCategory && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
                <p className="text-xl font-light">Select a category from Works to view items</p>
              </div>
            )}

            {activeCategory && (
              <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <h2 className="text-2xl font-light mb-8 uppercase tracking-widest text-gray-800">
                  {activeCategory === "all" ? "ALL WORKS" : (workSections.find(s => s.slug === activeCategory)?.name || activeCategory)}
                </h2>
                
                {loadingItems ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-6">
                    {workItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="group cursor-pointer flex flex-col gap-2"
                        onClick={() => openGallery(item)}
                      >
                        <div className="aspect-square overflow-hidden bg-gray-100 relative">
                          {item.media[0] ? (
                            <img
                              src={item.media[0].thumbnail || item.media[0].url}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              No Image
                            </div>
                          )}
                        </div>
                        <h3 className="text-xs text-gray-500 text-left font-medium uppercase tracking-wide group-hover:text-black transition-colors">
                          {item.title}
                        </h3>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loadingItems && workItems.length === 0 && (
                  <p className="text-gray-400 text-sm">No items found in this category.</p>
                )}
              </div>
            )}
          </>
        )}

        {activeMenu === "info" && (
          <div className="w-full md:w-[700px] animate-in fade-in duration-500 slide-in-from-bottom-4">
            {loadingInfo ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <>
                {/* ABOUT */}
                {activeInfoSection === "ABOUT" && infoData?.about?.text && (
                  <div className="prose prose-gray max-w-none font-light leading-relaxed" dangerouslySetInnerHTML={{ __html: infoData.about.text }} />
                )}

                {/* NEWS */}
                {activeInfoSection === "NEWS" && infoData?.news && (
                  <div className="flex flex-col gap-16">
                    {infoData.news.map((item: any) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveNewsItem(item)
                          setNewsModalOpen(true)
                        }}
                        className="flex flex-col gap-6 text-left group"
                      >
                        {item.coverUrl && (
                          <div className="w-full aspect-video overflow-hidden bg-gray-50">
                            <img
                              src={item.coverUrl}
                              alt={item.title}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-2 cursor-pointer">
                          <span className="text-xs text-gray-400 uppercase tracking-widest">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <h3 className="text-2xl font-light uppercase tracking-wide group-hover:text-gray-700 transition-colors">
                            {item.title}
                          </h3>
                          {item.summary && (
                            <p className="text-gray-600 font-light leading-relaxed">
                              {item.summary}
                            </p>
                          )}
                          {item.text && !item.summary && (
                            <div
                              className="text-gray-600 font-light leading-relaxed line-clamp-4"
                              dangerouslySetInnerHTML={{ __html: item.text }}
                            />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* CONTACTS */}
                {activeInfoSection === "CONTACTS" && infoData?.contacts && (
                  <div className="flex flex-col gap-8 text-lg font-light">
                    {infoData.contacts.address && (
                      <div className="whitespace-pre-line leading-relaxed">{infoData.contacts.address}</div>
                    )}
                    <div className="flex flex-col gap-2">
                        {infoData.contacts.email && (
                          <a href={`mailto:${infoData.contacts.email}`} className="hover:text-gray-500 transition-colors w-fit">{infoData.contacts.email}</a>
                        )}
                        {infoData.contacts.phone && (
                          <a href={`tel:${infoData.contacts.phone}`} className="hover:text-gray-500 transition-colors w-fit">{infoData.contacts.phone}</a>
                        )}
                    </div>
                    <div className="flex gap-6 mt-4 pt-8 border-t border-gray-50">
                        {infoData.contacts.instagram && (
                          <a href={infoData.contacts.instagram} target="_blank" rel="noopener noreferrer" className="uppercase text-sm tracking-widest hover:underline">Instagram</a>
                        )}
                        {infoData.contacts.facebook && (
                          <a href={infoData.contacts.facebook} target="_blank" rel="noopener noreferrer" className="uppercase text-sm tracking-widest hover:underline">Facebook</a>
                        )}
                    </div>
                  </div>
                )}

                {/* FAIRS, AWARDS, SOLO, GROUP */}
                {["FAIRS", "AWARDS", "SOLO", "GROUP"].includes(activeInfoSection) && infoData?.[activeInfoSection.toLowerCase()] && (
                  <div className="flex flex-col gap-6">
                      {infoData[activeInfoSection.toLowerCase()].map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-8 border-b border-gray-50 pb-4 items-baseline">
                            <span className="text-gray-400 font-mono w-16 shrink-0 text-sm">{item.year}</span>
                            <span
                              className="font-light text-lg leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: String(item.title || "") }}
                            />
                        </div>
                      ))}
                      {infoData[activeInfoSection.toLowerCase()].length === 0 && (
                        <p className="text-gray-400 font-light">No items found.</p>
                      )}
                  </div>
                )}

                {/* WEBSITES */}
                {activeInfoSection === "WEBSITES" && infoData?.websites && (
                  <div className="flex flex-col gap-6">
                      {infoData.websites.map((item: any, idx: number) => (
                        <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="text-xl font-light hover:text-gray-500 transition-colors flex items-center gap-2 border-b border-gray-50 pb-4">
                            <span>{item.label || item.url}</span>
                        </a>
                      ))}
                      {infoData.websites.length === 0 && (
                        <p className="text-gray-400 font-light">No websites found.</p>
                      )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {newsModalOpen && activeNewsItem && (
        <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-400 uppercase tracking-widest">
                  {new Date(activeNewsItem.date).toLocaleDateString()}
                </span>
                <h2 className="text-lg md:text-xl font-light uppercase tracking-wide">
                  {activeNewsItem.title}
                </h2>
              </div>
              <button
                onClick={() => {
                  setNewsModalOpen(false)
                  setActiveNewsItem(null)
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {activeNewsItem.coverUrl && (
              <div className="w-full aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={activeNewsItem.coverUrl}
                  alt={activeNewsItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="px-4 py-6 text-sm text-gray-700">
              {activeNewsItem.summary && (
                <p className="mb-4 font-light leading-relaxed">
                  {activeNewsItem.summary}
                </p>
              )}
              <div
                className="prose prose-gray max-w-none font-light leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: activeNewsItem.content || activeNewsItem.text || "",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Gallery */}
      {galleryOpen && galleryImages.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300"
          onClick={(e) => {
            // Close if clicking outside the image container
            if (e.target === e.currentTarget) setGalleryOpen(false)
          }}
        >
          {/* Close Button */}
          <button 
            onClick={() => setGalleryOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-50"
            aria-label="Close Gallery"
          >
            <X size={24} />
          </button>

          {/* Navigation Arrows */}
          {galleryImages.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); navigateGallery("prev") }}
                className="absolute left-4 md:left-8 p-3 rounded-full bg-white/50 hover:bg-white shadow-sm transition-all z-50 group"
                aria-label="Previous Image"
              >
                <ChevronLeft size={32} className="text-gray-600 group-hover:text-black" />
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); navigateGallery("next") }}
                className="absolute right-4 md:right-8 p-3 rounded-full bg-white/50 hover:bg-white shadow-sm transition-all z-50 group"
                aria-label="Next Image"
              >
                <ChevronRight size={32} className="text-gray-600 group-hover:text-black" />
              </button>
            </>
          )}

          {/* Item Info */}
          {activeGalleryItem && (
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-50 max-w-md text-left pointer-events-auto bg-white/80 p-4 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold uppercase tracking-widest mb-1">{activeGalleryItem.title}</h2>
                
                {activeGalleryItem.description && (
                    <p className="text-sm text-gray-600 mb-2 leading-relaxed">{activeGalleryItem.description}</p>
                )}

                <div className="flex flex-col gap-1 text-xs text-gray-500 uppercase tracking-wider">
                    {(activeGalleryItem.year || activeGalleryItem.type) && (
                        <div>
                            {activeGalleryItem.year && <span>{activeGalleryItem.year}</span>}
                            {activeGalleryItem.year && activeGalleryItem.type && <span> / </span>}
                            {activeGalleryItem.type && <span>{activeGalleryItem.type}</span>}
                        </div>
                    )}
                    
                    {(activeGalleryItem.location || activeGalleryItem.collaborators) && (
                        <div>
                            {activeGalleryItem.location && <span>{activeGalleryItem.location}</span>}
                            {activeGalleryItem.location && activeGalleryItem.collaborators && <span> / </span>}
                            {activeGalleryItem.collaborators && <span>{activeGalleryItem.collaborators}</span>}
                        </div>
                    )}
                </div>
            </div>
          )}

          {/* Main Media Container */}
          <div className="relative w-full h-full max-w-7xl max-h-screen p-4 md:p-12 flex items-center justify-center pointer-events-none">
            <div className="relative pointer-events-auto">
               {galleryImages[currentImageIndex]?.type === "video" ? (
                 <video
                   src={galleryImages[currentImageIndex].url}
                   className="max-w-full max-h-[85vh] object-contain shadow-2xl"
                   controls
                   autoPlay
                 />
               ) : (
                 <img
                   src={galleryImages[currentImageIndex].url}
                   alt={`Gallery image ${currentImageIndex + 1}`}
                   className="max-w-full max-h-[85vh] object-contain shadow-2xl"
                 />
               )}
               
               {/* Image Counter (Optional but nice) */}
               <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-gray-500 text-sm tracking-widest">
                 {currentImageIndex + 1} / {galleryImages.length}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
