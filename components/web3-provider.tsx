"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

// Import from contract-utils and constants
import { contractService } from "@/lib/contract-utils"
import {
  CONTRACT_ADDRESSES,
  getContractAddresses,
  getNetworkByChainId,
  isSupportedNetwork,
  NETWORKS,
} from "@/lib/constants"
import { isMobileDevice, isInAppBrowser, getInAppBrowserType } from "@/lib/wallet-utils"

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  account: string | null
  chainId: number | null
  isConnecting: boolean
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  error: string | null
  // Connection state
  isAdmin: boolean
  balance: string
  nativeBalance: string // Changed from ethBalance to nativeBalance
  isClient: boolean
  isMobile: boolean
  inAppBrowser: boolean
  walletType: string
  isAutoConnecting: boolean
  isRefreshing: boolean

  // Contract state
  cafiTokenExists: boolean
  faucetContractExists: boolean
  stakingContractExists: boolean
  nftContractExists: boolean
  marketplaceContractExists: boolean
  carbonRetireContractExists: boolean
  farmingContractExists: boolean

  // Token info
  tokenSymbol: string
  tokenDecimals: number
  networkCurrencySymbol: string // Symbol for the native currency of the connected network

  // Network info
  networkName: string
  isLoadingBalance: boolean

  // Methods
  refreshBalances: () => Promise<void>
  reinitializeMetaMask: () => Promise<void>
  setAutoConnect: (enabled: boolean) => void
  fetchFaucetData: (address: string) => Promise<void>

  // Faucet data
  faucetStats: {
    dailyLimit: string
    remainingQuota: string
    todayTotal: string
    hasClaimedToday: boolean
  }
  isLoadingFaucetData: boolean

  // NFT Contract methods
  getMintFee: () => Promise<string>
  setMintFee: (newFee: string) => Promise<ethers.ContractTransactionResponse>
  getAutoApproveEnabled: () => Promise<boolean>
  toggleAutoApprove: () => Promise<ethers.ContractTransactionResponse>
  getTaxWallet: () => Promise<string>
  getManagementWallet: () => Promise<string>
  addVerifier: (name: string, wallet: string) => Promise<ethers.ContractTransactionResponse>
  getVerifier: (index: number) => Promise<{ name: string; wallet: string; isActive: boolean } | null>

  // Staking Contract methods
  approveTokens: (spender: string, amount: string) => Promise<ethers.ContractTransactionResponse>
  checkAllowance: (owner: string, spender: string) => Promise<string>
  addRewardPoolFunds: (amount: string) => Promise<ethers.ContractTransactionResponse>
  setAPY: (periodIndex: number, apy: string) => Promise<ethers.ContractTransactionResponse>
  getRewardPoolBalance: () => Promise<string>
  getTotalStaked: () => Promise<string>

  // Contract addresses
  ADMIN_ADDRESS: string
  CAFI_TOKEN_ADDRESS: string
  STAKING_CONTRACT_ADDRESS: string
  NFT_CONTRACT_ADDRESS: string
  FAUCET_CONTRACT_ADDRESS: string
  MARKETPLACE_CONTRACT_ADDRESS: string
  CARBON_RETIRE_CONTRACT_ADDRESS: string
  FARMING_CONTRACT_ADDRESS: string

  supportedNetwork: boolean
  currentNetworkContracts: typeof CONTRACT_ADDRESSES
}

// Create context with default values
const Web3Context = createContext<Web3ContextType>({
  provider: null,
  account: null,
  chainId: null,
  isConnecting: false,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  error: null,
  isAdmin: false,
  balance: "0",
  nativeBalance: "0", // Changed from ethBalance
  isClient: false,
  isMobile: false,
  inAppBrowser: false,
  walletType: "",
  isAutoConnecting: false,
  isRefreshing: false,
  cafiTokenExists: false,
  faucetContractExists: false,
  stakingContractExists: false,
  nftContractExists: false,
  marketplaceContractExists: false,
  carbonRetireContractExists: false,
  farmingContractExists: false,
  tokenSymbol: "CAFI",
  tokenDecimals: 18,
  networkCurrencySymbol: "ETH", // Default native currency symbol
  networkName: "",
  isLoadingBalance: false,
  refreshBalances: async () => {},
  reinitializeMetaMask: async () => {},
  setAutoConnect: (enabled: boolean) => {},
  fetchFaucetData: async (address: string) => {},
  faucetStats: {
    dailyLimit: "0",
    remainingQuota: "0",
    todayTotal: "0",
    hasClaimedToday: false,
  },
  isLoadingFaucetData: false,
  getMintFee: async () => "",
  setMintFee: async (newFee: string) => {
    throw new Error("Function not implemented.")
  },
  getAutoApproveEnabled: async () => false,
  toggleAutoApprove: async () => {
    throw new Error("Function not implemented.")
  },
  getTaxWallet: async () => "",
  getManagementWallet: async () => "",
  addVerifier: async (name: string, wallet: string) => {
    throw new Error("Function not implemented.")
  },
  getVerifier: async (index: number) => null,
  approveTokens: async (spender: string, amount: string) => {
    throw new Error("Function not implemented.")
  },
  checkAllowance: async (owner: string, spender: string) => "",
  addRewardPoolFunds: async (amount: string) => {
    throw new Error("Function not implemented.")
  },
  setAPY: async (periodIndex: number, apy: string) => {
    throw new Error("Function not implemented.")
  },
  getRewardPoolBalance: async () => "",
  getTotalStaked: async () => "",
  ADMIN_ADDRESS: "",
  CAFI_TOKEN_ADDRESS: "",
  STAKING_CONTRACT_ADDRESS: "",
  NFT_CONTRACT_ADDRESS: "",
  FAUCET_CONTRACT_ADDRESS: "",
  MARKETPLACE_CONTRACT_ADDRESS: "",
  CARBON_RETIRE_CONTRACT_ADDRESS: "",
  FARMING_CONTRACT_ADDRESS: "",
  supportedNetwork: true,
  currentNetworkContracts: CONTRACT_ADDRESSES,
})

export const useWeb3 = () => useContext(Web3Context)

interface Web3ProviderProps {
  children: ReactNode
  autoConnect?: boolean
}

export function Web3Provider({ children, autoConnect = true }: Web3ProviderProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [balance, setBalance] = useState("0") // CAFI token balance
  const [nativeBalance, setNativeBalance] = useState("0") // Native currency balance
  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [inAppBrowser, setInAppBrowser] = useState(false)
  const [walletType, setWalletType] = useState("")
  const [cafiTokenExists, setCafiTokenExists] = useState(false)
  const [faucetContractExists, setFaucetContractExists] = useState(false)
  const [stakingContractExists, setStakingContractExists] = useState(false)
  const [nftContractExists, setNftContractExists] = useState(false)
  const [marketplaceContractExists, setMarketplaceContractExists] = useState(false)
  const [carbonRetireContractExists, setCarbonRetireContractExists] = useState(false)
  const [farmingContractExists, setFarmingContractExists] = useState(false)
  const [tokenSymbol, setTokenSymbol] = useState("CAFI")
  const [tokenDecimals, setTokenDecimals] = useState(18)
  const [networkCurrencySymbol, setNetworkCurrencySymbol] = useState("ETH") // State for native currency symbol
  const [networkName, setNetworkName] = useState("")
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [isAutoConnecting, setIsAutoConnecting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingFaucetData, setIsLoadingFaucetData] = useState(false)
  const [faucetStats, setFaucetStats] = useState({
    dailyLimit: "0",
    remainingQuota: "0",
    todayTotal: "0",
    hasClaimedToday: false,
  })

  const [currentNetworkContracts, setCurrentNetworkContracts] = useState(CONTRACT_ADDRESSES)
  const [supportedNetwork, setSupportedNetwork] = useState(true)

  const router = useRouter()

  // Enhanced environment detection
  const isPreviewEnvironment = useCallback(() => {
    if (typeof window === "undefined") return false

    const hostname = window.location.hostname
    const isPreview =
      hostname.includes("vercel.app") ||
      hostname.includes("localhost") ||
      hostname.includes("v0.dev") ||
      hostname.includes("127.0.0.1") ||
      hostname.includes("preview") ||
      hostname.includes("staging") ||
      hostname.includes("netlify.app") ||
      hostname.includes("github.io")

    return isPreview
  }, [])

  // Enhanced wallet detection
  const detectWallet = useCallback(() => {
    if (typeof window === "undefined") return null

    try {
      const ethereum = window.ethereum
      if (!ethereum) return null

      // Check for MetaMask specifically
      if (ethereum.isMetaMask) {
        return { provider: ethereum, type: "MetaMask" }
      }

      // Check for multiple providers
      if (ethereum.providers && Array.isArray(ethereum.providers)) {
        const metaMaskProvider = ethereum.providers.find((p: any) => p.isMetaMask)
        if (metaMaskProvider) {
          return { provider: metaMaskProvider, type: "MetaMask" }
        }

        // Fallback to first available provider
        const firstProvider = ethereum.providers[0]
        if (firstProvider) {
          const type = firstProvider.isCoinbaseWallet
            ? "Coinbase"
            : firstProvider.isRabby
              ? "Rabby"
              : firstProvider.isTrust
                ? "Trust"
                : "Unknown"
          return { provider: firstProvider, type }
        }
      }

      // Check for other wallet types
      if (ethereum.isCoinbaseWallet) {
        return { provider: ethereum, type: "Coinbase" }
      }
      if (ethereum.isRabby) {
        return { provider: ethereum, type: "Rabby" }
      }
      if (ethereum.isTrust) {
        return { provider: ethereum, type: "Trust" }
      }

      // Generic ethereum provider
      return { provider: ethereum, type: "Generic" }
    } catch (error) {
      console.error("Error detecting wallet:", error)
      return null
    }
  }, [])

  // Initialize client-side flag and device detection
  useEffect(() => {
    setIsClient(true)
    if (typeof window !== "undefined") {
      setIsMobile(isMobileDevice())
      setInAppBrowser(isInAppBrowser())
      if (isInAppBrowser()) {
        setWalletType(getInAppBrowserType())
      }
    }
  }, [])

  const handleChainChanged = useCallback(() => {
    console.log("Chain changed, refreshing...")
    getNetworkInfo()
    // Don't reload the page, just refresh network info
  }, [])

  const handleDisconnect = useCallback(() => {
    console.log("Wallet disconnected")
    disconnect()
  }, [])

  const getNetworkInfo = async () => {
    try {
      const walletInfo = detectWallet()
      if (walletInfo?.provider) {
        console.log("[Web3Provider] Fetching network info...")
        const chainIdHex = await walletInfo.provider.request({ method: "eth_chainId" })
        const chainIdNum = Number.parseInt(chainIdHex, 16)
        setChainId(chainIdNum)

        // Update contract addresses based on network
        const networkContracts = getContractAddresses(chainIdNum)
        setCurrentNetworkContracts(networkContracts)

        // Check if network is supported
        const isSupported = isSupportedNetwork(chainIdNum)
        setSupportedNetwork(isSupported)

        // Get network name and currency symbol
        const network = getNetworkByChainId(chainIdNum)
        const networkName = network?.name || `Chain ID: ${chainIdNum}`
        const networkCurrencySymbol = network?.currency?.symbol || "ETH" // Default to ETH
        setNetworkName(networkName)
        setNetworkCurrencySymbol(networkCurrencySymbol)

        console.log(`[Web3Provider] Connected to ${networkName} (Chain ID: ${chainIdNum})`)
        console.log(`[Web3Provider] Native currency: ${networkCurrencySymbol}`)
        console.log(`[Web3Provider] Using contracts:`, networkContracts)

        if (!isSupported) {
          console.warn(`[Web3Provider] Network ${networkName} is not officially supported`)
        }
      } else {
        console.log("[Web3Provider] No wallet provider detected for network info.")
      }
    } catch (error) {
      console.error("[Web3Provider] Error getting network info:", error)
    }
  }

  // Check contracts existence with real addresses
  const checkContractsExistence = async () => {
    try {
      console.log("[Web3Provider] Checking contract existence with current network addresses...")

      // Initialize contract service with the provider if not already done
      const walletInfo = detectWallet()
      if (walletInfo?.provider && !contractService.provider) {
        contractService.provider = new ethers.BrowserProvider(walletInfo.provider)
        console.log("[Web3Provider] ContractService provider re-initialized for existence check.")
      }

      // Check contracts one by one with error handling
      const contractChecks = [
        { name: "CAFI Token", address: currentNetworkContracts.CAFI_TOKEN, setter: setCafiTokenExists },
        { name: "Faucet", address: currentNetworkContracts.FAUCET, setter: setFaucetContractExists },
        { name: "Staking", address: currentNetworkContracts.STAKING, setter: setStakingContractExists },
        { name: "NFT", address: currentNetworkContracts.NFT, setter: setNftContractExists },
        { name: "Marketplace", address: currentNetworkContracts.MARKETPLACE, setter: setMarketplaceContractExists },
        {
          name: "Carbon Retire",
          address: currentNetworkContracts.CARBON_RETIRE,
          setter: setCarbonRetireContractExists,
        },
        { name: "Farming", address: currentNetworkContracts.FARMING, setter: setFarmingContractExists },
      ]

      for (const { name, address, setter } of contractChecks) {
        try {
          console.log(`[Web3Provider] Checking ${name} at: ${address}`)
          const exists = await contractService.contractExists(address)
          setter(exists)
          console.log(`[Web3Provider] ${name} exists: ${exists}`)
        } catch (e) {
          console.error(`[Web3Provider] Error checking ${name} contract at ${address}:`, e)
          setter(false)
        }
      }
      console.log("[Web3Provider] All contract existence checks completed.")
    } catch (error) {
      console.error("[Web3Provider] Error in checkContractsExistence:", error)
    }
  }

  const fetchTokenInfo = async () => {
    try {
      if (cafiTokenExists && currentNetworkContracts.CAFI_TOKEN) {
        const tokenContract = await contractService.getTokenContract(currentNetworkContracts.CAFI_TOKEN)
        try {
          const [symbol, decimals] = await Promise.all([tokenContract.symbol(), tokenContract.decimals()])
          setTokenSymbol(symbol)
          setTokenDecimals(Number(decimals))
          console.log(`Token info: Symbol=${symbol}, Decimals=${decimals}`)
        } catch (error) {
          console.error("Error fetching token info:", error)
          // Use default values
          setTokenSymbol("CAFI")
          setTokenDecimals(18)
        }
      } else {
        // Use default values
        setTokenSymbol("CAFI")
        setTokenDecimals(18)
      }
    } catch (error) {
      console.error("Error in fetchTokenInfo:", error)
      setTokenSymbol("CAFI")
      setTokenDecimals(18)
    }
  }

  // Enhanced fetch balances - Native and CAFI together
  const fetchBalances = async (address: string) => {
    try {
      setIsLoadingBalance(true)
      console.log("[Web3Provider] 🔄 Fetching native and CAFI balances for address:", address)

      // Initialize contract service with the provider if not already done
      const walletInfo = detectWallet()
      if (walletInfo?.provider && !contractService.provider) {
        contractService.provider = new ethers.BrowserProvider(walletInfo.provider)
        console.log("[Web3Provider] ContractService provider re-initialized for balance fetch.")
      }

      // Prepare promises for parallel execution
      const balancePromises = []

      // Native Balance Promise
      const nativeBalancePromise = (async () => {
        try {
          const provider = await contractService.getProvider()
          const nativeBalanceWei = await provider.getBalance(address)
          const nativeBalanceFormatted = ethers.formatEther(nativeBalanceWei)
          console.log(`✅ ${networkCurrencySymbol} Balance fetched:`, nativeBalanceFormatted)
          return { type: "native", balance: Number.parseFloat(nativeBalanceFormatted).toFixed(4) }
        } catch (nativeError) {
          console.error(`❌ Error fetching ${networkCurrencySymbol} balance:`, nativeError)
          return { type: "native", balance: "0" }
        }
      })()

      // CAFI Balance Promise
      const cafiBalancePromise = (async () => {
        try {
          if (currentNetworkContracts.CAFI_TOKEN && cafiTokenExists) {
            console.log("Attempting to fetch CAFI balance from:", currentNetworkContracts.CAFI_TOKEN)
            const tokenContract = await contractService.getTokenContract(currentNetworkContracts.CAFI_TOKEN)
            const tokenBalance = await tokenContract.balanceOf(address)
            const tokenBalanceFormatted = ethers.formatUnits(tokenBalance, tokenDecimals)
            console.log("✅ CAFI Balance fetched:", tokenBalanceFormatted)
            return { type: "cafi", balance: Number.parseFloat(tokenBalanceFormatted).toFixed(4) }
          } else {
            console.log("CAFI token contract not available")
            return { type: "cafi", balance: "0" }
          }
        } catch (tokenError) {
          console.error("❌ Error fetching CAFI balance:", tokenError)
          return { type: "cafi", balance: "0" }
        }
      })()

      // Execute both promises in parallel
      balancePromises.push(nativeBalancePromise, cafiBalancePromise)

      // Wait for all balance fetches to complete
      const balanceResults = await Promise.all(balancePromises)

      // Update state with results
      balanceResults.forEach((result) => {
        if (result.type === "native") {
          setNativeBalance(result.balance)
        } else if (result.type === "cafi") {
          setBalance(result.balance)
        }
      })

      console.log("[Web3Provider] ✅ All balances fetched successfully")

      // Fetch faucet data if connected
      if (isConnected && faucetContractExists && address) {
        await fetchFaucetData(address)
      }
    } catch (error) {
      console.error("[Web3Provider] ❌ Error in fetchBalances:", error)
      setBalance("0")
      setNativeBalance("0")
    } finally {
      setIsLoadingBalance(false)
    }
  }

  // Fetch faucet data from real contract
  const fetchFaucetData = async (address: string) => {
    try {
      setIsLoadingFaucetData(true)
      console.log("Loading faucet data for account:", address)

      if (!faucetContractExists || !currentNetworkContracts.FAUCET) {
        console.log("Faucet contract not available")
        return
      }

      const faucetContract = await contractService.getFaucetContract()

      // Use Promise.all to fetch all data in parallel
      const [dailyLimitBN, remainingQuotaBN, todayTotalBN, lastClaimTime] = await Promise.all([
        faucetContract.DAILY_LIMIT(),
        faucetContract.getRemainingDailyQuota(),
        faucetContract.todayTotal(),
        faucetContract.lastClaimTime(address),
      ])

      // Check if user has claimed today
      const lastClaimDate = new Date(Number(lastClaimTime) * 1000)
      const today = new Date()
      const hasClaimedToday = lastClaimDate.toDateString() === today.toDateString() && Number(lastClaimTime) > 0

      // Format the values
      const dailyLimit = ethers.formatEther(dailyLimitBN)
      const remainingQuota = ethers.formatEther(remainingQuotaBN)
      const todayTotal = ethers.formatEther(todayTotalBN)

      console.log("Faucet data loaded:", {
        dailyLimit,
        remainingQuota,
        todayTotal,
        hasClaimedToday,
      })

      setFaucetStats({
        dailyLimit,
        remainingQuota,
        todayTotal,
        hasClaimedToday,
      })
    } catch (error) {
      console.error("Error loading faucet data:", error)
      toast({
        title: "Failed to load faucet data",
        description: "Please try refreshing the page",
        variant: "destructive",
      })
    } finally {
      setIsLoadingFaucetData(false)
    }
  }

  // Update the handleAccountsChanged function to check for specific admin address
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      console.log("[Web3Provider] 🔌 Wallet disconnected via accountsChanged event.")
      setAccount(null)
      setIsConnected(false)
      setBalance("0")
      setNativeBalance("0") // Changed from ethBalance
      setIsAdmin(false)
      console.log("🔌 Wallet disconnected")
      localStorage.removeItem("carbonfi-auto-connect")

      // Reset faucet stats
      setFaucetStats({
        dailyLimit: "0",
        remainingQuota: "0",
        todayTotal: "0",
        hasClaimedToday: false,
      })

      // Only redirect to home page when wallet is disconnected
      const currentPath = window.location.pathname
      if (currentPath !== "/") {
        router.push("/")
      }
    } else {
      // User connected or switched accounts
      const newAccount = accounts[0]
      console.log(`[Web3Provider] 🔗 Wallet accounts changed/reconnecting: ${newAccount}`)

      // Check if admin FIRST before setting other states
      const ADMIN_WALLET_ADDRESS = "0x732eBd7B8c50A8e31EAb04aF774F4160C8c22Dd6"
      const isSpecificAdmin = newAccount.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()

      console.log("👑 Admin Check Details:")
      console.log("- Connected Address:", newAccount.toLowerCase())
      console.log("- Admin Address:", ADMIN_WALLET_ADDRESS.toLowerCase())
      console.log("- Is Admin:", isSpecificAdmin)

      // Set states
      setAccount(newAccount)
      setIsConnected(true)
      setIsAdmin(isSpecificAdmin)

      // Initialize contract service with the provider
      const walletInfo = detectWallet()
      if (walletInfo?.provider) {
        contractService.provider = new ethers.BrowserProvider(walletInfo.provider)
      }

      // Re-check all contracts and balances on reconnection
      console.log("[Web3Provider] 🔄 Re-checking contracts and balances after account change...")
      await checkContractsExistence()
      await fetchTokenInfo() // Ensure token info is fetched after contract existence
      await fetchBalances(newAccount)
      console.log("[Web3Provider] ✅ Reconnection complete - Admin Status:", isSpecificAdmin)
    }
  }

  // Connect wallet with enhanced error handling
  const connect = async () => {
    const walletInfo = detectWallet()

    if (!walletInfo) {
      const errorMsg = "No Ethereum wallet found. Please install MetaMask or another compatible wallet."
      setError(errorMsg)
      toast({
        title: "Wallet Not Found",
        description: errorMsg,
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      console.log(`[Web3Provider] Attempting to connect to ${walletInfo.type} wallet...`)

      const browserProvider = new ethers.BrowserProvider(walletInfo.provider)
      const accounts = await browserProvider.send("eth_requestAccounts", [])
      const network = await browserProvider.getNetwork()

      const connectedAccount = accounts[0]

      // Check admin status immediately
      const ADMIN_WALLET_ADDRESS = "0x732eBd7B8c50A8e31EAb04aF774F4160C8c22Dd6"
      const isSpecificAdmin = connectedAccount.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()

      console.log("[Web3Provider] 🔗 Connect Function - Admin Check:")
      console.log(`[Web3Provider] - Connected Account: ${connectedAccount}`)
      console.log(`[Web3Provider] - Is Admin: ${isSpecificAdmin}`)

      setProvider(browserProvider)
      setAccount(connectedAccount)
      setChainId(Number(network.chainId))
      setIsConnected(true)
      setIsAdmin(isSpecificAdmin) // Set admin status immediately
      setWalletType(walletInfo.type)

      // Save auto-connect preference
      localStorage.setItem("carbonfi-auto-connect", "true")

      // Initialize contract service with the provider
      contractService.provider = browserProvider
      console.log("[Web3Provider] Contract service provider initialized.")

      // Fetch balances and contract data
      console.log("[Web3Provider] Fetching contract existence and balances...")
      await checkContractsExistence()
      await fetchTokenInfo() // Ensure token info is fetched after contract existence
      await fetchBalances(connectedAccount)
      console.log("[Web3Provider] Contract existence and balances fetched.")

      toast({
        title: "Wallet Connected",
        description: `Successfully connected ${walletInfo.type} wallet: ${connectedAccount.substring(0, 6)}...${connectedAccount.substring(38)}`,
      })
    } catch (error: any) {
      console.error("[Web3Provider] Failed to connect wallet:", error)

      let errorMessage = "Failed to connect wallet"
      if (error.code === 4001) {
        errorMessage = "Connection rejected by user"
      } else if (error.code === -32002) {
        errorMessage = "Connection request already pending"
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect wallet
  const disconnect = () => {
    setAccount(null)
    setIsConnected(false)
    setProvider(null)
    localStorage.removeItem("carbonfi-auto-connect")
    sessionStorage.removeItem("dashboard-choice") // Clear dashboard choice

    // Reset balances and faucet data
    setBalance("0")
    setNativeBalance("0") // Changed from ethBalance
    setFaucetStats({
      dailyLimit: "0",
      remainingQuota: "0",
      todayTotal: "0",
      hasClaimedToday: false,
    })

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    })

    // Redirect to home page
    router.push("/")
  }

  const reinitializeMetaMask = async () => {
    const walletInfo = detectWallet()

    if (walletInfo?.provider) {
      try {
        console.log("🔄 Re-initializing wallet connection...")
        setIsRefreshing(true)

        // Initialize contract service with the provider
        contractService.provider = new ethers.BrowserProvider(walletInfo.provider)

        // Check if already connected
        const accounts = await walletInfo.provider.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          await handleAccountsChanged(accounts)
        }

        // Get network info
        await getNetworkInfo()

        console.log("✅ Wallet re-initialization complete")

        toast({
          title: "Wallet Refreshed",
          description: "Your wallet data has been refreshed.",
        })
      } catch (error) {
        console.error("❌ Error re-initializing wallet:", error)

        toast({
          title: "Refresh Failed",
          description: "Failed to refresh wallet data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsRefreshing(false)
      }
    } else {
      console.log("❌ No wallet detected during re-initialization")

      toast({
        title: "Wallet Not Found",
        description: "No Ethereum wallet detected. Please install a compatible wallet.",
        variant: "destructive",
      })
    }
  }

  // Set auto-connect preference
  const setAutoConnect = (enabled: boolean) => {
    if (enabled) {
      localStorage.setItem("carbonfi-auto-connect", "true")
    } else {
      localStorage.removeItem("carbonfi-auto-connect")
    }
  }

  // Update the refreshBalances function
  const refreshBalances = async () => {
    if (account) {
      setIsRefreshing(true)
      try {
        await fetchBalances(account)
      } catch (error) {
        console.error("Error refreshing balances:", error)
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  // Setup event listeners and check connection
  useEffect(() => {
    if (!isClient) return

    const setupWeb3 = async () => {
      try {
        const isPreview = isPreviewEnvironment()
        const walletInfo = detectWallet()

        if (walletInfo && !isPreview) {
          try {
            console.log(`[Web3Provider] Detected wallet: ${walletInfo.type}. Setting up provider...`)
            const browserProvider = new ethers.BrowserProvider(walletInfo.provider)
            contractService.provider = browserProvider
            setWalletType(walletInfo.type)

            // Check if user has previously connected
            const shouldAutoConnect = localStorage.getItem("carbonfi-auto-connect") === "true"
            console.log(`[Web3Provider] Auto-connect preference: ${shouldAutoConnect}`)

            // Check if already connected
            try {
              const accounts = await walletInfo.provider.request({ method: "eth_accounts" })
              if (accounts && accounts.length > 0) {
                console.log(`[Web3Provider] Existing accounts found: ${accounts[0]}. Handling account change...`)
                await handleAccountsChanged(accounts)
              } else {
                console.log("[Web3Provider] No existing accounts found.")
              }
            } catch (accountError) {
              console.warn("[Web3Provider] Error checking existing accounts:", accountError)
            }

            // Get network info
            await getNetworkInfo()

            // Auto connect if enabled
            if (autoConnect && shouldAutoConnect && !hasAttemptedAutoConnect) {
              setHasAttemptedAutoConnect(true)
              console.log("[Web3Provider] Attempting auto-connect in 1 second...")
              setTimeout(() => connect(), 1000) // Delay to ensure everything is initialized
            }

            // Setup event listeners with error handling
            try {
              console.log("[Web3Provider] Setting up wallet event listeners...")
              walletInfo.provider.on("accountsChanged", handleAccountsChanged)
              walletInfo.provider.on("chainChanged", handleChainChanged)
              walletInfo.provider.on("disconnect", handleDisconnect)
              console.log("[Web3Provider] Wallet event listeners set up.")
            } catch (listenerError) {
              console.warn("[Web3Provider] Error setting up event listeners:", listenerError)
            }
          } catch (error) {
            console.error("[Web3Provider] Error during wallet setup:", error)
          }
        } else {
          console.log("[Web3Provider] No wallet detected or running in preview mode. Setting up fallback provider.")

          // Set up a fallback provider for read-only operations
          try {
            const fallbackRPCs = [
              NETWORKS.HEDERA_TESTNET.rpcUrl, // Use Hedera Testnet RPC as a fallback
              NETWORKS.BSC_TESTNET.rpcUrl,
              NETWORKS.SEPOLIA.rpcUrl,
              "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
              "https://rpc.sepolia.org",
            ]

            for (const rpc of fallbackRPCs) {
              try {
                const fallbackProvider = new ethers.JsonRpcProvider(rpc)
                await fallbackProvider.getNetwork() // Test connection
                contractService.provider = fallbackProvider
                console.log(`[Web3Provider] Set up fallback provider: ${rpc}`)
                break
              } catch (rpcError) {
                console.warn(`[Web3Provider] Failed to connect to ${rpc}:`, rpcError)
                continue
              }
            }
          } catch (fallbackError) {
            console.error("[Web3Provider] Could not set up any fallback provider:", fallbackError)
          }
        }
      } catch (setupError) {
        console.error("[Web3Provider] Critical error in setupWeb3:", setupError)
      }
    }

    setupWeb3()

    // Cleanup function
    return () => {
      const walletInfo = detectWallet()
      if (walletInfo?.provider) {
        try {
          console.log("[Web3Provider] Cleaning up wallet event listeners...")
          walletInfo.provider.removeListener("accountsChanged", handleAccountsChanged)
          walletInfo.provider.removeListener("chainChanged", handleChainChanged)
          walletInfo.provider.removeListener("disconnect", handleDisconnect)
          console.log("[Web3Provider] Wallet event listeners cleaned up.")
        } catch (cleanupError) {
          console.warn("[Web3Provider] Error during cleanup:", cleanupError)
        }
      }
    }
  }, [isClient, autoConnect, hasAttemptedAutoConnect, isPreviewEnvironment])

  // NFT Contract Methods - Real implementations
  const getMintFee = async (): Promise<string> => {
    try {
      if (!nftContractExists) {
        throw new Error("NFT contract not available")
      }
      const nftContract = await contractService.getNftContract()
      const fee = await nftContract.mintFeePerTon()
      return contractService.formatTokenAmount(fee)
    } catch (error) {
      console.error("Error getting mint fee:", error)
      throw error
    }
  }

  const setMintFee = async (newFee: string): Promise<ethers.ContractTransactionResponse> => {
    try {
      if (!nftContractExists) {
        throw new Error("NFT contract not available")
      }
      const nftContract = await contractService.getNftContract(true)
      const feeInWei = contractService.parseTokenAmount(newFee)
      return await nftContract.setMintFeePerTon(feeInWei)
    } catch (error) {
      console.error("Error setting mint fee:", error)
      throw error
    }
  }

  const getAutoApproveEnabled = async (): Promise<boolean> => {
    try {
      if (!nftContractExists) {
        throw new Error("NFT contract not available")
      }
      const nftContract = await contractService.getNftContract()
      return await nftContract.autoApproveEnabled()
    } catch (error) {
      console.error("Error getting auto approve status:", error)
      throw error
    }
  }

  const toggleAutoApprove = async (): Promise<ethers.ContractTransactionResponse> => {
    try {
      if (!nftContractExists) {
        throw new Error("NFT contract not available")
      }
      const nftContract = await contractService.getNftContract(true)
      return await nftContract.toggleAutoApprove()
    } catch (error) {
      console.error("Error toggling auto approve:", error)
      throw error
    }
  }

  const getTaxWallet = async (): Promise<string> => {
    try {
      if (!nftContractExists) {
        throw new Error("NFT contract not available")
      }
      const nftContract = await contractService.getNftContract()
      return await nftContract.taxWallet()
    } catch (error) {
      console.error("Error getting tax wallet:", error)
      throw error
    }
  }

  const getManagementWallet = async (): Promise<string> => {
    try {
      if (!nftContractExists) {
        throw new Error("NFT contract not available")
      }
      const nftContract = await contractService.getNftContract()
      return await nftContract.managementWallet()
    } catch (error) {
      console.error("Error getting management wallet:", error)
      throw error
    }
  }

  const addVerifier = async (name: string, wallet: string): Promise<ethers.ContractTransactionResponse> => {
    try {
      if (!nftContractExists) {
        throw new Error("NFT contract not available")
      }
      const nftContract = await contractService.getNftContract(true)
      // Get the next verifier index by trying to find an empty slot
      let index = 0
      try {
        while (true) {
          const verifier = await nftContract.verifiers(index)
          if (!verifier.isActive && verifier.wallet === ethers.ZeroAddress) {
            break
          }
          index++
        }
      } catch {
        // If we get an error, it means we've reached the end, use current index
      }
      return await nftContract.setVerifier(index, name, wallet)
    } catch (error) {
      console.error("Error adding verifier:", error)
      throw error
    }
  }

  const getVerifier = async (index: number): Promise<{ name: string; wallet: string; isActive: boolean } | null> => {
    try {
      if (!nftContractExists) {
        throw new Error("NFT contract not available")
      }
      const nftContract = await contractService.getNftContract()
      const verifier = await nftContract.verifiers(index)
      return {
        name: verifier.name,
        wallet: verifier.wallet,
        isActive: verifier.isActive,
      }
    } catch (error) {
      console.error("Error getting verifier:", error)
      return null
    }
  }

  // Staking Contract Methods - Real implementations
  const approveTokens: (spender: string, amount: string) => Promise<ethers.ContractTransactionResponse> = async (
    spender: string,
    amount: string,
  ) => {
    try {
      if (!cafiTokenExists) {
        throw new Error("CAFI token contract not available")
      }
      console.log(`Approving ${amount} tokens for spender ${spender}`)
      const tokenContract = await contractService.getTokenContract(currentNetworkContracts.CAFI_TOKEN, true) // Use currentNetworkContracts
      const amountInWei = contractService.parseTokenAmount(amount)
      return await tokenContract.approve(spender, amountInWei)
    } catch (error) {
      console.error("Error approving tokens:", error)
      throw error
    }
  }

  const checkAllowance: (owner: string, spender: string) => Promise<string> = async (
    owner: string,
    spender: string,
  ) => {
    try {
      if (!cafiTokenExists) {
        throw new Error("CAFI token contract not available")
      }
      console.log(`Checking allowance for owner ${owner} and spender ${spender}`)
      const tokenContract = await contractService.getTokenContract(currentNetworkContracts.CAFI_TOKEN) // Use currentNetworkContracts
      const allowance = await tokenContract.allowance(owner, spender)
      return contractService.formatTokenAmount(allowance)
    } catch (error) {
      console.error("Error checking allowance:", error)
      return "0"
    }
  }

  const addRewardPoolFunds: (amount: string) => Promise<ethers.ContractTransactionResponse> = async (
    amount: string,
  ) => {
    try {
      if (!stakingContractExists) {
        throw new Error("Staking contract not available")
      }
      console.log(`Adding ${amount} tokens to reward pool`)
      const stakingContract = await contractService.getStakingContract(true)
      const amountInWei = contractService.parseTokenAmount(amount)
      return await stakingContract.addRewardPoolFunds(amountInWei)
    } catch (error) {
      console.error("Error adding reward pool funds:", error)
      throw error
    }
  }

  const setAPY: (periodIndex: number, apy: string) => Promise<ethers.ContractTransactionResponse> = async (
    periodIndex: number,
    apy: string,
  ) => {
    try {
      if (!stakingContractExists) {
        throw new Error("Staking contract not available")
      }
      console.log(`Setting APY for period ${periodIndex} to ${apy}`)
      const stakingContract = await contractService.getStakingContract(true)
      // Convert APY percentage to basis points (e.g., 5% = 500)
      const apyInBasisPoints = Math.round(Number.parseFloat(apy) * 100)
      return await stakingContract.setAPY(periodIndex, apyInBasisPoints)
    } catch (error) {
      console.error("Error setting APY:", error)
      throw error
    }
  }

  const getRewardPoolBalance: () => Promise<string> = async () => {
    try {
      if (!stakingContractExists) {
        throw new Error("Staking contract not available")
      }
      console.log("Getting reward pool balance")
      const stakingContract = await contractService.getStakingContract()

      // Try both methods to get reward pool balance
      try {
        // Try the new method first
        const rewardPoolBalance = await stakingContract.getRewardPoolBalance()
        console.log("Got reward pool balance using getRewardPoolBalance()")
        return contractService.formatTokenAmount(rewardPoolBalance)
      } catch (methodError) {
        console.log("getRewardPoolBalance() not available, falling back to rewardPoolBalance()")
        // Fall back to the old method
        const rewardPoolBalance = await stakingContract.rewardPoolBalance()
        return contractService.formatTokenAmount(rewardPoolBalance)
      }
    } catch (error) {
      console.error("Error getting reward pool balance:", error)
      throw error
    }
  }

  const getTotalStaked: () => Promise<string> = async () => {
    try {
      if (!stakingContractExists) {
        throw new Error("Staking contract not available")
      }
      console.log("Getting total staked")
      const stakingContract = await contractService.getStakingContract()
      const totalStaked = await stakingContract.totalStaked()
      return contractService.formatTokenAmount(totalStaked)
    } catch (error) {
      console.error("Error getting total staked:", error)
      throw error
    }
  }

  // Context value
  const contextValue: Web3ContextType = {
    provider,
    account,
    chainId,
    isConnecting,
    isConnected,
    connect,
    disconnect,
    error,
    // Connection state
    isAdmin,
    balance,
    nativeBalance, // Changed from ethBalance
    isClient,
    isMobile,
    inAppBrowser,
    walletType,
    isAutoConnecting,
    isRefreshing,

    // Contract state
    cafiTokenExists,
    faucetContractExists,
    stakingContractExists,
    nftContractExists,
    marketplaceContractExists,
    carbonRetireContractExists,
    farmingContractExists,

    // Token info
    tokenSymbol,
    tokenDecimals,
    networkCurrencySymbol, // Added

    // Network info
    networkName,
    isLoadingBalance,

    // Methods
    refreshBalances,
    reinitializeMetaMask,
    setAutoConnect,
    fetchFaucetData,

    // Faucet data
    faucetStats,
    isLoadingFaucetData,

    // NFT Contract methods
    getMintFee,
    setMintFee,
    getAutoApproveEnabled,
    toggleAutoApprove,
    getTaxWallet,
    getManagementWallet,
    addVerifier,
    getVerifier,

    // Staking Contract methods
    approveTokens,
    checkAllowance,
    addRewardPoolFunds,
    setAPY,
    getRewardPoolBalance,
    getTotalStaked,

    // Contract addresses
    ADMIN_ADDRESS: "0x732eBd7B8c50A8e31EAb04aF774F4160C8c22Dd6",
    CAFI_TOKEN_ADDRESS: currentNetworkContracts.CAFI_TOKEN,
    STAKING_CONTRACT_ADDRESS: currentNetworkContracts.STAKING,
    NFT_CONTRACT_ADDRESS: currentNetworkContracts.NFT,
    FAUCET_CONTRACT_ADDRESS: currentNetworkContracts.FAUCET,
    MARKETPLACE_CONTRACT_ADDRESS: currentNetworkContracts.MARKETPLACE,
    CARBON_RETIRE_CONTRACT_ADDRESS: currentNetworkContracts.CARBON_RETIRE,
    FARMING_CONTRACT_ADDRESS: currentNetworkContracts.FARMING,

    supportedNetwork,
    currentNetworkContracts,
  }

  return <Web3Context.Provider value={contextValue}>{children}</Web3Context.Provider>
}
