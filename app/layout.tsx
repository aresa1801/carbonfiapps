import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Web3Provider } from "@/components/web3-provider"
import MetaMaskDetector from "@/components/metamask-detector" // Updated import

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CarbonFi DApps",
  description: "Decentralized Applications for CarbonFi Ecosystem",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Web3Provider>
            {children}
            <MetaMaskDetector /> {/* Render MetaMaskDetector here */}
          </Web3Provider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
