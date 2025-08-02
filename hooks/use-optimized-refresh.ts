"use client"

import type React from "react"
import { useCallback, useEffect, useRef } from "react"

/**
 * Custom hook for optimized data refreshing.
 * It provides a `refresh` function that can be called to trigger a data re-fetch,
 * and it automatically re-fetches data when the `chainId` or `address` changes.
 *
 * @param fetchFunction The asynchronous function to call for data fetching.
 * @param dependencies An array of dependencies for the `fetchFunction`.
 * @param chainId The current blockchain chain ID.
 * @param address The current connected wallet address.
 */
export function useOptimizedRefresh<T>(
  fetchFunction: () => Promise<T>,
  dependencies: React.DependencyList,
  chainId: number | null,
  address: string | null,
) {
  const lastChainId = useRef<number | null>(null)
  const lastAddress = useRef<string | null>(null)
  const isInitialMount = useRef(true)

  const refresh = useCallback(async () => {
    try {
      return await fetchFunction()
    } catch (error) {
      console.error("Error during refresh:", error)
      throw error
    }
  }, [fetchFunction])

  useEffect(() => {
    // Only run on subsequent changes, not on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastChainId.current = chainId
      lastAddress.current = address
      refresh() // Initial fetch
      return
    }

    // Trigger refresh if chainId or address changes
    if (chainId !== lastChainId.current || address !== lastAddress.current) {
      console.log("Chain ID or address changed, refreshing data...")
      refresh()
    }

    lastChainId.current = chainId
    lastAddress.current = address
  }, [chainId, address, refresh, ...dependencies]) // Add dependencies to useEffect
}
