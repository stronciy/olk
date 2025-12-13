"use client"

import { useEffect, useRef, useState } from "react"
import { Editor } from "@tinymce/tinymce-react"
import { GripVertical, CheckCircle, AlertCircle, Pencil, Trash } from "lucide-react"
import * as Accordion from "@radix-ui/react-accordion"

type Section = { id: number; slug: string; name: string; seoTitle?: string | null; seoDescription?: string | null; seoKeywords?: string | null }
type Item = { id: number; title: string; slug: string; published?: number; position?: number }
type Media = { id: number; type: "IMAGE" | "VIDEO"; url: string; thumbnail?: string | null; caption?: string | null; alt?: string | null; position?: number }

export default function AdminClient() {
  const [adminTab, setAdminTab] = useState<"work" | "information">("work")
  const [infoMenu, setInfoMenu] = useState<"about" | "news" | "contacts" | "fairs" | "awards" | "solo" | "group" | "websites">("about")
  const [viewLoading, setViewLoading] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [active, setActive] = useState<string>("paint")
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [description, setDescription] = useState("")
  const [year, setYear] = useState<number | "">("")
  const [typeVal, setTypeVal] = useState("")
  const [location, setLocation] = useState("")
  const [collaborators, setCollaborators] = useState("")
  const [published, setPublished] = useState(false)
  const [position, setPosition] = useState<number | "">("")
  const [media, setMedia] = useState<Media[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaCaption, setMediaCaption] = useState("")
  const [mediaAlt, setMediaAlt] = useState("")
  const [mediaView, setMediaView] = useState<"list" | "thumbs">("list")
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [itemDragIndex, setItemDragIndex] = useState<number | null>(null)
  const [uploads, setUploads] = useState<{ name: string; progress: number; status: "pending" | "success" | "error"; message?: string }[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState("")
  const [newItemSlug, setNewItemSlug] = useState("")
  const [createError, setCreateError] = useState<string>("")
  const [creating, setCreating] = useState(false)
  const [sectionSeoTitle, setSectionSeoTitle] = useState("")
  const [sectionSeoDescription, setSectionSeoDescription] = useState("")
  const [sectionSeoKeywords, setSectionSeoKeywords] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [aboutText, setAboutText] = useState("")
  const [contactsEmail, setContactsEmail] = useState("")
  const [contactsPhone, setContactsPhone] = useState("")
  const [contactsAddressLine1, setContactsAddressLine1] = useState("")
  const [contactsAddressLine2, setContactsAddressLine2] = useState("")
  const [contactsAddressLine3, setContactsAddressLine3] = useState("")
  const [contactsInstagram, setContactsInstagram] = useState("")
  const [contactsFacebook, setContactsFacebook] = useState("")
  const [contactsWebsite, setContactsWebsite] = useState("")
  const [news, setNews] = useState<{ id?: number; title: string; date: string; text: string; summary: string; content: string; draft?: boolean; coverUrl?: string; previewUrl?: string }[]>([])
  const [newNewsTitle, setNewNewsTitle] = useState("")
  const [newNewsDate, setNewNewsDate] = useState("")
  const [newNewsSummary, setNewNewsSummary] = useState("")
  const [newNewsContent, setNewNewsContent] = useState("")
  const [newNewsText, setNewNewsText] = useState("")
  const [newNewsDraft, setNewNewsDraft] = useState(false)
  const [newNewsCoverUrl, setNewNewsCoverUrl] = useState<string | undefined>(undefined)
  const [newNewsPreviewUrl, setNewNewsPreviewUrl] = useState<string | undefined>(undefined)
  const [editNewsIndex, setEditNewsIndex] = useState<number | null>(null)
  const [newsTrashMode, setNewsTrashMode] = useState(false)
  const [newsModalOpen, setNewsModalOpen] = useState(false)
  const [newsModalSaving, setNewsModalSaving] = useState(false)
  const [newsModalError, setNewsModalError] = useState("")
  const [newsModalMode, setNewsModalMode] = useState<"add" | "edit">("add")
  const [newNewsDateTime, setNewNewsDateTime] = useState("")
  const [fairs, setFairs] = useState<{ year: string; title: string }[]>([])
  const [fairDragIndex, setFairDragIndex] = useState<number | null>(null)
  const [newFairYear, setNewFairYear] = useState<string>("")
  const [newFairTitle, setNewFairTitle] = useState("")
  const [awards, setAwards] = useState<{ year: string; title: string }[]>([])
  const [newAwardYear, setNewAwardYear] = useState<string>("")
  const [newAwardTitle, setNewAwardTitle] = useState("")
  const [solo, setSolo] = useState<{ year: string; title: string }[]>([])
  const [newSoloYear, setNewSoloYear] = useState<string>("")
  const [newSoloTitle, setNewSoloTitle] = useState("")
  const [group, setGroup] = useState<{ year: string; title: string }[]>([])
  const [newGroupYear, setNewGroupYear] = useState<string>("")
  const [newGroupTitle, setNewGroupTitle] = useState("")
  const [websites, setWebsites] = useState<{ url: string; label: string }[]>([])
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("")
  const [newWebsiteLabel, setNewWebsiteLabel] = useState("")
  const [websiteDragIndex, setWebsiteDragIndex] = useState<number | null>(null)
  const [websiteFilter, setWebsiteFilter] = useState("")
  const [websitePage, setWebsitePage] = useState(1)
  const [websitePageSize, setWebsitePageSize] = useState(10)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [noticeType, setNoticeType] = useState<"success" | "error" | null>(null)
  const [noticeMessage, setNoticeMessage] = useState("")
  const noticeTimerRef = useRef<number | null>(null)
  const debounceRef = useRef<number | null>(null)
  const [awardDragIndex, setAwardDragIndex] = useState<number | null>(null)
  const [soloDragIndex, setSoloDragIndex] = useState<number | null>(null)
  const [groupDragIndex, setGroupDragIndex] = useState<number | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [manageAccordionOpen, setManageAccordionOpen] = useState(false)

  const tinyApiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || ""

 

  const showSuccess = (message = "Данные успешно сохранены") => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current)
      noticeTimerRef.current = null
    }
    setNoticeType("success")
    setNoticeMessage(message)
    setNoticeOpen(true)
    noticeTimerRef.current = window.setTimeout(() => {
      setNoticeOpen(false)
      setNoticeType(null)
      setNoticeMessage("")
      noticeTimerRef.current = null
    }, 4000)
  }
  const showError = (message = "Ошибка сохранения") => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current)
      noticeTimerRef.current = null
    }
    setNoticeType("error")
    setNoticeMessage(message)
    setNoticeOpen(true)
    noticeTimerRef.current = window.setTimeout(() => {
      setNoticeOpen(false)
      setNoticeType(null)
      setNoticeMessage("")
      noticeTimerRef.current = null
    }, 4500)
  }

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
  const nowLocalDateTime = () => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const hh = String(d.getHours()).padStart(2, "0")
    const mi = String(d.getMinutes()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  }
  const toSqlDateTime = (dt: string) => {
    if (!dt) return ""
    const base = dt.replace("T", " ")
    return base.length === 16 ? `${base}:00` : base
  }

  useEffect(() => {
    try {
      const savedTab = (localStorage.getItem("admin_tab") as "work" | "information") || "work"
      const savedInfo = (localStorage.getItem("admin_info_menu") as typeof infoMenu) || "about"
      setAdminTab(savedTab)
      setInfoMenu(savedInfo)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("admin_tab", adminTab)
    } catch {}
  }, [adminTab])

  useEffect(() => {
    try {
      localStorage.setItem("admin_info_menu", infoMenu)
    } catch {}
  }, [infoMenu])

  const switchTab = (tab: "work" | "information") => {
    if (adminTab === tab) return
    setViewLoading(true)
    setAdminTab(tab)
    setTimeout(() => setViewLoading(false), 150)
  }

  const switchInfo = (name: typeof infoMenu) => {
    if (infoMenu === name) return
    setViewLoading(true)
    setInfoMenu(name)
    setTimeout(() => setViewLoading(false), 150)
  }

  useEffect(() => {
    const loadInfo = async () => {
      if (adminTab !== "information") return
      if (infoMenu === "about") {
        const r = await fetch("/api/information/about").then((x) => x.json()).catch(() => null)
        setAboutText(r?.data?.about?.text || "")
      } else if (infoMenu === "contacts") {
        const r = await fetch("/api/information/contacts").then((x) => x.json()).catch(() => null)
        const c = r?.data?.contacts || {}
        setContactsEmail(c.email || "")
        setContactsPhone(c.phone || "")
        if (typeof c.addressLine1 === "string" || typeof c.addressLine2 === "string" || typeof c.addressLine3 === "string") {
          setContactsAddressLine1(c.addressLine1 || "")
          setContactsAddressLine2(c.addressLine2 || "")
          setContactsAddressLine3(c.addressLine3 || "")
        } else {
          const lines = String(c.address || "").split(/\r?\n/)
          setContactsAddressLine1(lines[0] || "")
          setContactsAddressLine2(lines[1] || "")
          setContactsAddressLine3(lines[2] || "")
        }
        setContactsInstagram(c.instagram || "")
        setContactsFacebook(c.facebook || "")
        setContactsWebsite(c.website || "")
      } else if (infoMenu === "news") {
        const r = await fetch("/api/information/news?sort=date&nocache=1", { cache: "no-store" }).then((x) => x.json()).catch(() => null)
        setNews(r?.data?.news?.map((n: any) => ({ id: Number(n.id || 0), title: String(n.title || ""), date: String(n.date || ""), text: String(n.text || ""), summary: String(n.summary || ""), content: String(n.content || ""), draft: Boolean(n.draft), coverUrl: String(n.coverUrl || ""), previewUrl: String(n.previewUrl || "") })) || [])
      } else if (infoMenu === "fairs") {
        const r = await fetch("/api/information/fairs").then((x) => x.json()).catch(() => null)
        setFairs(r?.data?.fairs?.map((n: any) => ({ year: String(n.year ?? ""), title: String(n.title || "") })) || [])
      } else if (infoMenu === "awards") {
        const r = await fetch("/api/information/awards").then((x) => x.json()).catch(() => null)
        setAwards(r?.data?.awards?.map((n: any) => ({ year: String(n.year ?? ""), title: String(n.title || "") })) || [])
      } else if (infoMenu === "solo") {
        const r = await fetch("/api/information/solo").then((x) => x.json()).catch(() => null)
        setSolo(r?.data?.solo?.map((n: any) => ({ year: String(n.year ?? ""), title: String(n.title || "") })) || [])
      } else if (infoMenu === "group") {
        const r = await fetch("/api/information/group").then((x) => x.json()).catch(() => null)
        setGroup(r?.data?.group?.map((n: any) => ({ year: String(n.year ?? ""), title: String(n.title || "") })) || [])
      } else if (infoMenu === "websites") {
        const r = await fetch("/api/information/websites").then((x) => x.json()).catch(() => null)
        setWebsites(r?.data?.websites?.map((w: any) => ({ url: String(w.url || ""), label: String(w.label || "") })) || [])
      }
    }
    loadInfo()
  }, [adminTab, infoMenu])

  const saveAbout = async () => {
    try {
      const res = await fetch("/api/information/about", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: aboutText }) })
      if (!res.ok) {
        let msg = "Ошибка сохранения"
        try {
          const e = await res.json()
          msg = String(e?.error || e?.message || msg)
        } catch {
          msg = await res.text().catch(() => msg)
        }
        showError(msg)
        return
      }
      showSuccess()
    } catch {
      showError("Ошибка сети")
    }
  }

  const saveContacts = async () => {
    try {
      const res = await fetch("/api/information/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contactsEmail,
          phone: contactsPhone,
          addressLine1: contactsAddressLine1,
          addressLine2: contactsAddressLine2,
          addressLine3: contactsAddressLine3,
          instagram: contactsInstagram,
          facebook: contactsFacebook,
          website: contactsWebsite,
        }),
      })
      if (!res.ok) {
        let msg = "Ошибка сохранения"
        try {
          const e = await res.json()
          msg = String(e?.error || e?.message || msg)
        } catch {
          msg = await res.text().catch(() => msg)
        }
        showError(msg)
        return
      }
      showSuccess()
    } catch {
      showError("Ошибка сети")
    }
  }
  const refreshNews = async (includeTrash = false) => {
    const r = await fetch(`/api/information/news${includeTrash ? "?include=trash&sort=date&nocache=1" : "?sort=date&nocache=1"}`, { cache: "no-store" }).then((x) => x.json()).catch(() => null)
    setNews(r?.data?.news?.map((n: any) => ({ id: Number(n.id || 0), title: String(n.title || ""), date: String(n.date || ""), summary: String(n.summary || n.text || ""), content: String(n.content || ""), draft: Boolean(n.draft), coverUrl: String(n.coverUrl || ""), previewUrl: String(n.previewUrl || "") })) || [])
  }
  const toggleNewsDraft = async (id?: number, current?: boolean) => {
    if (!id) return
    const ok = window.confirm(current ? "Снять статус черновик?" : "Поставить статус черновик?")
    if (!ok) return
    const r = await fetch("/api/information/news", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, update: { draft: !current } }),
    })
    if (r.ok) {
      await refreshNews(newsTrashMode)
      showSuccess()
    } else {
      const t = await r.text().catch(() => "")
      showError(t || "Ошибка обновления")
    }
  }
  const trashNews = async (id?: number) => {
    if (!id) return
    const ok = window.confirm("Переместить в корзину?")
    if (!ok) return
    const r = await fetch(`/api/information/news?id=${id}`, { method: "DELETE" })
    if (r.ok) {
      await refreshNews(newsTrashMode)
      showSuccess()
    } else {
      const t = await r.text().catch(() => "")
      showError(t || "Ошибка удаления")
    }
  }
  const restoreNews = async (id?: number) => {
    if (!id) return
    const r = await fetch("/api/information/news/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (r.ok) {
      await refreshNews(true)
      showSuccess()
    } else {
      const t = await r.text().catch(() => "")
      showError(t || "Ошибка восстановления")
    }
  }
  const startEditNews = (idx: number) => {
    const n = news[idx]
    setNewNewsTitle(n.title)
    setNewNewsDate(n.date)
    setNewNewsDateTime((n.date && n.date.includes("T")) ? n.date.slice(0, 16) : nowLocalDateTime())
    setNewNewsSummary(n.summary)
    setNewNewsText(n.text)
    setNewNewsContent(n.content)
    setNewNewsDraft(!!n.draft)
    setNewNewsCoverUrl(n.coverUrl)
    setNewNewsPreviewUrl(n.previewUrl)
    setEditNewsIndex(idx)
    setNewsModalMode("edit")
    setNewsModalOpen(true)
  }
  const saveEditedNews = async () => {
    if (editNewsIndex === null) return
    const n = news[editNewsIndex]
    if (!n?.id) {
      setEditNewsIndex(null)
      return
    }
    const ok = window.confirm("Подтвердить изменения?")
    if (!ok) return
    const shortText = newNewsText.trim()
    if (!shortText) {
      setNewsModalError("Краткий текст обязателен")
      return
    }
    if (shortText.length > 250) {
      setNewsModalError("Краткий текст не должен превышать 250 символов")
      return
    }
    setNewsModalSaving(true)
    const r = await fetch("/api/information/news", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: n.id,
        update: {
          title: newNewsTitle.trim(),
          date: toSqlDateTime(newNewsDateTime.trim() || newNewsDate.trim()),
          text: shortText,
          summary: newNewsSummary.trim(),
          content: newNewsContent.trim(),
          draft: newNewsDraft,
          coverUrl: newNewsCoverUrl,
          previewUrl: newNewsPreviewUrl,
        },
      }),
    })
    if (r.ok) {
      setEditNewsIndex(null)
      setNewsModalOpen(false)
      setNewNewsTitle("")
      setNewNewsDate("")
      setNewNewsDateTime("")
      setNewNewsSummary("")
      setNewNewsContent("")
      setNewNewsDraft(false)
      setNewNewsCoverUrl(undefined)
      setNewNewsPreviewUrl(undefined)
      await refreshNews(newsTrashMode)
      showSuccess()
    } else {
      const t = await r.text().catch(() => "")
      setNewsModalError(t || "Ошибка обновления")
      showError(t || "Ошибка обновления")
    }
    setNewsModalSaving(false)
  }

  const openAddNewsModal = () => {
    setNewsModalMode("add")
    setNewNewsTitle("")
    setNewNewsSummary("")
    setNewNewsText("")
    setNewNewsContent("")
    setNewNewsDate("")
    setNewNewsDateTime(nowLocalDateTime())
    setNewNewsCoverUrl(undefined)
    setNewNewsPreviewUrl(undefined)
    setNewsModalError("")
    setNewsModalOpen(true)
  }
  const cancelNewsModal = () => {
    setNewsModalOpen(false)
    setNewsModalError("")
    setNewsModalSaving(false)
    setNewNewsTitle("")
    setNewNewsSummary("")
    setNewNewsText("")
    setNewNewsContent("")
    setNewNewsDate("")
    setNewNewsDateTime("")
    setNewNewsCoverUrl(undefined)
    setNewNewsPreviewUrl(undefined)
  }
  const saveNewNews = async () => {
    const title = newNewsTitle.trim()
    const content = newNewsContent.trim()
    const shortText = newNewsText.trim()
    const dt = toSqlDateTime((newNewsDateTime || "").trim())
    if (!title || !content || !dt || !shortText) {
      setNewsModalError("Заполните обязательные поля")
      return
    }
    if (shortText.length > 250) {
      setNewsModalError("Краткий текст не должен превышать 250 символов")
      return
    }
    setNewsModalSaving(true)
    try {
      const res = await fetch("/api/information/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date: dt, text: shortText, summary: newNewsSummary.trim(), content, draft: false, coverUrl: newNewsCoverUrl, previewUrl: newNewsPreviewUrl }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => "")
        setNewsModalError(t || "Ошибка создания")
        showError(t || "Ошибка создания")
      } else {
        cancelNewsModal()
        await refreshNews(false)
        showSuccess()
      }
    } catch {
      setNewsModalError("Ошибка сети")
      showError("Ошибка сети")
    } finally {
      setNewsModalSaving(false)
    }
  }

  const addFair = () => {
    const y = newFairYear.replace(/\D/g, "")
    if (y === "" || !newFairTitle.trim()) return
    setFairs((prev) => [...prev, { year: y, title: newFairTitle.trim() }])
    setNewFairYear("")
    setNewFairTitle("")
  }
  const saveFairs = async () => {
    try {
      const res = await fetch("/api/information/fairs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fairs: fairs.map((n, i) => ({ year: n.year === "" ? null : Number(n.year), title: n.title, position: i })) }),
      })
      if (!res.ok) {
        let msg = "Ошибка сохранения"
        try {
          const e = await res.json()
          msg = String(e?.error || e?.message || msg)
        } catch {
          msg = await res.text().catch(() => msg)
        }
        showError(msg)
        return
      }
      showSuccess()
    } catch {
      showError("Ошибка сети")
    }
  }
  const persistFairsOrder = async (arr: { year: string; title: string }[]) => {
    await fetch("/api/information/fairs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fairs: arr.map((n, i) => ({ year: n.year === "" ? null : Number(n.year), title: n.title, position: i })) }),
    })
  }
  const handleFairDropAt = async (targetIdx: number) => {
    if (fairDragIndex === null || fairDragIndex === targetIdx) return
    const arr = [...fairs]
    const [it] = arr.splice(fairDragIndex, 1)
    arr.splice(targetIdx, 0, it)
    setFairs(arr)
    setFairDragIndex(null)
    await persistFairsOrder(arr)
  }

  const addAward = () => {
    const y = newAwardYear.replace(/\D/g, "")
    if (y === "" || !newAwardTitle.trim()) return
    setAwards((prev) => [...prev, { year: y, title: newAwardTitle.trim() }])
    setNewAwardYear("")
    setNewAwardTitle("")
  }
  const saveAwards = async () => {
    try {
      const res = await fetch("/api/information/awards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awards: awards.map((n, i) => ({ year: n.year === "" ? null : Number(n.year), title: n.title, position: i })) }),
      })
      if (!res.ok) {
        let msg = "Ошибка сохранения"
        try {
          const e = await res.json()
          msg = String(e?.error || e?.message || msg)
        } catch {
          msg = await res.text().catch(() => msg)
        }
        showError(msg)
        return
      }
      showSuccess()
    } catch {
      showError("Ошибка сети")
    }
  }
  const persistAwardsOrder = async (arr: { year: string; title: string }[]) => {
    await fetch("/api/information/awards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awards: arr.map((n, i) => ({ year: n.year === "" ? null : Number(n.year), title: n.title, position: i })) }),
    })
  }
  const handleAwardDropAt = async (targetIdx: number) => {
    if (awardDragIndex === null || awardDragIndex === targetIdx) return
    const arr = [...awards]
    const [it] = arr.splice(awardDragIndex, 1)
    arr.splice(targetIdx, 0, it)
    setAwards(arr)
    setAwardDragIndex(null)
    await persistAwardsOrder(arr)
  }

  const addSolo = () => {
    const y = newSoloYear.replace(/\D/g, "")
    if (y === "" || !newSoloTitle.trim()) return
    setSolo((prev) => [...prev, { year: y, title: newSoloTitle.trim() }])
    setNewSoloYear("")
    setNewSoloTitle("")
  }
  const saveSolo = async () => {
    try {
      const res = await fetch("/api/information/solo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solo: solo.map((n, i) => ({ year: n.year === "" ? null : Number(n.year), title: n.title, position: i })) }),
      })
      if (!res.ok) {
        let msg = "Ошибка сохранения"
        try {
          const e = await res.json()
          msg = String(e?.error || e?.message || msg)
        } catch {
          msg = await res.text().catch(() => msg)
        }
        showError(msg)
        return
      }
      showSuccess()
    } catch {
      showError("Ошибка сети")
    }
  }
  const persistSoloOrder = async (arr: { year: string; title: string }[]) => {
    await fetch("/api/information/solo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solo: arr.map((n, i) => ({ year: n.year === "" ? null : Number(n.year), title: n.title, position: i })) }),
    })
  }
  const handleSoloDropAt = async (targetIdx: number) => {
    if (soloDragIndex === null || soloDragIndex === targetIdx) return
    const arr = [...solo]
    const [it] = arr.splice(soloDragIndex, 1)
    arr.splice(targetIdx, 0, it)
    setSolo(arr)
    setSoloDragIndex(null)
    await persistSoloOrder(arr)
  }

  const addGroup = () => {
    const y = newGroupYear.replace(/\D/g, "")
    if (y === "" || !newGroupTitle.trim()) return
    setGroup((prev) => [...prev, { year: y, title: newGroupTitle.trim() }])
    setNewGroupYear("")
    setNewGroupTitle("")
  }
  const saveGroup = async () => {
    try {
      const res = await fetch("/api/information/group", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group: group.map((n, i) => ({ year: n.year === "" ? null : Number(n.year), title: n.title, position: i })) }),
      })
      if (!res.ok) {
        let msg = "Ошибка сохранения"
        try {
          const e = await res.json()
          msg = String(e?.error || e?.message || msg)
        } catch {
          msg = await res.text().catch(() => msg)
        }
        showError(msg)
        return
      }
      showSuccess()
    } catch {
      showError("Ошибка сети")
    }
  }
  const persistGroupOrder = async (arr: { year: string; title: string }[]) => {
    await fetch("/api/information/group", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group: arr.map((n, i) => ({ year: n.year === "" ? null : Number(n.year), title: n.title, position: i })) }),
    })
  }
  const handleGroupDropAt = async (targetIdx: number) => {
    if (groupDragIndex === null || groupDragIndex === targetIdx) return
    const arr = [...group]
    const [it] = arr.splice(groupDragIndex, 1)
    arr.splice(targetIdx, 0, it)
    setGroup(arr)
    setGroupDragIndex(null)
    await persistGroupOrder(arr)
  }

  const addWebsite = () => {
    if (!newWebsiteUrl.trim()) return
    setWebsites((prev) => [...prev, { url: newWebsiteUrl.trim(), label: newWebsiteLabel.trim() }])
    setNewWebsiteUrl("")
    setNewWebsiteLabel("")
  }
  const saveWebsites = async () => {
    try {
      const res = await fetch("/api/information/websites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websites: websites.map((w, i) => ({ ...w, position: i })) }),
      })
      if (!res.ok) {
        let msg = "Ошибка сохранения"
        try {
          const e = await res.json()
          msg = String(e?.error || e?.message || msg)
        } catch {
          msg = await res.text().catch(() => msg)
        }
        showError(msg)
        return
      }
      showSuccess()
    } catch {
      showError("Ошибка сети")
    }
  }
  const persistWebsitesOrder = async (arr: { url: string; label: string }[]) => {
    await fetch("/api/information/websites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ websites: arr.map((w, i) => ({ ...w, position: i })) }),
    })
  }
  const handleWebsiteDropAt = async (targetIdx: number) => {
    if (websiteDragIndex === null || websiteDragIndex === targetIdx) return
    const arr = [...websites]
    const [it] = arr.splice(websiteDragIndex, 1)
    arr.splice(targetIdx, 0, it)
    setWebsites(arr)
    setWebsiteDragIndex(null)
    await persistWebsitesOrder(arr)
  }

  useEffect(() => {
    const load = async () => {
      const sRes = await fetch("/api/work/sections")
      const s = sRes.ok ? await sRes.json() : { sections: [] }
      const list = (s.sections || []).map((x: any) => ({
        id: Number(x?.id ?? 0),
        slug: String(x?.slug || ""),
        name: String(x?.name || ""),
        seoTitle: typeof x?.seoTitle === "string" ? x.seoTitle : null,
        seoDescription: typeof x?.seoDescription === "string" ? x.seoDescription : null,
        seoKeywords: typeof x?.seoKeywords === "string" ? x.seoKeywords : null,
      }))
      setSections(list)
      const activeSection = list.find((x: Section) => x.slug === active)
      if (activeSection) {
        setSectionSeoTitle(activeSection.seoTitle || "")
        setSectionSeoDescription(activeSection.seoDescription || "")
        setSectionSeoKeywords(activeSection.seoKeywords || "")
      }
    }
    load()
  }, [])

  useEffect(() => {
    const load = async () => {
      const rRes = await fetch(`/api/work/items?section=${active}`)
      const r = rRes.ok ? await rRes.json() : { items: [] }
      const list = (r.items || []).map((x: any) => ({
        id: Number(x?.id ?? 0),
        title: String(x?.title || ""),
        slug: String(x?.slug || ""),
        published: typeof x?.published === "number" ? x.published : (x?.published ? 1 : 0),
        position: typeof x?.position === "number" ? x.position : undefined,
      }))
      setItems(list)
      setSelectedItem(null)
      setDescription("")
      setYear("")
      setTypeVal("")
      setLocation("")
      setCollaborators("")
      setPublished(false)
      setPosition("")
      setMedia([])
    }
    load()
  }, [active])

  const toSlug = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")

  useEffect(() => {
    const slug = toSlug(newItemTitle)
    setNewItemSlug(slug)
    if (!newItemTitle.trim()) {
      setCreateError("Title is required")
    } else if (items.some((i) => i.slug === slug)) {
      setCreateError("Slug already exists")
    } else {
      setCreateError("")
    }
  }, [newItemTitle, items])

  const createItem = async () => {
    const s = sections.find((x) => x.slug === active)
    if (!s) return
    console.warn("CreateItem: attempt", { title: newItemTitle, slug: newItemSlug, section: s.slug })
    setCreating(true)
    try {
      const res = await fetch("/api/work/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: s.id, title: newItemTitle.trim(), slug: newItemSlug, position: items.length }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        let e: any = {}
        try { e = txt ? JSON.parse(txt) : {} } catch { e = { error: txt || "" } }
        const msg = res.status === 409 ? "Slug already exists" : typeof e?.error === "string" ? e.error : "Create failed"
        setCreateError(msg)
        console.error("CreateItem: failed", e)
        return
      }
      const created = await res.json().catch(() => ({}))
      const r = await fetch(`/api/work/items?section=${active}`).then((x) => x.json())
      setItems(r.items || [])
      const id = created?.item?.id
      if (id) await loadItem(Number(id))
      setCreateOpen(false)
      setNewItemTitle("")
      setNewItemSlug("")
      setCreateError("")
      console.warn("CreateItem: success", { id })
    } finally {
      setCreating(false)
    }
  }

  const persistItemOrder = async (arr: Item[]) => {
    const ids = arr.map((i) => i.id)
    await fetch(`/api/work/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    const r = await fetch(`/api/work/items?section=${active}`).then((x) => x.json())
    setItems(r.items || [])
  }

  const handleItemDropAt = async (targetIdx: number) => {
    if (itemDragIndex === null || itemDragIndex === targetIdx) return
    const arr = [...items]
    const [it] = arr.splice(itemDragIndex, 1)
    arr.splice(targetIdx, 0, it)
    setItems(arr)
    setItemDragIndex(null)
    await persistItemOrder(arr)
  }

  const deleteItem = async (id: number) => {
    setDeleting(true)
    try {
      await fetch(`/api/work/items/${id}`, { method: "DELETE" })
      if (selectedItem?.id === id) {
        setSelectedItem(null)
      }
      const r = await fetch(`/api/work/items?section=${active}`).then((x) => x.json())
      setItems(r.items || [])
    } finally {
      setDeleting(false)
      setDeleteItemId(null)
    }
  }

  const loadItem = async (id: number) => {
    const res = await fetch(`/api/work/items/${id}`)
    const r = res.ok ? await res.json() : { item: null }
    if (!r.item) return
    setSelectedItem(r.item)
    setTitle(r.item.title)
    setSlug(r.item.slug)
    setDescription(r.item.description || "")
    setYear(r.item.year ?? "")
    setTypeVal(r.item.type || "")
    setLocation(r.item.location || "")
    setCollaborators(r.item.collaborators || "")
    setPublished(!!r.item.published)
    setPosition(r.item.position ?? "")
    setMedia(r.item.media || [])
  }

  const saveItem = async () => {
    if (!selectedItem) return
    await fetch(`/api/work/items/${selectedItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        description,
        year: year === "" ? null : Number(year),
        type: typeVal,
        location,
        collaborators,
        published,
        position: position === "" ? null : Number(position),
      }),
    })
    await loadItem(selectedItem.id)
    const r = await fetch(`/api/work/items?section=${active}`).then((x) => x.json())
    setItems(r.items || [])
  }

  const addMedia = async () => {
    if (!selectedItem) return
    if (mediaFile) {
      const fd = new FormData()
      fd.set("itemId", String(selectedItem.id))
      const t = mediaFile.type && mediaFile.type.startsWith("video") ? "VIDEO" : "IMAGE"
      fd.set("type", t)
      fd.set("caption", mediaCaption)
      fd.set("alt", mediaAlt)
      const base = media?.length ? Number(media.length) : 0
      fd.set("position", String(base))
      fd.set("file", mediaFile)
      await fetch(`/api/work/media`, { method: "POST", body: fd })
    }
    setMediaFile(null)
    setMediaCaption("")
    setMediaAlt("")
    await loadItem(selectedItem.id)
  }

  const deleteMedia = async (id: number) => {
    if (!selectedItem) return
    await fetch(`/api/work/media/${id}`, { method: "DELETE" })
    await loadItem(selectedItem.id)
  }

  const persistMediaOrder = async (arr: Media[]) => {
    const ids = arr.map((m) => m.id)
    await fetch(`/api/work/media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    if (selectedItem) await loadItem(selectedItem.id)
  }

  const handleDropAt = async (targetIdx: number) => {
    if (dragIndex === null || dragIndex === targetIdx) return
    const arr = [...media]
    const [m] = arr.splice(dragIndex, 1)
    arr.splice(targetIdx, 0, m)
    setMedia(arr)
    setDragIndex(null)
    await persistMediaOrder(arr)
  }

  const onDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!selectedItem) return
    const files = Array.from(e.dataTransfer.files || [])
    if (!files.length) return
    setUploads(files.map((f) => ({ name: f.name, progress: 0, status: "pending" })))
    const base = media?.length || 0
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const fd = new FormData()
      fd.set("itemId", String(selectedItem.id))
      const t = f.type && f.type.startsWith("video") ? "VIDEO" : "IMAGE"
      fd.set("type", t)
      fd.set("caption", "")
      fd.set("alt", "")
      fd.set("position", String(base + i))
      fd.set("file", f)
      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", "/api/work/media", true)
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const p = Math.round((ev.loaded / ev.total) * 100)
            setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, progress: p } : u)))
          }
        }
        xhr.onload = () => {
          const ok = xhr.status >= 200 && xhr.status < 300
          setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, progress: 100, status: ok ? "success" : "error", message: ok ? "Uploaded" : xhr.responseText || "Error" } : u)))
          resolve()
        }
        xhr.onerror = () => {
          setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, status: "error", message: "Network error" } : u)))
          resolve()
        }
        xhr.send(fd)
      })
    }
    await loadItem(selectedItem.id)
  }

  const saveSectionSeo = async () => {
    const s = sections.find((x) => x.slug === active)
    if (!s) return
    await fetch(`/api/work/sections/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seoTitle: sectionSeoTitle,
        seoDescription: sectionSeoDescription,
        seoKeywords: sectionSeoKeywords,
      }),
    })
  }

  const moveSection = async (id: number, dir: -1 | 1) => {
    const idx = sections.findIndex((s) => s.id === id)
    if (idx < 0) return
    const newSections = [...sections]
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= newSections.length) return
    const tmp = newSections[idx]
    newSections[idx] = newSections[swapIdx]
    newSections[swapIdx] = tmp
    setSections(newSections)
    const ids = newSections.map((s) => s.id)
    await fetch(`/api/work/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
  }

  const deleteSection = async (id: number) => {
    await fetch(`/api/work/sections/${id}`, { method: "DELETE" })
    const s = await fetch("/api/work/sections").then((r) => r.json())
    setSections(s.sections || [])
    if (active && !s.sections.find((x: Section) => x.slug === active)) setActive("paint")
  }

  const logout = async () => {
    await fetch(`/api/admin/logout`, { method: "POST" })
    window.location.href = "/admin/login"
  }

  const changePassword = async () => {
    setPasswordMessage("")
    const msg = validatePassword(newPassword, confirmPassword)
    if (msg) {
      setPasswordMessage(msg)
      return
    }
    setChangingPassword(true)
    try {
      const csrf = (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)?.[1] && decodeURIComponent(document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)![1])) || ""
      const r = await fetch(`/api/admin/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      if (r.ok) {
        setPasswordMessage("Password updated")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setPasswordModalOpen(false)
      } else {
        const e = await r.json().catch(() => ({}))
        setPasswordMessage(e?.message ? String(e.message) : "Update failed")
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const validatePassword = (pw: string, confirm: string) => {
    if (!pw || pw.length < 8) return "Пароль должен быть не менее 8 символов"
    if (!/[A-Z]/.test(pw)) return "Пароль должен содержать заглавную букву"
    if (!/[a-z]/.test(pw)) return "Пароль должен содержать строчную букву"
    if (!/\d/.test(pw)) return "Пароль должен содержать цифру"
    if (pw !== confirm) return "Пароли не совпадают"
    return ""
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-medium tracking-wide mb-4">Admin</h2>
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchTab("work")}
            className={`px-3 py-1 text-[11px] rounded-sm border ${adminTab === "work" ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"}`}
          >
            WORK
          </button>
          <button
            onClick={() => switchTab("information")}
            className={`px-3 py-1 text-[11px] rounded-sm border ${adminTab === "information" ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"}`}
          >
            INFORMATION
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                await fetch("/api/admin/csrf", { method: "GET", cache: "no-store" })
              } catch {}
              setPasswordModalOpen(true)
            }}
            className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
          >
            Change Password
          </button>
          <button onClick={logout} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Logout</button>
        </div>
      </div>
      {adminTab === "information" ? (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["about","news","contacts","fairs","awards","solo","group","websites"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => switchInfo(cat)}
                className={`px-3 py-1 text-[11px] rounded-sm border ${infoMenu === cat ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
          {viewLoading && <div className="text-xs text-neutral-500 mb-3 animate-in fade-in duration-150">Loading…</div>}
          {infoMenu === "about" && (
            <div className="bg-white border border-neutral-200 rounded-sm p-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-medium mb-2">Edit About</h3>
              <div className="mb-2">
                <Editor
                  tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js"
                  apiKey={tinyApiKey || undefined}
                  value={aboutText}
                  onEditorChange={(val) => {
                    setAboutText(val)
                    setNoticeType("success")
                    setNoticeMessage("Saving…")
                    setNoticeOpen(true)
                    window.clearTimeout(debounceRef.current || undefined as unknown as number)
                    debounceRef.current = window.setTimeout(async () => {
                      try {
                        const r = await fetch("/api/information/about", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: val }) })
                        if (!r.ok) {
                          const t = await r.text().catch(() => "")
                          setNoticeType("error")
                          setNoticeMessage(t || "Ошибка сохранения")
                          return
                        }
                        setNoticeType("success")
                        setNoticeMessage("Saved")
                      } catch {
                        setNoticeType("error")
                        setNoticeMessage("Ошибка сети")
                      }
                    }, 1000)
                  }}
                  init={{
                    height: 360,
                    menubar: false,
                    plugins: ["link", "image", "lists", "code", "table", "media", "quickbars"],
                    toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image editimage media | code",
                    image_advtab: true,
                    images_upload_handler: async (blobInfo: any) => {
                      const fd = new FormData()
                      fd.append("file", blobInfo.blob(), blobInfo.filename() || "image.webp")
                      const r = await fetch("/api/information/about/upload", { method: "POST", body: fd })
                      if (!r.ok) {
                        const t = await r.text().catch(() => "")
                        throw new Error(t || "Ошибка загрузки")
                      }
                      const j = await r.json()
                      return j?.data?.coverUrl || ""
                    },
                    convert_urls: false,
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className={`text-xs ${noticeType === "error" ? "text-red-600" : "text-neutral-500"}`}>{noticeOpen ? noticeMessage : ""}</div>
                <button onClick={saveAbout} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Save</button>
              </div>
            </div>
          )}
          {infoMenu === "news" && (
            <div className="bg-white border border-neutral-200 rounded-sm p-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Manage News</h3>
              <button onClick={openAddNewsModal} className="px-3 py-1 text-[11px] rounded-sm bg-blue-600 text-white hover:bg-blue-700">Add News</button>
            </div>
            {newsModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={cancelNewsModal} />
                <div className="relative bg-white border border-neutral-200 rounded-sm p-4 w-[95%] max-w-[640px] max-h-[85vh] overflow-y-auto">
                  <h4 className="text-sm font-medium mb-2">{newsModalMode === "add" ? "Add News" : "Edit News"}</h4>
                  {newsModalError && <div className="text-xs text-red-600 mb-2">{newsModalError}</div>}
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Заголовок *</label>
                    <input value={newNewsTitle} onChange={(e) => setNewNewsTitle(e.target.value)} className="border rounded-sm px-2 py-1 text-sm w-full" placeholder="Title" />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Краткий текст *</label>
                    <textarea
                      value={newNewsText}
                      onChange={(e) => setNewNewsText(e.target.value)}
                      className="border rounded-sm px-2 py-1 text-sm w-full h-24"
                      placeholder="До 250 символов"
                      maxLength={250}
                    />
                    <div className="text-[11px] text-neutral-500 mt-1">{newNewsText.length}/250</div>
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Текст *</label>
                    <div className="border rounded-sm">
                      <Editor
                        tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js"
                        apiKey={tinyApiKey || undefined}
                        value={newNewsContent}
                        onEditorChange={(val) => setNewNewsContent(val)}
                          init={{
                            height: 300,
                            menubar: false,
                            plugins: ["link", "image", "lists", "code", "table", "quickbars"],
                            toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image editimage | code",
                            image_advtab: true,
                            images_upload_handler: async (blobInfo: any) => {
                              const fd = new FormData()
                              fd.append("file", blobInfo.blob(), blobInfo.filename() || "image.webp")
                              const r = await fetch("/api/information/news/upload", { method: "POST", body: fd })
                              if (!r.ok) {
                              const t = await r.text().catch(() => "")
                              throw new Error(t || "Ошибка загрузки")
                            }
                            const j = await r.json()
                            return j?.data?.coverUrl || ""
                          },
                          convert_urls: false,
                        }}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs mb-1">Дата публикации *</label>
                    <input type="datetime-local" value={newNewsDateTime} onChange={(e) => setNewNewsDateTime(e.target.value)} className="border rounded-sm px-2 py-1 text-sm w-full" />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={cancelNewsModal} className="px-3 py-1 text-[11px] rounded-sm border bg-neutral-100 hover:bg-neutral-200" disabled={newsModalSaving}>Cancel</button>
                    <button onClick={newsModalMode === "add" ? saveNewNews : saveEditedNews} className={`px-3 py-1 text-[11px] rounded-sm ${newsModalSaving ? "bg-green-500/60 text-white" : "bg-green-600 text-white hover:bg-green-700"}`} disabled={newsModalSaving}>
                      {newsModalSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => refreshNews(newsTrashMode)} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Refresh</button>
                <button onClick={async () => { setNewsTrashMode((v) => !v); await refreshNews(!newsTrashMode) }} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">{newsTrashMode ? "Show Active" : "Show Trash"}</button>
              </div>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left w-52 px-2 py-1 border-b">Дата</th>
                      <th className="text-left px-2 py-1 border-b">Заголовок</th>
                      <th className="text-right w-32 px-2 py-1 border-b"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {news.map((n, idx) => (
                      <tr key={n.id ? n.id : `${n.title}-${idx}`} className="align-top">
                        <td className="px-2 py-1">{formatDateForView(n.date)}</td>
                        <td className="px-2 py-1">{n.title.length > 100 ? `${n.title.slice(0, 100)}…` : n.title}</td>
                        <td className="px-2 py-1 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => startEditNews(idx)} className="px-2 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100" title="Редактировать">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => trashNews(n.id)} className="px-2 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100" title="Удалить">
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {infoMenu === "contacts" && (
            <div className="bg-white border border-neutral-200 rounded-sm p-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-medium mb-2">Edit Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input value={contactsEmail} onChange={(e) => setContactsEmail(e.target.value)} placeholder="Email" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={contactsPhone} onChange={(e) => setContactsPhone(e.target.value)} placeholder="Phone" className="border rounded-sm px-2 py-1 text-sm w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <input value={contactsAddressLine1} onChange={(e) => setContactsAddressLine1(e.target.value)} placeholder="Улица и дом" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={contactsAddressLine2} onChange={(e) => setContactsAddressLine2(e.target.value)} placeholder="Квартира/офис" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={contactsAddressLine3} onChange={(e) => setContactsAddressLine3(e.target.value)} placeholder="Доп. информация" className="border rounded-sm px-2 py-1 text-sm w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <input value={contactsInstagram} onChange={(e) => setContactsInstagram(e.target.value)} placeholder="Instagram" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={contactsFacebook} onChange={(e) => setContactsFacebook(e.target.value)} placeholder="Facebook" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={contactsWebsite} onChange={(e) => setContactsWebsite(e.target.value)} placeholder="Website" className="border rounded-sm px-2 py-1 text-sm w-full" />
              </div>
              <button onClick={saveContacts} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Save</button>
            </div>
          )}
          {infoMenu === "fairs" && (
            <div className="bg-white border border-neutral-200 rounded-sm p-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-medium mb-2">Edit Fairs</h3>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left w-10 px-2 py-1 border-b"></th>
                      <th className="text-left w-24 px-2 py-1 border-b">Year</th>
                      <th className="text-left px-2 py-1 border-b">Event</th>
                      <th className="text-right w-24 px-2 py-1 border-b"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fairs.map((row, idx) => (
                      <tr
                        key={idx}
                        className="align-top"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleFairDropAt(idx)}
                      >
                        <td className="px-2 py-1">
                          <button
                            draggable
                            onDragStart={() => setFairDragIndex(idx)}
                            className="px-1 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
                            title="Drag"
                          >
                            <GripVertical className="w-4 h-4 text-neutral-400" />
                          </button>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.year}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "")
                              setFairs((prev) => prev.map((x, j) => (j === idx ? { ...x, year: v } : x)))
                            }}
                            placeholder="Year"
                            className="border rounded-sm px-2 py-1 text-sm w-24"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.title}
                            onChange={(e) =>
                              setFairs((prev) => prev.map((x, j) => (j === idx ? { ...x, title: e.target.value } : x)))
                            }
                            placeholder="Event"
                            className="border rounded-sm px-2 py-1 text-sm w-full"
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button
                            onClick={() => setFairs((prev) => prev.filter((_, j) => j !== idx))}
                            className="px-2 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <input value={newFairYear} onChange={(e) => setNewFairYear(e.target.value.replace(/\D/g, ""))} placeholder="Year" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={newFairTitle} onChange={(e) => setNewFairTitle(e.target.value)} placeholder="Title" className="border rounded-sm px-2 py-1 text-sm w-full col-span-2 md:col-span-2" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addFair} disabled={newFairYear.trim() === "" || !newFairTitle.trim()} className={`px-3 py-1 text-[11px] rounded-sm border ${newFairYear.trim() === "" || !newFairTitle.trim() ? "opacity-50" : "bg-white hover:bg-neutral-100"}`}>Add</button>
                <button onClick={saveFairs} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Save All</button>
              </div>
            </div>
          )}
          {infoMenu === "awards" && (
            <div className="bg-white border border-neutral-200 rounded-sm p-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-medium mb-2">Edit Awards</h3>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left w-10 px-2 py-1 border-b"></th>
                      <th className="text-left w-24 px-2 py-1 border-b">Year</th>
                      <th className="text-left px-2 py-1 border-b">Title</th>
                      <th className="text-right w-24 px-2 py-1 border-b"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {awards.map((row, idx) => (
                      <tr
                        key={idx}
                        className="align-top"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleAwardDropAt(idx)}
                      >
                        <td className="px-2 py-1">
                          <button
                            draggable
                            onDragStart={() => setAwardDragIndex(idx)}
                            className="px-1 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
                            title="Drag"
                          >
                            <GripVertical className="w-4 h-4 text-neutral-400" />
                          </button>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.year}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "")
                              setAwards((prev) => prev.map((x, j) => (j === idx ? { ...x, year: v } : x)))
                            }}
                            placeholder="Year"
                            className="border rounded-sm px-2 py-1 text-sm w-24"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.title}
                            onChange={(e) =>
                              setAwards((prev) => prev.map((x, j) => (j === idx ? { ...x, title: e.target.value } : x)))
                            }
                            placeholder="Title"
                            className="border rounded-sm px-2 py-1 text-sm w-full"
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button
                            onClick={() => setAwards((prev) => prev.filter((_, j) => j !== idx))}
                            className="px-2 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <input value={newAwardYear} onChange={(e) => setNewAwardYear(e.target.value.replace(/\D/g, ""))} placeholder="Year" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={newAwardTitle} onChange={(e) => setNewAwardTitle(e.target.value)} placeholder="Title" className="border rounded-sm px-2 py-1 text-sm w-full col-span-2 md:col-span-2" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addAward} disabled={newAwardYear.trim() === "" || !newAwardTitle.trim()} className={`px-3 py-1 text-[11px] rounded-sm border ${newAwardYear.trim() === "" || !newAwardTitle.trim() ? "opacity-50" : "bg-white hover:bg-neutral-100"}`}>Add</button>
                <button onClick={saveAwards} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Save All</button>
              </div>
            </div>
          )}
          {infoMenu === "solo" && (
            <div className="bg-white border border-neutral-200 rounded-sm p-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-medium mb-2">Edit Solo Exhibitions</h3>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left w-10 px-2 py-1 border-b"></th>
                      <th className="text-left w-24 px-2 py-1 border-b">Year</th>
                      <th className="text-left px-2 py-1 border-b">Title</th>
                      <th className="text-right w-24 px-2 py-1 border-b"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {solo.map((row, idx) => (
                      <tr
                        key={idx}
                        className="align-top"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleSoloDropAt(idx)}
                      >
                        <td className="px-2 py-1">
                          <button
                            draggable
                            onDragStart={() => setSoloDragIndex(idx)}
                            className="px-1 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
                            title="Drag"
                          >
                            <GripVertical className="w-4 h-4 text-neutral-400" />
                          </button>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.year}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "")
                              setSolo((prev) => prev.map((x, j) => (j === idx ? { ...x, year: v } : x)))
                            }}
                            placeholder="Year"
                            className="border rounded-sm px-2 py-1 text-sm w-24"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.title}
                            onChange={(e) =>
                              setSolo((prev) => prev.map((x, j) => (j === idx ? { ...x, title: e.target.value } : x)))
                            }
                            placeholder="Title"
                            className="border rounded-sm px-2 py-1 text-sm w-full"
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button
                            onClick={() => setSolo((prev) => prev.filter((_, j) => j !== idx))}
                            className="px-2 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <input value={newSoloYear} onChange={(e) => setNewSoloYear(e.target.value.replace(/\D/g, ""))} placeholder="Year" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={newSoloTitle} onChange={(e) => setNewSoloTitle(e.target.value)} placeholder="Title" className="border rounded-sm px-2 py-1 text-sm w-full col-span-2 md:col-span-2" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addSolo} disabled={newSoloYear.trim() === "" || !newSoloTitle.trim()} className={`px-3 py-1 text-[11px] rounded-sm border ${newSoloYear.trim() === "" || !newSoloTitle.trim() ? "opacity-50" : "bg-white hover:bg-neutral-100"}`}>Add</button>
                <button onClick={saveSolo} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Save All</button>
              </div>
            </div>
          )}
          {infoMenu === "group" && (
            <div className="bg-white border border-neutral-200 rounded-sm p-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-medium mb-2">Edit Group Exhibitions</h3>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left w-10 px-2 py-1 border-b"></th>
                      <th className="text-left w-24 px-2 py-1 border-b">Year</th>
                      <th className="text-left px-2 py-1 border-b">Title</th>
                      <th className="text-right w-24 px-2 py-1 border-b"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((row, idx) => (
                      <tr
                        key={idx}
                        className="align-top"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleGroupDropAt(idx)}
                      >
                        <td className="px-2 py-1">
                          <button
                            draggable
                            onDragStart={() => setGroupDragIndex(idx)}
                            className="px-1 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
                            title="Drag"
                          >
                            <GripVertical className="w-4 h-4 text-neutral-400" />
                          </button>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.year}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "")
                              setGroup((prev) => prev.map((x, j) => (j === idx ? { ...x, year: v } : x)))
                            }}
                            placeholder="Year"
                            className="border rounded-sm px-2 py-1 text-sm w-24"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.title}
                            onChange={(e) =>
                              setGroup((prev) => prev.map((x, j) => (j === idx ? { ...x, title: e.target.value } : x)))
                            }
                            placeholder="Title"
                            className="border rounded-sm px-2 py-1 text-sm w-full"
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button
                            onClick={() => setGroup((prev) => prev.filter((_, j) => j !== idx))}
                            className="px-2 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <input value={newGroupYear} onChange={(e) => setNewGroupYear(e.target.value.replace(/\D/g, ""))} placeholder="Year" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} placeholder="Title" className="border rounded-sm px-2 py-1 text-sm w-full col-span-2 md:col-span-2" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addGroup} disabled={newGroupYear.trim() === "" || !newGroupTitle.trim()} className={`px-3 py-1 text-[11px] rounded-sm border ${newGroupYear.trim() === "" || !newGroupTitle.trim() ? "opacity-50" : "bg-white hover:bg-neutral-100"}`}>Add</button>
                <button onClick={saveGroup} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Save All</button>
              </div>
            </div>
          )}
          {infoMenu === "websites" && (
            <div className="bg-white border border-neutral-200 rounded-sm p-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-medium mb-2">Edit Websites</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <input value={newWebsiteUrl} onChange={(e) => setNewWebsiteUrl(e.target.value)} placeholder="URL" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={newWebsiteLabel} onChange={(e) => setNewWebsiteLabel(e.target.value)} placeholder="Label" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <button onClick={addWebsite} disabled={!newWebsiteUrl.trim()} className={`px-3 py-1 text-[11px] rounded-sm border ${!newWebsiteUrl.trim() ? "opacity-50" : "bg-white hover:bg-neutral-100"}`}>Add</button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input value={websiteFilter} onChange={(e) => { setWebsiteFilter(e.target.value); setWebsitePage(1) }} placeholder="Фильтр по URL/Label" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <select value={websitePageSize} onChange={(e) => { setWebsitePageSize(Number(e.target.value)); setWebsitePage(1) }} className="border rounded-sm px-2 py-1 text-sm">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left w-10 px-2 py-1 border-b"></th>
                      <th className="text-left w-72 px-2 py-1 border-b">URL</th>
                      <th className="text-left px-2 py-1 border-b">Label</th>
                      <th className="text-right w-24 px-2 py-1 border-b"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filtered = websites.filter((w) => {
                        const q = websiteFilter.trim().toLowerCase()
                        if (!q) return true
                        return w.url.toLowerCase().includes(q) || w.label.toLowerCase().includes(q)
                      })
                      const start = (websitePage - 1) * websitePageSize
                      const pageRows = filtered.slice(start, start + websitePageSize)
                      return pageRows.map((row, idxOnPage) => {
                        const idx = start + idxOnPage
                        return (
                          <tr
                            key={`${row.url}-${idx}`}
                            className="align-top"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleWebsiteDropAt(idx)}
                          >
                            <td className="px-2 py-1">
                              <button
                                draggable
                                onDragStart={() => setWebsiteDragIndex(idx)}
                                className="px-1 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
                                title="Drag"
                              >
                                <GripVertical className="w-4 h-4 text-neutral-400" />
                              </button>
                            </td>
                            <td className="px-2 py-1">
                              <input
                                value={row.url}
                                onChange={(e) =>
                                  setWebsites((prev) => prev.map((x, j) => (j === idx ? { ...x, url: e.target.value } : x)))
                                }
                                placeholder="URL"
                                className="border rounded-sm px-2 py-1 text-sm w-full"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                value={row.label}
                                onChange={(e) =>
                                  setWebsites((prev) => prev.map((x, j) => (j === idx ? { ...x, label: e.target.value } : x)))
                                }
                                placeholder="Label"
                                className="border rounded-sm px-2 py-1 text-sm w-full"
                              />
                            </td>
                            <td className="px-2 py-1 text-right">
                              <button
                                onClick={() => setWebsites((prev) => prev.filter((_, j) => j !== idx))}
                                className="px-2 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-neutral-600">Всего: {websites.filter((w) => w.url.toLowerCase().includes(websiteFilter.trim().toLowerCase()) || w.label.toLowerCase().includes(websiteFilter.trim().toLowerCase())).length}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setWebsitePage((p) => Math.max(1, p - 1))} className="px-2 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Prev</button>
                  <div className="text-xs">Page {websitePage}</div>
                  <button onClick={() => {
                    const total = websites.filter((w) => w.url.toLowerCase().includes(websiteFilter.trim().toLowerCase()) || w.label.toLowerCase().includes(websiteFilter.trim().toLowerCase())).length
                    const maxPage = Math.max(1, Math.ceil(total / websitePageSize))
                    setWebsitePage((p) => Math.min(maxPage, p + 1))
                  }} className="px-2 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Next</button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={saveWebsites} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Save All</button>
              </div>
            </div>
          )}
          {noticeOpen && noticeType && (
            <div className={`fixed left-1/2 -translate-x-1/2 bottom-4 z-50 w-[calc(100%-2rem)] max-w-sm sm:max-w-md md:max-w-lg shadow-lg rounded-sm border ${noticeType === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2 px-3 py-2">
                {noticeType === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div className={`text-sm ${noticeType === "success" ? "text-green-800" : "text-red-800"}`}>{noticeMessage}</div>
              </div>
            </div>
          )}
        </div>
          ) : (
        <div>
          <div className="flex gap-2 mb-4">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.slug)}
                className={`px-3 py-1 text-[11px] rounded-sm border ${active === s.slug ? "bg-yellow-400" : "bg-white"}`}
              >
                {String(s.name)}
              </button>
            ))}
          </div>
          <div className="bg-white border border-neutral-200 rounded-sm p-4 mb-4">
            <h3 className="text-sm font-medium mb-2">Account</h3>
            <Accordion.Root
              type="single"
              collapsible
              value={manageAccordionOpen ? "manage-sections" : undefined}
              onValueChange={(v) => setManageAccordionOpen(!!v)}
              className="w-full"
            >
              <Accordion.Item value="manage-sections">
                <Accordion.Header>
                  <Accordion.Trigger className="w-full text-left px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">
                    Manage Sections
                  </Accordion.Trigger>
                </Accordion.Header>
                {manageAccordionOpen && (
                  <Accordion.Content className="mt-2">
                    <ul className="space-y-2">
                      {sections.map((s, idx) => (
                        <li key={s.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => moveSection(s.id, -1)} className="px-2 py-1 text-[11px] rounded-sm border">Up</button>
                            <button onClick={() => moveSection(s.id, 1)} className="px-2 py-1 text-[11px] rounded-sm border">Down</button>
                            <span className="text-sm">{idx + 1}. {s.name}</span>
                          </div>
                          <button onClick={() => deleteSection(s.id)} className="px-2 py-1 text-[11px] rounded-sm border">Delete</button>
                        </li>
                      ))}
                    </ul>
                  </Accordion.Content>
                )}
              </Accordion.Item>
            </Accordion.Root>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-neutral-200 rounded-sm p-4 h-96">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Items</h3>
                <button onClick={() => { setCreateOpen(true); console.warn("CreateItem: open modal") }} className="px-2 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Add new item</button>
              </div>
          <div className="h-full overflow-y-auto">
            <ul className="space-y-2">
              {items.map((i, idx) => (
                <li
                  key={i.id}
                  className={`text-sm flex items-center justify-between cursor-pointer transition-colors px-2 py-1 rounded-sm ${i.published ? "" : "opacity-60"} ${selectedItem?.id === i.id ? "active bg-yellow-50 border border-yellow-300" : "hover:bg-neutral-50"}`}
                  draggable
                  onDragStart={() => setItemDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleItemDropAt(idx)}
                  onClick={() => { selectedItem?.id === i.id ? setSelectedItem(null) : loadItem(i.id) }}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-neutral-400" />
                    <button className={`text-left cursor-pointer ${i.published ? "" : "text-neutral-500"}`} onClick={() => loadItem(i.id)}>{String(i.title)}</button>
                  </div>
                  <button onClick={() => setDeleteItemId(i.id)} className="px-2 py-1 text-[11px] rounded-sm border">Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-sm p-4 h-96">
          <h3 className="text-sm font-medium mb-2">Edit Item</h3>
          {!selectedItem ? (
            <div className="text-sm text-neutral-600">Select an item to edit.</div>
          ) : (
            <div className="h-full overflow-y-auto">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input value={year} onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Year" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={typeVal} onChange={(e) => setTypeVal(e.target.value)} placeholder="Type" className="border rounded-sm px-2 py-1 text-sm w-full" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="border rounded-sm px-2 py-1 text-sm w-full" />
                <input value={collaborators} onChange={(e) => setCollaborators(e.target.value)} placeholder="Collaborators" className="border rounded-sm px-2 py-1 text-sm w-full" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm">Published</label>
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                <input value={position} onChange={(e) => setPosition(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Position" className="border rounded-sm px-2 py-1 text-sm w-24" />
              </div>
              <button onClick={saveItem} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Save</button>
            </div>
          )}
        </div>
        </div>
        </div>
      )}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-neutral-200 w-full max-w-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Create Item</h3>
              <button onClick={() => { setCreateOpen(false); console.warn("CreateItem: cancel") }} className="text-neutral-600 hover:text-neutral-900">✕</button>
            </div>
            <label className="text-xs text-neutral-600">Title</label>
            <input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="Title" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
            <div className="text-[11px] text-neutral-500 mb-2">Slug: {newItemSlug || "—"}</div>
            {createError && <div className="text-[11px] text-red-600 mb-2">{createError}</div>}
            <div className="flex items-center justify-end gap-2 mt-2">
              <button onClick={() => { setCreateOpen(false); console.warn("CreateItem: cancel") }} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Cancel</button>
              <button onClick={createItem} disabled={creating || !!createError || !newItemTitle.trim()} className={`px-3 py-1 text-[11px] rounded-sm border ${creating || !!createError || !newItemTitle.trim() ? "opacity-50" : "bg-white hover:bg-neutral-100"}`}>{creating ? "Adding..." : "Add"}</button>
            </div>
          </div>
        </div>
      )}
      {deleteItemId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-neutral-200 w-full max-w-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Confirm deletion</h3>
              <button onClick={() => setDeleteItemId(null)} className="text-neutral-600 hover:text-neutral-900">✕</button>
            </div>
            <div className="text-sm">Delete this item and all associated media files?</div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button onClick={() => setDeleteItemId(null)} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Cancel</button>
              <button onClick={() => deleteItem(deleteItemId!)} disabled={deleting} className={`px-3 py-1 text-[11px] rounded-sm border ${deleting ? "opacity-50" : "bg-white hover:bg-neutral-100"}`}>{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
      {selectedItem && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white border border-neutral-200 rounded-sm p-4">
            <h3 className="text-sm font-medium mb-2">Section SEO</h3>
            <input value={sectionSeoTitle} onChange={(e) => setSectionSeoTitle(e.target.value)} placeholder="SEO Title" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
            <textarea value={sectionSeoDescription} onChange={(e) => setSectionSeoDescription(e.target.value)} placeholder="SEO Description" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
            <input value={sectionSeoKeywords} onChange={(e) => setSectionSeoKeywords(e.target.value)} placeholder="SEO Keywords" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
            <button onClick={saveSectionSeo} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Save</button>
          </div>
          <div className="bg-white border border-neutral-200 rounded-sm p-4 h-96">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Media</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setMediaView("list")} className={`px-2 py-1 text-[11px] rounded-sm border ${mediaView === "list" ? "bg-yellow-400" : "bg-white"}`}>List</button>
                <button onClick={() => setMediaView("thumbs")} className={`px-2 py-1 text-[11px] rounded-sm border ${mediaView === "thumbs" ? "bg-yellow-400" : "bg-white"}`}>Thumbs</button>
              </div>
            </div>
            <div className="h-full overflow-y-auto">
              <div onDragOver={(e) => e.preventDefault()} onDrop={onDropFiles} className="border border-dashed rounded-sm p-4 mb-4 text-center text-xs text-neutral-600">Drop files here</div>
              {uploads.length > 0 && (
                <div className="space-y-2 mb-4">
                  {uploads.map((u, idx) => (
                    <div key={`${u.name}-${idx}`} className="flex items-center gap-3">
                      <span className="text-xs w-40 truncate">{u.name}</span>
                      <div className="flex-1 h-1 bg-neutral-200 rounded-sm">
                        <div className={`h-1 rounded-sm ${u.status === "error" ? "bg-red-500" : u.status === "success" ? "bg-green-500" : "bg-yellow-400"}`} style={{ width: `${u.progress}%` }} />
                      </div>
                      <span className={`text-[11px] ${u.status === "error" ? "text-red-600" : u.status === "success" ? "text-green-600" : "text-neutral-600"}`}>{u.status === "pending" ? `${u.progress}%` : u.status === "success" ? "Success" : "Error"}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 mb-4">
                {mediaView === "list" && media.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between"
                    draggable
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropAt(idx)}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm">
                        {(() => {
                          const u = m.url || ""
                          const last = u.split("/").pop() || u
                          return (last || "").split("?")[0]
                        })()}
                      </span>
                    </div>
                    <button onClick={() => deleteMedia(m.id)} className="px-2 py-1 text-[11px] rounded-sm border">Delete</button>
                  </div>
                ))}
                {mediaView === "thumbs" && (
                  <div className="grid grid-cols-3 gap-2">
                    {media.map((m, idx) => (
                      <div
                        key={m.id}
                        className="relative"
                        draggable
                        onDragStart={() => setDragIndex(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropAt(idx)}
                      >
                        <img src={m.thumbnail || m.url} alt={m.alt || ""} className="w-full h-auto object-cover border rounded-sm" />
                        <button onClick={() => deleteMedia(m.id)} className="absolute top-1 right-1 px-2 py-1 text-[11px] rounded-sm border bg-white">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input type="file" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} className="border rounded-sm px-2 py-1 text-sm w-full my-2" />
              <input value={mediaAlt} onChange={(e) => setMediaAlt(e.target.value)} placeholder="Alt" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
              <input value={mediaCaption} onChange={(e) => setMediaCaption(e.target.value)} placeholder="Caption" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
              <button onClick={addMedia} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Add Media</button>
            </div>
          </div>
        </div>
      )}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-neutral-200 w-full max-w-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Change Password</h3>
              <button onClick={() => setPasswordModalOpen(false)} className="text-neutral-600 hover:text-neutral-900">✕</button>
            </div>
            {passwordMessage && <div className="text-[11px] mb-2">{passwordMessage}</div>}
            <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" type="password" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" type="password" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
            <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" type="password" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button onClick={() => setPasswordModalOpen(false)} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Cancel</button>
              <button onClick={async () => { await changePassword(); }} disabled={changingPassword} className={`px-3 py-1 text-[11px] rounded-sm border ${changingPassword ? "opacity-50" : "bg-white hover:bg-neutral-100"}`}>{changingPassword ? "Updating…" : "Update"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
