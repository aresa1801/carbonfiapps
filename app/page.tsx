"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWeb3 } from "@/components/web3-provider"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Leaf, Coins, Shield, TrendingUp } from "lucide-react"
import Image from "next/image"

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
      const ADMIN_WALLET_ADDRESS = "0x732eBd7B8c50A8e31EAb04aF774F4160C8c22Dd6"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 relative">
                <Image src="/images/carbonfi-logo.png" alt="CarbonFi Logo" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">CarbonFi</h1>
                <p className="text-sm text-gray-400">Sustainable Finance Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isConnected && account && (
                <div className="text-sm text-gray-400">
                  Connected: {account.substring(0, 6)}...{account.substring(38)}
                  {isAdminWallet && (
                    <Badge variant="secondary" className="ml-2 bg-emerald-600 text-white">
                      Admin
                    </Badge>
                  )}
                </div>
              )}
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Revolutionizing{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
              Carbon Finance
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join the future of sustainable finance with blockchain-powered carbon credit trading, NFT minting, and DeFi
            staking rewards.
          </p>

          {!isConnected && (
            <div className="mb-12">
              <ConnectWalletButton />
              <p className="text-sm text-gray-400 mt-2">Connect your wallet to get started</p>
            </div>
          )}

          {isConnected && (
            <div className="mb-12 p-6 bg-emerald-900/20 rounded-lg border border-emerald-800">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-200 font-semibold">Wallet Connected Successfully</span>
              </div>
              <p className="text-emerald-300 text-sm">
                {(() => {
                  const ADMIN_WALLET_ADDRESS = "0x732eBd7B8c50A8e31EAb04aF774F4160C8c22Dd6"
                  const isAdminWallet = account?.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
                  const finalIsAdmin = isAdmin || isAdminWallet

                  return finalIsAdmin
                    ? "Admin wallet detected! Redirecting to Admin Dashboard..."
                    : "Redirecting to User Dashboard..."
                })()}
              </p>
              <div className="mt-2 text-xs text-emerald-400">
                Address: {account?.substring(0, 10)}...{account?.substring(account.length - 8)}
              </div>
              <div className="mt-3 flex justify-center">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card className="border-0 shadow-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-emerald-900/50 rounded-lg flex items-center justify-center mb-4">
                <Leaf className="h-6 w-6 text-emerald-400" />
              </div>
              <CardTitle className="text-lg text-white">Carbon Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-300">
                Trade verified carbon credits with blockchain transparency and real-time tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-lg text-white">NFT Minting</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-300">
                Mint unique NFTs representing your carbon offset contributions and achievements.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                <Coins className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-lg text-white">DeFi Staking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-300">
                Stake CAFI tokens and earn rewards while supporting sustainable finance initiatives.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-900/50 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-orange-400" />
              </div>
              <CardTitle className="text-lg text-white">Yield Farming</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-300">
                Participate in yield farming programs and maximize your returns on green investments.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
