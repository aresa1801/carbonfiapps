"use client"

import { useEffect, useCallback } from "react"
import { useWeb3 } from "@/components/web3-provider"
import type { Contract } from "ethers"

interface UseEventRefreshOptions {
  contract: Contract | null
  eventName: string
  onEvent: (...args: any[]) => void
  enabled?: boolean
}

export function useEventRefresh({ contract, eventName, onEvent, enabled = true }: UseEventRefreshOptions) {
  const { isConnected } = useWeb3()

  const handleEvent = useCallback(
    (...args: any[]) => {
      console.log(`Event '${eventName}' received:`, args)
      onEvent(...args)
    },
    [onEvent, eventName],
  )

  useEffect(() => {
    if (enabled && isConnected && contract) {
      console.log(`Listening for '${eventName}' events on contract: ${contract.target}`)
      contract.on(eventName, handleEvent)

      return () => {
        console.log(`Removing listener for '${eventName}' on contract: ${contract.target}`)
        contract.off(eventName, handleEvent)
      }
    }
  }, [contract, eventName, handleEvent, enabled, isConnected])
}
