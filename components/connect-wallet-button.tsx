"use client"

import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { formatWalletAddress } from "@/lib/wallet-utils"
import { Loader2, Wallet } from "lucide-react"

export function ConnectWalletButton() {
  const { isConnected, address, connectWallet, disconnectWallet, isLoading } = useWeb3()

  if (isLoading) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  return (
    <>
      {isConnected ? (
        <Button onClick={disconnectWallet} variant="outline">
          <Wallet className="mr-2 h-4 w-4" />
          {formatWalletAddress(address)}
        </Button>
      ) : (
        <Button onClick={connectWallet}>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      )}
    </>
  )
}
