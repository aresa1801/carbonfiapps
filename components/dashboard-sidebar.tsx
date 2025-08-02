"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Package2, Home, Settings, DollarSign, Gem, Leaf, Factory, Handshake, Wallet } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { Separator } from "@/components/ui/separator"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isAdmin, isConnected } = useWeb3()

  const adminNavItems = [
    {
      href: "/admin",
      icon: Home,
      label: "Dashboard",
      active: pathname === "/admin",
    },
    {
      href: "/admin/nft-settings",
      icon: Gem,
      label: "NFT Settings",
      active: pathname.startsWith("/admin/nft-settings"),
    },
    {
      href: "/admin/verifiers",
      icon: Handshake,
      label: "Verifiers",
      active: pathname.startsWith("/admin/verifiers"),
    },
    {
      href: "/admin/retire-settings",
      icon: Leaf,
      label: "Retire Settings",
      active: pathname.startsWith("/admin/retire-settings"),
    },
    {
      href: "/admin/staking-pool",
      icon: DollarSign,
      label: "Staking Pool",
      active: pathname.startsWith("/admin/staking-pool"),
    },
    {
      href: "/admin/farming",
      icon: Factory,
      label: "Farming",
      active: pathname.startsWith("/admin/farming"),
    },
  ]

  const userNavItems = [
    {
      href: "/user",
      icon: Home,
      label: "Dashboard",
      active: pathname === "/user",
    },
    {
      href: "/user/staking",
      icon: DollarSign,
      label: "Staking",
      active: pathname.startsWith("/user/staking"),
    },
    {
      href: "/user/farming",
      icon: Factory,
      label: "Farming",
      active: pathname.startsWith("/user/farming"),
    },
    {
      href: "/user/mint-nft",
      icon: Gem,
      label: "Mint NFT",
      active: pathname.startsWith("/user/mint-nft"),
    },
    {
      href: "/user/retire",
      icon: Leaf,
      label: "Retire Carbon",
      active: pathname.startsWith("/user/retire"),
    },
    {
      href: "/user/marketplace",
      icon: Wallet,
      label: "Marketplace",
      active: pathname.startsWith("/user/marketplace"),
    },
  ]

  const currentNavItems = isAdmin ? adminNavItems : userNavItems

  if (!isConnected) {
    return null // Don't render sidebar if not connected
  }

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className="">CarbonFi DApps</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {currentNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  item.active && "bg-muted text-primary",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <Separator className="my-4" />
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === "/settings" && "bg-muted text-primary",
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}
