import { NextResponse } from "next/server"
import { ok } from "@/lib/api"

export const runtime = "nodejs"

export async function POST() {
  const dummyReq = new Request("http://localhost")
  const res = ok(dummyReq, {}, "Logged out")
  res.cookies.set("admin_session", "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: 0,
  })
  return res
}
