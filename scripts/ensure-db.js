const fs = require("fs")
let mysql
try {
  mysql = require("mysql2/promise")
} catch (err) {
  console.error("FATAL: Failed to load mysql2/promise:", err.message)
  console.error("Current directory:", process.cwd())
  try {
    if (fs.existsSync("node_modules")) {
      console.error("node_modules exists. Checking for mysql2...")
      const hasMysql2 = fs.existsSync("node_modules/mysql2")
      console.error("node_modules/mysql2 exists:", hasMysql2)
    } else {
      console.error("node_modules NOT found in current directory")
    }
  } catch (e) {
    console.error("Error checking file system:", e.message)
  }
  process.exit(1)
}

try {
  require("dotenv/config")
} catch (e) {
  // dotenv is optional in production if env vars are provided by the platform
}

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

const wait = (ms) => new Promise(res => setTimeout(res, ms))

async function connectWithRetry(config, retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mysql.createConnection(config)
      return conn
    } catch (err) {
      console.error(`DB Connection attempt ${i + 1}/${retries} failed: ${err.message}`)
      if (i === retries - 1) throw err
      console.log("Retrying in 3 seconds...")
      await wait(3000)
    }
  }
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log("No DATABASE_URL found, skipping DB creation check.")
    return
  }

  // Check if it's the dummy build URL
  if (url.includes("dummy:dummy")) {
    console.log("Dummy DATABASE_URL detected, skipping DB creation check.")
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
    // Connect without database selected
    conn = await connectWithRetry({
      host,
      port,
      user,
      password,
    })

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``)
    console.log(`Database '${database}' ensured.`)
  } catch (e) {
    console.error("FATAL: Failed to ensure database after retries:", e.message)
    // We exit with 0 to allow the app to TRY starting, 
    // but likely it will fail if the DB is truly unreachable.
    // Logging is key here.
  } finally {
    if (conn) await conn.end()
  }
}

main()
