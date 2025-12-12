import { ok, fail } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import crypto from "crypto"

export const runtime = "nodejs"

export async function GET(req: Request) {
  if (!requireAdmin(req)) return fail(req, 401, "UNAUTHORIZED", "Unauthorized", { type: "AuthenticationError" })
  const csrf = crypto.randomBytes(16).toString("hex")
  const res = ok(req, { csrf }, "CSRF refreshed")
  res.cookies.set("csrf_token", csrf, {
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60,
  })
  return res
}
