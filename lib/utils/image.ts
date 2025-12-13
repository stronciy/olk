import sharp from "sharp"

export async function resizeAndCompressImage(input: Buffer, mimeType: string, size = 1024): Promise<Buffer> {
  const img = sharp(input)
  const meta = await img.metadata()
  let pipe = img
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  if (w > size || h > size) {
    pipe = pipe.resize(size, size, { fit: "inside", withoutEnlargement: true })
  }
  const mt = (mimeType || "").toLowerCase()
  if (mt.includes("png")) {
    pipe = pipe.png({ compressionLevel: 9 })
  } else if (mt.includes("webp")) {
    pipe = pipe.webp({ quality: 90 })
  } else {
    pipe = pipe.jpeg({ quality: 90 })
  }
  return pipe.toBuffer()
}
