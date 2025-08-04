"use client"

/**
 * Custom hook to fetch ERC20 token balance using contract.balanceOf
 * Works across all supported EVM networks
 */

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWallet } from "./useWallet"

interface TokenInfo {
  symbol: string
  decimals: number
  name: string
}

interface TokenBalanceState {
  balance: string
  balanceWei: bigint | null
  tokenInfo: TokenInfo | null
  isLoading: boolean
  error: string | null
  isValidContract: boolean
}

// Standard ERC20 ABI for balanceOf, symbol, decimals, and name
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
]

export const useTokenBalance = (tokenAddress?: string, userAddress?: string) => {
  const { provider, account, network } = useWallet()
  const [tokenState, setTokenState] = useState<TokenBalanceState>({
    balance: "0",
    balanceWei: null,
    tokenInfo: null,
    isLoading: false,
    error: null,
    isValidContract: false,
  })

  // Use provided addresses or connected account
  const targetUserAddress = userAddress || account
  const targetTokenAddress = tokenAddress

  /**
   * Fetch token information (symbol, decimals, name)
   */
  const fetchTokenInfo = async (contract: ethers.Contract): Promise<TokenInfo | null> => {
    try {
      const [symbol, decimals, name] = await Promise.all([contract.symbol(), contract.decimals(), contract.name()])

      return { symbol, decimals: Number(decimals), name }
    } catch (error) {
      console.error("Failed to fetch token info:", error)
      return null
    }
  }

  /**
   * Fetch ERC20 token balance using contract.balanceOf
   */
  const fetchTokenBalance = async () => {
    if (!provider || !targetUserAddress || !targetTokenAddress || !network) {
      setTokenState((prev) => ({
        ...prev,
        balance: "0",
        balanceWei: null,
        tokenInfo: null,
        isValidContract: false,
      }))
      return
    }

    // Validate token address format
    if (!ethers.isAddress(targetTokenAddress)) {
      setTokenState((prev) => ({
        ...prev,
        error: "Invalid token contract address",
        isValidContract: false,
        isLoading: false,
      }))
      return
    }

    setTokenState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    try {
      // Create contract instance
      const tokenContract = new ethers.Contract(targetTokenAddress, ERC20_ABI, provider)

      // Fetch token info and balance in parallel
      const [tokenInfo, balanceWei] = await Promise.all([
        fetchTokenInfo(tokenContract),
        tokenContract.balanceOf(targetUserAddress),
      ])

      if (!tokenInfo) {
        throw new Error("Invalid ERC20 contract - could not fetch token information")
      }

      // Format balance using token decimals
      const balanceFormatted = ethers.formatUnits(balanceWei, tokenInfo.decimals)
      const balanceDisplay = Number.parseFloat(balanceFormatted).toFixed(6)

      setTokenState({
        balance: balanceDisplay,
        balanceWei,
        tokenInfo,
        isLoading: false,
        error: null,
        isValidContract: true,
      })

      console.log(`${tokenInfo.symbol} Balance for ${targetUserAddress}:`, balanceDisplay, tokenInfo.symbol)
    } catch (error: any) {
      console.error("Failed to fetch token balance:", error)

      let errorMessage = "Failed to fetch token balance"
      if (error.message.includes("call revert exception")) {
        errorMessage = "Invalid contract address or not an ERC20 token"
      } else if (error.message.includes("network")) {
        errorMessage = "Network error - please check your connection"
      }

      setTokenState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isValidContract: false,
      }))
    }
  }

  // Fetch balance when dependencies change
  useEffect(() => {
    if (targetTokenAddress && targetUserAddress) {
      fetchTokenBalance()
    } else {
      setTokenState({
        balance: "0",
        balanceWei: null,
        tokenInfo: null,
        isLoading: false,
        error: null,
        isValidContract: false,
      })
    }
  }, [provider, targetUserAddress, targetTokenAddress, network])

  return {
    ...tokenState,
    refetch: fetchTokenBalance,
  }
}
