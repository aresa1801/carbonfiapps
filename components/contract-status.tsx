"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useWeb3 } from "@/components/web3-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { getNetworkByChainId } from "@/lib/constants"

export function ContractStatus() {
  const { isConnected, chainId, error } = useWeb3()

  const network = chainId ? getNetworkByChainId(chainId) : null

  if (!isConnected) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to view contract status.</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Web3 Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Status</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Network:</span>
          <span className="text-sm">
            {network ? network.name : "Unknown Network"} (Chain ID: {chainId})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection Status:</span>
          <span className="text-sm text-green-500">Connected</span>
        </div>
        {/* You can add more contract-specific status checks here */}
        <p className="text-sm text-muted-foreground">
          All contracts are loaded and ready for interaction on the current network.
        </p>
      </CardContent>
    </Card>
  )
}
