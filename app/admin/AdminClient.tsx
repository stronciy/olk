"use client"

import { useEffect, useState } from "react"
import { GripVertical } from "lucide-react"

type Section = { id: number; slug: string; name: string; seoTitle?: string | null; seoDescription?: string | null; seoKeywords?: string | null }
type Item = { id: number; title: string; slug: string; published?: number; position?: number }
type Media = { id: number; type: "IMAGE" | "VIDEO"; url: string; thumbnail?: string | null; caption?: string | null; alt?: string | null; position?: number }

export default function AdminClient() {
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
  const [passwordMessage, setPasswordMessage] = useState("")
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const sRes = await fetch("/api/work/sections")
      const s = sRes.ok ? await sRes.json() : { sections: [] }
      setSections(s.sections || [])
      const activeSection = (s.sections || []).find((x: Section) => x.slug === active)
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
      setItems(r.items || [])
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
    const r = await fetch(`/api/admin/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    if (r.ok) {
      setPasswordMessage("Password updated")
      setCurrentPassword("")
      setNewPassword("")
    } else {
      const e = await r.json().catch(() => ({}))
      setPasswordMessage(e?.error ? String(e.error) : "Update failed")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-medium tracking-wide mb-4">Admin</h2>
      <div className="flex gap-2 mb-4">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.slug)}
            className={`px-3 py-1 text-[11px] rounded-sm border ${active === s.slug ? "bg-yellow-400" : "bg-white"}`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="bg-white border border-neutral-200 rounded-sm p-4 mb-4">
        <h3 className="text-sm font-medium mb-2">Account</h3>
        <div className="flex items-center gap-2 mb-2">
          <button onClick={logout} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Logout</button>
        </div>
        <div className="mt-2">
          <p className="text-xs text-neutral-500 mb-2">Change password</p>
          {passwordMessage && <div className="text-xs mb-2">{passwordMessage}</div>}
          <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" type="password" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
          <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" type="password" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
          <button onClick={changePassword} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Update</button>
        </div>
      <h3 className="text-sm font-medium mb-2">Manage Sections</h3>
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
                  className="text-sm flex items-center justify-between"
                  draggable
                  onDragStart={() => setItemDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleItemDropAt(idx)}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-neutral-400" />
                    <button className="text-left" onClick={() => loadItem(i.id)}>{i.title}</button>
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
    </div>
  )
}
