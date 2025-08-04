"use client"

import type React from "react"
import { useWeb3 } from "@/components/web3-provider"
import { AdminGuard } from "@/components/admin-guard"
import { AdminDashboardNav } from "@/components/admin-dashboard-nav"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { RefreshCw, Home } from "lucide-react" // Import Home icon
import { Button } from "@/components/ui/button"
import Link from "next/link" // Import Link

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
    <AdminGuard>
      <div className="min-h-screen bg-gray-950">
        {/* Header with User Dashboard Colors */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 relative">
                <Image src="/images/carbonfi-logo.png" alt="Carbon Finance Logo" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Carbon Finance</h1>
                <p className="text-xs text-emerald-400 -mt-1">Admin Dashboard</p>
              </div>
            </div>

            {/* Wallet Info Section with User Dashboard Colors */}
            <div className="flex items-center space-x-6">
              {/* Balance Display */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="text-gray-300">
                  <span className="text-gray-400">ETH:</span> {ethBalance}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">CAFI:</span> {balance}
                </div>
                {networkName && (
                  <div className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">{networkName}</div>
                )}
              </div>

              {/* Manual Refresh Button */}
              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-gray-600 hover:text-gray-100"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>

              {/* Admin Badge */}
              <div className="px-3 py-1 bg-emerald-900/50 border border-emerald-700/50 rounded-full text-xs text-emerald-300 font-medium">
                Admin Access
              </div>

              {/* Account Info */}
              {account && (
                <div className="text-sm text-gray-300">
                  <span className="text-gray-400">Admin:</span>
                  <span className="ml-1 font-mono">
                    {account.substring(0, 6)}...{account.substring(38)}
                  </span>
                </div>
              )}

              {/* Connect Wallet Button */}
              <ConnectWalletButton
                showAddress={false}
                showBalance={true}
                showNetwork={true}
                variant="outline"
                className="border-emerald-800 bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800 hover:text-emerald-100"
              />
            </div>
          </div>

          {/* Mobile Balance Display */}
          <div className="md:hidden mt-3 pt-3 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="text-gray-300">
                  <span className="text-gray-400">ETH:</span> {ethBalance}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">CAFI:</span> {balance}
                </div>
              </div>
              {networkName && <div className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">{networkName}</div>}
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-120px)]">
          {/* Sidebar Navigation with User Dashboard Colors */}
          <aside className="w-64 bg-gray-900 border-r border-gray-800">
            <AdminDashboardNav />
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-950">
            <div className="p-6">{children}</div>
          </main>
        </div>

        {/* Floating Home Button for Admin Dashboard */}
        <Link href="/admin" passHref>
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-4 right-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center"
            aria-label="Go to Admin Dashboard"
          >
            <Home className="h-7 w-7" />
          </Button>
        </Link>
      </div>
    </AdminGuard>
  )
}
