"use client"

/**
 * Custom hook for gas price estimation with native currency display
 * Handles special HBAR formatting for Hedera network
 */

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWallet } from "./useWallet"
import { isHederaNetwork } from "@/lib/networkConfig"

interface GasEstimate {
  gasPrice: string
  gasPriceWei: bigint | null
  gasPriceGwei: string | null
  isLoading: boolean
  error: string | null
  currencySymbol: string
  isHedera: boolean
}

export const useGasEstimate = () => {
  const { provider, network, chainId } = useWallet()
  const [gasState, setGasState] = useState<GasEstimate>({
    gasPrice: "0",
    gasPriceWei: null,
    gasPriceGwei: null,
    isLoading: false,
    error: null,
    currencySymbol: "ETH",
    isHedera: false,
  })

  /**
   * Fetch current gas price from the network
   * Works for all EVM networks including Hedera
   */
  const fetchGasPrice = async () => {
    if (!provider || !network) {
      setGasState((prev) => ({
        ...prev,
        gasPrice: "0",
        gasPriceWei: null,
        gasPriceGwei: null,
        currencySymbol: "ETH",
        isHedera: false,
      }))
      return
    }

    const isHederaNet = isHederaNetwork(network.chainId)

    setGasState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      currencySymbol: network.nativeCurrency.symbol,
      isHedera: isHederaNet,
    }))

    try {
      // Get current gas price from provider
      const gasPriceWei = await provider.getFeeData()
      const currentGasPrice = gasPriceWei.gasPrice || BigInt(0)

      // Format gas price in native currency
      const gasPriceFormatted = ethers.formatEther(currentGasPrice)
      const gasPriceDisplay = Number.parseFloat(gasPriceFormatted).toFixed(9)

      // Calculate Gwei for non-Hedera networks (Gwei doesn't apply to HBAR)
      let gasPriceGwei = null
      if (!isHederaNet) {
        const gweiValue = ethers.formatUnits(currentGasPrice, "gwei")
        gasPriceGwei = Number.parseFloat(gweiValue).toFixed(2)
      }

      setGasState({
        gasPrice: gasPriceDisplay,
        gasPriceWei: currentGasPrice,
        gasPriceGwei,
        isLoading: false,
        error: null,
        currencySymbol: network.nativeCurrency.symbol,
        isHedera: isHederaNet,
      })

      // Log for debugging
      if (isHederaNet) {
        console.log(`Gas Price (HBAR):`, gasPriceDisplay, "HBAR")
      } else {
        console.log(
          `Gas Price (${network.nativeCurrency.symbol}):`,
          gasPriceDisplay,
          network.nativeCurrency.symbol,
          `(${gasPriceGwei} Gwei)`,
        )
      }
    } catch (error: any) {
      console.error("Failed to fetch gas price:", error)
      setGasState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to fetch gas price",
      }))
    }
  }

  // Fetch gas price when network changes
  useEffect(() => {
    fetchGasPrice()
  }, [provider, network, chainId])

  // Auto-refresh gas price every 15 seconds
  useEffect(() => {
    if (!provider) return

    const interval = setInterval(fetchGasPrice, 15000)
    return () => clearInterval(interval)
  }, [provider, network])

  return {
    ...gasState,
    refetch: fetchGasPrice,
  }
}
