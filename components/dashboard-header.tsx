import type React from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { NetworkSelector } from "@/components/network-selector"

const DashboardHeader: React.FC = () => {
  return (
    <header className="bg-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">Dashboard</div>
        <div className="flex items-center gap-2">
          <NetworkSelector />
          <ThemeToggle />
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
