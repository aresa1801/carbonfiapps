"use client"

import { useCallback, useRef, useEffect, useState } from "react"

interface UseOptimizedRefreshOptions {
  initialDelay?: number
  regularInterval?: number
  onRefresh: () => Promise<void>
  enabled?: boolean
  dependencies?: any[]
}

export function useOptimizedRefresh({
  initialDelay = 5000,
  regularInterval = 60000, // Default 60 seconds
  onRefresh,
  enabled = true,
  dependencies = [],
}: UseOptimizedRefreshOptions) {
  const [refreshCount, setRefreshCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(true)

  const performRefresh = useCallback(async () => {
    if (!enabled || !isActiveRef.current) return

    try {
      setIsRefreshing(true)
      await onRefresh()
      setRefreshCount((prev) => prev + 1)
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Auto refresh error:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, enabled])

  const setupRefresh = useCallback(() => {
    // Clear existing timers
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!enabled) return

    // Initial refresh after delay
    timeoutRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        performRefresh()

        // Set up regular intervals
        intervalRef.current = setInterval(() => {
          if (isActiveRef.current) {
            performRefresh()
          }
        }, regularInterval)
      }
    }, initialDelay)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [enabled, initialDelay, regularInterval, performRefresh])

  useEffect(() => {
    const cleanup = setupRefresh()
    return cleanup
  }, [setupRefresh, ...dependencies])

  useEffect(() => {
    return () => {
      isActiveRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const manualRefresh = useCallback(async () => {
    await performRefresh()
  }, [performRefresh])

  return {
    refreshCount,
    isRefreshing,
    lastRefresh,
    manualRefresh,
  }
}
