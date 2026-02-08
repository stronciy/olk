import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: urlPath } = await params
    
    // Construct the absolute path
    const relativePath = urlPath.join("/")
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    const filePath = path.join(uploadsDir, relativePath)
    
    // Security check: ensure the path is inside public/uploads
    // path.resolve resolves .. segments, so we can check if it still starts with uploadsDir
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(uploadsDir)) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    if (!fs.existsSync(resolvedPath)) {
      return new NextResponse("Not Found", { status: 404 })
    }
    
    const stat = fs.statSync(resolvedPath)
    if (!stat.isFile()) {
       return new NextResponse("Not Found", { status: 404 })
    }

    const fileBuffer = fs.readFileSync(resolvedPath)
    const ext = path.extname(resolvedPath).slice(1).toLowerCase()
    
    let contentType = "application/octet-stream"
    if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg"
    else if (ext === "png") contentType = "image/png"
    else if (ext === "webp") contentType = "image/webp"
    else if (ext === "gif") contentType = "image/gif"
    else if (ext === "svg") contentType = "image/svg+xml"
    else if (ext === "mp4") contentType = "video/mp4"
    else if (ext === "pdf") contentType = "application/pdf"
    else if (ext === "avif") contentType = "image/avif"
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": stat.size.toString()
      }
    })
  } catch (e) {
    console.error("Error serving upload:", e)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
