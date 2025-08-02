"use client"

import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { formatAddress } from "@/lib/wallet-utils"
import { Loader2, Wallet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useState } from "react"
import { MetaMaskDetector } from "@/components/metamask-detector"

export function ConnectWalletButton() {
  const { isConnected, address, connectWallet, disconnectWallet, isLoading, chainId } = useWeb3()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleConnectClick = async () => {
    if (!window.ethereum) {
      setIsModalOpen(true)
    } else {
      await connectWallet()
    }
  }

  const handleDisconnectClick = () => {
    disconnectWallet()
  }

  if (isLoading) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Wallet className="h-4 w-4" />
            {formatAddress(address)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="flex flex-col items-start">
            <span className="text-sm font-medium">Connected Account:</span>
            <span className="text-xs text-muted-foreground">{address}</span>
          </DropdownMenuItem>
          {chainId && (
            <DropdownMenuItem className="flex flex-col items-start">
              <span className="text-sm font-medium">Chain ID:</span>
              <span className="text-xs text-muted-foreground">{chainId}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleDisconnectClick}>Disconnect Wallet</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <Button onClick={handleConnectClick}>Connect Wallet</Button>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>Please install MetaMask or a compatible browser wallet to connect.</DialogDescription>
          </DialogHeader>
          <MetaMaskDetector />
        </DialogContent>
      </Dialog>
    </>
  )
}
