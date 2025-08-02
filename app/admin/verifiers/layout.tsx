import type React from "react"
import { AdminGuard } from "@/components/admin-guard"
import { MobileOptimizedLayout } from "@/components/mobile-optimized-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { Web3Provider } from "@/components/web3-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { MetaMaskDetector } from "@/components/metamask-detector"

export default function AdminVerifiersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Web3Provider>
        <AdminGuard>
          <MobileOptimizedLayout sidebar={<DashboardSidebar />} header={<DashboardHeader />}>
            {children}
          </MobileOptimizedLayout>
          <Toaster />
          <MetaMaskDetector />
        </AdminGuard>
      </Web3Provider>
    </ThemeProvider>
  )
}
