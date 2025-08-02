"use client"

import type React from "react"

import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, Loader2 } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { NETWORKS } from "@/lib/constants"
import { toast } from "@/hooks/use-toast"

export function NetworkSelector() {
  const { chainId, networkName, switchNetwork, isConnected, isLoading } = useWeb3()
  const [isSwitching, setIsSwitching] = useState(false)

  const handleNetworkSwitch = async (targetChainId: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first to switch networks.",
        variant: "destructive",
      })
      return
    }
    if (chainId === targetChainId) {
      toast({
        title: "Already Connected",
        description: `You are already connected to ${NETWORKS[Object.keys(NETWORKS).find((key) => NETWORKS[key].chainId === targetChainId) || ""]?.name || "this network"}.`,
      })
      return
    }

    setIsSwitching(true)
    try {
      await switchNetwork(targetChainId)
    } catch (error) {
      console.error("Failed to switch network:", error)
      toast({
        title: "Network Switch Failed",
        description: "Could not switch network. Please try again or add the network manually to your wallet.",
        variant: "destructive",
      })
    } finally {
      setIsSwitching(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading Networks...
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          {isSwitching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Switching...
            </>
          ) : (
            <>
              {networkName || "Select Network"}
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.values(NETWORKS).map((network) => (
          <DropdownMenuItem
            key={network.chainId}
            onClick={() => handleNetworkSwitch(network.chainId)}
            disabled={isSwitching || chainId === network.chainId}
          >
            {network.name}
            {chainId === network.chainId && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
