"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { getNetworkByChainId } from "@/lib/constants"
import { contractService } from "@/services/contract-service"

export function ContractMigrationNotice() {
  const { chainId, isConnected } = useWeb3()
  const [showNotice, setShowNotice] = useState(false)
  const [missingContracts, setMissingContracts] = useState<string[]>([])

  useEffect(() => {
    const checkContracts = async () => {
      if (!isConnected || !chainId) {
        setShowNotice(false)
        return
      }

      const network = getNetworkByChainId(chainId)
      if (!network) {
        setShowNotice(false) // Already handled by ContractStatus for unsupported networks
        return
      }

      const contractsToCheck = [
        { name: "CAFI Token", address: network.contracts.cafiToken },
        { name: "Faucet", address: network.contracts.faucet },
        { name: "Staking", address: network.contracts.staking },
        { name: "Farming", address: network.contracts.farming },
        { name: "NFT", address: network.contracts.nft },
        { name: "Carbon Retire", address: network.contracts.carbonRetire },
        { name: "Marketplace", address: network.contracts.marketplace },
      ]

      const missing: string[] = []
      for (const contract of contractsToCheck) {
        if (contract.address && !(await contractService.contractExists(contract.address))) {
          missing.push(contract.name)
        }
      }

      if (missing.length > 0) {
        setMissingContracts(missing)
        setShowNotice(true)
      } else {
        setShowNotice(false)
      }
    }

    checkContracts()
  }, [chainId, isConnected])

  if (!showNotice) {
    return null
  }

  const currentNetworkName = chainId ? getNetworkByChainId(chainId)?.name : "your current network"

  return (
    <Alert variant="destructive" className="mb-4">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Contract Migration Required!</AlertTitle>
      <AlertDescription>
        <p>
          It appears some essential smart contracts are not deployed or configured correctly on{" "}
          <strong>{currentNetworkName}</strong>.
        </p>
        <p className="mt-2">
          Missing contracts: <strong>{missingContracts.join(", ")}</strong>.
        </p>
        <p className="mt-2">
          Please ensure all contracts are deployed to this network and their addresses are correctly configured in{" "}
          <code>lib/constants.ts</code>.
        </p>
        <p className="mt-2">
          You can find the contract ABIs in the <code>contracts/</code> directory.
        </p>
      </AlertDescription>
    </Alert>
  )
}
