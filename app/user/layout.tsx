import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Toaster } from "@/components/ui/toaster"
import { TransactionStatus } from "@/components/transaction-status"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/components/web3-provider"
import { cookies } from "next/headers"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Web3Provider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <div className="flex min-h-screen w-full flex-col bg-muted/40 md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <DashboardSidebar />
            <div className="flex flex-col">
              <DashboardHeader />
              <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">{children}</main>
            </div>
          </div>
          <Toaster />
          <TransactionStatus />
        </SidebarProvider>
      </Web3Provider>
    </ThemeProvider>
  )
}
