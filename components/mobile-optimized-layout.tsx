"use client"

import type React from "react"

import { useIsMobile } from "@/hooks/use-mobile"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

interface MobileOptimizedLayoutProps {
  children: React.ReactNode
}

export function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <div className="flex min-h-screen w-full flex-col">
      {isMobile ? (
        <>
          <DashboardHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">{children}</main>
          <MobileBottomNav />
        </>
      ) : (
        <div className="flex min-h-screen w-full">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col">
            <DashboardHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">{children}</main>
          </div>
        </div>
      )}
    </div>
  )
}
