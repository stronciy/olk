"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const submit = async () => {
    setError("")
    const r = await fetch(`/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    if (r.ok) {
      router.push("/admin")
    } else {
      const e = await r.json().catch(() => ({}))
      setError(e?.error || "Login failed")
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h2 className="text-xl font-medium tracking-wide mb-4">Admin Login</h2>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="border rounded-sm px-2 py-1 text-sm w-full mb-2" />
      <button onClick={submit} className="px-3 py-1 text-[11px] rounded-sm border bg-white hover:bg-neutral-100">Login</button>
    </div>
  )
}

