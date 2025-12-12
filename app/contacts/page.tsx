"use client"

import Link from "next/link"

export default function ContactsPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-neutral-200 rounded-sm p-4">
            <div className="text-sm text-green-700 space-y-2">
              <div>
                <div className="text-xs text-green-600">Email</div>
                <div>studio@esdevlin.com</div>
              </div>
              <div>
                <div className="text-xs text-green-600">Location</div>
                <div>Kyiv, Ukraine</div>
              </div>
              <div>
                <div className="text-xs text-green-600">Social</div>
                <div className="text-green-700">instagram.com/olk_manufactory</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-sm p-4">
            <form className="space-y-3">
              <div className="text-xs text-neutral-500">Send a message</div>
              <input
                type="text"
                placeholder="Your name"
                className="w-full border rounded-sm px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Your email"
                className="w-full border rounded-sm px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Message"
                className="w-full border rounded-sm px-3 py-2 text-sm h-28"
              />
              <button type="button" className="text-xs px-3 py-2 rounded-sm border bg-white hover:bg-neutral-100">
                Send
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
