"use client"

/**
 * Custom hook to fetch native currency balance dynamically
 * Works with all supported networks including Hedera (HBAR)
 */

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWallet } from "./useWallet"
import { isHederaNetwork } from "@/lib/networkConfig"

interface BalanceState {
  balance: string
  balanceWei: bigint | null
  isLoading: boolean
  error: string | null
  symbol: string
}

export const useNativeBalance = (address?: string) => {
  const { provider, chainId, network, account } = useWallet()
  const [balanceState, setBalanceState] = useState<BalanceState>({
    balance: "0",
    balanceWei: null,
    isLoading: false,
    error: null,
    symbol: "ETH",
  })

  // Use provided address or connected account
  const targetAddress = address || account

  /**
   * Fetch native currency balance using provider.getBalance
   * Works for all networks including Hedera HBAR
   */
  const fetchBalance = async () => {
    if (!provider || !targetAddress || !network) {
      setBalanceState((prev) => ({
        ...prev,
        balance: "0",
        balanceWei: null,
        symbol: network?.nativeCurrency.symbol || "ETH",
      }))
      return
    }

    setBalanceState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      symbol: network.nativeCurrency.symbol,
    }))

    try {
      // Get balance in wei (works for all EVM networks including Hedera)
      const balanceWei = await provider.getBalance(targetAddress)

      // Format balance to readable format
      const balanceFormatted = ethers.formatEther(balanceWei)

      // For display purposes, limit decimal places
      const balanceDisplay = Number.parseFloat(balanceFormatted).toFixed(6)

      setBalanceState((prev) => ({
        ...prev,
        balance: balanceDisplay,
        balanceWei,
        isLoading: false,
        symbol: network.nativeCurrency.symbol,
      }))

      // Log for debugging - especially useful for Hedera
      if (isHederaNetwork(network.chainId)) {
        console.log(`HBAR Balance for ${targetAddress}:`, balanceDisplay, "HBAR")
      } else {
        console.log(
          `${network.nativeCurrency.symbol} Balance for ${targetAddress}:`,
          balanceDisplay,
          network.nativeCurrency.symbol,
        )
      }
    } catch (error: any) {
      console.error("Failed to fetch native balance:", error)
      setBalanceState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to fetch balance",
      }))
    }
  }

  // Fetch balance when dependencies change
  useEffect(() => {
    fetchBalance()
  }, [provider, targetAddress, chainId, network])

  // Auto-refresh balance every 15 seconds
  useEffect(() => {
    if (!provider || !targetAddress) return

    const interval = setInterval(fetchBalance, 15000)
    return () => clearInterval(interval)
  }, [provider, targetAddress, chainId])

  return {
    ...balanceState,
    refetch: fetchBalance,
    isHedera: chainId ? isHederaNetwork(chainId) : false,
  }
}
