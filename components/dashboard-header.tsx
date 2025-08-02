"use client"

import Image from "next/image"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { PanelLeft } from "lucide-react"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { NetworkSelector } from "@/components/network-selector"
import { ThemeToggle } from "@/components/theme-toggle"
import { useIsMobile } from "@/hooks/use-mobile"
import { useWeb3 } from "@/components/web3-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"

export function DashboardHeader() {
  const isMobile = useIsMobile()
  const { isAdmin } = useWeb3()
  const pathname = usePathname()

  const userNavItems = [
    { href: "/user", title: "Dashboard" },
    { href: "/user/faucet", title: "Faucet" },
    { href: "/user/retire", title: "Retire" },
    { href: "/user/staking", title: "Staking" },
    { href: "/user/farming", title: "Farming" },
    { href: "/user/mint-nft", title: "Mint NFT" },
    { href: "/user/marketplace", title: "Marketplace" },
  ]

  const adminNavItems = [
    { href: "/admin", title: "Admin Dashboard" },
    { href: "/admin/nft-settings", title: "NFT Settings" },
    { href: "/admin/retire-settings", title: "Retire Settings" },
    { href: "/admin/staking-pool", title: "Staking Pool" },
    { href: "/admin/farming", title: "Farming Pools" },
    { href: "/admin/verifiers", title: "Verifiers" },
  ]

  const currentNavItems = pathname.startsWith("/admin") ? adminNavItems : userNavItems

  const currentDashboardTitle = pathname.startsWith("/admin") ? "Admin Dashboard" : "User Dashboard"

  if (isMobile) {
    return (
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden bg-transparent">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
              >
                <Image src="/public/images/carbonfi-logo.png" alt="CarbonFi Logo" width={24} height={24} />
                <span className="sr-only">CarbonFi</span>
              </Link>
              {currentNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  {item.title}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  Admin
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/public/images/carbonfi-logo.png" alt="CarbonFi Logo" width={100} height={25} priority />
        </Link>
        <div className="relative ml-auto flex items-center gap-4">
          <NetworkSelector />
          <ThemeToggle />
          <ConnectWalletButton />
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/public/images/carbonfi-logo.png" alt="CarbonFi Logo" width={100} height={25} priority />
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <NetworkSelector />
        <ThemeToggle />
        <ConnectWalletButton />
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                {currentDashboardTitle}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href="/user" passHref>
                <DropdownMenuItem>User Dashboard</DropdownMenuItem>
              </Link>
              <Link href="/admin" passHref>
                <DropdownMenuItem>Admin Dashboard</DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
