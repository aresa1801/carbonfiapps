"use client"

/**
 * Custom hook for wallet connection and network management
 * Handles MetaMask connection, network switching, and account changes
 */

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { SUPPORTED_NETWORKS, getNetworkConfig, formatChainId, type NetworkConfig } from "@/lib/networkConfig"

interface WalletState {
  isConnected: boolean
  account: string | null
  chainId: number | null
  network: NetworkConfig | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  isLoading: boolean
  error: string | null
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    chainId: null,
    network: null,
    provider: null,
    signer: null,
    isLoading: false,
    error: null,
  })

  /**
   * Initialize provider and signer when wallet is connected
   */
  const initializeProvider = useCallback(async (account: string, chainId: number) => {
    try {
      if (!window.ethereum) return

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const network = getNetworkConfig(chainId)

      setWalletState((prev) => ({
        ...prev,
        isConnected: true,
        account,
        chainId,
        network,
        provider,
        signer,
        error: null,
      }))
    } catch (error) {
      console.error("Failed to initialize provider:", error)
      setWalletState((prev) => ({
        ...prev,
        error: "Failed to initialize wallet connection",
      }))
    }
  }, [])

  /**
   * Connect to MetaMask wallet
   */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setWalletState((prev) => ({
        ...prev,
        error: "MetaMask is not installed. Please install MetaMask to continue.",
      }))
      return
    }

    setWalletState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found")
      }

      // Get current chain ID
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      })

      const chainIdNumber = Number.parseInt(chainId, 16)
      await initializeProvider(accounts[0], chainIdNumber)
    } catch (error: any) {
      console.error("Failed to connect wallet:", error)
      setWalletState((prev) => ({
        ...prev,
        error: error.message || "Failed to connect wallet",
      }))
    } finally {
      setWalletState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [initializeProvider])

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      account: null,
      chainId: null,
      network: null,
      provider: null,
      signer: null,
      isLoading: false,
      error: null,
    })
  }, [])

  /**
   * Switch to a specific network
   */
  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) return

    const networkConfig = getNetworkConfig(targetChainId)
    if (!networkConfig) {
      setWalletState((prev) => ({
        ...prev,
        error: `Unsupported network: ${targetChainId}`,
      }))
      return
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: formatChainId(targetChainId) }],
      })
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: formatChainId(targetChainId),
                chainName: networkConfig.displayName,
                nativeCurrency: networkConfig.nativeCurrency,
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.blockExplorer],
              },
            ],
          })
        } catch (addError) {
          console.error("Failed to add network:", addError)
          setWalletState((prev) => ({
            ...prev,
            error: "Failed to add network to MetaMask",
          }))
        }
      } else {
        console.error("Failed to switch network:", switchError)
        setWalletState((prev) => ({
          ...prev,
          error: "Failed to switch network",
        }))
      }
    }
  }, [])

  /**
   * Handle account changes
   */
  const handleAccountsChanged = useCallback(
    (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet()
      } else if (accounts[0] !== walletState.account) {
        if (walletState.chainId) {
          initializeProvider(accounts[0], walletState.chainId)
        }
      }
    },
    [walletState.account, walletState.chainId, disconnectWallet, initializeProvider],
  )

  /**
   * Handle network changes
   */
  const handleChainChanged = useCallback(
    (chainId: string) => {
      const chainIdNumber = Number.parseInt(chainId, 16)
      if (walletState.account) {
        initializeProvider(walletState.account, chainIdNumber)
      }
    },
    [walletState.account, initializeProvider],
  )

  /**
   * Check if wallet is already connected on mount
   */
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        })

        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          })
          const chainIdNumber = Number.parseInt(chainId, 16)
          await initializeProvider(accounts[0], chainIdNumber)
        }
      } catch (error) {
        console.error("Failed to check wallet connection:", error)
      }
    }

    checkConnection()
  }, [initializeProvider])

  /**
   * Set up event listeners for account and network changes
   */
  useEffect(() => {
    if (!window.ethereum) return

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [handleAccountsChanged, handleChainChanged])

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    supportedNetworks: SUPPORTED_NETWORKS,
  }
}
