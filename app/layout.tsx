import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/components/web3-provider"
import { Toaster } from "@/components/ui/toaster"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { AdminDashboardChoice } from "@/components/admin-dashboard-choice"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CarbonFi Smart Contract Tester",
  description: "Test and interact with CarbonFi smart contracts",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CarbonFi" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Web3Provider>
            <div className="min-h-screen bg-background pb-16 md:pb-0">{children}</div>
            <MobileBottomNav />
            <AdminDashboardChoice />
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
