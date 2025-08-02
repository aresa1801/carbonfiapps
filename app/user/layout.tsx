"use client"

import type React from "react"
import { useWeb3 } from "@/components/web3-provider"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { MobileOptimizedLayout } from "@/components/mobile-optimized-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { UserDashboardNav } from "@/components/user-dashboard-nav"
import { Toaster } from "@/components/ui/toaster"
import { Web3Provider } from "@/components/web3-provider"
import { ThemeProvider } from "@/components/theme-provider"
import MetaMaskDetector from "@/components/metamask-detector" // Corrected import

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isConnected, account, isClient, balance, ethBalance, networkName } = useWeb3()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-redirect to home if not connected (with delay to prevent flash)
  useEffect(() => {
    if (mounted && isClient && !isConnected) {
      const timer = setTimeout(() => {
        if (!isConnected) {
          console.log("User not connected, redirecting to home...")
          router.push("/")
        }
      }, 3000) // Give more time for wallet to connect

      return () => clearTimeout(timer)
    }
  }, [isConnected, mounted, isClient, router])

  // Show loading state while checking connection
  if (!mounted || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Loading Dashboard...</h2>
            <p className="text-gray-400">Please wait while we initialize your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (mounted && isClient && !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Checking Wallet Connection...</h2>
            <p className="text-gray-400">Verifying your wallet connection...</p>
            <p className="text-sm text-gray-500">
              If this takes too long, you'll be redirected to connect your wallet.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Web3Provider>
        <MobileOptimizedLayout sidebar={<UserDashboardNav />} header={<DashboardHeader />}>
          <div className="min-h-screen bg-gray-950">
            {/* Header with Wallet Info */}
            <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 relative">
                    <Image src="/images/carbonfi-logo.png" alt="Carbon Finance Logo" fill className="object-contain" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-white">Carbon Finance</h1>
                    <p className="text-xs text-gray-400 -mt-1">User Dashboard</p>
                  </div>
                </div>

                {/* Wallet Info Section */}
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

                  {/* Account Info */}
                  {account && (
                    <div className="text-sm text-gray-300">
                      <span className="text-gray-400">Connected:</span> {account.substring(0, 6)}...
                      {account.substring(38)}
                    </div>
                  )}

                  {/* Connect Wallet Button (with advanced features and logout) */}
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
                  {networkName && (
                    <div className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">{networkName}</div>
                  )}
                </div>
              </div>
            </header>

            <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-120px)]">
              {/* Main Content - Full Width */}
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          </div>
        </MobileOptimizedLayout>
        <Toaster />
        <MetaMaskDetector />
      </Web3Provider>
    </ThemeProvider>
  )
}
