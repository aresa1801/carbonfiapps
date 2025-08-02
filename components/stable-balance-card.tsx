import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Coins, Droplets } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider" // Import useWeb3

interface StableBalanceCardProps {
  title?: string
  balance: string
  symbol: string
  isLoading: boolean
  subtitle?: string
  type: "eth" | "cafi" // This type is used to determine default title and icon
  isRefreshing?: boolean
}

export function StableBalanceCard({
  title,
  balance,
  symbol,
  isLoading,
  subtitle,
  type,
  isRefreshing = false,
}: StableBalanceCardProps) {
  const { chainId } = useWeb3() // Get chainId from context

  const getNativeTokenSymbol = (id: number | null) => {
    if (id === 97) return "BNB" // BSC Testnet
    if (id === 296) return "HBAR" // Hedera Testnet
    return "ETH" // Default
  }

  const nativeTokenSymbol = getNativeTokenSymbol(chainId)

  const icon =
    type === "eth" ? <Droplets className="h-5 w-5 text-blue-500" /> : <Coins className="h-5 w-5 text-emerald-500" />
  const defaultTitle = type === "eth" ? `${nativeTokenSymbol} Balance` : "CAFI Token Balance" // Use nativeTokenSymbol here

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title || defaultTitle}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading || isRefreshing ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-white">
              {balance} {symbol}
            </div>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
