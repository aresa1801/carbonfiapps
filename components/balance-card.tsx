"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useWeb3 } from "@/components/web3-provider"
import { formatBigIntToEther } from "@/lib/wallet-utils"

export function BalanceCard() {
  const { nativeBalance, chainId } = useWeb3()

  const getCurrencySymbol = (id: number | null) => {
    switch (id) {
      case 97: // BSC Testnet
        return "BNB"
      case 296: // Hedera Testnet
        return "HBAR"
      case 11155111: // Sepolia
        return "ETH"
      case 4202: // Lisk Sepolia
        return "ETH"
      case 84532: // Base Sepolia
        return "ETH"
      case 44787: // Celo Alfajores
        return "CELO"
      default:
        return "ETH"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Native Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          {formatBigIntToEther(nativeBalance)} {getCurrencySymbol(chainId)}
        </p>
        <p className="text-sm text-muted-foreground">Your native token balance on the current network.</p>
      </CardContent>
    </Card>
  )
}
