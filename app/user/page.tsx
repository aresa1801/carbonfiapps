"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { TransactionAlert } from "@/components/transaction-alert"
import { StableBalanceCard } from "@/components/stable-balance-card"
import { FaucetStatCard } from "@/components/faucet-stat-card"
import { ClaimStatusCard } from "@/components/claim-status-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Droplets, TrendingUp, Coins, ShoppingCart, Leaf, RefreshCw, Clock } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { useToast } from "@/hooks/use-toast"
import { useEventRefresh } from "@/hooks/use-event-refresh"
import { contractService } from "@/lib/contract-utils"
import Link from "next/link"

export default function UserDashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const [isClaimingTokens, setIsClaimingTokens] = useState(false)
  const [txStatus, setTxStatus] = useState<"success" | "error" | "none">("none")
  const [txMessage, setTxMessage] = useState("")

  const { toast } = useToast()

  // Get Web3 context
  const {
    account = "",
    isConnected = false,
    balance = "0",
    ethBalance = "0",
    refreshBalances = async () => {},
    tokenSymbol = "CAFI",
    faucetContractExists = false,
    isLoadingBalance = false,
    networkName = "",
    faucetStats = {
      dailyLimit: "0",
      remainingQuota: "0",
      todayTotal: "0",
      hasClaimedToday: false,
    },
    isLoadingFaucetData = false,
    fetchFaucetData = async () => {},
    currentNetworkContracts, // Destructure currentNetworkContracts
  } = useWeb3()

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Event-based refresh (no time-based auto refresh)
  const handleRefresh = useCallback(async () => {
    if (!isConnected || !account) return

    try {
      await Promise.all([refreshBalances(), fetchFaucetData(account)])
    } catch (error) {
      console.error("Refresh error:", error)
    }
  }, [isConnected, account, refreshBalances, fetchFaucetData])

  const { refreshCount, isRefreshing, lastRefresh, manualRefresh, triggerRefresh } = useEventRefresh({
    onRefresh: handleRefresh,
    enabled: isClient && isConnected && !!account,
  })

  const handleManualRefresh = useCallback(async () => {
    try {
      await manualRefresh()
      toast({
        title: "Data refreshed",
        description: "Wallet data has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh wallet data",
        variant: "destructive",
      })
    }
  }, [manualRefresh, toast])

  const handleClaimTokens = useCallback(async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to claim tokens",
        variant: "destructive",
      })
      return
    }

    if (faucetStats.hasClaimedToday) {
      toast({
        title: "Already claimed today",
        description: "You have already claimed tokens today. Please try again tomorrow.",
        variant: "destructive",
      })
      return
    }

    // Determine the currency name for the native token (ETH or HBAR)
    const nativeCurrencyName = networkName === "Hedera Testnet" ? "HBAR" : "ETH"

    try {
      setIsClaimingTokens(true)
      setTxStatus("none")

      // Corrected: Pass the actual faucet contract address and then true for withSigner
      const faucetContract = await contractService.getFaucetContract(currentNetworkContracts.FAUCET, true)
      const tx = await faucetContract.claimTokens()

      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setTxStatus("success")
        setTxMessage("Successfully claimed CAFI tokens from faucet!")

        // Trigger refresh after successful transaction
        await triggerRefresh()

        toast({
          title: "CAFI tokens claimed successfully",
          description: `You have successfully claimed ${tokenSymbol} tokens from the faucet`,
        })
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Error claiming tokens:", error)
      setTxStatus("error")

      let errorMessage = "Failed to claim CAFI tokens"
      if (error.message?.includes("Already claimed")) {
        errorMessage = "You have already claimed CAFI tokens today"
      } else if (error.message?.includes("Insufficient ETH")) {
        // Dynamically update the error message for gas fees
        errorMessage = `Insufficient ${nativeCurrencyName} balance for gas fees`
      } else if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user"
      }

      setTxMessage(errorMessage)
      toast({
        title: "Failed to claim CAFI tokens",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsClaimingTokens(false)
    }
  }, [
    isConnected,
    faucetStats.hasClaimedToday,
    tokenSymbol,
    triggerRefresh,
    toast,
    currentNetworkContracts.FAUCET,
    networkName,
  ])

  // Show loading state while client is initializing
  if (!isClient) {
    return null
  }

  const formatLastRefresh = (date: Date | null) => {
    if (!date) return "Never"
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return date.toLocaleTimeString()
  }

  const remainingPercentage =
    Number(faucetStats.dailyLimit) > 0
      ? ((Number(faucetStats.remainingQuota) / Number(faucetStats.dailyLimit)) * 100).toFixed(0)
      : "0"

  // Determine the currency name for the native token (ETH or HBAR)
  const nativeCurrencyName = networkName === "Hedera Testnet" ? "HBAR" : "ETH"

  return (
    <div className="flex h-screen bg-gray-950">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {/* Welcome Section with Manual Refresh Button */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-50 mb-2">Welcome to CAFI Dashboard</h1>
                <p className="text-gray-400">Manage your carbon credits and earn rewards with CAFI tokens</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right space-y-1">
                  <p className="text-sm text-gray-400">Network</p>
                  <p className="text-emerald-400 font-medium">{networkName || "Sepolia Testnet"}</p>
                  <div className="flex items-center justify-end space-x-2">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatLastRefresh(lastRefresh)}
                    </Badge>
                  </div>
                  {refreshCount > 0 && <p className="text-xs text-gray-500">Refreshed {refreshCount} times</p>}
                </div>
                <Button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 bg-transparent text-gray-50 border-gray-700 hover:bg-gray-700"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                </Button>
              </div>
            </div>
          </div>

          {txStatus !== "none" && (
            <div className="mb-6">
              <TransactionAlert status={txStatus} message={txMessage} />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Link href="/user/mint-nft">
              <Card className="bg-gray-900 border-gray-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Coins className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Mint NFT</p>
                    <p className="text-gray-400 text-sm">Create carbon credits</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/user/staking">
              <Card className="bg-gray-900 border-gray-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Staking</p>
                    <p className="text-gray-400 text-sm">Earn rewards</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/user/marketplace">
              <Card className="bg-gray-900 border-gray-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Marketplace</p>
                    <p className="text-gray-400 text-sm">Trade NFTs</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/user/retire">
              <Card className="bg-gray-900 border-gray-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Leaf className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Retire</p>
                    <p className="text-gray-400 text-sm">Offset carbon</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Droplets className="h-6 w-6 text-emerald-500" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-50">CAFI Token Faucet</h2>
                    <p className="text-sm text-gray-400">
                      Claim free CAFI tokens for testing purposes on CarbonFi Testnet
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <StableBalanceCard
                  type="eth"
                  currencyName={nativeCurrencyName} // Pass the dynamic currency name
                  balance={ethBalance}
                  isLoading={isLoadingBalance}
                  symbol={nativeCurrencyName} // Also update symbol for consistency
                  subtitle="✓ Available for gas"
                  isRefreshing={isRefreshing}
                />

                <StableBalanceCard
                  type="cafi"
                  currencyName={tokenSymbol} // CAFI remains CAFI
                  balance={balance}
                  isLoading={isLoadingBalance}
                  symbol={tokenSymbol}
                  subtitle="Ready for staking & minting"
                  isRefreshing={isRefreshing}
                />
              </div>

              <div className="mt-6">
                <ClaimStatusCard
                  isLoading={isLoadingFaucetData}
                  hasClaimedToday={faucetStats.hasClaimedToday}
                  remainingQuota={faucetStats.remainingQuota}
                />
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleClaimTokens}
                  disabled={
                    !isConnected ||
                    !faucetContractExists ||
                    isClaimingTokens ||
                    faucetStats.hasClaimedToday ||
                    Number(faucetStats.remainingQuota) <= 0 ||
                    isLoadingFaucetData
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  {isClaimingTokens ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Claiming...
                    </div>
                  ) : (
                    `Claim CAFI Tokens`
                  )}
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-6 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-50">Faucet Statistics</h2>
                  <p className="text-sm text-gray-400">Current faucet status and daily metrics</p>
                </div>
              </div>

              <div className="grid gap-6">
                <FaucetStatCard
                  title="Daily Limit"
                  value={`${Number(faucetStats.dailyLimit).toLocaleString()} CAFI`}
                  isLoading={isLoadingFaucetData}
                />

                <FaucetStatCard
                  title="Remaining Today"
                  value={`${Number(faucetStats.remainingQuota).toLocaleString()} CAFI`}
                  isLoading={isLoadingFaucetData}
                  subtitle={`${remainingPercentage}% remaining`}
                />

                <FaucetStatCard
                  title="Claimed Today"
                  value={`${Number(faucetStats.todayTotal).toLocaleString()} CAFI`}
                  isLoading={isLoadingFaucetData}
                  subtitle={`${
                    Number(faucetStats.dailyLimit) > 0
                      ? ((Number(faucetStats.todayTotal) / Number(faucetStats.dailyLimit)) * 100).toFixed(0)
                      : "0"
                  }% of daily limit`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
