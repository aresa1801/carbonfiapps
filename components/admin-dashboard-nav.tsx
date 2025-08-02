"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Settings, Users, Coins, Sprout, Droplets } from "lucide-react"

export function AdminDashboardNav() {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Faucet Management",
      href: "/admin",
      icon: <Droplets className="h-4 w-4" />,
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
    <nav className="space-y-1 p-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-emerald-900/50 text-emerald-400 border border-emerald-700/50"
                : "text-gray-300 hover:bg-gray-800 hover:text-white border border-transparent",
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
