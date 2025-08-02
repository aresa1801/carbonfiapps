"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, DollarSign, Gem, ShoppingCart, Leaf, BarChart } from "lucide-react"

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/user",
      icon: Home,
      label: "Home",
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
      label: "Mint",
    },
    {
      href: "/user/marketplace",
      icon: ShoppingCart,
      label: "Market",
    },
    {
      href: "/user/retire",
      icon: BarChart,
      label: "Retire",
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-gray-900 p-2 shadow-lg md:hidden">
      <nav className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 p-2 text-xs font-medium text-gray-400 transition-colors hover:text-gray-50",
              pathname === item.href && "text-gray-50",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
