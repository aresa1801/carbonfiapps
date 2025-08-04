"use client"

/**
 * Network Selector Component
 * Allows users to switch between supported EVM networks
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWallet } from "@/hooks/useWallet"
import { Badge } from "@/components/ui/badge"
import { isHederaNetwork } from "@/lib/networkConfig"

export const NetworkSelector = () => {
  const { chainId, network, switchNetwork, supportedNetworks, isConnected } = useWallet()

  if (!isConnected) {
    return null
  }

  const handleNetworkChange = (value: string) => {
    const targetChainId = Number.parseInt(value)
    switchNetwork(targetChainId)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Network</label>
      <Select value={chainId?.toString()} onValueChange={handleNetworkChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a network" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(supportedNetworks).map((net) => (
            <SelectItem key={net.chainId} value={net.chainId.toString()}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <span>{net.displayName}</span>
                  {isHederaNetwork(net.chainId) && (
                    <Badge variant="secondary" className="text-xs">
                      HBAR
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">{net.nativeCurrency.symbol}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {network && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Chain ID: {network.chainId} • Currency: {network.nativeCurrency.symbol}
        </div>
      )}
    </div>
  )
}
