"use client"

import { useWeb3 } from "@/components/web3-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { getNetworkByChainId } from "@/lib/constants"

export function ContractStatus() {
  const { chainId, error, isConnected } = useWeb3()

  if (!isConnected) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to interact with the DApp.</AlertDescription>
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

  const network = getNetworkByChainId(chainId)

  if (!network) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Unsupported Network</AlertTitle>
        <AlertDescription>
          You are connected to an unsupported network (Chain ID: {chainId}). Please switch to a supported testnet (e.g.,
          Sepolia, Lisk Sepolia, BSC Testnet, Hedera Testnet, Base Sepolia, Celo Alfajores).
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Status</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Connected to: <strong>{network.name}</strong> (Chain ID: {network.chainId})
        </p>
        <p>
          Block Explorer:{" "}
          <a
            href={network.blockExplorer}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {network.blockExplorer}
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
