"use client"

import Image from "next/image"
import Link from "next/link"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NetworkSelector } from "@/components/network-selector"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { DashboardSidebar } from "./dashboard-sidebar" // Import the actual sidebar component

export function DashboardHeader() {
  const isMobile = useIsMobile()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-4">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                {/* Re-using DashboardSidebar for mobile sheet content */}
                <DashboardSidebar isMobileSheet={true} />
              </SheetContent>
            </Sheet>
          )}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/images/carbonfi-logo.png" alt="CarbonFi Logo" width={32} height={32} className="h-8 w-8" />
            <span className="hidden font-bold sm:inline-block">CarbonFi</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <NetworkSelector />
          <ConnectWalletButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
