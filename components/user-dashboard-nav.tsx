"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Coins, Sprout, Recycle, Store } from "lucide-react"
import { cn } from "@/lib/utils"

export function UserDashboardNav() {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/user",
      icon: <Home className="h-4 w-4" />,
    },
    {
      name: "Mint NFT",
      href: "/user/mint-nft",
      icon: <Coins className="h-4 w-4" />,
    },
    {
      name: "Staking",
      href: "/user/staking",
      icon: <Sprout className="h-4 w-4" />,
    },
    {
      name: "Marketplace",
      href: "/user/marketplace",
      icon: <Store className="h-4 w-4" />,
    },
    {
      name: "Retire",
      href: "/user/retire",
      icon: <Recycle className="h-4 w-4" />,
    },
  ]

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive ? "bg-emerald-100 text-emerald-800" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
