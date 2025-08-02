import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Coins, Droplets } from "lucide-react"

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
  const icon =
    type === "eth" ? <Droplets className="h-5 w-5 text-blue-500" /> : <Coins className="h-5 w-5 text-emerald-500" />
  const defaultTitle = type === "eth" ? "Native Token Balance" : "CAFI Token Balance"

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
