"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Wifi, WifiOff } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { NETWORKS, getNetworkByChainId, isSupportedNetwork } from "@/lib/constants"
import { toast } from "@/hooks/use-toast"

export function NetworkSelector() {
  const { chainId, provider, isConnected } = useWeb3()
  const [isChangingNetwork, setIsChangingNetwork] = useState(false)

  const currentNetwork = chainId ? getNetworkByChainId(chainId) : null
  const isSupported = chainId ? isSupportedNetwork(chainId) : false

  const switchNetwork = async (targetChainId: number) => {
    if (!provider || !window.ethereum) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    setIsChangingNetwork(true)

    try {
      const chainIdHex = `0x${targetChainId.toString(16)}`

      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      })

      toast({
        title: "Network Switched",
        description: `Successfully switched to ${getNetworkByChainId(targetChainId)?.name}`,
      })
    } catch (error: any) {
      console.error("Error switching network:", error)

      // If the network doesn't exist, try to add it
      if (error.code === 4902) {
        try {
          const network = getNetworkByChainId(targetChainId)
          if (network) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${targetChainId.toString(16)}`,
                  chainName: network.name,
                  rpcUrls: [network.rpcUrl],
                  blockExplorerUrls: [network.blockExplorer],
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                },
              ],
            })

            toast({
              title: "Network Added",
              description: `Successfully added and switched to ${network.name}`,
            })
          }
        } catch (addError) {
          console.error("Error adding network:", addError)
          toast({
            title: "Failed to Add Network",
            description: "Could not add the network to your wallet",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Network Switch Failed",
          description: error.message || "Failed to switch network",
          variant: "destructive",
        })
      }
    } finally {
      setIsChangingNetwork(false)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
            disabled={isChangingNetwork}
          >
            {isSupported ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            <span className="hidden sm:inline">{currentNetwork?.name || `Chain ${chainId}`}</span>
            <span className="sm:hidden">{currentNetwork?.name.split(" ")[0] || `${chainId}`}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Select Network</div>
          {Object.values(NETWORKS).map((network) => (
            <DropdownMenuItem
              key={network.chainId}
              onClick={() => switchNetwork(network.chainId)}
              className="flex items-center justify-between"
              disabled={isChangingNetwork || chainId === network.chainId}
            >
              <span>{network.name}</span>
              {chainId === network.chainId && (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {!isSupported && chainId && (
        <Badge variant="destructive" className="text-xs">
          Unsupported
        </Badge>
      )}
    </div>
  )
}
