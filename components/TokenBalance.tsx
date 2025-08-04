"use client"

/**
 * Token Balance Component
 * Allows users to query ERC20 token balances by contract address
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTokenBalance } from "@/hooks/useTokenBalance"
import { useWallet } from "@/hooks/useWallet"
import { Search, Coins, AlertCircle, CheckCircle } from "lucide-react"

export const TokenBalance = () => {
  const { account, network } = useWallet()
  const [tokenAddress, setTokenAddress] = useState("")
  const [queryAddress, setQueryAddress] = useState("")

  const { balance, tokenInfo, isLoading, error, isValidContract } = useTokenBalance(queryAddress, account)

  const handleQuery = () => {
    if (tokenAddress.trim()) {
      setQueryAddress(tokenAddress.trim())
    }
  }

  const handleClear = () => {
    setTokenAddress("")
    setQueryAddress("")
  }

  if (!account || !network) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center space-x-2">
          <Coins className="h-5 w-5" />
          <span>ERC20 Token Balance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Address Input */}
        <div className="space-y-2">
          <Label htmlFor="token-address">Token Contract Address</Label>
          <div className="flex space-x-2">
            <Input
              id="token-address"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="font-mono text-sm"
            />
            <Button onClick={handleQuery} disabled={!tokenAddress.trim() || isLoading}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {queryAddress && (
          <div className="space-y-3">
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success State */}
            {!isLoading && !error && isValidContract && tokenInfo && (
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Valid ERC20 contract found!</AlertDescription>
                </Alert>

                {/* Token Information */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Token Name:</span>
                    <span className="text-sm">{tokenInfo.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Symbol:</span>
                    <span className="text-sm font-mono">{tokenInfo.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Decimals:</span>
                    <span className="text-sm">{tokenInfo.decimals}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium">Your Balance:</span>
                    <span className="text-sm font-mono">
                      {balance} {tokenInfo.symbol}
                    </span>
                  </div>
                </div>

                {/* Contract Address Display */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>Contract: {queryAddress}</p>
                  <a
                    href={`${network.blockExplorer}/token/${queryAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View on Explorer →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clear Button */}
        {queryAddress && (
          <Button variant="outline" onClick={handleClear} className="w-full bg-transparent">
            Clear
          </Button>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Enter any ERC20 token contract address to check your balance</p>
          <p>• Works on all supported networks: {network.displayName}</p>
          <p>• Make sure the contract is deployed on the current network</p>
        </div>
      </CardContent>
    </Card>
  )
}
