"use client"

import { useState, useEffect, useCallback } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TransactionStatus } from "@/components/transaction-status"
import { useToast } from "@/hooks/use-toast"
import {
  ShoppingCart,
  Tag,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Info,
  Calendar,
  MapPin,
  FileText,
  Leaf,
  User,
  Hash,
  Bug,
  DollarSign,
  Heart,
  Store,
  Plus,
  Minus,
  List,
} from "lucide-react"
import { contractService } from "@/lib/contract-utils"
import { ethers } from "ethers"

interface CarbonProject {
  tokenId: number
  projectName: string
  projectType: string
  location: string
  carbonReduction: string
  methodology: string
  documentHash: string
  imageCID: string
  startDate: number
  endDate: number
  creator: string
  balance: string
  isApproved?: boolean
}

interface MarketplaceListing {
  seller: string
  tokenId: number
  amount: string
  pricePerItem: string
  listingFeePaid: string
  totalPrice: string
  priceFormatted: string
  totalFormatted: string
  project?: CarbonProject
}

interface DebugInfo {
  userBalance: string
  listingAmount: string
  isApprovedForAll: boolean
  marketplaceAddress: string
  nftContractAddress: string
  userAddress: string
  refreshedBalance?: string
  contractBalance?: string
  listingFee?: string
  userCAFIBalance?: string
}

interface MarketplaceConstants {
  feePercent: number
  feeDenominator: number
  actualFeePercent: number
  minAmount: number
  minPrice: bigint
  minPriceFormatted: string
}

export default function MarketplacePage() {
  const {
    account,
    isConnected,
    nftContractExists,
    marketplaceContractExists,
    tokenSymbol,
    refreshBalances,
    tokenDecimals,
    currentNetworkContracts, // Access current network contracts
  } = useWeb3()
  const { toast } = useToast()

  // State
  const [userNFTs, setUserNFTs] = useState<CarbonProject[]>([])
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [txStatus, setTxStatus] = useState<{
    hash: string
    status: "pending" | "success" | "error"
    message: string
  } | null>(null)

  // Purchase quantities for each listing
  const [purchaseQuantities, setPurchaseQuantities] = useState<{ [key: string]: number }>({})

  // Form states
  const [listingForm, setListingForm] = useState({
    tokenId: "",
    amount: "",
    pricePerItem: "",
  })

  // Marketplace info
  const [marketplaceConstants, setMarketplaceConstants] = useState<MarketplaceConstants>({
    feePercent: 0,
    feeDenominator: 10000,
    actualFeePercent: 0,
    minAmount: 1,
    minPrice: BigInt(0),
    minPriceFormatted: "0",
  })
  const [feeWallet, setFeeWallet] = useState("")

  // Load user NFTs from CarbonFi contract
  const loadUserNFTs = useCallback(async () => {
    if (!isConnected || !account || !nftContractExists || !currentNetworkContracts.NFT) return

    try {
      setIsLoading(true)
      console.log("🔄 Loading user NFTs for account:", account)

      const nfts: CarbonProject[] = []
      const nftContract = await contractService.getNftContract(currentNetworkContracts.NFT)

      // Get current token ID to know the range
      let maxTokenId = 1
      try {
        maxTokenId = await nftContract.getCurrentTokenId()
        console.log("📊 Current max token ID:", maxTokenId)
      } catch (error) {
        console.log("Using default range for token scanning")
        maxTokenId = 50 // Default range if getCurrentTokenId fails
      }

      // Check for NFTs with token IDs from 1 to maxTokenId
      for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
        try {
          // Check balance for this token ID
          const balance = await nftContract.balanceOf(account, tokenId)

          if (balance > 0) {
            console.log(`✅ Found NFT ${tokenId} with balance:`, balance.toString())

            // Get project data using getProject method
            try {
              const project = await nftContract.getProject(tokenId)

              if (project && project.projectName) {
                // Check if project is approved by any verifier
                let isApproved = false
                try {
                  // Try to check approval status (this might not exist in all contract versions)
                  const verifierCount = await nftContract.VERIFIER_COUNT().catch(() => 5)
                  for (let i = 0; i < verifierCount; i++) {
                    try {
                      const verifier = await nftContract.verifiers(i)
                      if (verifier.isActive) {
                        const approved = await nftContract.isApproved(tokenId, verifier.wallet)
                        if (approved) {
                          isApproved = true
                          break
                        }
                      }
                    } catch (verifierError) {
                      // Continue checking other verifiers
                      continue
                    }
                  }
                } catch (approvalError) {
                  console.log("Could not check approval status:", approvalError)
                  isApproved = true // Assume approved if we can't check
                }

                nfts.push({
                  tokenId,
                  projectName: project.projectName,
                  projectType: project.projectType,
                  location: project.location,
                  carbonReduction: project.carbonReduction.toString(),
                  methodology: project.methodology,
                  documentHash: project.documentHash,
                  imageCID: project.imageCID,
                  startDate: Number(project.startDate),
                  endDate: Number(project.endDate),
                  creator: project.creator,
                  balance: balance.toString(),
                  isApproved,
                })

                console.log(`📋 Loaded project data for token ${tokenId}:`, {
                  name: project.projectName,
                  type: project.projectType,
                  location: project.location,
                  carbonTons: project.carbonReduction.toString(),
                  balance: balance.toString(),
                  isApproved,
                })
              }
            } catch (projectError) {
              console.error(`❌ Error loading project data for token ${tokenId}:`, projectError)

              // Fallback: try to get basic info from projects mapping
              try {
                const basicProject = await nftContract.projects(tokenId)
                if (basicProject && basicProject.projectName) {
                  nfts.push({
                    tokenId,
                    projectName: basicProject.projectName,
                    projectType: basicProject.projectType || "Unknown",
                    location: basicProject.location || "Unknown",
                    carbonReduction: basicProject.carbonReduction?.toString() || "0",
                    methodology: basicProject.methodology || "Unknown",
                    documentHash: basicProject.documentHash || "",
                    imageCID: basicProject.imageCID || "",
                    startDate: Number(basicProject.startDate) || 0,
                    endDate: Number(basicProject.endDate) || 0,
                    creator: basicProject.creator || "",
                    balance: balance.toString(),
                    isApproved: true, // Assume approved for fallback
                  })
                }
              } catch (fallbackError) {
                console.error(`❌ Fallback failed for token ${tokenId}:`, fallbackError)
              }
            }
          }
        } catch (error) {
          // Token doesn't exist or other error, continue
          continue
        }
      }

      setUserNFTs(nfts)
      console.log(`✅ Loaded ${nfts.length} NFTs for user`)

      if (nfts.length === 0) {
        toast({
          title: "No NFTs Found",
          description: "You don't have any Carbon Credit NFTs yet. Try minting some first!",
        })
      }
    } catch (error) {
      console.error("❌ Error loading user NFTs:", error)
      toast({
        title: "Error",
        description: "Failed to load your NFTs. Please try refreshing.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, account, nftContractExists, toast, currentNetworkContracts.NFT])

  // Load marketplace listings with project data
  const loadMarketplaceListings = useCallback(async () => {
    if (
      !marketplaceContractExists ||
      !nftContractExists ||
      !currentNetworkContracts.MARKETPLACE ||
      !currentNetworkContracts.NFT
    )
      return

    try {
      console.log("🔄 Loading marketplace listings...")
      setIsLoading(true)

      const listings: MarketplaceListing[] = []
      const marketplaceContract = await contractService.getMarketplaceContract(currentNetworkContracts.MARKETPLACE)
      const nftContract = await contractService.getNftContract(currentNetworkContracts.NFT)

      // Get all listing events to find active listings
      try {
        // Try to get ItemListed events from the contract
        const filter = marketplaceContract.filters.ItemListed()
        const events = await marketplaceContract.queryFilter(filter, -10000) // Last 10000 blocks

        console.log(`📊 Found ${events.length} listing events`)

        // Process each event to check if listing is still active
        for (const event of events) {
          try {
            const { seller, tokenId, amount, pricePerItem } = event.args || {}

            if (seller && tokenId && amount && pricePerItem) {
              // Check if listing is still active
              const listing = await marketplaceContract.listings(tokenId, seller)

              if (listing && listing.seller !== ethers.ZeroAddress && listing.amount > 0) {
                // Get project data for this token
                let project: CarbonProject | undefined
                try {
                  const projectData = await nftContract.getProject(tokenId)
                  if (projectData && projectData.projectName) {
                    project = {
                      tokenId: Number(tokenId),
                      projectName: projectData.projectName,
                      projectType: projectData.projectType,
                      location: projectData.location,
                      carbonReduction: projectData.carbonReduction.toString(),
                      methodology: projectData.methodology,
                      documentHash: projectData.documentHash,
                      imageCID: projectData.imageCID,
                      startDate: Number(projectData.startDate),
                      endDate: Number(projectData.endDate),
                      creator: projectData.creator,
                      balance: "0", // Not relevant for marketplace listings
                      isApproved: true,
                    }
                  }
                } catch (projectError) {
                  console.log(`Could not load project data for token ${tokenId}`)
                }

                const marketplaceListing: MarketplaceListing = {
                  seller: listing.seller,
                  tokenId: Number(tokenId),
                  amount: listing.amount.toString(),
                  pricePerItem: listing.pricePerItem.toString(),
                  listingFeePaid: listing.listingFeePaid?.toString() || "0",
                  totalPrice: (BigInt(listing.amount) * BigInt(listing.pricePerItem)).toString(),
                  priceFormatted: contractService.formatTokenAmount(listing.pricePerItem, tokenDecimals),
                  totalFormatted: contractService.formatTokenAmount(
                    BigInt(listing.amount) * BigInt(listing.pricePerItem),
                    tokenDecimals,
                  ),
                  project,
                }

                listings.push(marketplaceListing)
                console.log(`✅ Added listing: Token ${tokenId} by ${seller}`)

                // Initialize purchase quantity for this listing
                const listingKey = `${listing.seller}-${tokenId}`
                setPurchaseQuantities((prev) => ({
                  ...prev,
                  [listingKey]: prev[listingKey] || 1,
                }))
              }
            }
          } catch (eventError) {
            console.log("Error processing listing event:", eventError)
            continue
          }
        }
      } catch (eventError) {
        console.log("Could not load events, trying alternative method:", eventError)

        // Fallback: scan for listings manually (less efficient but works)
        // This would require knowing token IDs and seller addresses
        // For now, we'll just show empty state
      }

      setMarketplaceListings(listings)
      console.log(`✅ Loaded ${listings.length} marketplace listings`)
    } catch (error) {
      console.error("❌ Error loading marketplace listings:", error)
    } finally {
      setIsLoading(false)
    }
  }, [
    marketplaceContractExists,
    nftContractExists,
    tokenDecimals,
    account,
    currentNetworkContracts.MARKETPLACE,
    currentNetworkContracts.NFT,
  ])

  const loadMarketplaceInfo = useCallback(async () => {
    if (!marketplaceContractExists || !currentNetworkContracts.MARKETPLACE) return

    try {
      const marketplaceContract = await contractService.getMarketplaceContract(currentNetworkContracts.MARKETPLACE)

      // Get marketplace constants and fee wallet
      const [feePercentValue, feeDenominatorValue, minAmountValue, minPriceValue, feeWalletValue] = await Promise.all([
        marketplaceContract.FEE_PERCENT().catch(() => "0"),
        marketplaceContract.FEE_DENOMINATOR().catch(() => "10000"),
        marketplaceContract.MIN_AMOUNT().catch(() => "1"),
        marketplaceContract.MIN_PRICE().catch(() => "0"),
        marketplaceContract.feeWallet().catch(() => ""),
      ])

      // Calculate actual fee percentage
      const actualFeePercent = (Number(feePercentValue) / Number(feeDenominatorValue)) * 100

      const constants: MarketplaceConstants = {
        feePercent: Number(feePercentValue),
        feeDenominator: Number(feeDenominatorValue),
        actualFeePercent,
        minAmount: Number(minAmountValue),
        minPrice: BigInt(minPriceValue),
        minPriceFormatted: contractService.formatTokenAmount(minPriceValue, tokenDecimals),
      }

      setMarketplaceConstants(constants)
      setFeeWallet(feeWalletValue)

      console.log("✅ Marketplace info loaded:", {
        ...constants,
        feeWallet: feeWalletValue,
      })
    } catch (error) {
      console.error("❌ Error loading marketplace info:", error)
    }
  }, [marketplaceContractExists, tokenDecimals, currentNetworkContracts.MARKETPLACE])

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (isConnected && account && nftContractExists && currentNetworkContracts.NFT) {
      loadUserNFTs()
    }
  }, [isConnected, account, nftContractExists, loadUserNFTs, currentNetworkContracts.NFT])

  useEffect(() => {
    if (marketplaceContractExists && currentNetworkContracts.MARKETPLACE) {
      loadMarketplaceInfo()
      loadMarketplaceListings()
    }
  }, [marketplaceContractExists, loadMarketplaceInfo, loadMarketplaceListings, currentNetworkContracts.MARKETPLACE])

  const calculateListingFee = (amount: string, pricePerItem: string) => {
    try {
      if (!amount || !pricePerItem) return BigInt(0)

      const amountBig = BigInt(amount)
      const priceInWei = contractService.parseTokenAmount(pricePerItem, tokenDecimals)
      const totalValue = amountBig * BigInt(priceInWei)
      const fee = (totalValue * BigInt(marketplaceConstants.feePercent)) / BigInt(marketplaceConstants.feeDenominator)

      return fee
    } catch (error) {
      console.error("Error calculating listing fee:", error)
      return BigInt(0)
    }
  }

  // Helper functions for quantity management
  const getListingKey = (listing: MarketplaceListing) => `${listing.seller}-${listing.tokenId}`

  const getPurchaseQuantity = (listing: MarketplaceListing) => {
    const key = getListingKey(listing)
    return purchaseQuantities[key] || 1
  }

  const setPurchaseQuantity = (listing: MarketplaceListing, quantity: number) => {
    const key = getListingKey(listing)
    const maxQuantity = Number(listing.amount)
    const validQuantity = Math.max(1, Math.min(quantity, maxQuantity))

    setPurchaseQuantities((prev) => ({
      ...prev,
      [key]: validQuantity,
    }))
  }

  const calculateTotalCost = (listing: MarketplaceListing, quantity: number) => {
    const pricePerItem = BigInt(listing.pricePerItem)
    const totalCost = pricePerItem * BigInt(quantity)
    return contractService.formatTokenAmount(totalCost, tokenDecimals)
  }

  const handlePurchaseNFT = async (listing: MarketplaceListing) => {
    if (!listing.project) {
      toast({
        title: "Error",
        description: "Project information not available",
        variant: "destructive",
      })
      return
    }

    const purchaseAmount = getPurchaseQuantity(listing)

    if (purchaseAmount <= 0 || purchaseAmount > Number(listing.amount)) {
      toast({
        title: "Invalid Amount",
        description: `Please enter an amount between 1 and ${listing.amount}`,
        variant: "destructive",
      })
      return
    }

    if (!currentNetworkContracts.CAFI_TOKEN || !currentNetworkContracts.MARKETPLACE) {
      toast({
        title: "Error",
        description: "Contract addresses not available for current network.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus({
        hash: "",
        status: "pending",
        message: "Preparing to purchase NFT...",
      })

      // Calculate total price for the purchase amount
      const pricePerItem = BigInt(listing.pricePerItem)
      const totalPrice = pricePerItem * BigInt(purchaseAmount)

      // Get CAFI token contract and approve the marketplace
      const cafiContract = await contractService.getCAFITokenContract(currentNetworkContracts.CAFI_TOKEN, true)

      // Check user's CAFI balance
      const userBalance = await cafiContract.balanceOf(account)
      if (userBalance < totalPrice) {
        throw new Error(
          `Insufficient CAFI balance. Required: ${contractService.formatTokenAmount(
            totalPrice,
            tokenDecimals,
          )} ${tokenSymbol}, Available: ${contractService.formatTokenAmount(
            userBalance,
            tokenDecimals,
          )} ${tokenSymbol}`,
        )
      }

      setTxStatus({
        hash: "",
        status: "pending",
        message: "Approving CAFI tokens for purchase...",
      })

      // Approve CAFI tokens for the marketplace
      const approveTx = await cafiContract.approve(currentNetworkContracts.MARKETPLACE, totalPrice)
      console.log(`📝 CAFI Approval transaction:`, approveTx.hash)

      setTxStatus({
        hash: approveTx.hash,
        status: "pending",
        message: "CAFI approval transaction submitted...",
      })

      await approveTx.wait()
      console.log(`✅ CAFI Approval confirmed`)

      setTxStatus({
        hash: "",
        status: "pending",
        message: "Purchasing NFT...",
      })

      // Now purchase the NFT
      const marketplaceContract = await contractService.getMarketplaceContract(
        currentNetworkContracts.MARKETPLACE,
        true,
      )
      const purchaseTx = await marketplaceContract.buyItem(listing.seller, listing.tokenId, purchaseAmount)

      console.log(`📝 Purchase transaction:`, purchaseTx.hash)

      setTxStatus({
        hash: purchaseTx.hash,
        status: "pending",
        message: "Purchase transaction submitted. Waiting for confirmation...",
      })

      const receipt = await purchaseTx.wait()

      if (receipt?.status === 1) {
        console.log(`✅ Purchase confirmed:`, receipt.hash)

        setTxStatus({
          hash: purchaseTx.hash,
          status: "success",
          message: "NFT purchased successfully!",
        })

        // Reset purchase quantity for this listing
        const key = getListingKey(listing)
        setPurchaseQuantities((prev) => ({
          ...prev,
          [key]: 1,
        }))

        // Refresh data
        await Promise.all([loadUserNFTs(), loadMarketplaceListings(), refreshBalances()])

        toast({
          title: "Success",
          description: `Successfully purchased ${purchaseAmount} ${
            listing.project.projectName
          } NFT(s) for ${contractService.formatTokenAmount(totalPrice, tokenDecimals)} ${tokenSymbol}!`,
        })
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("❌ Error purchasing NFT:", error)

      let errorMessage = error.message || "Failed to purchase NFT"

      if (error.message?.includes("Insufficient CAFI balance")) {
        errorMessage = error.message
      } else if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user."
      } else if (error.message?.includes("execution reverted")) {
        errorMessage =
          "Transaction failed. The listing might no longer be available or you don't have enough CAFI tokens."
      }

      setTxStatus({
        hash: "",
        status: "error",
        message: errorMessage,
      })

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleListItem = async () => {
    if (!listingForm.tokenId || !listingForm.amount || !listingForm.pricePerItem) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Find the NFT in user's collection to check balance
    const selectedNFT = userNFTs.find((nft) => nft.tokenId.toString() === listingForm.tokenId)
    if (!selectedNFT) {
      toast({
        title: "Error",
        description: "You don't own this NFT token ID",
        variant: "destructive",
      })
      return
    }

    // Check if user has enough balance
    const userBalance = Number.parseInt(selectedNFT.balance)
    const listingAmount = Number.parseInt(listingForm.amount)

    if (listingAmount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${userBalance} NFTs but trying to list ${listingAmount}`,
        variant: "destructive",
      })
      return
    }

    if (listingAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Listing amount must be greater than 0",
        variant: "destructive",
      })
      return
    }

    // Check minimum amount
    if (listingAmount < marketplaceConstants.minAmount) {
      toast({
        title: "Amount Too Low",
        description: `Minimum listing amount is ${marketplaceConstants.minAmount}`,
        variant: "destructive",
      })
      return
    }

    // Check minimum price
    const priceInWei = contractService.parseTokenAmount(listingForm.pricePerItem, tokenDecimals)
    if (BigInt(priceInWei) < marketplaceConstants.minPrice) {
      toast({
        title: "Price Too Low",
        description: `Minimum price is ${marketplaceConstants.minPriceFormatted} ${tokenSymbol}`,
        variant: "destructive",
      })
      return
    }

    if (!currentNetworkContracts.NFT || !currentNetworkContracts.CAFI_TOKEN || !currentNetworkContracts.MARKETPLACE) {
      toast({
        title: "Error",
        description: "Contract addresses not available for current network.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus({
        hash: "",
        status: "pending",
        message: "Preparing to list NFT...",
      })

      // Calculate listing fee
      const listingFee = calculateListingFee(listingForm.amount, listingForm.pricePerItem)

      // Get contracts
      const nftContract = await contractService.getNftContract(currentNetworkContracts.NFT) // Read-only
      const nftContractWithSigner = await contractService.getNftContract(currentNetworkContracts.NFT, true) // With signer
      const cafiContract = await contractService.getCAFITokenContract(currentNetworkContracts.CAFI_TOKEN, true) // With signer
      const marketplaceContract = await contractService.getMarketplaceContract(
        currentNetworkContracts.MARKETPLACE,
        true,
      ) // With signer

      // Check CAFI balance for listing fee
      const cafiBalance = await cafiContract.balanceOf(account)
      if (cafiBalance < listingFee) {
        throw new Error(
          `Insufficient CAFI balance for listing fee. Required: ${contractService.formatTokenAmount(
            listingFee,
            tokenDecimals,
          )} ${tokenSymbol}, Available: ${contractService.formatTokenAmount(
            cafiBalance,
            tokenDecimals,
          )} ${tokenSymbol}`,
        )
      }

      // Check if marketplace is already approved for NFTs
      const isApprovedForAll = await nftContract.isApprovedForAll(account, currentNetworkContracts.MARKETPLACE)
      console.log(`🔍 Is approved for all (NFT):`, isApprovedForAll)

      if (!isApprovedForAll) {
        setTxStatus({
          hash: "",
          status: "pending",
          message: "Approving NFT for marketplace...",
        })

        const approveTx = await nftContractWithSigner.setApprovalForAll(currentNetworkContracts.MARKETPLACE, true)
        console.log(`📝 NFT Approval transaction:`, approveTx.hash)

        setTxStatus({
          hash: approveTx.hash,
          status: "pending",
          message: "NFT approval transaction submitted...",
        })

        await approveTx.wait()
        console.log(`✅ NFT Approval confirmed`)

        // Wait for the approval to propagate
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      // Check if marketplace is approved for CAFI tokens (for listing fee)
      const cafiAllowance = await cafiContract.allowance(account, currentNetworkContracts.MARKETPLACE)
      console.log(`🔍 CAFI allowance:`, contractService.formatTokenAmount(cafiAllowance, tokenDecimals))

      if (cafiAllowance < listingFee) {
        setTxStatus({
          hash: "",
          status: "pending",
          message: "Approving CAFI tokens for listing fee...",
        })

        const cafiApproveTx = await cafiContract.approve(currentNetworkContracts.MARKETPLACE, listingFee)
        console.log(`📝 CAFI Approval transaction:`, cafiApproveTx.hash)

        setTxStatus({
          hash: cafiApproveTx.hash,
          status: "pending",
          message: "CAFI approval transaction submitted...",
        })

        await cafiApproveTx.wait()
        console.log(`✅ CAFI Approval confirmed`)

        // Wait for the approval to propagate
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      setTxStatus({
        hash: "",
        status: "pending",
        message: "Submitting listing transaction...",
      })

      // Now execute the actual transaction
      const tx = await marketplaceContract.listItem(
        Number.parseInt(listingForm.tokenId),
        Number.parseInt(listingForm.amount),
        priceInWei,
      )

      console.log(`📝 List transaction:`, tx.hash)

      setTxStatus({
        hash: tx.hash,
        status: "pending",
        message: "Transaction submitted. Waiting for confirmation...",
      })

      const receipt = await tx.wait()

      if (receipt?.status === 1) {
        console.log(`✅ Transaction confirmed:`, receipt.hash)

        setTxStatus({
          hash: tx.hash,
          status: "success",
          message: "NFT listed successfully!",
        })

        // Reset form
        setListingForm({
          tokenId: "",
          amount: "",
          pricePerItem: "",
        })

        // Clear debug info
        setDebugInfo(null)

        // Refresh data
        await Promise.all([loadUserNFTs(), loadMarketplaceListings(), refreshBalances()])

        toast({
          title: "Success",
          description: `Successfully listed ${listingAmount} NFT(s) for ${
            listingForm.pricePerItem
          } ${tokenSymbol} each! Listing fee: ${contractService.formatTokenAmount(
            listingFee,
            tokenDecimals,
          )} ${tokenSymbol}`,
        })
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("❌ Error listing NFT:", error)

      let errorMessage = error.message || "Failed to list NFT"

      // Parse specific error messages
      if (error.message?.includes("Insufficient CAFI balance")) {
        errorMessage = error.message
      } else if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user."
      } else if (error.message?.includes("execution reverted")) {
        errorMessage =
          "Transaction failed. This might be due to insufficient listing fee, invalid parameters, or contract restrictions. Please check your CAFI balance and try again."
      }

      setTxStatus({
        hash: "",
        status: "error",
        message: errorMessage,
      })

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlistItem = async (tokenId: number, seller: string) => {
    if (!currentNetworkContracts.MARKETPLACE) {
      toast({
        title: "Error",
        description: "Marketplace contract address not available for current network.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus({
        hash: "",
        status: "pending",
        message: "Preparing to unlist NFT...",
      })

      const marketplaceContract = await contractService.getMarketplaceContract(
        currentNetworkContracts.MARKETPLACE,
        true,
      )

      const tx = await marketplaceContract.cancelListing(tokenId, seller)

      console.log(`📝 Unlist transaction:`, tx.hash)

      setTxStatus({
        hash: tx.hash,
        status: "pending",
        message: "Unlist transaction submitted. Waiting for confirmation...",
      })

      const receipt = await tx.wait()

      if (receipt?.status === 1) {
        console.log(`✅ Unlist confirmed:`, receipt.hash)

        setTxStatus({
          hash: tx.hash,
          status: "success",
          message: "NFT unlisted successfully!",
        })

        // Refresh data
        await Promise.all([loadUserNFTs(), loadMarketplaceListings(), refreshBalances()])

        toast({
          title: "Success",
          description: `Successfully unlisted Token #${tokenId} from the marketplace!`,
        })
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("❌ Error unlisting NFT:", error)

      let errorMessage = error.message || "Failed to unlist NFT"

      if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user."
      } else if (error.message?.includes("execution reverted")) {
        errorMessage = "Transaction failed. You might not be the seller or the listing no longer exists."
      }

      setTxStatus({
        hash: "",
        status: "error",
        message: errorMessage,
      })

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await Promise.all([loadUserNFTs(), loadMarketplaceInfo(), loadMarketplaceListings()])
    setIsRefreshing(false)
  }

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Not specified"
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatIPFSUrl = (hash: string) => {
    if (!hash) return ""
    if (hash.startsWith("//IPFS:")) {
      return `https://ipfs.io/ipfs/${hash.replace("//IPFS:", "")}`
    }
    if (hash.startsWith("Qm") || hash.startsWith("bafy")) {
      return `https://ipfs.io/ipfs/${hash}`
    }
    return hash
  }

  // Filter marketplace listings to show only current user's active listings
  const myActiveListings = marketplaceListings.filter(
    (listing) => listing.seller.toLowerCase() === account?.toLowerCase(),
  )

  // Calculate estimated listing fee for display
  const estimatedListingFee = calculateListingFee(listingForm.amount, listingForm.pricePerItem)

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please connect your wallet to access the marketplace.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!nftContractExists || !marketplaceContractExists) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {!nftContractExists && "NFT contract not found. "}
            {!marketplaceContractExists && "Marketplace contract not found. "}
            Please check the contract addresses.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-50">Carbon NFT Marketplace</h1>
          <p className="text-muted-foreground">Buy and sell Carbon Credit NFTs from CarbonFi</p>
        </div>
        <Button
          onClick={refreshData}
          disabled={isRefreshing}
          variant="outline"
          className="text-gray-50 border-gray-700 bg-gray-800 hover:bg-gray-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Debug Information */}
      {debugInfo && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Bug className="h-5 w-5" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-medium">User NFT Balance:</Label>
                <p className="font-mono">{debugInfo.userBalance}</p>
              </div>
              <div>
                <Label className="font-medium">Listing Amount:</Label>
                <p className="font-mono">{debugInfo.listingAmount}</p>
              </div>
              <div>
                <Label className="font-medium">NFT Approved for All:</Label>
                <p className="font-mono">{debugInfo.isApprovedForAll ? "Yes" : "No"}</p>
              </div>
              <div>
                <Label className="font-medium">Available NFT Balance:</Label>
                <p className="font-mono">{debugInfo.refreshedBalance}</p>
              </div>
              <div>
                <Label className="font-medium">User CAFI Balance:</Label>
                <p className="font-mono">
                  {debugInfo.userCAFIBalance} {tokenSymbol}
                </p>
              </div>
              <div>
                <Label className="font-medium">Required Listing Fee:</Label>
                <p className="font-mono">
                  {debugInfo.listingFee} {tokenSymbol}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketplace Info */}
      <Card className="bg-gray-950 text-gray-50 border-gray-800 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-50">
            <Info className="h-5 w-5" />
            Marketplace Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300">Trading Fee</Label>
              <p className="text-lg text-gray-50">{marketplaceConstants.actualFeePercent.toFixed(2)}%</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300">Minimum Amount</Label>
              <p className="text-lg text-gray-50">{marketplaceConstants.minAmount} NFTs</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300">Minimum Price</Label>
              <p className="text-lg text-gray-50">
                {marketplaceConstants.minPriceFormatted} {tokenSymbol}
              </p>
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm font-medium text-gray-300">Fee Wallet</Label>
              <p className="text-sm font-mono break-all text-gray-50">{feeWallet || "Not set"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger
            value="marketplace"
            className="flex items-center gap-2 text-gray-50 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
          >
            <Store className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger
            value="my-nfts"
            className="flex items-center gap-2 text-gray-50 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
          >
            <Leaf className="h-4 w-4" />
            My NFTs
          </TabsTrigger>
          <TabsTrigger
            value="my-listings" // Renamed from "list"
            className="flex items-center gap-2 text-gray-50 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
          >
            <Tag className="h-4 w-4" />
            My Listings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-50">Available Carbon Credit NFTs</h2>
            {isLoading && marketplaceListings.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-50" />
                <span className="ml-2 text-gray-50">Loading marketplace listings...</span>
              </div>
            ) : marketplaceListings.length === 0 ? (
              <Alert className="bg-gray-800 border-gray-700 text-gray-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No NFTs from other users are currently listed for sale. Only NFTs from other wallets are shown here -
                  your own listings are managed in the "My Listings" tab.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceListings.map((listing, index) => {
                  const purchaseQuantity = getPurchaseQuantity(listing)
                  const totalCost = calculateTotalCost(listing, purchaseQuantity)

                  return (
                    <Card
                      key={`${listing.seller}-${listing.tokenId}-${index}`}
                      className="group overflow-hidden bg-gray-900 border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex items-start justify-between relative z-10">
                          <Badge
                            variant="secondary"
                            className="bg-green-500/20 text-green-300 font-medium border-green-500/30 group-hover:bg-green-500/30 transition-colors duration-300"
                          >
                            VCS
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto text-gray-400 hover:text-red-400 transition-colors duration-300"
                          >
                            <Heart className="h-4 w-4 group-hover:fill-red-400 transition-all duration-300" />
                          </Button>
                        </div>

                        {/* Project Image */}
                        <div className="w-full h-32 bg-gray-800 rounded-md flex items-center justify-center relative overflow-hidden group-hover:bg-gray-700 transition-colors duration-300">
                          {listing.project?.imageCID ? (
                            <img
                              src={formatIPFSUrl(listing.project.imageCID) || "/placeholder.svg"}
                              alt={listing.project.projectName}
                              className="w-full h-full object-cover rounded-md group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="text-gray-500 text-center group-hover:text-gray-400 transition-colors duration-300">
                              <FileText className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-xs">No Image</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 relative">
                        <div>
                          <CardTitle className="text-lg text-gray-50 group-hover:text-green-300 transition-colors duration-300">
                            {listing.project?.projectName || `Token #${listing.tokenId}`}
                          </CardTitle>
                          <CardDescription className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                            {listing.project?.projectType || "Carbon Credit NFT"}
                          </CardDescription>
                        </div>

                        <div className="space-y-2">
                          {listing.project?.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                              <MapPin className="h-3 w-3 text-blue-400 group-hover:text-blue-300" />
                              <span>{listing.project.location}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-green-400 group-hover:text-green-300 transition-colors duration-300">
                            <Leaf className="h-3 w-3" />
                            <span>{listing.amount} Credits Available</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                            <User className="h-3 w-3" />
                            <span>
                              by {listing.seller.substring(0, 6)}...{listing.seller.substring(38)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors duration-300">
                              {listing.priceFormatted} {tokenSymbol}
                            </p>
                            <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                              per credit
                            </p>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="space-y-2 pt-2 border-t border-gray-700 group-hover:border-gray-600 transition-colors duration-300">
                          <Label className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">
                            Quantity to Purchase
                          </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-300"
                              onClick={() => setPurchaseQuantity(listing, purchaseQuantity - 1)}
                              disabled={purchaseQuantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max={listing.amount}
                              value={purchaseQuantity}
                              onChange={(e) => setPurchaseQuantity(listing, Number(e.target.value))}
                              className="h-8 text-center font-medium bg-gray-800 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20 transition-all duration-300"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-300"
                              onClick={() => setPurchaseQuantity(listing, purchaseQuantity + 1)}
                              disabled={purchaseQuantity >= Number(listing.amount)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                              Max: {listing.amount} credits
                            </p>
                            <p className="text-lg font-bold text-green-400 group-hover:text-green-300 transition-colors duration-300">
                              Total: {totalCost} {tokenSymbol}
                            </p>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-3">
                        <Button
                          className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium shadow-lg hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300 group-hover:shadow-xl"
                          onClick={() => handlePurchaseNFT(listing)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                              Purchase {purchaseQuantity} NFT{purchaseQuantity > 1 ? "s" : ""}
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-nfts" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-50">Your Carbon Credit NFTs</h2>
            {isLoading && userNFTs.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-50" />
                <span className="ml-2 text-gray-50">Loading your NFTs...</span>
              </div>
            ) : userNFTs.length === 0 ? (
              <Alert className="bg-gray-800 border-gray-700 text-gray-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have any Carbon Credit NFTs yet.
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-1 text-gray-50"
                    onClick={() => (window.location.href = "/user/mint-nft")}
                  >
                    Mint some NFTs first!
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userNFTs.map((nft) => (
                  <Card
                    key={nft.tokenId}
                    className="group overflow-hidden bg-gray-900 border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="flex items-start justify-between relative z-10">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2 text-gray-50 group-hover:text-blue-300 transition-colors duration-300">
                            <Hash className="h-4 w-4" />
                            Token #{nft.tokenId}
                          </CardTitle>
                          <CardDescription className="font-medium text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                            {nft.projectName}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={nft.isApproved ? "default" : "secondary"}
                          className={
                            nft.isApproved
                              ? "bg-green-500/20 text-green-300 border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          }
                        >
                          {nft.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label className="text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                            Project Type
                          </Label>
                          <p className="font-medium text-gray-200 group-hover:text-white transition-colors duration-300">
                            {nft.projectType}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                            Balance
                          </Label>
                          <p className="font-bold text-green-400 group-hover:text-green-300 transition-colors duration-300">
                            {nft.balance} NFTs
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                          <MapPin className="h-3 w-3 text-blue-400" />
                          <span>{nft.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-400 group-hover:text-green-300 transition-colors duration-300">
                          <Leaf className="h-3 w-3" />
                          <span>{nft.carbonReduction} tons CO₂</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                          <FileText className="h-3 w-3" />
                          <span>{nft.methodology}</span>
                        </div>
                        {nft.startDate > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDate(nft.startDate)} - {formatDate(nft.endDate)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                          <User className="h-3 w-3" />
                          <span className="font-mono text-xs">
                            {nft.creator.substring(0, 6)}...{nft.creator.substring(38)}
                          </span>
                        </div>
                      </div>

                      {nft.imageCID && (
                        <div className="mt-3">
                          <img
                            src={formatIPFSUrl(nft.imageCID) || "/placeholder.svg"}
                            alt={nft.projectName}
                            className="w-full h-32 object-cover rounded-md group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all duration-300 group-hover:shadow-lg"
                        onClick={() => {
                          setListingForm((prev) => ({
                            ...prev,
                            tokenId: nft.tokenId.toString(),
                            amount: Math.min(1, Number.parseInt(nft.balance)).toString(),
                          }))
                          // Switch to list tab
                          const listTab = document.querySelector('[value="my-listings"]') as HTMLElement
                          if (listTab) listTab.click()
                          // Switch to create new listing sub-tab
                          const createNewListingSubTab = document.querySelector(
                            '[value="create-new-listing"]',
                          ) as HTMLElement
                          if (createNewListingSubTab) createNewListingSubTab.click()
                        }}
                      >
                        <Tag className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                        Quick List
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-listings" className="space-y-6">
          <Tabs defaultValue="active-listings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
              <TabsTrigger
                value="active-listings"
                className="flex items-center gap-2 text-gray-50 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <List className="h-4 w-4" />
                Your Active Listings
              </TabsTrigger>
              <TabsTrigger
                value="create-new-listing"
                className="flex items-center gap-2 text-gray-50 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <Plus className="h-4 w-4" />
                Create New Listing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active-listings" className="space-y-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-50">Your Listed Carbon Credit NFTs</h2>
              {isLoading && myActiveListings.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-50" />
                  <span className="ml-2 text-gray-50">Loading your active listings...</span>
                </div>
              ) : myActiveListings.length === 0 ? (
                <Alert className="bg-gray-800 border-gray-700 text-gray-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You currently have no NFTs listed for sale on the marketplace.
                    <Button
                      variant="link"
                      className="p-0 h-auto ml-1 text-green-400 hover:text-green-300"
                      onClick={() => {
                        const createNewListingSubTab = document.querySelector(
                          '[value="create-new-listing"]',
                        ) as HTMLElement
                        if (createNewListingSubTab) createNewListingSubTab.click()
                      }}
                    >
                      List one now!
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myActiveListings.map((listing) => (
                    <Card
                      key={`${listing.seller}-${listing.tokenId}`}
                      className="group overflow-hidden bg-gray-900 border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex items-start justify-between relative z-10">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2 text-gray-50 group-hover:text-green-300 transition-colors duration-300">
                              <Hash className="h-4 w-4" />
                              Token #{listing.tokenId}
                            </CardTitle>
                            <CardDescription className="font-medium text-green-400 group-hover:text-green-300 transition-colors duration-300">
                              {listing.project?.projectName || "Carbon Credit NFT"}
                            </CardDescription>
                          </div>
                          <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                            Listed
                          </Badge>
                        </div>

                        {/* Project Image */}
                        <div className="w-full h-32 bg-gray-800 rounded-md flex items-center justify-center relative overflow-hidden group-hover:bg-gray-700 transition-colors duration-300">
                          {listing.project?.imageCID ? (
                            <img
                              src={formatIPFSUrl(listing.project.imageCID) || "/placeholder.svg"}
                              alt={listing.project.projectName}
                              className="w-full h-full object-cover rounded-md group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="text-gray-500 text-center group-hover:text-gray-400 transition-colors duration-300">
                              <FileText className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-xs">No Image</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <Label className="text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                              Project Type
                            </Label>
                            <p className="font-medium text-gray-200 group-hover:text-white transition-colors duration-300">
                              {listing.project?.projectType || "N/A"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                              Listed Amount
                            </Label>
                            <p className="font-bold text-green-400 group-hover:text-green-300 transition-colors duration-300">
                              {listing.amount} NFTs
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {listing.project?.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                              <MapPin className="h-3 w-3 text-blue-400" />
                              <span>{listing.project.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-green-400 group-hover:text-green-300 transition-colors duration-300">
                            <Leaf className="h-3 w-3" />
                            <span>{listing.project?.carbonReduction || "N/A"} tons CO₂</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                            <FileText className="h-3 w-3" />
                            <span>{listing.project?.methodology || "N/A"}</span>
                          </div>
                          {listing.project?.startDate > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDate(listing.project.startDate)} - {formatDate(listing.project.endDate)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                            <User className="h-3 w-3" />
                            <span className="font-mono text-xs">
                              {listing.seller.substring(0, 6)}...{listing.seller.substring(38)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors duration-300">
                              {listing.priceFormatted} {tokenSymbol}
                            </p>
                            <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                              per credit
                            </p>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-3">
                        <Button
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg hover:shadow-red-500/25 transform hover:scale-105 transition-all duration-300 group-hover:shadow-xl"
                          onClick={() => handleUnlistItem(listing.tokenId, listing.seller)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Unlisting...
                            </>
                          ) : (
                            <>
                              <Tag className="h-4 w-4 mr-2" />
                              Unlist NFT
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="create-new-listing" className="space-y-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-50">Select NFT to List</h2>

              {/* NFT Selection Cards */}
              <div className="mb-6">
                {userNFTs.length === 0 ? (
                  <Alert className="bg-gray-800 border-gray-700 text-gray-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You don't have any Carbon Credit NFTs to list.
                      <Button
                        variant="link"
                        className="p-0 h-auto ml-1 text-green-400 hover:text-green-300"
                        onClick={() => (window.location.href = "/user/mint-nft")}
                      >
                        Mint some NFTs first!
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {userNFTs.map((nft) => {
                      const isSelected = listingForm.tokenId === nft.tokenId.toString()
                      return (
                        <Card
                          key={nft.tokenId}
                          className={`group overflow-hidden cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? "bg-gray-800 border-green-500 shadow-lg shadow-green-500/20"
                              : "bg-gray-900 border-gray-700 hover:border-green-400 hover:shadow-md"
                          }`}
                          onClick={() => {
                            setListingForm((prev) => ({
                              ...prev,
                              tokenId: nft.tokenId.toString(),
                              amount: Math.min(1, Number.parseInt(nft.balance)).toString(),
                            }))
                            setDebugInfo(null)
                          }}
                        >
                          <CardHeader className="pb-3 relative">
                            <div
                              className={`absolute inset-0 transition-opacity duration-500 ${
                                isSelected
                                  ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 opacity-100"
                                  : "bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100"
                              }`}
                            />
                            <div className="flex items-start justify-between relative z-10">
                              <div>
                                <CardTitle
                                  className={`text-lg flex items-center gap-2 transition-colors duration-300 ${
                                    isSelected ? "text-green-300" : "text-gray-50 group-hover:text-green-300"
                                  }`}
                                >
                                  <Hash className="h-4 w-4" />
                                  Token #{nft.tokenId}
                                </CardTitle>
                                <CardDescription
                                  className={`font-medium transition-colors duration-300 ${
                                    isSelected ? "text-green-400" : "text-blue-400 group-hover:text-green-300"
                                  }`}
                                >
                                  {nft.projectName}
                                </CardDescription>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Badge
                                  variant={nft.isApproved ? "default" : "secondary"}
                                  className={
                                    nft.isApproved
                                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                                      : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                  }
                                >
                                  {nft.isApproved ? "Approved" : "Pending"}
                                </Badge>
                                {isSelected && (
                                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Project Image */}
                            {nft.imageCID && (
                              <div className="mt-3 w-full h-32 bg-gray-800 rounded-md flex items-center justify-center relative overflow-hidden">
                                <img
                                  src={formatIPFSUrl(nft.imageCID) || "/placeholder.svg"}
                                  alt={nft.projectName}
                                  className={`w-full h-full object-cover rounded-md transition-transform duration-500 ${
                                    isSelected ? "scale-105" : "group-hover:scale-105"
                                  }`}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                                <div
                                  className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 ${
                                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  }`}
                                />
                              </div>
                            )}
                          </CardHeader>

                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <Label
                                  className={`text-xs font-medium transition-colors duration-300 ${
                                    isSelected ? "text-gray-200" : "text-gray-400 group-hover:text-gray-300"
                                  }`}
                                >
                                  Project Type
                                </Label>
                                <p
                                  className={`font-medium transition-colors duration-300 ${
                                    isSelected ? "text-gray-50" : "text-gray-200 group-hover:text-white"
                                  }`}
                                >
                                  {nft.projectType}
                                </p>
                              </div>
                              <div>
                                <Label
                                  className={`text-xs font-medium transition-colors duration-300 ${
                                    isSelected ? "text-gray-200" : "text-gray-400 group-hover:text-gray-300"
                                  }`}
                                >
                                  Available Balance
                                </Label>
                                <p
                                  className={`font-bold transition-colors duration-300 ${
                                    isSelected ? "text-green-300" : "text-green-400 group-hover:text-green-300"
                                  }`}
                                >
                                  {nft.balance} NFTs
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div
                                className={`flex items-center gap-2 text-sm transition-colors duration-300 ${
                                  isSelected ? "text-gray-200" : "text-gray-400 group-hover:text-gray-300"
                                }`}
                              >
                                <MapPin className="h-3 w-3 text-blue-400" />
                                <span>{nft.location}</span>
                              </div>
                              <div
                                className={`flex items-center gap-2 text-sm transition-colors duration-300 ${
                                  isSelected ? "text-green-300" : "text-green-400 group-hover:text-green-300"
                                }`}
                              >
                                <Leaf className="h-3 w-3" />
                                <span>{nft.carbonReduction} tons CO₂</span>
                              </div>
                              <div
                                className={`flex items-center gap-2 text-sm transition-colors duration-300 ${
                                  isSelected ? "text-gray-200" : "text-gray-400 group-hover:text-gray-300"
                                }`}
                              >
                                <FileText className="h-3 w-3" />
                                <span>{nft.methodology}</span>
                              </div>
                              {nft.startDate > 0 && (
                                <div
                                  className={`flex items-center gap-2 text-sm transition-colors duration-300 ${
                                    isSelected ? "text-gray-200" : "text-gray-400 group-hover:text-gray-300"
                                  }`}
                                >
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {formatDate(nft.startDate)} - {formatDate(nft.endDate)}
                                  </span>
                                </div>
                              )}
                              <div
                                className={`flex items-center gap-2 text-sm transition-colors duration-300 ${
                                  isSelected ? "text-gray-200" : "text-gray-400 group-hover:text-gray-300"
                                }`}
                              >
                                <User className="h-3 w-3" />
                                <span className="font-mono text-xs">
                                  {nft.creator.substring(0, 6)}...{nft.creator.substring(38)}
                                </span>
                              </div>
                            </div>
                          </CardContent>

                          <CardFooter className="pt-3">
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={`w-full transition-all duration-300 ${
                                isSelected
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                                  : "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500"
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Tag className="h-4 w-4 mr-2" />
                                  Selected for Listing
                                </>
                              ) : (
                                <>
                                  <Tag className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                                  Select to List
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Listing Form - Only show if NFT is selected */}
              {listingForm.tokenId && (
                <Card className="bg-gray-950 text-gray-50 border-gray-800 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-gray-50 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-green-400" />
                      Configure Listing Details
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Set the amount and price for your selected NFT
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selected NFT Summary */}
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-medium text-gray-50 mb-2">Selected NFT</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center">
                          <Hash className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-50">
                            Token #{listingForm.tokenId} -{" "}
                            {userNFTs.find((nft) => nft.tokenId.toString() === listingForm.tokenId)?.projectName}
                          </p>
                          <p className="text-sm text-gray-400">
                            Available: {userNFTs.find((nft) => nft.tokenId.toString() === listingForm.tokenId)?.balance}{" "}
                            NFTs
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="list-amount" className="text-gray-300">
                          Amount to List
                        </Label>
                        <Input
                          id="list-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={listingForm.amount}
                          onChange={(e) => {
                            setListingForm((prev) => ({ ...prev, amount: e.target.value }))
                            setDebugInfo(null)
                          }}
                          className="bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 focus:border-emerald-500"
                        />
                        {listingForm.tokenId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Available:{" "}
                            {userNFTs.find((nft) => nft.tokenId.toString() === listingForm.tokenId)?.balance || 0}
                            NFTs (Min: {marketplaceConstants.minAmount})
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="list-price" className="text-gray-300">
                          Price per Item ({tokenSymbol})
                        </Label>
                        <Input
                          id="list-price"
                          type="number"
                          step="0.01"
                          placeholder="Enter price"
                          value={listingForm.pricePerItem}
                          onChange={(e) => setListingForm((prev) => ({ ...prev, pricePerItem: e.target.value }))}
                          className="bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 focus:border-emerald-500"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Min: {marketplaceConstants.minPriceFormatted} {tokenSymbol}
                        </p>
                      </div>
                    </div>

                    {/* Total Revenue and Fee Information */}
                    {listingForm.amount && listingForm.pricePerItem && (
                      <div className="space-y-3">
                        <Alert className="bg-gray-800 border-gray-700 text-gray-50">
                          <DollarSign className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <p className="font-medium">Listing Summary:</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Credits to List:</p>
                                  <p className="font-medium">{listingForm.amount} NFTs</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Price per Credit:</p>
                                  <p className="font-medium">
                                    {listingForm.pricePerItem} {tokenSymbol}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Total Revenue:</p>
                                  <p className="font-bold text-green-600">
                                    {(Number(listingForm.amount) * Number(listingForm.pricePerItem)).toFixed(2)}{" "}
                                    {tokenSymbol}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Listing Fee:</p>
                                  <p className="font-medium text-orange-600">
                                    {contractService.formatTokenAmount(estimatedListingFee, tokenDecimals)}{" "}
                                    {tokenSymbol}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Listing fee ({marketplaceConstants.actualFeePercent.toFixed(2)}%) will be deducted from
                                your CAFI balance.
                              </p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleListItem}
                      disabled={isLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Listing...
                        </>
                      ) : (
                        <>
                          <Tag className="h-4 w-4 mr-2" />
                          List NFT for Sale
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Transaction Status */}
      {txStatus && (
        <TransactionStatus
          hash={txStatus.hash}
          status={txStatus.status}
          message={txStatus.message}
          onClose={() => setTxStatus(null)}
        />
      )}
    </div>
  )
}
