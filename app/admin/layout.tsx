"use client"

import type React from "react"
import { useWeb3 } from "@/components/web3-provider"
import { AdminGuard } from "@/components/admin-guard"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Toaster } from "@/components/ui/toaster"
import { TransactionStatus } from "@/components/transaction-status"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/components/web3-provider"
import { cookies } from "next/headers"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  const { isConnected, isAdmin, account, isClient, balance, ethBalance, networkName, refreshBalances, isRefreshing } =
    useWeb3()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (isConnected && mounted) {
      const interval = setInterval(() => {
        refreshBalances()
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [isConnected, mounted, refreshBalances])

  // Auto-redirect if not connected or not admin
  useEffect(() => {
    if (mounted && isClient) {
      if (!isConnected) {
        const timer = setTimeout(() => {
          if (!isConnected) {
            console.log("User not connected, redirecting to home...")
            router.push("/")
          }
        }, 3000)
        return () => clearTimeout(timer)
      } else if (isConnected && !isAdmin) {
        const timer = setTimeout(() => {
          if (!isAdmin) {
            console.log("User not admin, redirecting to user dashboard...")
            router.push("/user")
          }
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [isConnected, isAdmin, mounted, isClient, router])

  const handleManualRefresh = async () => {
    await refreshBalances()
  }

  // Show loading state while checking connection and admin status
  if (!mounted || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Loading Admin Dashboard...</h2>
            <p className="text-gray-400">Please wait while we initialize the admin panel...</p>
          </div>
        </div>
      </div>
    )
  }

  if (mounted && isClient && (!isConnected || (isConnected && !isAdmin))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              {!isConnected ? "Checking Wallet Connection..." : "Verifying Admin Access..."}
            </h2>
            <p className="text-gray-400">
              {!isConnected ? "Please make sure your wallet is connected..." : "Checking admin permissions..."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Web3Provider>
        <AdminGuard>
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
        </AdminGuard>
      </Web3Provider>
    </ThemeProvider>
  )
}
