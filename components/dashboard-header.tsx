"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MenuIcon } from "lucide-react"
import { ConnectWalletButton } from "./connect-wallet-button"
import { NetworkSelector } from "./network-selector"
import { ThemeToggle } from "./theme-toggle"
import { useWeb3 } from "./web3-provider"
import { useState } from "react"
import { AdminDashboardNav } from "./admin-dashboard-nav"
import { UserDashboardNav } from "./user-dashboard-nav"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function DashboardHeader() {
  const { isConnected, isAdmin, isMobile, chainId } = useWeb3()
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Helper function to get native token symbol based on chainId
  const getNativeTokenSymbol = (chainId: number | null) => {
    if (chainId === 97) {
      // BSC Testnet
      return "BNB"
    } else if (chainId === 296) {
      // Hedera Testnet
      return "HBAR"
    }
    return "ETH" // Default for other networks
  }

  const nativeTokenSymbol = getNativeTokenSymbol(chainId)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {isMobile && isConnected && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden bg-transparent">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
              >
                <Image
                  src="/images/carbonfi-logo.png"
                  alt="CarbonFi Logo"
                  width={24}
                  height={24}
                  className="transition-all group-hover:scale-110"
                />
                <span className="sr-only">CarbonFi</span>
              </Link>
              {isAdmin ? (
                <AdminDashboardNav onLinkClick={() => setIsSheetOpen(false)} />
              ) : (
                <UserDashboardNav onLinkClick={() => setIsSheetOpen(false)} />
              )}
            </nav>
          </SheetContent>
        </Sheet>
      )}

      <div className="relative ml-auto flex-1 md:grow-0">
        {/* No direct "ETH" text here, NetworkSelector handles network name */}
      </div>
      <div className="flex items-center gap-2">
        {isConnected && (
          <>
            <NetworkSelector />
            <ConnectWalletButton />
          </>
        )}
        <ThemeToggle />
      </div>
      {isMobile && isConnected && <MobileBottomNav />}
    </header>
  )
}
