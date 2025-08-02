"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useOptimizedRefresh } from "@/hooks/use-optimized-refresh"

// Import from contract-utils and constants
import { contractService } from "@/lib/contract-utils"
import { CONTRACT_ADDRESSES } from "@/lib/constants"
import { isMobileDevice, isInAppBrowser, getInAppBrowserType } from "@/lib/wallet-utils"

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  address: string | null
  chainId: number | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isLoading: boolean
  isConnecting: boolean
  error: string | null
  // Connection state
  isAdmin: boolean
  balance: string
  ethBalance: string
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
const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}

interface Web3ProviderProps {
  children: ReactNode
  autoConnect?: boolean
}

export function Web3Provider({ children, autoConnect = true }: Web3ProviderProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [balance, setBalance] = useState("0")
  const [ethBalance, setEthBalance] = useState("0")
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
  const [isConnected, setIsConnected] = useState(false) // Declare isConnected state

  const router = useRouter()
  const { toast } = useToast()
  const { triggerRefresh } = useOptimizedRefresh()

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

  const handleChainChanged = useCallback(
    (hexChainId: string) => {
      const newChainId = Number.parseInt(hexChainId, 16)
      setChainId(newChainId)
      toast({
        title: "Network Changed",
        description: `Switched to Chain ID: ${newChainId}`,
      })
      triggerRefresh() // Trigger a refresh on chain change
    },
    [toast, triggerRefresh],
  )

  const handleAccountsChanged = useCallback(
    (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        console.log("[Web3Provider] 🔌 Wallet disconnected via accountsChanged event.")
        setAddress(null)
        setIsConnected(false)
        setBalance("0")
        setEthBalance("0")
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

        // Check admin status immediately
        const ADMIN_WALLET_ADDRESS = "0x732eBd7B8c50A8e31EAb04aF774F4160C8c22Dd6"
        const isSpecificAdmin = newAccount.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()

        console.log("[Web3Provider] 🔗 Connect Function - Admin Check:")
        console.log(`[Web3Provider] - Connected Account: ${newAccount}`)
        console.log(`[Web3Provider] - Is Admin: ${isSpecificAdmin}`)

        setProvider(new ethers.BrowserProvider(window.ethereum))
        setSigner(window.ethereum.getSigner())
        setAddress(newAccount)
        setChainId(Number(window.ethereum.chainId))
        setIsConnected(true)
        setIsAdmin(isSpecificAdmin) // Set admin status immediately
        setWalletType("MetaMask")

        // Save auto-connect preference
        localStorage.setItem("carbonfi-auto-connect", "true")

        // Initialize contract service with the provider
        contractService.provider = new ethers.BrowserProvider(window.ethereum)
        console.log("[Web3Provider] Contract service provider initialized.")

        // Fetch balances and contract data
        console.log("[Web3Provider] Fetching contract existence and balances...")
        checkContractsExistence()
        fetchTokenInfo() // Ensure token info is fetched after contract existence
        fetchBalances(newAccount)
        console.log("[Web3Provider] Contract existence and balances fetched.")

        toast({
          title: "Wallet Connected",
          description: `Successfully connected MetaMask wallet: ${newAccount.substring(0, 6)}...${newAccount.substring(38)}`,
        })
      }
    },
    [router, toast],
  )

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      if (window.ethereum) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum)
        setProvider(browserProvider)

        const accounts = await browserProvider.send("eth_requestAccounts", [])
        const currentSigner = await browserProvider.getSigner()
        const currentChainId = (await browserProvider.getNetwork()).chainId

        setAddress(accounts[0])
        setSigner(currentSigner)
        setChainId(Number(currentChainId))

        // Add event listeners only once
        if (!window.ethereum.listenerCount("accountsChanged")) {
          window.ethereum.on("accountsChanged", handleAccountsChanged)
        }
        if (!window.ethereum.listenerCount("chainChanged")) {
          window.ethereum.on("chainChanged", handleChainChanged)
        }

        toast({
          title: "Wallet Connected",
          description: `Connected to: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
        })
      } else {
        setError("MetaMask or a compatible wallet is not installed.")
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask or a compatible wallet.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Failed to connect wallet:", err)
      setError(err.message || "Failed to connect wallet.")
      toast({
        title: "Connection Failed",
        description: err.message || "Could not connect to wallet.",
        variant: "destructive",
      })
      clearState()
    } finally {
      setIsConnecting(false)
    }
  }, [handleAccountsChanged, handleChainChanged, toast])

  const disconnectWallet = useCallback(() => {
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum.removeListener("chainChanged", handleChainChanged)
    }
    clearState()
    toast({
      title: "Wallet Disconnected",
      description: "You have successfully disconnected your wallet.",
    })
  }, [handleAccountsChanged, handleChainChanged, toast])

  const clearState = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setChainId(null)
    setError(null)
    setIsConnected(false) // Clear isConnected state
  }, [])

  const fetchBalances = async (address: string) => {
    try {
      setIsLoadingBalance(true)
      console.log("[Web3Provider] 🔄 Fetching ETH and CAFI balances for address:", address)

      // Initialize contract service with the provider if not already done
      const walletInfo = detectWallet()
      if (walletInfo?.provider && !contractService.provider) {
        contractService.provider = new ethers.BrowserProvider(walletInfo.provider)
        console.log("[Web3Provider] ContractService provider re-initialized for balance fetch.")
      }

      // Prepare promises for parallel execution
      const balancePromises = []

      // ETH Balance Promise
      const ethBalancePromise = (async () => {
        try {
          const provider = await contractService.getProvider()
          const ethBalanceWei = await provider.getBalance(address)
          const ethBalanceFormatted = ethers.formatEther(ethBalanceWei)
          console.log("✅ ETH Balance fetched:", ethBalanceFormatted)
          return { type: "eth", balance: Number.parseFloat(ethBalanceFormatted).toFixed(4) }
        } catch (ethError) {
          console.error("❌ Error fetching ETH balance:", ethError)
          return { type: "eth", balance: "0" }
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
      balancePromises.push(ethBalancePromise, cafiBalancePromise)

      // Wait for all balance fetches to complete
      const balanceResults = await Promise.all(balancePromises)

      // Update state with results
      balanceResults.forEach((result) => {
        if (result.type === "eth") {
          setEthBalance(result.balance)
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
      setEthBalance("0")
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

  // Update the refreshBalances function
  const refreshBalances = async () => {
    if (address) {
      setIsRefreshing(true)
      try {
        await fetchBalances(address)
      } catch (error) {
        console.error("Error refreshing balances:", error)
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  // Setup event listeners and check connection
  useEffect(() => {
    const initWallet = async () => {
      if (window.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await browserProvider.listAccounts()
          if (accounts.length > 0) {
            const currentSigner = await browserProvider.getSigner()
            const currentChainId = (await browserProvider.getNetwork()).chainId
            setProvider(browserProvider)
            setSigner(currentSigner)
            setAddress(accounts[0])
            setChainId(Number(currentChainId))
            setIsConnected(true) // Set isConnected state

            // Add event listeners
            if (!window.ethereum.listenerCount("accountsChanged")) {
              window.ethereum.on("accountsChanged", handleAccountsChanged)
            }
            if (!window.ethereum.listenerCount("chainChanged")) {
              window.ethereum.on("chainChanged", handleChainChanged)
            }
          }
        } catch (err) {
          console.error("Error initializing wallet:", err)
          setError("Error initializing wallet.")
        }
      }
      setIsLoading(false)
    }

    initWallet()

    // Cleanup event listeners on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [handleAccountsChanged, handleChainChanged])

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
      const tokenContract = await contractService.getTokenContract(CONTRACT_ADDRESSES.CAFI_TOKEN, true)
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
      const tokenContract = await contractService.getTokenContract(CONTRACT_ADDRESSES.CAFI_TOKEN)
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
    signer,
    address,
    chainId,
    connectWallet,
    disconnectWallet,
    isLoading,
    isConnecting,
    error,
    // Connection state
    isAdmin,
    balance,
    ethBalance,
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

    // Network info
    networkName,
    isLoadingBalance,

    // Methods
    refreshBalances,
    reinitializeMetaMask: async () => {},
    setAutoConnect: (enabled: boolean) => {},
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
