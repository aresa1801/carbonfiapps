"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, HandCoins, Leaf, Gem, Store, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAdmin } = useWeb3()

  const userNavItems = [
    {
      href: "/user",
      label: "Dashboard",
      icon: Home,
      active: pathname === "/user",
    },
    {
      href: "/user/faucet",
      label: "Faucet",
      icon: HandCoins,
      active: pathname === "/user/faucet",
    },
    {
      href: "/user/retire",
      label: "Retire",
      icon: Leaf,
      active: pathname === "/user/retire",
    },
    {
      href: "/user/staking",
      label: "Staking",
      icon: Gem,
      active: pathname === "/user/staking",
    },
    {
      href: "/user/farming",
      label: "Farming",
      icon: Leaf, // Reusing Leaf for farming, consider a different icon if available
      active: pathname === "/user/farming",
    },
    {
      href: "/user/mint-nft",
      label: "Mint NFT",
      icon: Gem, // Reusing Gem for NFT, consider a different icon if available
      active: pathname === "/user/mint-nft",
    },
    {
      href: "/user/marketplace",
      label: "Marketplace",
      icon: Store,
      active: pathname === "/user/marketplace",
    },
  ]

  const adminNavItem = {
    href: "/admin",
    label: "Admin",
    icon: ShieldCheck,
    active: pathname.startsWith("/admin"),
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around bg-background border-t border-border p-2 shadow-lg md:hidden">
      {userNavItems.map((item) => (
        <Link key={item.href} href={item.href} passHref>
          <Button
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center p-2 h-auto",
              item.active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </Button>
        </Link>
      ))}
      {isAdmin && (
        <Link href={adminNavItem.href} passHref>
          <Button
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center p-2 h-auto",
              adminNavItem.active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <adminNavItem.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{adminNavItem.label}</span>
          </Button>
        </Link>
      )}
    </nav>
  )
}
