"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { MetaMaskDetector } from "@/components/metamask-detector" // This import is not used here, but kept for consistency if needed elsewhere.
import { useWeb3 } from "@/components/web3-provider"
import { BalanceCard } from "@/components/balance-card"
import { StableBalanceCard } from "@/components/stable-balance-card"
import { FaucetStatCard } from "@/components/faucet-stat-card"
import { ClaimStatusCard } from "@/components/claim-status-card"
import { ContractStatus } from "@/components/contract-status"
import { ContractMigrationNotice } from "@/components/contract-migration-notice"
import { ContractAddressesDisplay } from "@/components/contract-addresses-display"
import { TransactionAlert } from "@/components/transaction-alert"
import { VerifierApprovalStatus } from "@/components/verifier-approval-status"
import { AdminDashboardChoice } from "@/components/admin-dashboard-choice"
import { MobileOptimizedLayout } from "@/components/mobile-optimized-layout"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardHeader } from "@/components/dashboard-header"
import { ThemeToggle } from "@/components/theme-toggle"
import { AdminGuard } from "@/components/admin-guard"
import { useMobile } from "@/hooks/use-mobile"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export default function HomePage() {
  const {
    address,
    isConnected,
    chainId,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalances,
    isRefreshing,
  } = useWeb3()
  const { toast } = useToast()
  const isMobileView = useMobile()
  const [showMetaMaskDetector, setShowMetaMaskDetector] = useState(false)

  useEffect(() => {
    if (!isLoading && !isConnected && !error) {
      setShowMetaMaskDetector(true)
    } else {
      setShowMetaMaskDetector(false)
    }
  }, [isLoading, isConnected, error])

  useEffect(() => {
    if (error) {
      toast({
        title: "Wallet Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const getNativeTokenSymbol = (chainId: number | null) => {
    switch (chainId) {
      case 97: // BSC Testnet
        return "BNB"
      case 296: // Hedera Testnet
        return "HBAR"
      default:
        return "ETH"
    }
  }

  return (
    <MobileOptimizedLayout>
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Image
                  src="/images/carbonfi-logo.png"
                  alt="CarbonFi Logo"
                  width={72} // Updated size
                  height={72} // Updated size
                  className="rounded-full"
                />
                <h1 className="text-3xl font-bold">CarbonFi Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <ConnectWalletButton />
              </div>
            </div>

            {showMetaMaskDetector && <MetaMaskDetector />}

            {isConnected && (
              <>
                <TransactionAlert />
                <ContractMigrationNotice />
                <ContractAddressesDisplay />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <BalanceCard />
                  <StableBalanceCard />
                  <FaucetStatCard />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <ClaimStatusCard />
                  <ContractStatus />
                </div>

                <VerifierApprovalStatus />

                <AdminGuard>
                  <AdminDashboardChoice />
                </AdminGuard>
              </>
            )}

            {!isConnected && !isLoading && !showMetaMaskDetector && (
              <Card className="w-full max-w-md mx-auto text-center py-8">
                <CardHeader>
                  <CardTitle>Connect Your Wallet</CardTitle>
                  <CardDescription>
                    Please connect your wallet to access the CarbonFi dashboard and its features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConnectWalletButton />
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        {isMobileView && <MobileBottomNav />}
      </div>
    </MobileOptimizedLayout>
  )
}
