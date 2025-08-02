"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { BrowserProvider, type JsonRpcSigner, Contract } from "ethers"
import { getContractAddresses, addNetworkToMetamask, getNetworkByChainId } from "@/lib/constants"
import CAFITokenABI from "@/contracts/cafi-token-abi.json"
import FaucetABI from "@/contracts/faucet-abi.json"
import StakingABI from "@/contracts/staking-abi.json"
import FarmingABI from "@/contracts/farming-abi.json"
import NFTABI from "@/contracts/nft-abi.json"
import CarbonRetireABI from "@/contracts/carbon-retire-abi.json"
import MarketplaceABI from "@/contracts/marketplace-abi.json"
import { formatEther } from "ethers"
import { useToast } from "@/hooks/use-toast"

interface Web3ContextType {
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
  address: string | null
  chainId: number | null
  isConnected: boolean
  isLoading: boolean
  error: Error | null
  nativeBalance: bigint | null
  cafiBalance: string
  isAdmin: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchNetwork: (newChainId: number) => Promise<void>
  refreshBalances: () => Promise<void>
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
  cafiTokenContract: Contract | null
  faucetContract: Contract | null
  stakingContract: Contract | null
  farmingContract: Contract | null
  nftContract: Contract | null
  carbonRetireContract: Contract | null
  marketplaceContract: Contract | null
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
  const [nativeBalance, setNativeBalance] = useState<bigint | null>(null)
  const [cafiBalance, setCafiBalance] = useState<string>("0")
  const [isAdmin, setIsAdmin] = useState(false)
  const { toast } = useToast()

  const [transactionStatus, setTransactionStatus] = useState<{
    hash: string | null
    status: "pending" | "success" | "failed" | null
    message: string | null
  }>({ hash: null, status: null, message: null })

  const [cafiTokenContract, setCafiTokenContract] = useState<Contract | null>(null)
  const [faucetContract, setFaucetContract] = useState<Contract | null>(null)
  const [stakingContract, setStakingContract] = useState<Contract | null>(null)
  const [farmingContract, setFarmingContract] = useState<Contract | null>(null)
  const [nftContract, setNftContract] = useState<Contract | null>(null)
  const [carbonRetireContract, setCarbonRetireContract] = useState<Contract | null>(null)
  const [marketplaceContract, setMarketplaceContract] = useState<Contract | null>(null)

  const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase()

  const initializeProvider = useCallback(async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const browserProvider = new BrowserProvider(window.ethereum)
        setProvider(browserProvider)

        const network = await browserProvider.getNetwork()
        setChainId(Number(network.chainId))

        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          const currentAddress = accounts[0]
          setAddress(currentAddress)
          setIsConnected(true)
          const signerInstance = await browserProvider.getSigner(currentAddress)
          setSigner(signerInstance)
        } else {
          setIsConnected(false)
          setAddress(null)
          setSigner(null)
        }
      } catch (err: any) {
        console.error("Error initializing provider:", err)
        setError(new Error("Failed to connect to Ethereum. Please refresh."))
        setIsConnected(false)
        setAddress(null)
        setSigner(null)
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
      setError(new Error("MetaMask or compatible wallet not detected."))
    }
  }, [])

  const connectWallet = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask or compatible wallet not detected.")
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      const selectedAddress = accounts[0] as string
      setAddress(selectedAddress)
      setIsConnected(true)

      const browserProvider = new BrowserProvider(window.ethereum)
      setProvider(browserProvider)
      const signerInstance = await browserProvider.getSigner(selectedAddress)
      setSigner(signerInstance)

      const network = await browserProvider.getNetwork()
      setChainId(Number(network.chainId))

      toast({
        title: "Wallet Connected",
        description: `Connected with ${selectedAddress.substring(0, 6)}...${selectedAddress.slice(-4)}`,
      })
    } catch (err: any) {
      console.error("Failed to connect wallet:", err)
      setError(new Error(err.message || "Failed to connect wallet."))
      toast({
        title: "Connection Failed",
        description: err.message || "Could not connect to wallet.",
        variant: "destructive",
      })
      setIsConnected(false)
      setAddress(null)
      setSigner(null)
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const disconnectWallet = useCallback(() => {
    setAddress(null)
    setSigner(null)
    setIsConnected(false)
    setNativeBalance(null)
    setCafiBalance("0")
    setIsAdmin(false)
    setCafiTokenContract(null)
    setFaucetContract(null)
    setStakingContract(null)
    setFarmingContract(null)
    setNftContract(null)
    setCarbonRetireContract(null)
    setMarketplaceContract(null)
    toast({
      title: "Wallet Disconnected",
      description: "You have successfully disconnected your wallet.",
    })
  }, [toast])

  const refreshBalances = useCallback(async () => {
    if (provider && address && chainId) {
      try {
        const nativeBal = await provider.getBalance(address)
        setNativeBalance(nativeBal)

        const contractAddresses = getContractAddresses(chainId)
        if (contractAddresses.CAFI_TOKEN) {
          const cafiContract = new Contract(contractAddresses.CAFI_TOKEN, CAFITokenABI, provider)
          const cafiBal = await cafiContract.balanceOf(address)
          setCafiBalance(formatEther(cafiBal))
        } else {
          setCafiBalance("0")
        }
      } catch (err) {
        console.error("Error refreshing balances:", err)
        setError(new Error("Failed to refresh balances."))
      }
    }
  }, [provider, address, chainId])

  const switchNetwork = useCallback(
    async (newChainId: number) => {
      if (!window.ethereum) {
        toast({
          title: "Wallet Not Detected",
          description: "Please install MetaMask or a compatible wallet.",
          variant: "destructive",
        })
        return
      }

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${newChainId.toString(16)}` }],
        })
        // If switch is successful, the 'chainChanged' event will handle state update
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            const networkInfo = getNetworkByChainId(newChainId)
            if (networkInfo) {
              await addNetworkToMetamask(networkInfo)
              // After adding, MetaMask will automatically try to switch
            } else {
              throw new Error(`Network with chainId ${newChainId} not supported.`)
            }
          } catch (addError: any) {
            console.error("Failed to add network:", addError)
            setError(new Error(addError.message || "Failed to add the new network."))
            toast({
              title: "Failed to Add Network",
              description: addError.message || "Could not add the network to your wallet.",
              variant: "destructive",
            })
          }
        } else {
          console.error("Failed to switch network:", switchError)
          setError(new Error(switchError.message || "Failed to switch network."))
          toast({
            title: "Failed to Switch Network",
            description: switchError.message || "Could not switch network in your wallet.",
            variant: "destructive",
          })
        }
      }
    },
    [toast],
  )

  // Effect for initial load and setting up event listeners
  useEffect(() => {
    initializeProvider()

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet()
      } else {
        setAddress(accounts[0])
        setIsConnected(true)
        if (provider) {
          provider.getSigner(accounts[0]).then(setSigner)
        }
        refreshBalances()
      }
    }

    const handleChainChanged = (hexChainId: string) => {
      const newChainId = Number(hexChainId)
      setChainId(newChainId)
      if (provider) {
        provider.getSigner(address || 0).then(setSigner) // Re-get signer for new chain
      }
      refreshBalances()
      toast({
        title: "Network Changed",
        description: `Switched to ${getNetworkByChainId(newChainId)?.name || "Unknown"} network.`,
      })
    }

    const handleDisconnect = (error: any) => {
      console.error("Wallet disconnected:", error)
      disconnectWallet()
      setError(new Error(error.message || "Wallet disconnected unexpectedly."))
      toast({
        title: "Wallet Disconnected",
        description: error.message || "Your wallet was disconnected.",
        variant: "destructive",
      })
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("disconnect", handleDisconnect)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.off("accountsChanged", handleAccountsChanged)
        window.ethereum.off("chainChanged", handleChainChanged)
        window.ethereum.off("disconnect", handleDisconnect)
      }
    }
  }, [initializeProvider, disconnectWallet, refreshBalances, provider, address, toast])

  // Effect to set up contract instances and check admin status
  useEffect(() => {
    if (signer && chainId) {
      const contractAddresses = getContractAddresses(chainId)

      setCafiTokenContract(new Contract(contractAddresses.CAFI_TOKEN, CAFITokenABI, signer))
      setFaucetContract(new Contract(contractAddresses.FAUCET, FaucetABI, signer))
      setStakingContract(new Contract(contractAddresses.STAKING, StakingABI, signer))
      setFarmingContract(new Contract(contractAddresses.FARMING, FarmingABI, signer))
      setNftContract(new Contract(contractAddresses.NFT, NFTABI, signer))
      setCarbonRetireContract(new Contract(contractAddresses.CARBON_RETIRE, CarbonRetireABI, signer))
      setMarketplaceContract(new Contract(contractAddresses.MARKETPLACE, MarketplaceABI, signer))

      // Check admin status
      if (address && ADMIN_ADDRESS) {
        setIsAdmin(address.toLowerCase() === ADMIN_ADDRESS)
      } else {
        setIsAdmin(false)
      }

      refreshBalances()
    } else {
      setCafiTokenContract(null)
      setFaucetContract(null)
      setStakingContract(null)
      setFarmingContract(null)
      setNftContract(null)
      setCarbonRetireContract(null)
      setMarketplaceContract(null)
      setIsAdmin(false)
    }
  }, [signer, chainId, address, refreshBalances, ADMIN_ADDRESS])

  // Effect to handle transaction status updates
  useEffect(() => {
    if (transactionStatus.hash && provider) {
      const checkTransaction = async () => {
        try {
          const receipt = await provider.waitForTransaction(
            transactionStatus.hash!,
            1, // confirmations
          )
          if (receipt && receipt.status === 1) {
            setTransactionStatus({
              hash: transactionStatus.hash,
              status: "success",
              message: "Transaction confirmed!",
            })
            refreshBalances()
          } else if (receipt && receipt.status === 0) {
            setTransactionStatus({
              hash: transactionStatus.hash,
              status: "failed",
              message: "Transaction failed on chain.",
            })
          }
        } catch (err: any) {
          console.error("Error checking transaction status:", err)
          setTransactionStatus({
            hash: transactionStatus.hash,
            status: "failed",
            message: err.message || "Transaction check failed.",
          })
        }
      }
      if (transactionStatus.status === "pending") {
        checkTransaction()
      }
    }
  }, [transactionStatus.hash, transactionStatus.status, provider, refreshBalances])

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
        nativeBalance,
        cafiBalance,
        isAdmin,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        refreshBalances,
        transactionStatus,
        setTransactionStatus,
        cafiTokenContract,
        faucetContract,
        stakingContract,
        farmingContract,
        nftContract,
        carbonRetireContract,
        marketplaceContract,
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
