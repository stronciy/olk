import { NextResponse } from "next/server"

function reqId(req: Request) {
  const id = req.headers.get("x-request-id")
  return id || `req_${Math.random().toString(36).slice(2)}`
}

function secHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("X-XSS-Protection", "1; mode=block")
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  res.headers.set("Content-Security-Policy", "default-src 'self'")
  return res
}

export function ok(req: Request, data: any = {}, message = "Operation completed successfully", code = "SUCCESS", status = 200) {
  const body = {
    success: true,
    code,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId: reqId(req),
  }
  const res = NextResponse.json(body, { status })
  return secHeaders(res)
}

export function fail(req: Request, status = 500, code = "INTERNAL_ERROR", message = "Unexpected error", error?: any) {
  const body = {
    success: false,
    code,
    error,
    message,
    timestamp: new Date().toISOString(),
    requestId: reqId(req),
  }
  const res = NextResponse.json(body, { status })
  return secHeaders(res)
}

