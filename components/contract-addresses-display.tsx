"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useWeb3 } from "@/components/web3-provider"
import { getContractAddresses, getNetworkByChainId } from "@/lib/constants"
import { formatWalletAddress } from "@/lib/wallet-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export function ContractAddressesDisplay() {
  const { chainId, isConnected } = useWeb3()

  if (!isConnected) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to view contract addresses.</AlertDescription>
      </Alert>
    )
  }

  if (!chainId) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Network Not Detected</AlertTitle>
        <AlertDescription>
          Could not detect the connected network. Please ensure your wallet is connected to a supported network.
        </AlertDescription>
      </Alert>
    )
  }

  const contractAddresses = getContractAddresses(chainId)
  const network = getNetworkByChainId(chainId)

  if (!contractAddresses || !network) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Unsupported Network</AlertTitle>
        <AlertDescription>The connected network ({chainId}) is not currently supported or configured.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployed Contract Addresses</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Network:</span>
          <span>
            {network.name} (Chain ID: {chainId})
          </span>
        </div>
        {Object.entries(contractAddresses).map(([name, address]) => (
          <div key={name} className="flex items-center justify-between">
            <span className="font-medium">{name.replace(/_/g, " ")}:</span>
            <span className="font-mono text-sm">{address ? formatWalletAddress(address) : "N/A"}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
