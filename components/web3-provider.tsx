"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { BrowserProvider, Contract, type JsonRpcSigner } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import { useOptimizedRefresh } from "@/hooks/use-optimized-refresh"
import {
  CAFI_TOKEN_ADDRESS,
  FAUCET_ADDRESS,
  STAKING_ADDRESS,
  FARMING_ADDRESS,
  NFT_ADDRESS,
  CARBON_RETIRE_ADDRESS,
  MARKETPLACE_ADDRESS,
  BSC_TESTNET_CHAIN_ID,
  HEDERA_TESTNET_CHAIN_ID,
} from "@/lib/constants"
import CAFITokenABI from "@/contracts/cafi-token-abi.json"
import FaucetABI from "@/contracts/faucet-abi.json"
import StakingABI from "@/contracts/staking-abi.json"
import FarmingABI from "@/contracts/farming-abi.json"
import NFTABI from "@/contracts/nft-abi.json"
import CarbonRetireABI from "@/contracts/carbon-retire-abi.json"
import MarketplaceABI from "@/contracts/marketplace-abi.json"

interface Web3ContextType {
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
  address: string | null
  chainId: number | null
  isConnected: boolean
  isLoading: boolean
  error: Error | null
  ethBalance: bigint | null
  stableTokenBalance: bigint | null
  faucetContract: Contract | null
  stakingContract: Contract | null
  farmingContract: Contract | null
  nftContract: Contract | null
  carbonRetireContract: Contract | null
  marketplaceContract: Contract | null
  cafiTokenContract: Contract | null
  isAdmin: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchNetwork: (chainId: number) => Promise<void>
  refreshBalances: () => void
  isRefreshing: boolean
  transactionStatus: {
    hash: string | null
    status: "pending" | "success" | "failed" | null
    message: string | null
  }
  setTransactionStatus: React.Dispatch<
    React.SetStateAction<{
      hash: string | null
      status: "pending" | "success" | "failed" | null
      message: string | null
    }>
  >
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [ethBalance, setEthBalance] = useState<bigint | null>(null)
  const [stableTokenBalance, setStableTokenBalance] = useState<bigint | null>(null)
  const [faucetContract, setFaucetContract] = useState<Contract | null>(null)
  const [stakingContract, setStakingContract] = useState<Contract | null>(null)
  const [farmingContract, setFarmingContract] = useState<Contract | null>(null)
  const [nftContract, setNftContract] = useState<Contract | null>(null)
  const [carbonRetireContract, setCarbonRetireContract] = useState<Contract | null>(null)
  const [marketplaceContract, setMarketplaceContract] = useState<Contract | null>(null)
  const [cafiTokenContract, setCafiTokenContract] = useState<Contract | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const { toast } = useToast()

  const [transactionStatus, setTransactionStatus] = useState<{
    hash: string | null
    status: "pending" | "success" | "failed" | null
    message: string | null
  }>({ hash: null, status: null, message: null })

  const isConnectingRef = useRef(false)

  const getNetworkRpcUrl = useCallback((id: number) => {
    switch (id) {
      case BSC_TESTNET_CHAIN_ID:
        return process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL
      case HEDERA_TESTNET_CHAIN_ID:
        return process.env.NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL
      default:
        return null
    }
  }, [])

  const initializeProvider = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError(new Error("MetaMask or compatible wallet not detected."))
      setIsLoading(false)
      return
    }

    try {
      const browserProvider = new BrowserProvider(window.ethereum)
      setProvider(browserProvider)

      const network = await browserProvider.getNetwork()
      setChainId(Number(network.chainId))

      const accounts = await browserProvider.listAccounts()
      if (accounts.length > 0) {
        const currentSigner = await browserProvider.getSigner()
        setSigner(currentSigner)
        setAddress(currentSigner.address)
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (err: any) {
      console.error("Error initializing provider:", err)
      setError(new Error(`Failed to initialize Web3 provider: ${err.message || err}`))
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchBalances = useCallback(async () => {
    if (!provider || !address) return

    try {
      const ethBal = await provider.getBalance(address)
      setEthBalance(ethBal)

      if (cafiTokenContract) {
        const stableBal = await cafiTokenContract.balanceOf(address)
        setStableTokenBalance(stableBal)
      }
    } catch (err: any) {
      console.error("Error fetching balances:", err)
      setError(new Error(`Failed to fetch balances: ${err.message || err}`))
    }
  }, [provider, address, cafiTokenContract])

  const fetchAdminStatus = useCallback(async () => {
    if (!faucetContract || !address) return
    try {
      const adminRole = await faucetContract.DEFAULT_ADMIN_ROLE()
      const isAdminUser = await faucetContract.hasRole(adminRole, address)
      setIsAdmin(isAdminUser)
    } catch (err: any) {
      console.error("Error fetching admin status:", err)
      setError(new Error(`Failed to fetch admin status: ${err.message || err}`))
      setIsAdmin(false) // Default to false on error
    }
  }, [faucetContract, address])

  const { manualRefresh, isAutoRefreshing } = useOptimizedRefresh({
    initialDelay: 1000, // Initial delay before first auto-refresh
    interval: 10000, // Auto-refresh every 10 seconds
    onRefresh: useCallback(async () => {
      if (isConnected && address && provider) {
        await fetchBalances()
        await fetchAdminStatus()
      }
    }, [isConnected, address, provider, fetchBalances, fetchAdminStatus]),
    enabled: isConnected && !!address, // Only enable auto-refresh when connected and address is available
  })

  const refreshBalancesAndAdmin = useCallback(() => {
    manualRefresh.refresh()
  }, [manualRefresh])

  const disconnectWallet = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setChainId(null)
    setIsConnected(false)
    setEthBalance(null)
    setStableTokenBalance(null)
    setIsAdmin(false)
    setError(null)
    setTransactionStatus({ hash: null, status: null, message: null })
    toast({
      title: "Wallet Disconnected",
      description: "You have successfully disconnected your wallet.",
    })
  }, [toast])

  // Event listeners for account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log("Accounts changed:", accounts)
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setAddress(accounts[0])
          setIsConnected(true)
          // Re-initialize provider to get new signer
          initializeProvider()
        }
      }

      const handleChainChanged = (newChainId: string) => {
        console.log("Chain changed:", newChainId)
        setChainId(Number(newChainId))
        // Re-initialize provider to get new signer and contracts for the new chain
        initializeProvider()
        // Also refresh balances for the new chain
        if (address) {
          fetchBalances()
        }
      }

      const handleDisconnect = (error: any) => {
        console.log("Wallet disconnected:", error)
        disconnectWallet()
        toast({
          title: "Wallet Disconnected",
          description: error?.message || "Your wallet has been disconnected.",
          variant: "destructive",
        })
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("disconnect", handleDisconnect)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
        window.ethereum.removeListener("disconnect", handleDisconnect)
      }
    }
  }, [initializeProvider, toast, address, fetchBalances]) // Added address and fetchBalances to dependencies

  // Initialize provider on mount
  useEffect(() => {
    initializeProvider()
  }, [initializeProvider])

  // Fetch balances and admin status when connected or address changes
  useEffect(() => {
    if (isConnected && address && provider) {
      fetchBalances()
      fetchAdminStatus()
    }
  }, [isConnected, address, provider, fetchBalances, fetchAdminStatus])

  // Set up contracts when provider, signer, or chainId changes
  useEffect(() => {
    if (provider && signer && chainId) {
      try {
        const cafi = new Contract(CAFI_TOKEN_ADDRESS[chainId], CAFITokenABI, signer)
        setCafiTokenContract(cafi)
        setFaucetContract(new Contract(FAUCET_ADDRESS[chainId], FaucetABI, signer))
        setStakingContract(new Contract(STAKING_ADDRESS[chainId], StakingABI, signer))
        setFarmingContract(new Contract(FARMING_ADDRESS[chainId], FarmingABI, signer))
        setNftContract(new Contract(NFT_ADDRESS[chainId], NFTABI, signer))
        setCarbonRetireContract(new Contract(CARBON_RETIRE_ADDRESS[chainId], CarbonRetireABI, signer))
        setMarketplaceContract(new Contract(MARKETPLACE_ADDRESS[chainId], MarketplaceABI, signer))
      } catch (err: any) {
        console.error("Error setting up contracts:", err)
        setError(new Error(`Failed to load contracts for chain ${chainId}: ${err.message || err}`))
        // Clear contracts on error
        setCafiTokenContract(null)
        setFaucetContract(null)
        setStakingContract(null)
        setFarmingContract(null)
        setNftContract(null)
        setCarbonRetireContract(null)
        setMarketplaceContract(null)
      }
    } else {
      // Clear contracts if not connected or no signer/chain
      setCafiTokenContract(null)
      setFaucetContract(null)
      setStakingContract(null)
      setFarmingContract(null)
      setNftContract(null)
      setCarbonRetireContract(null)
      setMarketplaceContract(null)
    }
  }, [provider, signer, chainId])

  const connectWallet = useCallback(async () => {
    if (isConnectingRef.current) return // Prevent multiple connection attempts
    isConnectingRef.current = true
    setError(null) // Clear previous errors
    setIsLoading(true)

    if (typeof window === "undefined" || !window.ethereum) {
      setError(new Error("MetaMask or compatible wallet not detected. Please install it."))
      setIsLoading(false)
      isConnectingRef.current = false
      return
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      if (accounts.length > 0) {
        const browserProvider = new BrowserProvider(window.ethereum)
        setProvider(browserProvider)
        const currentSigner = await browserProvider.getSigner()
        setSigner(currentSigner)
        setAddress(currentSigner.address)
        setIsConnected(true)

        const network = await browserProvider.getNetwork()
        setChainId(Number(network.chainId))

        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].slice(-4)}`,
        })
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err)
      setError(new Error(`Failed to connect wallet: ${err.message || err}`))
      setIsConnected(false)
    } finally {
      setIsLoading(false)
      isConnectingRef.current = false
    }
  }, [toast])

  const switchNetwork = useCallback(
    async (targetChainId: number) => {
      if (!window.ethereum) {
        toast({
          title: "Error",
          description: "MetaMask is not installed.",
          variant: "destructive",
        })
        return
      }

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        })
        // Chain changed event will handle state update
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            const rpcUrl = getNetworkRpcUrl(targetChainId)
            if (!rpcUrl) {
              throw new Error(`RPC URL not configured for chain ID ${targetChainId}`)
            }

            let chainName = ""
            let nativeCurrencySymbol = ""
            let blockExplorerUrl = ""

            if (targetChainId === BSC_TESTNET_CHAIN_ID) {
              chainName = "Binance Smart Chain Testnet"
              nativeCurrencySymbol = "BNB"
              blockExplorerUrl = "https://testnet.bscscan.com"
            } else if (targetChainId === HEDERA_TESTNET_CHAIN_ID) {
              chainName = "Hedera Testnet"
              nativeCurrencySymbol = "HBAR"
              blockExplorerUrl = "https://hashscan.io/testnet"
            } else {
              throw new Error(`Network details not available for chain ID ${targetChainId}`)
            }

            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${targetChainId.toString(16)}`,
                  chainName: chainName,
                  rpcUrls: [rpcUrl],
                  nativeCurrency: {
                    name: nativeCurrencySymbol,
                    symbol: nativeCurrencySymbol,
                    decimals: 18,
                  },
                  blockExplorerUrls: [blockExplorerUrl],
                },
              ],
            })
            // Chain changed event will handle state update
          } catch (addError: any) {
            console.error("Error adding network:", addError)
            toast({
              title: "Error",
              description: `Failed to add network: ${addError.message || addError}`,
              variant: "destructive",
            })
          }
        } else {
          console.error("Error switching network:", switchError)
          toast({
            title: "Error",
            description: `Failed to switch network: ${switchError.message || switchError}`,
            variant: "destructive",
          })
        }
      }
    },
    [toast, getNetworkRpcUrl],
  )

  const isRefreshingCombined = manualRefresh.isRefreshing || isAutoRefreshing

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        address,
        chainId,
        isConnected,
        isLoading,
        error,
        ethBalance,
        stableTokenBalance,
        faucetContract,
        stakingContract,
        farmingContract,
        nftContract,
        carbonRetireContract,
        marketplaceContract,
        cafiTokenContract,
        isAdmin,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        refreshBalances: refreshBalancesAndAdmin,
        isRefreshing: isRefreshingCombined,
        transactionStatus,
        setTransactionStatus,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}
