"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseOptimizedRefreshOptions {
  initialDelay?: number // Delay before the first refresh (ms)
  interval?: number // Regular refresh interval (ms)
  onRefresh: () => Promise<void> | void // Function to call for refresh
  enabled?: boolean // Whether the auto-refresh is enabled
  dependencies?: React.DependencyList // Dependencies for the onRefresh callback
}

export function useOptimizedRefresh({
  initialDelay = 0,
  interval = 5000, // Default to 5 seconds
  onRefresh,
  enabled = true,
  dependencies = [],
}: UseOptimizedRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMounted = useRef(true)

  const executeRefresh = useCallback(async () => {
    if (!isMounted.current) return
    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error("Error during optimized refresh:", error)
    } finally {
      if (isMounted.current) {
        setIsRefreshing(false)
      }
    }
  }, [onRefresh])

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(executeRefresh, interval)
  }, [executeRefresh, interval])

  const stopAutoRefresh = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Manual refresh trigger
  const manualRefresh = useCallback(() => {
    stopAutoRefresh() // Stop current auto-refresh
    executeRefresh() // Execute immediately
    if (enabled) {
      startAutoRefresh() // Restart auto-refresh after manual refresh
    }
  }, [executeRefresh, enabled, startAutoRefresh, stopAutoRefresh])

  useEffect(() => {
    isMounted.current = true
    if (enabled) {
      // Clear any existing timers to prevent duplicates
      stopAutoRefresh()

      // Initial refresh after a delay
      timeoutRef.current = setTimeout(() => {
        executeRefresh()
        startAutoRefresh() // Start interval after the initial refresh
      }, initialDelay)
    } else {
      stopAutoRefresh()
    }

    return () => {
      isMounted.current = false
      stopAutoRefresh()
    }
  }, [enabled, initialDelay, startAutoRefresh, stopAutoRefresh, executeRefresh, ...dependencies])

  return { isRefreshing, manualRefresh: { refresh: manualRefresh, isRefreshing } }
}
