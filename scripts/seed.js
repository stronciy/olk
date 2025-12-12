import mysql from "mysql2/promise"
import fs from "fs"
import path from "path"
import bcrypt from "bcryptjs"
import sharp from "sharp"

function parseDatabaseUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    return {
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username || ""),
      password: decodeURIComponent(u.password || ""),
      database: (u.pathname || "/").replace(/^\//, ""),
    }
  } catch {
    return null
  }
}

function loadEnv() {
  try {
    const p = path.join(process.cwd(), ".env")
    if (!fs.existsSync(p)) return
    const content = fs.readFileSync(p, "utf8")
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!m) continue
      const key = m[1]
      let val = m[2]
      if (val.startsWith("\"") && val.endsWith("\"")) val = val.slice(1, -1)
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
      process.env[key] = val
    }
  } catch {}
}

loadEnv()

const parsed = parseDatabaseUrl(process.env.DATABASE_URL)
const useMaria = !!process.env.MARIADB_USER || !!process.env.MARIADB_DATABASE
let socketPath = process.env.MARIADB_SOCKET
if (!socketPath) {
  const candidates = [
    "/tmp/mysql.sock",
    "/var/run/mysqld/mysqld.sock",
    "/opt/homebrew/var/run/mysqld/mysqld.sock",
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      socketPath = p
      break
    }
  }
}

const pool = mysql.createPool(
  socketPath
    ? {
        socketPath,
        user: useMaria ? process.env.MARIADB_USER : parsed?.user,
        password: useMaria ? process.env.MARIADB_PASSWORD : parsed?.password,
        database: useMaria ? process.env.MARIADB_DATABASE : parsed?.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      }
    : {
        host: useMaria ? process.env.HOST || "127.0.0.1" : parsed?.host || "127.0.0.1",
        port: useMaria ? Number(process.env.MARIADB_PORT || 3306) : parsed?.port || 3306,
        user: useMaria ? process.env.MARIADB_USER : parsed?.user,
        password: useMaria ? process.env.MARIADB_PASSWORD : parsed?.password,
        database: useMaria ? process.env.MARIADB_DATABASE : parsed?.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      }
)

async function main() {
  const conn = await pool.getConnection()
  try {
    await conn.query(
      "CREATE TABLE IF NOT EXISTS WorkSection (id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(255) UNIQUE, name VARCHAR(255), position INT DEFAULT 0, visible BOOLEAN DEFAULT TRUE, seoTitle VARCHAR(255), seoDescription TEXT, seoKeywords TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
    )
    await conn.query(
      "CREATE TABLE IF NOT EXISTS WorkItem (id INT AUTO_INCREMENT PRIMARY KEY, sectionId INT, slug VARCHAR(255) UNIQUE, title VARCHAR(255), location VARCHAR(255), description TEXT, year INT, type VARCHAR(255), collaborators VARCHAR(255), position INT DEFAULT 0, published BOOLEAN DEFAULT TRUE, seoTitle VARCHAR(255), seoDescription TEXT, seoKeywords TEXT, canonicalUrl VARCHAR(255), ogImageUrl VARCHAR(255), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
    )
    await conn.query(
      "CREATE TABLE IF NOT EXISTS WorkMedia (id INT AUTO_INCREMENT PRIMARY KEY, itemId INT, type ENUM('IMAGE','VIDEO'), url TEXT, thumbnail TEXT, caption TEXT, alt TEXT, position INT DEFAULT 0, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
    )

    await conn.query(
      "CREATE TABLE IF NOT EXISTS Users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) UNIQUE, passwordHash VARCHAR(255), role VARCHAR(50), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
    )
    const [u] = await conn.query("SELECT id FROM Users WHERE username = 'admin' LIMIT 1")
    const hash = await bcrypt.hash("admin", 10)
    if (!(Array.isArray(u) && u.length)) {
      await conn.query(
        "INSERT INTO Users (username, passwordHash, role) VALUES (?, ?, ?)",
        ["admin", hash, "admin"]
      )
    } else {
      await conn.query("UPDATE Users SET passwordHash = ? WHERE username = 'admin'", [hash])
    }

    const slugs = ["paint", "prints", "mask", "carpet", "spare"]
    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i]
      await conn.query("INSERT IGNORE INTO WorkSection (slug, name, position) VALUES (?, ?, ?)", [slug, slug.toUpperCase(), i])
    }

    const [sections] = await conn.query("SELECT id, slug FROM WorkSection")
    const sectionBySlug = {}
    for (const s of sections) sectionBySlug[s.slug] = s.id

    const items = [
      {
        sectionSlug: "paint",
        slug: "library-of-light",
        title: "LIBRARY OF LIGHT",
        year: 2022,
        type: "painting",
        location: "London",
        position: 0,
        published: 1,
        description: "Exploration of light and texture.",
      },
      {
        sectionSlug: "paint",
        slug: "lady-gaga-coachella",
        title: "LADY GAGA COACHELLA",
        year: 2017,
        type: "painting",
        location: "California",
        position: 1,
        published: 1,
        description: "Vivid performance inspired work.",
      },
      {
        sectionSlug: "prints",
        slug: "face-to-face",
        title: "FACE TO FACE",
        year: 2019,
        type: "print",
        location: "Paris",
        position: 0,
        published: 1,
        description: "Series of abstract portraits.",
      },
    ]

    let itemInserted = 0
    for (const it of items) {
      const sectionId = sectionBySlug[it.sectionSlug]
      if (!sectionId) continue
      await conn.query(
        "INSERT IGNORE INTO WorkItem (sectionId, slug, title, location, description, year, type, collaborators, position, published, seoTitle, seoDescription, seoKeywords, canonicalUrl, ogImageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          sectionId,
          it.slug,
          it.title,
          it.location || null,
          it.description || null,
          it.year || null,
          it.type || null,
          null,
          it.position || 0,
          it.published ? 1 : 0,
          `${it.title} — SEO`,
          `About ${it.title}`,
          "art,light,texture",
          null,
          null,
        ]
      )
      itemInserted++
    }

    const [rows] = await conn.query("SELECT id, slug FROM WorkItem WHERE slug IN (?, ?, ?)", [
      "library-of-light",
      "lady-gaga-coachella",
      "face-to-face",
    ])

    const mediaRows = []
    for (const r of rows) {
      mediaRows.push([
        r.id,
        "IMAGE",
        "https://picsum.photos/seed/" + r.slug + "/960/720",
        null,
        "Sample image",
        "Alt text",
        0,
      ])
      mediaRows.push([
        r.id,
        "IMAGE",
        "https://picsum.photos/seed/" + r.slug + "-2/960/720",
        null,
        "Sample image 2",
        "Alt text",
        1,
      ])
    }
    for (const m of mediaRows) {
      await conn.query(
        "INSERT INTO WorkMedia (itemId, type, url, thumbnail, caption, alt, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
        m
      )
    }

    console.log(JSON.stringify({ sections: sections.length, items: itemInserted, media: mediaRows.length }))

    // Ensure category placeholder images exist
    const phDir = path.join(process.cwd(), "public", "images", "placeholders")
    if (!fs.existsSync(phDir)) fs.mkdirSync(phDir, { recursive: true })
    const categories = ["prints", "paint", "mask", "carpet", "spare"]
    for (const c of categories) {
      const p = path.join(phDir, `${c}.jpg`)
      if (!fs.existsSync(p)) {
        await sharp({
          create: {
            width: 800,
            height: 600,
            channels: 3,
            background: { r: 229, g: 231, b: 235 }, // neutral-200
          },
        })
          .jpeg({ quality: 85 })
          .toFile(p)
      }
    }

    // Seed from JSON catalog (data/catalog_seed.json)
    const jsonPath = path.join(process.cwd(), "data", "catalog_seed.json")
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf8")
      /** @type {{ categories: Array<{ category: string, items: Array<{ title: string, slug: string, description: string, specs?: any, price_usd?: number, image_filename?: string, image_placeholder_url?: string }> }> }} */
      const catalog = JSON.parse(raw)
      const catSlug = (name) => String(name || "").trim().toLowerCase()
      const typeByCat = {
        prints: "print",
        paint: "painting",
        mask: "mask",
        carpet: "carpet",
        spare: "object",
      }
      let itemsInsertedFromJson = 0
      let mediaInsertedFromJson = 0

      // Ensure sections exist for all categories in JSON
      const [existingSectionsRows] = await conn.query("SELECT id, slug FROM WorkSection")
      const sectionBySlug2 = {}
      for (const s of existingSectionsRows) sectionBySlug2[s.slug] = s.id

      if (Array.isArray(catalog?.categories)) {
        // Insert missing sections
        for (let i = 0; i < catalog.categories.length; i++) {
          const c = catalog.categories[i]
          const s = catSlug(c.category)
          if (!sectionBySlug2[s]) {
            await conn.query("INSERT IGNORE INTO WorkSection (slug, name, position) VALUES (?, ?, ?)", [s, (c.category || s).toUpperCase(), i])
            const [sr] = await conn.query("SELECT id FROM WorkSection WHERE slug = ? LIMIT 1", [s])
            if (Array.isArray(sr) && sr.length) sectionBySlug2[s] = sr[0].id
          }
        }

        // Insert items and one placeholder media per item
        for (const c of catalog.categories) {
          const s = catSlug(c.category)
          const sectionId = sectionBySlug2[s]
          if (!sectionId) continue
          const itemsArr = Array.isArray(c.items) ? c.items : []
          for (let idx = 0; idx < itemsArr.length; idx++) {
            const it = itemsArr[idx]
            const title = String(it.title || "").trim()
            const slug = String(it.slug || "").trim().toLowerCase()
            if (!title || !slug) continue
            const descBase = String(it.description || "").trim()
            const specs = it.specs || {}
            const price = it.price_usd
            const specsText = [
              specs.size_cm ? `Size: ${specs.size_cm}` : null,
              specs.weight_kg != null ? `Weight: ${specs.weight_kg} kg` : null,
              specs.color_palette ? `Palette: ${specs.color_palette}` : null,
              specs.material ? `Material: ${specs.material}` : null,
              price != null ? `Price: $${price}` : null,
            ].filter(Boolean).join(" • ")
            const description = specsText ? `${descBase}\n${specsText}` : descBase
            const type = typeByCat[s] || null

            await conn.query(
              "INSERT IGNORE INTO WorkItem (sectionId, slug, title, location, description, year, type, collaborators, position, published, seoTitle, seoDescription, seoKeywords, canonicalUrl, ogImageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                sectionId,
                slug,
                title,
                null,
                description || null,
                null,
                type,
                null,
                idx,
                1,
                `${title} — SEO`,
                `About ${title}`,
                `${s},${type || "art"},collection`,
                null,
                null,
              ]
            )
            itemsInsertedFromJson++

            // Get item id (whether inserted or existing)
            const [rowItem] = await conn.query("SELECT id FROM WorkItem WHERE slug = ? LIMIT 1", [slug])
            const itemId = Array.isArray(rowItem) && rowItem.length ? rowItem[0].id : null
            if (!itemId) continue

            const placeholderUrl = it.image_placeholder_url || `/images/placeholders/${s}.jpg`
            await conn.query(
              "INSERT INTO WorkMedia (itemId, type, url, thumbnail, caption, alt, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
              [itemId, "IMAGE", placeholderUrl, null, "Placeholder", title, 0]
            )
            mediaInsertedFromJson++
          }
        }
      }

      console.log(JSON.stringify({ added_from_json: { items: itemsInsertedFromJson, media: mediaInsertedFromJson } }))
    } else {
      console.warn("catalog_seed.json not found at", jsonPath)
    }
  } finally {
    conn.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
