"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type Contacts = {
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  instagram: string
  facebook: string
  website: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contacts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const r = await fetch("/api/information/contacts", { cache: "no-store" })
        if (!r.ok) throw new Error(await r.text().catch(() => "Ошибка загрузки"))
        const j = await r.json()
        const c = j?.data?.contacts || {}
        setContacts({
          email: String(c.email || ""),
          phone: String(c.phone || ""),
          addressLine1: String(c.addressLine1 || ""),
          addressLine2: String(c.addressLine2 || ""),
          addressLine3: String(c.addressLine3 || ""),
          instagram: String(c.instagram || ""),
          facebook: String(c.facebook || ""),
          website: String(c.website || ""),
        })
      } catch (e: any) {
        setError(typeof e?.message === "string" ? e.message : "Ошибка загрузки")
      } finally {
        setLoading(false)
      }
    }
    load()
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
            <Link href="/news" className="w-full block text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-neutral-100">NEWS</Link>
            <Link href="/contacts" className="w-full block text-left px-4 py-2 text-xs font-medium transition-colors bg-yellow-400 hover:bg-yellow-500">CONTACTS</Link>
          </div>
        </nav>
      </aside>

      <main className="max-w-5xl mx-auto p-4 md:p-8 md:ml-48">
        <h2 className="text-xl font-medium tracking-wide mb-6">Contacts</h2>
        <div className="bg-white border border-neutral-200 rounded-sm p-4">
          {loading && <div className="text-xs text-neutral-500">Loading…</div>}
          {error && <div className="text-xs text-red-600">{error}</div>}
          {!loading && !error && contacts && (
            <div className="text-sm text-green-700 space-y-4 animate-in fade-in duration-200">
              <section aria-labelledby="contact-address">
                <div id="contact-address" className="text-xs text-green-600">Address</div>
                <address className="not-italic leading-5">
                  {contacts.addressLine1 && <div>{contacts.addressLine1}</div>}
                  {contacts.addressLine2 && <div>{contacts.addressLine2}</div>}
                  {contacts.addressLine3 && <div>{contacts.addressLine3}</div>}
                </address>
              </section>
              <section aria-labelledby="contact-phone">
                <div id="contact-phone" className="text-xs text-green-600">Phone</div>
                <div>{contacts.phone}</div>
              </section>
              <section aria-labelledby="contact-email">
                <div id="contact-email" className="text-xs text-green-600">Email</div>
                <div>{contacts.email}</div>
              </section>
              <section aria-labelledby="contact-social">
                <div id="contact-social" className="text-xs text-green-600">Social</div>
                <div className="flex items-center gap-4">
                  {contacts.instagram && (
                    <a
                      href={contacts.instagram.startsWith("http") ? contacts.instagram : `https://${contacts.instagram}`}
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
                  {contacts.facebook && (
                    <a
                      href={contacts.facebook.startsWith("http") ? contacts.facebook : `https://${contacts.facebook}`}
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
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
