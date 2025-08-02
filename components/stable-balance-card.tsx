"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWeb3 } from "@/components/web3-provider"
import { formatEther } from "ethers"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function StableBalanceCard() {
  const { address, stableTokenBalance, isConnected, isRefreshing, refreshBalances, chainId } = useWeb3()

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

  if (!isConnected || !address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stable Token Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">0.00 CAFI</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Wallet not connected</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Stable Token Balance</CardTitle>
        <Button variant="ghost" size="icon" onClick={refreshBalances} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="sr-only">Refresh balance</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {stableTokenBalance !== null ? Number.parseFloat(formatEther(stableTokenBalance)).toFixed(4) : "Loading..."}{" "}
          CAFI
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Your CAFI token balance</p>
      </CardContent>
    </Card>
  )
}
