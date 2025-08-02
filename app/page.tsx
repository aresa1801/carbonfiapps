"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWeb3 } from "@/components/web3-provider"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MetamaskDetector } from "@/components/metamask-detector"
import { DashboardHeader } from "@/components/dashboard-header" // Ensure this import is correct

// Admin wallet address
const ADMIN_WALLET_ADDRESS = "0x732eBd7B8c50A8e31EAb04aF774F4160C8c22Dd6"

export default function HomePage() {
  const { isConnected, account, isClient, isAdmin } = useWeb3()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle redirect logic after wallet connection
  useEffect(() => {
    if (mounted && isClient && isConnected && account && !isRedirecting) {
      console.log("🚀 Redirect Logic Triggered:")
      console.log("- Account:", account)
      console.log("- Is Admin from Context:", isAdmin)

      // Double check admin status locally
      const isAdminWallet = account.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()

      console.log("- Local Admin Check:", isAdminWallet)
      console.log("- Final Admin Status:", isAdmin || isAdminWallet)

      setIsRedirecting(true)

      // Use both context isAdmin and local check for safety
      const finalIsAdmin = isAdmin || isAdminWallet

      if (finalIsAdmin) {
        // Admin wallet - redirect to admin dashboard
        console.log("✅ Redirecting to Admin Dashboard...")
        setTimeout(() => {
          router.push("/admin")
        }, 2000)
      } else {
        // Regular user wallet - redirect to user dashboard
        console.log("✅ Redirecting to User Dashboard...")
        setTimeout(() => {
          router.push("/user")
        }, 2000)
      }
    }
  }, [isConnected, account, isAdmin, mounted, isClient, router, isRedirecting])

  if (!mounted || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Check if connected wallet is admin
  const isAdminWallet = account?.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <DashboardHeader /> {/* Use the DashboardHeader component */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="space-y-6">
          <Image
            src="/images/carbonfi-logo.png"
            alt="CarbonFi Logo"
            width={72} // 1.5x of 48 (h-12)
            height={72} // 1.5x of 48 (w-12)
            className="mx-auto rounded-full shadow-lg"
          />
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            CarbonFi: Decentralized Carbon Credit Marketplace
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Trade, stake, and retire carbon credits on the blockchain. Empowering a sustainable future with transparency
            and efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ConnectWalletButton />
            <Button asChild variant="secondary" className="px-8 py-3 text-lg">
              <Link href="/user">Launch App</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="p-6 text-center text-gray-400 border-t border-gray-800">
        <p>&copy; {new Date().getFullYear()} CarbonFi. All rights reserved.</p>
      </footer>
      <MetamaskDetector />
    </div>
  )
}
