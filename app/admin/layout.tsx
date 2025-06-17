"use client"

import type React from "react"
import { useWeb3 } from "@/components/web3-provider"
import { AdminGuard } from "@/components/admin-guard"
import { AdminDashboardNav } from "@/components/admin-dashboard-nav"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-100">Loading Admin Dashboard...</h2>
            <p className="text-slate-400">Please wait while we initialize the admin panel...</p>
          </div>
        </div>
      </div>
    )
  }

  if (mounted && isClient && (!isConnected || (isConnected && !isAdmin))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-100">
              {!isConnected ? "Checking Wallet Connection..." : "Verifying Admin Access..."}
            </h2>
            <p className="text-slate-400">
              {!isConnected ? "Please make sure your wallet is connected..." : "Checking admin permissions..."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Enhanced Header with Better Colors */}
        <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 relative">
                <Image src="/images/carbonfi-logo.png" alt="Carbon Finance Logo" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Carbon Finance</h1>
                <p className="text-xs text-emerald-400 -mt-1">Admin Dashboard</p>
              </div>
            </div>

            {/* Enhanced Wallet Info Section */}
            <div className="flex items-center space-x-6">
              {/* Balance Display with Better Colors */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/50">
                  <span className="text-slate-300">ETH:</span>
                  <span className="text-slate-100 font-medium ml-1">{ethBalance}</span>
                </div>
                <div className="bg-emerald-900/30 px-3 py-2 rounded-lg border border-emerald-700/50">
                  <span className="text-emerald-300">CAFI:</span>
                  <span className="text-emerald-100 font-medium ml-1">{balance}</span>
                </div>
                {networkName && (
                  <div className="px-3 py-2 bg-blue-900/30 border border-blue-700/50 rounded-lg text-xs text-blue-200">
                    {networkName}
                  </div>
                )}
              </div>

              {/* Manual Refresh Button */}
              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-600 hover:text-slate-100"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>

              {/* Admin Badge */}
              <div className="px-3 py-1 bg-emerald-900/50 border border-emerald-700/50 rounded-full text-xs text-emerald-300 font-medium">
                Admin Access
              </div>

              {/* Account Info */}
              {account && (
                <div className="text-sm text-slate-200 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-600/50">
                  <span className="text-slate-400">Admin:</span>
                  <span className="ml-1 font-mono">
                    {account.substring(0, 6)}...{account.substring(38)}
                  </span>
                </div>
              )}

              {/* Advanced Connect Wallet Button */}
              <ConnectWalletButton
                showAddress={false}
                showBalance={true}
                showNetwork={true}
                variant="outline"
                className="border-emerald-600/50 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/50 hover:text-emerald-100 hover:border-emerald-500"
              />
            </div>
          </div>

          {/* Mobile Balance Display with Better Colors */}
          <div className="md:hidden mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-sm space-y-2">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-700/50 px-2 py-1 rounded border border-slate-600/50">
                  <span className="text-slate-300">ETH:</span>
                  <span className="text-slate-100 ml-1">{ethBalance}</span>
                </div>
                <div className="bg-emerald-900/30 px-2 py-1 rounded border border-emerald-700/50">
                  <span className="text-emerald-300">CAFI:</span>
                  <span className="text-emerald-100 ml-1">{balance}</span>
                </div>
              </div>
              {networkName && (
                <div className="px-2 py-1 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-200">
                  {networkName}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-120px)]">
          {/* Sidebar Navigation with Better Colors */}
          <aside className="w-64 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50">
            <AdminDashboardNav />
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/50">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </AdminGuard>
  )
}
