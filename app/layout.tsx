import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import UnderConstruction from "@/components/UnderConstruction"

export const metadata: Metadata = {
  title: "Oksana Levchenya",
  description: "Oksana Levchenys Personal Site",
  generator: "ksherif",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const enableVercelAnalytics = process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "true"
  
  // Check if site should be visible. Default to true if not set.
  // The user requested: "env visable=false" -> show under construction.
  // We support SITE_VISIBLE=false or VISIBLE=false.
  const isVisible = process.env.SITE_VISIBLE !== "false" && process.env.VISIBLE !== "false"

  if (!isVisible) {
    return (
      <html lang="en">
        <body className="antialiased">
          <UnderConstruction />
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {children}
        <footer className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 text-center text-[11px] text-neutral-700">
            Copyright (c) 2020-2026 Oksana Levchenya. All Rights Reserved.
          </div>
        </footer>
        {enableVercelAnalytics && <Analytics />}
      </body>
    </html>
  )
}
