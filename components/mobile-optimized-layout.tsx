"use client"
import type { ReactNode } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardHeader } from "@/components/dashboard-header"

interface MobileOptimizedLayoutProps {
  children: ReactNode
}

export function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const isMobile = useIsMobile()

  if (!isMobile) {
    // Render children directly if not on mobile, assuming a desktop layout handles its own header/nav
    return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto pb-16">{children}</main> {/* Add padding for bottom nav */}
      <MobileBottomNav />
    </div>
  )
}
