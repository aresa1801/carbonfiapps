"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWeb3 } from "@/components/web3-provider"
import { getSupportedNetworks, getNetworkByChainId } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

export function NetworkSelector() {
  const { chainId, switchNetwork, isConnected } = useWeb3()
  const { toast } = useToast()
  const supportedNetworks = getSupportedNetworks()
  const [selectedNetwork, setSelectedNetwork] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (chainId) {
      setSelectedNetwork(chainId.toString())
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
    try {
      await switchNetwork(Number(newChainId))
      toast({
        title: "Network Switched",
        description: `Successfully switched to ${getNetworkByChainId(Number(newChainId))?.name || "unknown"} network.`,
      })
    } catch (error: any) {
      console.error("Failed to switch network:", error)
      toast({
        title: "Failed to Switch Network",
        description: error.message || "Please try again or add the network to your wallet manually.",
        variant: "destructive",
      })
    }
  }

  return (
    <Select onValueChange={handleNetworkChange} value={selectedNetwork}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Network" />
      </SelectTrigger>
      <SelectContent>
        {supportedNetworks.map((network) => (
          <SelectItem key={network.chainId} value={network.chainId.toString()}>
            {network.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
