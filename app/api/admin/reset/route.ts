import { NextResponse } from "next/server"
import { exec } from "child_process"
import util from "util"

const execPromise = util.promisify(exec)

export async function GET() {
  try {
    console.log("Triggering database reset (seed script)...")
    const { stdout, stderr } = await execPromise("node scripts/seed.js")
    console.log("Seed script stdout:", stdout)
    if (stderr) console.error("Seed script stderr:", stderr)
    
    return NextResponse.json({
      success: true,
      message: "Database reset/seed completed successfully. Admin password reset to test1234.",
      stdout,
      stderr
    })
  } catch (error: any) {
    console.error("Database reset error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stderr: error.stderr
    }, { status: 500 })
  }
}
