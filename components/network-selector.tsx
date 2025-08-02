"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWeb3 } from "@/components/web3-provider"
import { SUPPORTED_NETWORKS, getNetworkByChainId } from "@/lib/constants"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function NetworkSelector() {
  const { chainId, switchNetwork, isConnected, isLoading } = useWeb3()
  const [selectedNetwork, setSelectedNetwork] = useState<string | undefined>(chainId ? String(chainId) : undefined)
  const [isSwitching, setIsSwitching] = useState(false)

  useEffect(() => {
    if (chainId) {
      setSelectedNetwork(String(chainId))
    } else {
      setSelectedNetwork(undefined)
    }
  }, [chainId])

  const handleNetworkChange = async (newChainId: string) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      })
      return
    }

    setIsSwitching(true)
    try {
      await switchNetwork(Number(newChainId))
      toast({
        title: "Network Switched",
        description: `Successfully switched to ${getNetworkByChainId(Number(newChainId))?.name}.`,
      })
    } catch (error: any) {
      console.error("Failed to switch network:", error)
      toast({
        title: "Network Switch Failed",
        description: `Could not switch network: ${error.message || error}`,
        variant: "destructive",
      })
      // Revert select back to current chainId if switch fails
      setSelectedNetwork(chainId ? String(chainId) : undefined)
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Network:</span>
      <Select
        value={selectedNetwork}
        onValueChange={handleNetworkChange}
        disabled={!isConnected || isLoading || isSwitching}
      >
        <SelectTrigger className="w-[180px]">
          {isSwitching ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Switching...
            </span>
          ) : (
            <SelectValue placeholder="Select Network" />
          )}
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_NETWORKS.map((network) => (
            <SelectItem key={network.chainId} value={String(network.chainId)}>
              {network.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
