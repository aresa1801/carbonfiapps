"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, BarChart, DollarSign, Gem, ShoppingCart, Leaf } from "lucide-react"

export function UserDashboardNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/user",
      icon: Home,
      label: "Dashboard",
    },
    {
      href: "/user/staking",
      icon: DollarSign,
      label: "Staking",
    },
    {
      href: "/user/farming",
      icon: Leaf,
      label: "Farming",
    },
    {
      href: "/user/mint-nft",
      icon: Gem,
      label: "Mint NFT",
    },
    {
      href: "/user/marketplace",
      icon: ShoppingCart,
      label: "Marketplace",
    },
    {
      href: "/user/retire",
      icon: BarChart,
      label: "Retire Carbon",
    },
  ]

  return (
    <nav className="grid items-start px-4 text-sm font-medium">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
            pathname === item.href && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50",
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
