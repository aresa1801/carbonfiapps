"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWeb3 } from "@/components/web3-provider"
import { CheckCircle2, XCircle } from "lucide-react"

export function ContractStatus() {
  const {
    cafiTokenContract,
    faucetContract,
    stakingContract,
    farmingContract,
    nftContract,
    carbonRetireContract,
    marketplaceContract,
    isLoading,
    isConnected,
  } = useWeb3()

  const contracts = [
    { name: "CAFI Token", contract: cafiTokenContract },
    { name: "Faucet", contract: faucetContract },
    { name: "Staking", contract: stakingContract },
    { name: "Farming", contract: farmingContract },
    { name: "NFT", contract: nftContract },
    { name: "Carbon Retire", contract: carbonRetireContract },
    { name: "Marketplace", contract: marketplaceContract },
  ]

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Contract Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading contract statuses...</p>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Contract Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Wallet not connected. Cannot check contract status.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contract Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {contracts.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span>{item.name}</span>
            {item.contract ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
