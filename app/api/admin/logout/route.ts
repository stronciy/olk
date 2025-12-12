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
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  })
  res.cookies.set("csrf_token", "", {
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  })
  return res
}
