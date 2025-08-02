"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { MetamaskDetector } from "@/components/metamask-detector"
import { MobileOptimizedLayout } from "@/components/mobile-optimized-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AdminDashboardChoice } from "@/components/admin-dashboard-choice"
import { useWeb3 } from "@/components/web3-provider"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function HomePage() {
  const { isConnected, isAdmin, isClient, isMobile, inAppBrowser, walletType, chainId } = useWeb3()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (isClient && isConnected) {
      const dashboardChoice = sessionStorage.getItem("dashboard-choice")
      if (isAdmin && dashboardChoice === "admin") {
        router.push("/admin")
      } else {
        router.push("/user")
      }
    }
  }, [isClient, isConnected, isAdmin, router])

  useEffect(() => {
    if (isClient && inAppBrowser && walletType === "Unknown") {
      toast({
        title: "Unsupported Browser",
        description: "Please open this dApp in a Web3 enabled browser like MetaMask or Trust Wallet.",
        variant: "destructive",
        duration: 8000,
      })
    }
  }, [isClient, inAppBrowser, walletType, toast])

  return (
    <MobileOptimizedLayout
      header={<DashboardHeader />}
      sidebar={<DashboardSidebar />}
      showSidebar={isConnected}
      showMobileNav={isConnected}
    >
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl text-center">
          <Image src="/images/carbonfi-logo.png" alt="CarbonFi Logo" width={72} height={72} className="mx-auto mb-6" />
          <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">Welcome to CarbonFi DApps</h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Your gateway to decentralized carbon credit management and sustainable finance.
          </p>

          {!isClient && (
            <Card className="mx-auto max-w-md">
              <CardHeader>
                <CardTitle>Loading DApp</CardTitle>
                <CardDescription>Please wait while the application loads...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-50" />
                </div>
              </CardContent>
            </Card>
          )}

          {isClient && !isConnected && (
            <div className="space-y-4">
              <Card className="mx-auto max-w-md">
                <CardHeader>
                  <CardTitle>Connect Your Wallet</CardTitle>
                  <CardDescription>Connect your MetaMask wallet to access the CarbonFi DApps.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ConnectWalletButton />
                  <MetamaskDetector />
                </CardContent>
              </Card>
              <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  New to Web3? Learn more about{" "}
                  <Link
                    href="https://metamask.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    MetaMask
                  </Link>{" "}
                  or{" "}
                  <Link
                    href="https://trustwallet.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Trust Wallet
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          {isClient && isConnected && isAdmin && <AdminDashboardChoice onChoice={() => router.push("/admin")} />}
        </div>
      </main>
    </MobileOptimizedLayout>
  )
}
