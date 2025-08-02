"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Coins, TrendingUp, ShoppingCart, Droplets, Settings, LogOut } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"

interface SidebarLinkProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}

function SidebarLink({ href, icon, children }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-emerald-100/10 text-emerald-500"
          : "text-gray-400 hover:bg-emerald-100/10 hover:text-emerald-500",
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}

export function DashboardSidebar() {
  const { disconnect } = useWeb3()

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-900">
      <div className="flex h-14 items-center border-b border-gray-800 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-emerald-500 flex items-center justify-center">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Carbon Finance</h1>
            <p className="text-xs text-gray-400">Sustainable financial solutions</p>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          <SidebarLink href="/user" icon={<LayoutDashboard className="h-4 w-4" />}>
            Dashboard
          </SidebarLink>
          <SidebarLink href="/user/mint-nft" icon={<Coins className="h-4 w-4" />}>
            Mint NFT
          </SidebarLink>
          <SidebarLink href="/user/staking" icon={<TrendingUp className="h-4 w-4" />}>
            Staking
          </SidebarLink>
          <SidebarLink href="/user/marketplace" icon={<ShoppingCart className="h-4 w-4" />}>
            Marketplace
          </SidebarLink>
          <SidebarLink href="/user/retire" icon={<Droplets className="h-4 w-4" />}>
            Retire
          </SidebarLink>
        </nav>
      </div>
      <div className="border-t border-gray-800 p-4">
        <div className="grid gap-1">
          <Link
            href="/user/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-emerald-100/10 hover:text-emerald-500"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => disconnect()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-red-100/10 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
