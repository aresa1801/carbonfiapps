"use client"

import { useCallback, useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface UseEventRefreshOptions {
  onRefresh: () => Promise<void>
  enabled?: boolean
}

export function useEventRefresh({ onRefresh, enabled = true }: UseEventRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const pathname = usePathname()

  const performRefresh = useCallback(async () => {
    if (!enabled) return

    try {
      setIsRefreshing(true)
      await onRefresh()
      setRefreshCount((prev) => prev + 1)
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Refresh error:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, enabled])

  // Refresh on page change
  useEffect(() => {
    if (enabled) {
      performRefresh()
    }
  }, [pathname, enabled])

  // Initial refresh on mount
  useEffect(() => {
    if (enabled) {
      performRefresh()
    }
  }, [enabled])

  const manualRefresh = useCallback(async () => {
    await performRefresh()
  }, [performRefresh])

  const triggerRefresh = useCallback(async () => {
    await performRefresh()
  }, [performRefresh])

  return {
    refreshCount,
    isRefreshing,
    lastRefresh,
    manualRefresh,
    triggerRefresh,
  }
}
