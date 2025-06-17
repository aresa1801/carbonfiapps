"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Coins, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"

interface StableBalanceCardProps {
  type: "eth" | "cafi"
  balance: string
  isLoading: boolean
  symbol: string
  subtitle: string
  isRefreshing?: boolean
}

export function StableBalanceCard({
  type,
  balance,
  isLoading,
  symbol,
  subtitle,
  isRefreshing = false,
}: StableBalanceCardProps) {
  const [displayBalance, setDisplayBalance] = useState(balance)
  const [isUpdating, setIsUpdating] = useState(false)

  // Smooth balance update without flickering
  useEffect(() => {
    if (balance !== displayBalance && !isLoading) {
      setIsUpdating(true)

      // Small delay to show update indicator
      const timer = setTimeout(() => {
        setDisplayBalance(balance)
        setIsUpdating(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [balance, displayBalance, isLoading])

  // Initialize display balance
  useEffect(() => {
    if (!isLoading && displayBalance === "0" && balance !== "0") {
      setDisplayBalance(balance)
    }
  }, [balance, displayBalance, isLoading])

  return (
    <Card className="border-gray-800 bg-gray-800/50 relative">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-400">{type === "eth" ? "ETH Balance" : "CAFI Balance"}</div>
          <div className="flex items-center space-x-2">
            {(isRefreshing || isUpdating) && <RefreshCw className="h-3 w-3 text-gray-500 animate-spin" />}
            {type === "eth" ? (
              <Wallet className="h-5 w-5 text-blue-400" />
            ) : (
              <Coins className="h-5 w-5 text-emerald-400" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center">
          {isLoading ? (
            <Skeleton className="h-8 w-32 bg-gray-700" />
          ) : (
            <div
              className={`text-2xl font-bold text-white transition-all duration-300 ${
                isUpdating ? "opacity-70 scale-95" : "opacity-100 scale-100"
              }`}
            >
              {displayBalance} {symbol}
            </div>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-400">{subtitle}</div>
      </CardContent>
    </Card>
  )
}
