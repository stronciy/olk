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

const TABLES = [
  "Users",
  "UserPasswordHistory",
  "PasswordChangeAttempts",
  "Address",
  "InformationAbout",
  "InformationAboutRevisions",
  "InformationNews",
  "InformationNewsRevisions",
  "InformationNewsTrash",
  "InformationGroup",
  "InformationSolo",
  "InformationAwards",
  "InformationFairs",
  "InformationWebsites",
  "InformationContacts",
  "WorkSection",
  "WorkItem",
  "WorkMedia",
  "WorkTag",
  "WorkItemTag",
]

async function main() {
  const conn = await pool.getConnection()
  try {
    const dump = {}
    for (const name of TABLES) {
      try {
        const [rows] = await conn.query(`SELECT * FROM \`${name}\``)
        dump[name] = Array.isArray(rows) ? rows : []
      } catch {
        dump[name] = []
      }
    }
    const outDir = path.join(process.cwd(), "data")
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    const outPath = path.join(outDir, "seed_dump.json")
    fs.writeFileSync(outPath, JSON.stringify(dump, null, 2), "utf8")
    console.log(JSON.stringify({ ok: true, file: outPath, tables: Object.keys(dump) }))
  } finally {
    conn.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
