"use client"

import { useEffect, useCallback } from "react"
import type { Contract } from "ethers"
import { useWeb3 } from "@/components/web3-provider"
import { useOptimizedRefresh } from "./use-optimized-refresh"

// Define a type for the event listener function
type EventListener = (...args: any[]) => void

interface EventConfig {
  contract: Contract | null
  eventName: string
  listener: EventListener
}

export const useEventRefresh = (eventConfigs: EventConfig[]) => {
  const { isConnected, address, chainId } = useWeb3()
  const { triggerRefresh } = useOptimizedRefresh()

  const setupListeners = useCallback(() => {
    eventConfigs.forEach(({ contract, eventName, listener }) => {
      if (contract && isConnected && address && chainId) {
        console.log(`Listening for ${eventName} on ${contract.target}`)
        contract.on(eventName, listener)
      }
    })
  }, [eventConfigs, isConnected, address, chainId])

  const cleanupListeners = useCallback(() => {
    eventConfigs.forEach(({ contract, eventName, listener }) => {
      if (contract) {
        console.log(`Removing listener for ${eventName} on ${contract.target}`)
        contract.off(eventName, listener)
      }
    })
  }, [eventConfigs])

  useEffect(() => {
    setupListeners()
    return () => {
      cleanupListeners()
    }
  }, [setupListeners, cleanupListeners])

  return { triggerRefresh }
}
