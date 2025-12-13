import mysql from "mysql2/promise"
import fs from "fs"
import path from "path"

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
const host = parsed?.host || process.env.HOST || "127.0.0.1"
const port = parsed?.port || Number(process.env.MARIADB_PORT || 3306)
const user = parsed?.user || process.env.MARIADB_USER
const password = parsed?.password || process.env.MARIADB_PASSWORD
const database = parsed?.database || process.env.MARIADB_DATABASE

async function main() {
  const conn = await mysql.createConnection({ host, port, user, password, database })
  try {
    await conn.query("CREATE TABLE IF NOT EXISTS `information_about` (id INT PRIMARY KEY, text LONGTEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)")
    await conn.query("CREATE TABLE IF NOT EXISTS `information_about_revisions` (id INT AUTO_INCREMENT PRIMARY KEY, text MEDIUMTEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)")

    const [tables] = await conn.query("SHOW TABLES")
    const names = (tables || []).map((row) => Object.values(row)[0]?.toString().toLowerCase())
    const legacy = names.includes("informationabout") ? "informationabout" : (names.includes("information_about") ? "information_about" : null)
    const legacyRev = names.includes("informationaboutrevisions") ? "informationaboutrevisions" : (names.includes("information_about_revisions") ? "information_about_revisions" : null)

    if (legacy && legacy !== "information_about") {
      await conn.query(`RENAME TABLE \`${legacy}\` TO \`information_about\``)
    }
    if (legacyRev && legacyRev !== "information_about_revisions") {
      await conn.query(`RENAME TABLE \`${legacyRev}\` TO \`information_about_revisions\``)
    }

    await conn.query("ALTER TABLE `information_about` MODIFY id INT PRIMARY KEY")
    await conn.query("ALTER TABLE `information_about` MODIFY text LONGTEXT")
    await conn.query("ALTER TABLE `information_about_revisions` MODIFY id INT AUTO_INCREMENT PRIMARY KEY")

    const [rows] = await conn.query("SELECT id, text, updatedAt FROM `information_about` ORDER BY updatedAt DESC")
    if ((rows || []).length > 1) {
      const latest = rows[0]
      await conn.query("TRUNCATE TABLE `information_about`")
      await conn.query("INSERT INTO `information_about` (id, text, updatedAt) VALUES (1, ?, NOW())", [latest.text || ""])
    } else if ((rows || []).length === 0) {
      await conn.query("INSERT INTO `information_about` (id, text, updatedAt) VALUES (1, '', NOW())")
    } else {
      const current = rows[0]
      if (current.id !== 1) {
        await conn.query("UPDATE `information_about` SET id = 1 WHERE id = ?", [current.id])
      }
    }

    console.log(JSON.stringify({ ok: true, message: "Migrated information_about", db: database }))
  } finally {
    await conn.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
