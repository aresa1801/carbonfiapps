"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { isMobileDevice } from "@/lib/wallet-utils"

interface MobileOptimizedLayoutProps {
  children: ReactNode
  className?: string
  mobileClassName?: string
  desktopClassName?: string
}

export function MobileOptimizedLayout({
  children,
  className = "",
  mobileClassName = "",
  desktopClassName = "",
}: MobileOptimizedLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const isMobileView = useIsMobile()

  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  return <div className={cn(className, isMobileView ? mobileClassName : desktopClassName)}>{children}</div>
}
