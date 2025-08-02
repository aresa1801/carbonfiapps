"use client"

import type React from "react"

import { useMobile } from "@/hooks/use-mobile"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useWeb3 } from "@/components/web3-provider"

interface MobileOptimizedLayoutProps {
  children: React.ReactNode
}

export function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const isMobile = useMobile()
  const { isConnected } = useWeb3()

  if (!isConnected) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        {!isMobile && <DashboardSidebar />}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">{children}</main>
      </div>
      {isMobile && <MobileBottomNav />}
    </div>
  )
}
