import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { verifyAdminSession } from "@/lib/auth"
import AdminClient from "./AdminClient"

export default async function AdminPage() {
  const hs = await headers()
  const cookieHeader = hs.get("cookie") || ""
  const m = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/)
  const token = m ? decodeURIComponent(m[1]) : undefined
  const ok = verifyAdminSession(token)
  if (!ok) redirect("/admin/login")
  return <AdminClient />
}
