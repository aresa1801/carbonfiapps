"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Info, X, ExternalLink } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { ORIGINAL_CONTRACT_ADDRESSES, NEW_CONTRACT_ADDRESSES, getNetworkByChainId } from "@/lib/constants"

export function ContractMigrationNotice() {
  const { chainId, currentNetworkContracts, supportedNetwork } = useWeb3()
  const [dismissed, setDismissed] = useState(false)

  // Check if user dismissed the notice
  useEffect(() => {
    const isDismissed = localStorage.getItem("carbonfi-migration-notice-dismissed") === "true"
    setDismissed(isDismissed)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("carbonfi-migration-notice-dismissed", "true")
  }

  // Don't show if dismissed or not connected
  if (dismissed || !chainId || !supportedNetwork) {
    return null
  }

  const currentNetwork = getNetworkByChainId(chainId)
  const isUsingNewContracts = currentNetworkContracts === NEW_CONTRACT_ADDRESSES
  const isUsingOriginalContracts = currentNetworkContracts === ORIGINAL_CONTRACT_ADDRESSES

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <AlertTitle className="text-blue-800 dark:text-blue-200">Multi-Network Smart Contracts Available</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300 mt-2">
            <div className="space-y-2">
              <p>CarbonFi now supports multiple testnets with updated smart contracts.</p>

              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant={isUsingNewContracts ? "default" : "secondary"}>
                  {currentNetwork?.name || `Chain ${chainId}`}
                </Badge>
                {isUsingNewContracts && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    New Contracts
                  </Badge>
                )}
                {isUsingOriginalContracts && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Original Contracts
                  </Badge>
                )}
              </div>

              <div className="text-sm mt-3">
                <p className="font-medium mb-1">Supported Networks:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Ethereum Sepolia Testnet (Original)</li>
                  <li>Lisk Sepolia Testnet (New)</li>
                  <li>BSC Testnet (New)</li>
                  <li>Hedera Testnet (New)</li>
                  <li>Base Sepolia Testnet (New)</li>
                  <li>Celo Alfajores Testnet (New)</li>
                </ul>
              </div>

              {currentNetwork && (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(currentNetwork.blockExplorer, "_blank")}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on Explorer
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}
