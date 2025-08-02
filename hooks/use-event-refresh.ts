"use client"

import type React from "react"

import { useEffect, useCallback } from "react"
import type { Contract } from "ethers"
import { useWeb3 } from "@/components/web3-provider"

/**
 * Custom hook to refresh data based on contract events.
 * It listens for specified events on a given contract and triggers a refresh function.
 *
 * @param contract The ethers.js Contract instance to listen to.
 * @param eventNames An array of event names to listen for.
 * @param refreshFunction The function to call when an event is detected.
 * @param dependencies An array of dependencies for the `refreshFunction`.
 */
export function useEventRefresh(
  contract: Contract | null,
  eventNames: string[],
  refreshFunction: () => void,
  dependencies: React.DependencyList = [],
) {
  const { isConnected } = useWeb3()

  const memoizedRefresh = useCallback(refreshFunction, dependencies)

  useEffect(() => {
    if (!contract || !isConnected) {
      return
    }

    const listeners: { eventName: string; handler: (...args: any[]) => void }[] = []

    eventNames.forEach((eventName) => {
      const handler = (...args: any[]) => {
        console.log(`Event '${eventName}' detected, refreshing data.`, args)
        memoizedRefresh()
      }
      try {
        contract.on(eventName, handler)
        listeners.push({ eventName, handler })
      } catch (error) {
        console.error(`Error setting up listener for event ${eventName}:`, error)
      }
    })

    return () => {
      listeners.forEach(({ eventName, handler }) => {
        try {
          contract.off(eventName, handler)
        } catch (error) {
          console.error(`Error removing listener for event ${eventName}:`, error)
        }
      })
    }
  }, [contract, isConnected, eventNames, memoizedRefresh])
}
