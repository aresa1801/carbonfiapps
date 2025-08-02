"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, XCircle } from "lucide-react"
import { listItem, buyItem, cancelListing, getListing, getListingCount, contractService } from "@/lib/contract-service"
import { formatEther, parseEther, ethers } from "ethers"
import { formatWalletAddress } from "@/lib/wallet-utils"
import type { NFTListing as NFTListingType } from "@/services/contract-service"

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

interface NFTListing {
  itemId: number
  nftAddress: string
  tokenId: number
  seller: string
  price: string
  isSold: boolean
}

export default function MarketplacePage() {
  const {
    marketplaceContract,
    nftContract,
    signer,
    address,
    isConnected,
    refreshBalances,
    nativeBalance,
    tokenSymbol,
    tokenDecimals,
    currentNetworkContracts,
    setTransactionStatus,
    account,
    nftContractExists,
    marketplaceContractExists,
  } = useWeb3()
  const { toast } = useToast()

  const [listings, setListings] = useState<NFTListing[]>([])
  const [listNftAddress, setListNftAddress] = useState("")
  const [listTokenId, setListTokenId] = useState("")
  const [listPrice, setListPrice] = useState("")
  const [buyItemId, setBuyItemId] = useState("")
  const [cancelItemId, setCancelItemId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const [tokenIdToList, setTokenIdToList] = useState("")
  const [amountToList, setAmountToList] = useState("")
  const [pricePerItemToList, setPricePerItemToList] = useState("")
  const [isListing, setIsListing] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [isUnlisting, setIsUnlisting] = useState(false)
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<NFTListingType | null>(null)
  const [buyAmount, setBuyAmount] = useState("")

  // Load user NFTs from CarbonFi contract
  const loadUserNFTs = async () => {
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
  }

  // Load marketplace listings with project data
  const loadMarketplaceListings = async () => {
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
  }

  const loadMarketplaceInfo = async () => {
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
  }

  useEffect(() => {
    const fetchListings = async () => {
      if (marketplaceContract) {
        setLoading(true)
        setError(null)
        try {
          const count = await getListingCount(marketplaceContract)
          const fetchedListings: NFTListing[] = []
          for (let i = 1; i <= count; i++) {
            const listing = await getListing(marketplaceContract, i)
            if (!listing.isSold) {
              // Only show active listings
              fetchedListings.push(listing)
            }
          }
          setListings(fetchedListings)
        } catch (err: any) {
          console.error("Error fetching listings:", err)
          setError(`Failed to fetch listings: ${err.message || "Unknown error"}`)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchListings()
  }, [marketplaceContract, refreshBalances])

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (isConnected && account && nftContractExists && currentNetworkContracts.NFT) {
      loadUserNFTs()
    }
  }, [isConnected, account, nftContractExists, currentNetworkContracts.NFT])

  useEffect(() => {
    if (marketplaceContractExists && currentNetworkContracts.MARKETPLACE) {
      loadMarketplaceInfo()
      loadMarketplaceListings()
    }
  }, [marketplaceContractExists, currentNetworkContracts.MARKETPLACE])

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

  const handleListItem = async () => {
    if (!marketplaceContract || !nftContract || !signer || !listNftAddress || !listTokenId || !listPrice) {
      toast({
        title: "Error",
        description: "Wallet not connected or listing details invalid.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const parsedTokenId = Number.parseInt(listTokenId)
      const parsedPrice = listPrice

      // Approve marketplace to transfer NFT
      const approveTx = await nftContract.approve(await marketplaceContract.getAddress(), parsedTokenId)
      await approveTx.wait()
      toast({
        title: "Approval Successful",
        description: "Marketplace approved to transfer your NFT.",
      })

      await listItem(marketplaceContract, listNftAddress, parsedTokenId, parsedPrice)
      toast({
        title: "Listing Successful",
        description: `NFT ${listTokenId} listed for ${listPrice} ETH.`,
      })
      setListNftAddress("")
      setListTokenId("")
      setListPrice("")
      refreshBalances()
    } catch (err: any) {
      console.error("List item error:", err)
      setError(`Listing failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Listing Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBuyItem = async (itemId: number, price: string) => {
    if (!marketplaceContract || !signer) {
      toast({
        title: "Error",
        description: "Wallet not connected.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      await buyItem(marketplaceContract, itemId, price)
      toast({
        title: "Purchase Successful",
        description: `Successfully purchased item ID ${itemId}.`,
      })
      setBuyItemId("")
      refreshBalances()
    } catch (err: any) {
      console.error("Buy item error:", err)
      setError(`Purchase failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Purchase Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelListing = async () => {
    if (!marketplaceContract || !signer || !cancelItemId) {
      toast({
        title: "Error",
        description: "Wallet not connected or item ID invalid.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      await cancelListing(marketplaceContract, Number.parseInt(cancelItemId))
      toast({
        title: "Cancellation Successful",
        description: `Listing ${cancelItemId} cancelled.`,
      })
      setCancelItemId("")
      refreshBalances()
    } catch (err: any) {
      console.error("Cancel listing error:", err)
      setError(`Cancellation failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Cancellation Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openBuyDialog2 = (listing: MarketplaceListing) => {
    setSelectedListing(listing)
    setBuyAmount("")
    setIsBuyDialogOpen(true)
  }

  const handleListNFT = async () => {
    if (!marketplaceContract || !nftContract || !tokenIdToList || !amountToList || !pricePerItemToList || !address) {
      toast({
        title: "Error",
        description: "Please fill all listing fields and connect wallet.",
        variant: "destructive",
      })
      return
    }

    setIsListing(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Approving NFT for listing..." })
    try {
      const parsedTokenId = BigInt(tokenIdToList)
      const parsedAmount = BigInt(amountToList)
      const parsedPricePerItem = parseEther(pricePerItemToList)

      // Check NFT ownership and balance
      const nftBalance = await nftContract.balanceOf(address)
      if (nftBalance < parsedAmount) {
        throw new Error("Insufficient NFT balance to list this amount.")
      }

      // Approve NFT transfer to Marketplace contract
      const approveTx = await nftContract.approve(await marketplaceContract.getAddress(), parsedTokenId)
      await approveTx.wait()
      setTransactionStatus({ hash: approveTx.hash, status: "pending", message: "NFT approved. Listing NFT..." })

      // List NFT
      const listTx = await marketplaceContract.listNFT(parsedTokenId, parsedAmount, parsedPricePerItem)
      await listTx.wait()
      setTransactionStatus({ hash: listTx.hash, status: "success", message: "NFT listed successfully!" })
      toast({
        title: "Listing Successful",
        description: `NFT ID ${tokenIdToList} listed for ${amountToList} units at ${pricePerItemToList} ETH/BNB/HBAR per unit.`,
      })
      setTokenIdToList("")
      setAmountToList("")
      setPricePerItemToList("")
      refreshBalances()
    } catch (error: any) {
      console.error("Error listing NFT:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Listing failed: ${error.reason || error.message}`,
      })
      toast({
        title: "Listing Failed",
        description: `Failed to list NFT: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsListing(false)
    }
  }

  const openBuyDialog = (listing: MarketplaceListing) => {
    setSelectedListing(listing)
    setBuyAmount("")
    setIsBuyDialogOpen(true)
  }

  const handleBuyNFT = async (listing: MarketplaceListing) => {
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

  const handleUnlistNFT = async (listing: NFTListingType) => {
    if (!marketplaceContract || !address) {
      toast({
        title: "Error",
        description: "Wallet not connected or marketplace contract not loaded.",
        variant: "destructive",
      })
      return
    }

    if (listing.seller.toLowerCase() !== address.toLowerCase()) {
      toast({
        title: "Unauthorized",
        description: "You can only unlist your own NFTs.",
        variant: "destructive",
      })
      return
    }

    setIsUnlisting(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Unlisting NFT..." })
    try {
      const listingId = listings.indexOf(listing)
      const tx = await marketplaceContract.unlistNFT(listingId)
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "NFT unlisted successfully!" })
      toast({
        title: "Unlist Successful",
        description: `NFT ID ${Number(listing.tokenId)} unlisted.`,
      })
      refreshBalances()
    } catch (error: any) {
      console.error("Error unlisting NFT:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Unlisting failed: ${error.reason || error.message}`,
      })
      toast({
        title: "Unlist Failed",
        description: `Failed to unlist NFT: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUnlisting(false)
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
        await Promise.all([loadUserNFTs(), loadMarketplaceInfo(), loadMarketplaceListings()])
        refreshBalances()

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
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to access the NFT Marketplace.</AlertDescription>
      </Alert>
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
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">NFT Marketplace</h1>

      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>List Your NFT</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="list-nft-address">NFT Contract Address</Label>
            <Input
              id="list-nft-address"
              type="text"
              value={listNftAddress}
              onChange={(e) => setListNftAddress(e.target.value)}
              placeholder="0x..."
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="list-token-id">Token ID</Label>
            <Input
              id="list-token-id"
              type="number"
              value={listTokenId}
              onChange={(e) => setListTokenId(e.target.value)}
              placeholder="e.g., 1"
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="list-price">Price (ETH)</Label>
            <Input
              id="list-price"
              type="number"
              value={listPrice}
              onChange={(e) => setListPrice(e.target.value)}
              placeholder="e.g., 0.01"
              disabled={loading}
            />
          </div>
          <Button onClick={handleListItem} disabled={loading || !listNftAddress || !listTokenId || !listPrice}>
            {loading ? "Listing..." : "List NFT for Sale"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading listings...</p>
          ) : listings.length === 0 ? (
            <p className="text-muted-foreground">No active listings found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <Card key={listing.itemId}>
                  <CardHeader>
                    <CardTitle>Item #{listing.itemId}</CardTitle>
                    <CardDescription>Token ID: {listing.tokenId}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>Seller: {formatWalletAddress(listing.seller)}</p>
                    <p className="text-xl font-bold">
                      Price: {listing.price} {process.env.NEXT_PUBLIC_NETWORK_CURRENCY_SYMBOL || "ETH"}
                    </p>
                    {/* You might want to fetch and display the NFT image here */}
                    <div className="relative w-full h-48 bg-muted rounded-md flex items-center justify-center">
                      <p className="text-muted-foreground">NFT Image Placeholder</p>
                    </div>
                    {address?.toLowerCase() !== listing.seller.toLowerCase() ? (
                      <Button
                        onClick={() => handleBuyItem(listing.itemId, listing.price)}
                        disabled={
                          loading ||
                          Number.parseFloat(formatEther(nativeBalance || BigInt(0))) < Number.parseFloat(listing.price)
                        }
                        className="w-full mt-2"
                      >
                        {loading ? "Buying..." : "Buy Now"}
                      </Button>
                    ) : (
                      <Button variant="outline" disabled className="w-full mt-2 bg-transparent">
                        Your Listing
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cancel Your Listing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cancel-item-id">Item ID to Cancel</Label>
            <Input
              id="cancel-item-id"
              type="number"
              value={cancelItemId}
              onChange={(e) => setCancelItemId(e.target.value)}
              placeholder="e.g., 1"
              disabled={loading}
            />
          </div>
          <Button onClick={handleCancelListing} disabled={loading || !cancelItemId}>
            {loading ? "Cancelling..." : "Cancel Listing"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
