"use client"

import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NetworkSelector } from "@/components/network-selector"
import { useMobile } from "@/hooks/use-mobile"
import { UserDashboardNav } from "@/components/user-dashboard-nav"
import { AdminDashboardNav } from "@/components/admin-dashboard-nav"
import { useWeb3 } from "@/components/web3-provider"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export function DashboardHeader() {
  const isMobileView = useMobile()
  const { isConnected, isAdmin } = useWeb3()
  const pathname = usePathname()

  const getNativeTokenSymbol = (chainId: number | null) => {
    switch (chainId) {
      case 97: // BSC Testnet
        return "BNB"
      case 296: // Hedera Testnet
        return "HBAR"
      default:
        return "ETH"
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/carbonfi-logo.png"
              alt="CarbonFi Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-lg font-semibold">CarbonFi</span>
          </Link>
          {isConnected && (
            <>
              {isAdmin && <AdminDashboardNav />}
              {!isAdmin && <UserDashboardNav />}
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <NetworkSelector />
          <ThemeToggle />
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  )
}
