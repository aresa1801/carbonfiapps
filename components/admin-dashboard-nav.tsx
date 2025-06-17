"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Settings, Users, Coins, Sprout } from "lucide-react"

export function AdminDashboardNav() {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: <Home className="h-4 w-4" />,
    },
    {
      name: "NFT Settings",
      href: "/admin/nft-settings",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      name: "Staking Pool",
      href: "/admin/staking-pool",
      icon: <Coins className="h-4 w-4" />,
    },
    {
      name: "Verifiers",
      href: "/admin/verifiers",
      icon: <Users className="h-4 w-4" />,
    },
    {
      name: "Retire Settings",
      href: "/admin/retire-settings",
      icon: <Sprout className="h-4 w-4" />,
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
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive ? "bg-blue-600 text-white shadow-md" : "text-slate-300 hover:bg-slate-700 hover:text-white",
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
