"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Coins } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface BalanceCardProps {
  type: "eth" | "cafi"
  balance: string
  isLoading: boolean
  symbol: string
  subtitle: string
}

export function BalanceCard({ type, balance, isLoading, symbol, subtitle }: BalanceCardProps) {
  return (
    <Card className="border-gray-800 bg-gray-800/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-400">{type === "eth" ? "ETH Balance" : "CAFI Balance"}</div>
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
