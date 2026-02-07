require("dotenv/config")
const mysql = require("mysql2/promise")
const fs = require("fs")

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

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log("No DATABASE_URL found, skipping DB creation check.")
    return
  }

  const parsed = parseDatabaseUrl(url)
  if (!parsed || !parsed.database) {
    console.log("Could not parse database name from DATABASE_URL, skipping.")
    return
  }

  const { host, port, user, password, database } = parsed
  console.log(`Checking database '${database}' on ${host}:${port}...`)

  let conn
  try {
    // Connect without database
    conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
    })

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``)
    console.log(`Database '${database}' ensured.`)
  } catch (e) {
    console.error("Failed to ensure database:", e.message)
    // We don't exit(1) because maybe the app can still work or it's a connection error that the app will handle/log better
  } finally {
    if (conn) await conn.end()
  }
}

main()
