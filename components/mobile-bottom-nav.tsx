"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Wallet, BarChart2, Leaf, Settings } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAdmin } = useWeb3()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide bottom nav on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // Don't show on login/landing page
  if (pathname === "/") {
    return null
  }

  const navItems = isAdmin
    ? [
        { href: "/admin", icon: Home, label: "Dashboard" },
        { href: "/admin/nft-settings", icon: Settings, label: "NFT" },
        { href: "/admin/staking-pool", icon: BarChart2, label: "Staking" },
        { href: "/admin/carbon-retire-settings", icon: Leaf, label: "Carbon" },
      ]
    : [
        { href: "/user", icon: Home, label: "Dashboard" },
        { href: "/user/mint-nft", icon: Wallet, label: "Mint" },
        { href: "/user/staking", icon: BarChart2, label: "Staking" },
        { href: "/user/marketplace", icon: Settings, label: "Market" },
        { href: "/user/retire", icon: Leaf, label: "Retire" },
      ]

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-transform duration-300 md:hidden",
        isVisible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-0 flex-1",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
