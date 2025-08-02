"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useWeb3 } from "@/components/web3-provider"
import { getNetworkByChainId } from "@/lib/constants"
import { formatAddress } from "@/lib/wallet-utils"

export function ContractAddressesDisplay() {
  const { chainId, isConnected } = useWeb3()

  if (!isConnected || !chainId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect your wallet to view contract addresses.</p>
        </CardContent>
      </Card>
    )
  }

  const network = getNetworkByChainId(chainId)

  if (!network) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unsupported network. Cannot display contract addresses.</p>
        </CardContent>
      </Card>
    )
  }

  const contracts = network.contracts

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Addresses ({network.name})</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {contracts.cafiToken && (
          <div>
            <Label htmlFor="cafi-token-address">CAFI Token Address</Label>
            <Input id="cafi-token-address" value={formatAddress(contracts.cafiToken)} readOnly />
          </div>
        )}
        {contracts.faucet && (
          <div>
            <Label htmlFor="faucet-address">Faucet Address</Label>
            <Input id="faucet-address" value={formatAddress(contracts.faucet)} readOnly />
          </div>
        )}
        {contracts.staking && (
          <div>
            <Label htmlFor="staking-address">Staking Contract Address</Label>
            <Input id="staking-address" value={formatAddress(contracts.staking)} readOnly />
          </div>
        )}
        {contracts.farming && (
          <div>
            <Label htmlFor="farming-address">Farming Contract Address</Label>
            <Input id="farming-address" value={formatAddress(contracts.farming)} readOnly />
          </div>
        )}
        {contracts.nft && (
          <div>
            <Label htmlFor="nft-address">NFT Contract Address</Label>
            <Input id="nft-address" value={formatAddress(contracts.nft)} readOnly />
          </div>
        )}
        {contracts.carbonRetire && (
          <div>
            <Label htmlFor="carbon-retire-address">Carbon Retire Contract Address</Label>
            <Input id="carbon-retire-address" value={formatAddress(contracts.carbonRetire)} readOnly />
          </div>
        )}
        {contracts.marketplace && (
          <div>
            <Label htmlFor="marketplace-address">Marketplace Contract Address</Label>
            <Input id="marketplace-address" value={formatAddress(contracts.marketplace)} readOnly />
          </div>
        )}
        {!Object.values(contracts).some(Boolean) && (
          <p className="text-muted-foreground">No contract addresses configured for this network.</p>
        )}
      </CardContent>
    </Card>
  )
}
