"use client"

import { useState, useEffect, useCallback } from "react"
import { useWeb3 } from "@/components/web3-provider"

export const useOptimizedRefresh = (interval = 10000) => {
  const { isConnected, address, chainId, refreshBalances } = useWeb3()
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const triggerRefresh = useCallback(() => {
    refreshBalances()
    setLastRefresh(Date.now())
  }, [refreshBalances])

  useEffect(() => {
    if (!isConnected || !address || !chainId) {
      return // Don't refresh if not connected or no address/chainId
    }

    const timer = setInterval(() => {
      triggerRefresh()
    }, interval)

    return () => clearInterval(timer)
  }, [isConnected, address, chainId, interval, triggerRefresh])

  return { triggerRefresh, lastRefresh }
}
