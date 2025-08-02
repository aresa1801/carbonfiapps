"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Coins } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useWeb3 } from "@/components/web3-provider" // Import useWeb3

interface BalanceCardProps {
  type: "eth" | "cafi"
  balance: string
  isLoading: boolean
  symbol: string
  subtitle: string
}

export function BalanceCard({ type, balance, isLoading, symbol, subtitle }: BalanceCardProps) {
  const { chainId } = useWeb3() // Get chainId from context

  const getNativeTokenSymbol = (id: number | null) => {
    if (id === 97) return "BNB" // BSC Testnet
    if (id === 296) return "HBAR" // Hedera Testnet
    return "ETH" // Default
  }

  const nativeTokenSymbol = getNativeTokenSymbol(chainId)

  return (
    <Card className="border-gray-700 bg-gray-900 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-300">
            {type === "eth" ? `${nativeTokenSymbol} Balance` : "CAFI Balance"}
          </div>
          {type === "eth" ? (
            <Wallet className="h-5 w-5 text-blue-400" />
          ) : (
            <Coins className="h-5 w-5 text-emerald-400" />
          )}
        </div>
        <div className="mt-2 flex items-center">
          {isLoading ? (
            <Skeleton className="h-8 w-32 bg-gray-700" />
          ) : (
            <div className="text-2xl font-bold text-white">
              {balance} {symbol}
            </div>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-400">{subtitle}</div>
      </CardContent>
    </Card>
  )
}
