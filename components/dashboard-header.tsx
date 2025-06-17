"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { ConnectWalletButton } from "@/components/connect-wallet-button"

export function DashboardHeader() {
  const { networkName, refreshBalances, isRefreshing } = useWeb3()

  return (
    <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome to CAFI Dashboard</h1>
        <p className="text-gray-400">Manage your carbon credits and earn rewards with CAFI tokens</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-gray-800 px-4 py-1 text-sm text-gray-300">
          {networkName || "Unknown Network"}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshBalances()}
          disabled={isRefreshing}
          className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <ConnectWalletButton
          variant="outline"
          className="border-emerald-800 bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800 hover:text-emerald-100"
        />
      </div>
    </div>
  )
}
