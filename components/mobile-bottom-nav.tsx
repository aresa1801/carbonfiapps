"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, DollarSign, Gem, Recycle, Store } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/user",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/user/faucet",
      label: "Faucet",
      icon: DollarSign,
    },
    {
      href: "/user/staking",
      label: "Staking",
      icon: Gem,
    },
    {
      href: "/user/farming",
      label: "Farming",
      icon: Gem,
    },
    {
      href: "/user/retire",
      label: "Retire",
      icon: Recycle,
    },
    {
      href: "/user/mint-nft",
      label: "Mint NFT",
      icon: Gem,
    },
    {
      href: "/user/marketplace",
      label: "Marketplace",
      icon: Store,
    },
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-2 shadow-lg md:hidden">
      <nav className="flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant="ghost"
                className={cn(
                  "flex flex-col items-center justify-center p-2 text-xs",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
