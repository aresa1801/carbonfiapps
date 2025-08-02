"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { cn } from "@/lib/utils"
import { useWeb3 } from "@/components/web3-provider"

interface MobileOptimizedLayoutProps {
  children: ReactNode
  sidebar: ReactNode
  header: ReactNode
}

export function MobileOptimizedLayout({ children, sidebar, header }: MobileOptimizedLayoutProps) {
  const isMobile = useMobile()
  const { isConnected, isAdmin } = useWeb3()
  const [showMobileNav, setShowMobileNav] = useState(false)

  useEffect(() => {
    // Only show mobile nav if connected and not on admin page
    const currentPath = window.location.pathname
    const isUserDashboard = currentPath.startsWith("/user")
    const isAdminDashboard = currentPath.startsWith("/admin")

    if (isConnected && isUserDashboard && !isAdminDashboard) {
      setShowMobileNav(true)
    } else {
      setShowMobileNav(false)
    }
  }, [isConnected, isAdmin])

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-950 text-gray-50 dark:bg-gray-950 dark:text-gray-50">
      {/* Desktop Header */}
      {!isMobile && <DashboardHeader />}

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        {!isMobile && <DashboardSidebar />}

        <main
          className={cn(
            "flex-1 p-4 md:p-6 lg:p-8",
            isMobile ? "pb-16" : "", // Add padding for mobile bottom nav
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && showMobileNav && <MobileBottomNav />}
    </div>
  )
}
