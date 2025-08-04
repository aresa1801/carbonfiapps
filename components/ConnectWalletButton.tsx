"use client"

/**
 * Connect Wallet Button Component
 * Handles MetaMask connection with loading states and error handling
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/useWallet"
import { Wallet, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const ConnectWalletButton = () => {
  const { isConnected, account, isLoading, error, connectWallet, disconnectWallet } = useWallet()
  const [showError, setShowError] = useState(false)

  const handleConnect = async () => {
    setShowError(false)
    await connectWallet()
    if (error) {
      setShowError(true)
    }
  }

  const handleDisconnect = () => {
    setShowError(false)
    disconnectWallet()
  }

  // Show error alert if there's an error
  if (error && showError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleConnect} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Try Again
            </>
          )}
        </Button>
      </div>
    )
  }

  if (isConnected && account) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {account.substring(0, 6)}...{account.substring(38)}
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={handleConnect} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </>
      )}
    </Button>
  )
}
