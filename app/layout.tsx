import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Oksana Levchenya - Work",
  description: "Portfolio of stage design and installation work",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const enableVercelAnalytics = process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "true"
  return (
    <html lang="en">
      <body className={`antialiased`}>
        {children}
        <footer className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 text-center text-[11px] text-neutral-700">
            Copyright (c) 2020-2025 Oksana Levchenya. All Rights Reserved.
          </div>
        </footer>
        {enableVercelAnalytics && <Analytics />}
      </body>
    </html>
  )
}
