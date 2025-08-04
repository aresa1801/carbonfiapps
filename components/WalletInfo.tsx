"use client"

/**
 * Wallet Information Component
 * Displays connected wallet details, native balance, and gas information
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWallet } from "@/hooks/useWallet"
import { useNativeBalance } from "@/hooks/useNativeBalance"
import { useGasEstimate } from "@/hooks/useGasEstimate"
import { Wallet, Network, Fuel, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export const WalletInfo = () => {
  const { account, network, chainId } = useWallet()
  const { balance, isLoading: balanceLoading, symbol, refetch: refetchBalance, isHedera } = useNativeBalance()
  const {
    gasPrice,
    gasPriceGwei,
    isLoading: gasLoading,
    currencySymbol,
    isHedera: gasIsHedera,
    refetch: refetchGas,
  } = useGasEstimate()

  if (!account || !network) {
    return null
  }

  const handleRefresh = () => {
    refetchBalance()
    refetchGas()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Wallet Information</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Address */}
        <div className="flex items-center space-x-2">
          <Wallet className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-sm font-medium">Wallet Address</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
              {account.substring(0, 10)}...{account.substring(32)}
            </p>
          </div>
        </div>

        {/* Network Information */}
        <div className="flex items-center space-x-2">
          <Network className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">Connected Network</p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {network.displayName} (Chain ID: {chainId})
              </p>
              {isHedera && (
                <Badge variant="secondary" className="text-xs">
                  HBAR Network
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Native Currency Balance */}
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">Native Balance</p>
            {balanceLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {balance} {symbol}
              </p>
            )}
          </div>
        </div>

        {/* Gas Price Information */}
        <div className="flex items-center space-x-2">
          <Fuel className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">Gas Fee ({currencySymbol})</p>
            {gasLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {gasPrice} {currencySymbol}
                </p>
                {!gasIsHedera && gasPriceGwei && <p className="text-xs text-gray-500">({gasPriceGwei} Gwei)</p>}
              </div>
            )}
          </div>
        </div>

        {/* Network Explorer Link */}
        <div className="pt-2 border-t">
          <a
            href={`${network.blockExplorer}/address/${account}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View on {network.displayName} Explorer →
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
