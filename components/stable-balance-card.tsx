"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWeb3 } from "@/components/web3-provider"
import { Skeleton } from "@/components/ui/skeleton"

interface StableBalanceCardProps {
  title: string
  balance: string | number
  symbol: string
  isLoading?: boolean
}

// Helper function to get native token symbol based on chainId
const getNativeTokenSymbol = (chainId: number | null) => {
  if (chainId === 97) {
    // BSC Testnet
    return "BNB"
  } else if (chainId === 296) {
    // Hedera Testnet
    return "HBAR"
  }
  return "ETH" // Default for other networks
}

export function StableBalanceCard({ title, balance, symbol, isLoading }: StableBalanceCardProps) {
  const { chainId, isLoadingBalance } = useWeb3()

  const displayBalance = typeof balance === "number" ? balance.toFixed(4) : balance
  const nativeTokenSymbol = getNativeTokenSymbol(chainId)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </CardHeader>
      <CardContent>
        {isLoading || isLoadingBalance ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">
            {displayBalance} {symbol}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {isLoadingBalance ? <Skeleton className="h-4 w-20 mt-1" /> : `Native Token: ${nativeTokenSymbol}`}
        </p>
      </CardContent>
    </Card>
  )
}
