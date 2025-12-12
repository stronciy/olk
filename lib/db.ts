import mysql from "mysql2/promise"
import fs from "fs"

function parseDatabaseUrl(url?: string) {
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

const parsed = parseDatabaseUrl(process.env.DATABASE_URL)

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
const hostEnv = process.env.HOST || "127.0.0.1"
const host = (parsed?.host || hostEnv) === "localhost" ? "127.0.0.1" : (parsed?.host || hostEnv)
const port = parsed?.port || Number(process.env.MARIADB_PORT || 3306)

export const pool = mysql.createPool(
  socketPath
    ? {
        socketPath,
        user: parsed?.user || process.env.MARIADB_USER,
        password: parsed?.password || process.env.MARIADB_PASSWORD,
        database: parsed?.database || process.env.MARIADB_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      }
    : {
        host,
        port,
        user: parsed?.user || process.env.MARIADB_USER,
        password: parsed?.password || process.env.MARIADB_PASSWORD,
        database: parsed?.database || process.env.MARIADB_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      }
)
