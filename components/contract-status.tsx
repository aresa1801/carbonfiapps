"use client"

import { useEffect, useState } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, XCircle } from "lucide-react"
import { contractService } from "@/services/contract-service"
import { ethers } from "ethers"

export function ContractStatus() {
  const {
    isConnected,
    cafiTokenExists,
    faucetContractExists,
    stakingContractExists,
    nftContractExists,
    marketplaceContractExists,
    carbonRetireContractExists,
    farmingContractExists,
    CAFI_TOKEN_ADDRESS,
    STAKING_CONTRACT_ADDRESS,
    NFT_CONTRACT_ADDRESS,
    FAUCET_CONTRACT_ADDRESS,
    MARKETPLACE_CONTRACT_ADDRESS,
    CARBON_RETIRE_CONTRACT_ADDRESS,
    FARMING_CONTRACT_ADDRESS,
  } = useWeb3()

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Set loading to false after a short delay to allow contract checks to complete
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    // Add an additional check for the NFT contract
    const checkNftContract = async () => {
      try {
        if (nftContractExists) {
          const nftContract = await contractService.getNftContract()
          // Try to call some methods to verify the contract is working
          const mintFee = await nftContract.mintFee()
          const autoApproveEnabled = await nftContract.autoApproveEnabled()
          console.log("NFT contract verified with methods:", {
            mintFee: ethers.formatUnits(mintFee, 18),
            autoApproveEnabled,
          })
        }
      } catch (error) {
        console.error("Error checking NFT contract details:", error)
      }
    }

    checkNftContract()

    return () => clearTimeout(timer)
  }, [nftContractExists])

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Status</CardTitle>
          <CardDescription>Connect your wallet to view contract status</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const contracts = [
    { name: "CAFI Token", address: CAFI_TOKEN_ADDRESS, exists: cafiTokenExists },
    { name: "Staking", address: STAKING_CONTRACT_ADDRESS, exists: stakingContractExists },
    { name: "NFT", address: NFT_CONTRACT_ADDRESS, exists: nftContractExists },
    { name: "Faucet", address: FAUCET_CONTRACT_ADDRESS, exists: faucetContractExists },
    { name: "Marketplace", address: MARKETPLACE_CONTRACT_ADDRESS, exists: marketplaceContractExists },
    { name: "Carbon Retire", address: CARBON_RETIRE_CONTRACT_ADDRESS, exists: carbonRetireContractExists },
    { name: "Farming", address: FARMING_CONTRACT_ADDRESS, exists: farmingContractExists },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Status</CardTitle>
        <CardDescription>Status of all smart contracts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div key={contract.name} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{contract.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
                  {contract.address}
                </p>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <Badge variant={contract.exists ? "default" : "destructive"} className="flex items-center gap-1">
                  {contract.exists ? (
                    <>
                      <CheckCircle className="h-3 w-3" /> Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" /> Inactive
                    </>
                  )}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
