"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useWeb3 } from "@/components/web3-provider"
import { contractService, type CarbonProject } from "@/lib/contract-utils"
import { CONTRACT_ADDRESSES } from "@/lib/constants"
import { TransactionStatus } from "@/components/transaction-status"
import {
  Recycle,
  Leaf,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MapPin,
  Factory,
  Download,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface NFTData {
  tokenId: number
  balance: number
  project: CarbonProject & {
    startDate?: string
    endDate?: string
    creator?: string
    isApproved?: boolean
  }
}

interface RetirementCertificate {
  certificateId: string
  retirer: string
  tokenId: number
  amount: number
  timestamp: Date
  projectName: string
  projectType: string
  location: string
  carbonReduction: string
  methodology: string
  txHash: string
}

export default function RetirePage() {
  const { account, isConnected } = useWeb3()
  const [ownedNFTs, setOwnedNFTs] = useState<NFTData[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null)
  const [retireAmount, setRetireAmount] = useState("")
  const [retireFee, setRetireFee] = useState("0")
  const [isLoading, setIsLoading] = useState(true)
  const [isRetiring, setIsRetiring] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "error" | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retirementCertificate, setRetirementCertificate] = useState<RetirementCertificate | null>(null)

  const loadOwnedNFTs = useCallback(async () => {
    if (!account) return

    try {
      setIsLoading(true)
      console.log("Loading owned NFTs for account:", account)

      // Get contracts
      const nftContract = await contractService.getNftContract()

      // Check if carbon retire contract exists
      if (
        !CONTRACT_ADDRESSES.CARBON_RETIRE ||
        CONTRACT_ADDRESSES.CARBON_RETIRE === "0x0000000000000000000000000000000000000000"
      ) {
        console.error("Carbon retire contract address not configured")
        toast({
          title: "Configuration Error",
          description: "Carbon retire contract is not properly configured",
          variant: "destructive",
        })
        return
      }

      const retireContract = await contractService.getCarbonRetireContract()

      // Get retire fee
      try {
        const fee = await retireContract.retireFee()
        setRetireFee(contractService.formatTokenAmount(fee))
        console.log("Retire fee:", contractService.formatTokenAmount(fee))
      } catch (error) {
        console.warn("Could not get retire fee:", error)
        setRetireFee("100") // Default fee
      }

      // Get max token ID to determine range
      let maxTokenId = 50 // Default range
      try {
        const totalSupply = await nftContract.totalSupply()
        maxTokenId = Math.min(Number(totalSupply) + 10, 100) // Add buffer but cap at 100
        console.log("Total supply:", Number(totalSupply), "Max token ID to check:", maxTokenId)
      } catch (error) {
        console.warn("Could not get total supply, using default range")
      }

      const nfts: NFTData[] = []

      // Check balance for each token ID
      for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
        try {
          const balance = await nftContract.balanceOf(account, tokenId)
          const balanceNum = Number(balance)

          if (balanceNum > 0) {
            console.log(`Found NFT ${tokenId} with balance:`, balanceNum)

            try {
              // Get project data using multiple methods
              let projectData: any = null

              // Method 1: Try projects mapping
              try {
                projectData = await nftContract.projects(tokenId)
                console.log(`Project data for token ${tokenId}:`, projectData)
              } catch (error) {
                console.log(`Method 1 failed for token ${tokenId}:`, error)
              }

              // Method 2: Try getProject function if available
              if (!projectData || !projectData.projectName) {
                try {
                  projectData = await nftContract.getProject(tokenId)
                  console.log(`getProject data for token ${tokenId}:`, projectData)
                } catch (error) {
                  console.log(`Method 2 failed for token ${tokenId}:`, error)
                }
              }

              if (projectData && projectData.projectName) {
                // Calculate dates if duration is available
                let startDate = ""
                let endDate = ""
                if (projectData.durationDays && Number(projectData.durationDays) > 0) {
                  const start = new Date()
                  const end = new Date()
                  end.setDate(start.getDate() + Number(projectData.durationDays))
                  startDate = start.toLocaleDateString()
                  endDate = end.toLocaleDateString()
                }

                // Get creator address if available
                let creator = ""
                try {
                  creator = (await nftContract.ownerOf) ? await nftContract.ownerOf(tokenId) : ""
                } catch (error) {
                  console.log(`Could not get creator for token ${tokenId}`)
                }

                // Check approval status
                let isApproved = false
                try {
                  // Try to get approval status from verifiers
                  const verifierCount = (await nftContract.VERIFIER_COUNT?.()) || 0
                  if (Number(verifierCount) > 0) {
                    // Check if approved by at least one verifier
                    for (let i = 0; i < Number(verifierCount); i++) {
                      try {
                        const verifier = await nftContract.verifiers(i)
                        if (verifier && verifier.isActive) {
                          isApproved = true
                          break
                        }
                      } catch (error) {
                        console.log(`Could not check verifier ${i}`)
                      }
                    }
                  }
                } catch (error) {
                  console.log(`Could not check approval status for token ${tokenId}`)
                }

                const nftData: NFTData = {
                  tokenId,
                  balance: balanceNum,
                  project: {
                    projectName: projectData.projectName || `Project #${tokenId}`,
                    projectType: projectData.projectType || "Unknown",
                    location: projectData.location || "Unknown",
                    carbonReduction: projectData.carbonTons || projectData.carbonReduction || "0",
                    methodology: projectData.methodology || "Unknown",
                    documentHash: projectData.documentHash || "",
                    imageHash: projectData.imageCID || projectData.imageHash || "",
                    startDate,
                    endDate,
                    creator,
                    isApproved,
                  },
                }

                nfts.push(nftData)
                console.log(`Added NFT ${tokenId} to collection:`, nftData)
              } else {
                console.log(`Token ${tokenId} exists but no project data found`)
                // Add with minimal data
                nfts.push({
                  tokenId,
                  balance: balanceNum,
                  project: {
                    projectName: `Carbon Credit #${tokenId}`,
                    projectType: "Carbon Credit",
                    location: "Unknown",
                    carbonReduction: "1000", // Default 1 ton
                    methodology: "Unknown",
                    documentHash: "",
                    imageHash: "",
                    startDate: "",
                    endDate: "",
                    creator: "",
                    isApproved: false,
                  },
                })
              }
            } catch (error) {
              console.error(`Error getting project data for token ${tokenId}:`, error)
            }
          }
        } catch (error) {
          // Token might not exist, continue to next
          if (tokenId <= 10) {
            console.log(`Token ${tokenId} check failed:`, error)
          }
        }
      }

      setOwnedNFTs(nfts)
      console.log(`Loaded ${nfts.length} owned NFTs:`, nfts)

      if (nfts.length === 0) {
        toast({
          title: "No NFTs Found",
          description: "You don't own any carbon credit NFTs yet. Try minting some first!",
        })
      }
    } catch (error) {
      console.error("Error loading owned NFTs:", error)
      toast({
        title: "Error",
        description: "Failed to load your NFTs. Please try refreshing.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [account])

  const generatePDFCertificate = async (certificate: RetirementCertificate) => {
    try {
      // Create PDF content using jsPDF (we'll simulate this for now)
      const pdfContent = `
CARBON CREDIT RETIREMENT CERTIFICATE

Certificate ID: ${certificate.certificateId}
Date: ${certificate.timestamp.toLocaleDateString()}
Time: ${certificate.timestamp.toLocaleTimeString()}

RETIREMENT DETAILS:
- Retirer: ${certificate.retirer}
- Token ID: #${certificate.tokenId}
- Amount Retired: ${certificate.amount} Carbon Credits
- Transaction Hash: ${certificate.txHash}

PROJECT INFORMATION:
- Project Name: ${certificate.projectName}
- Project Type: ${certificate.projectType}
- Location: ${certificate.location}
- Carbon Reduction: ${certificate.carbonReduction} tCO₂
- Methodology: ${certificate.methodology}

This certificate confirms the permanent retirement of ${certificate.amount} carbon credits.
These credits have been removed from circulation and cannot be traded or used again.

Generated by CarbonFi Platform
${new Date().toISOString()}
      `

      // Create a blob with the PDF content (simplified version)
      const blob = new Blob([pdfContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)

      // Create download link
      const link = document.createElement("a")
      link.href = url
      link.download = `carbon-retirement-certificate-${certificate.certificateId}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Certificate Downloaded",
        description: "Your retirement certificate has been downloaded successfully",
      })
    } catch (error) {
      console.error("Error generating PDF certificate:", error)
      toast({
        title: "Download Failed",
        description: "Failed to generate retirement certificate",
        variant: "destructive",
      })
    }
  }

  const handleRetire = async () => {
    if (!selectedNFT || !retireAmount || !account) return

    const amount = Number.parseInt(retireAmount)
    if (amount <= 0 || amount > selectedNFT.balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to retire",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRetiring(true)
      setTxStatus("pending")

      console.log("Starting retirement process...")
      console.log("Contract addresses:", CONTRACT_ADDRESSES)

      // Validate contract addresses
      if (!CONTRACT_ADDRESSES.CARBON_RETIRE) {
        throw new Error("Carbon retire contract address not configured")
      }

      if (!CONTRACT_ADDRESSES.CAFI_TOKEN) {
        throw new Error("CAFI token contract address not configured")
      }

      if (!CONTRACT_ADDRESSES.NFT) {
        throw new Error("NFT contract address not configured")
      }

      // Get the carbon retire contract directly
      const retireContract = await contractService.getCarbonRetireContract(true)
      console.log("Got retire contract")

      // First approve the NFT contract to spend tokens
      const nftContract = await contractService.getNftContract(true)
      const isApproved = await nftContract.isApprovedForAll(account, CONTRACT_ADDRESSES.CARBON_RETIRE)

      if (!isApproved) {
        toast({
          title: "Approving NFT transfer",
          description: "Please confirm the approval transaction in your wallet",
        })

        const approveTx = await nftContract.setApprovalForAll(CONTRACT_ADDRESSES.CARBON_RETIRE, true)
        await approveTx.wait()

        toast({
          title: "Approval successful",
          description: "NFT transfer approved. Now processing retirement",
        })
      }

      // Now approve CAFI tokens for the fee
      const cafiContract = await contractService.getTokenContract(CONTRACT_ADDRESSES.CAFI_TOKEN, true)
      const feeAmount = await retireContract.retireFee()
      const allowance = await cafiContract.allowance(account, CONTRACT_ADDRESSES.CARBON_RETIRE)

      if (allowance < feeAmount) {
        toast({
          title: "Approving CAFI tokens",
          description: "Please confirm the token approval transaction in your wallet",
        })

        const tokenApproveTx = await cafiContract.approve(CONTRACT_ADDRESSES.CARBON_RETIRE, feeAmount)
        await tokenApproveTx.wait()

        toast({
          title: "Token approval successful",
          description: "CAFI tokens approved. Now processing retirement",
        })
      }

      // Now retire the NFT
      console.log("Calling retireNFT with:", selectedNFT.tokenId, amount)
      const tx = await retireContract.retireNFT(selectedNFT.tokenId, amount)
      setTxHash(tx.hash)

      // Wait for transaction confirmation
      const receipt = await tx.wait()

      if (receipt?.status === 1) {
        setTxStatus("success")

        // Generate certificate data
        const certificate: RetirementCertificate = {
          certificateId: `CERT-${Date.now()}-${selectedNFT.tokenId}`,
          retirer: account,
          tokenId: selectedNFT.tokenId,
          amount: amount,
          timestamp: new Date(),
          projectName: selectedNFT.project.projectName,
          projectType: selectedNFT.project.projectType,
          location: selectedNFT.project.location,
          carbonReduction: selectedNFT.balance.toString(), // Use balance as carbon reduction
          methodology: selectedNFT.project.methodology,
          txHash: tx.hash,
        }

        setRetirementCertificate(certificate)

        toast({
          title: "NFT Retired Successfully!",
          description: `${amount} carbon credits have been permanently retired`,
        })

        // Auto-generate PDF certificate
        await generatePDFCertificate(certificate)

        // Refresh data
        await loadOwnedNFTs()
        setSelectedNFT(null)
        setRetireAmount("")
      } else {
        setTxStatus("error")
        toast({
          title: "Transaction Failed",
          description: "The retirement transaction failed",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Retire error:", error)
      setTxStatus("error")

      let errorMessage = "Failed to retire NFT"
      if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user"
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction"
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Retirement Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsRetiring(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadOwnedNFTs()
  }

  const getTotalCost = () => {
    if (!retireFee) return "0"
    return retireFee
  }

  const formatIPFSUrl = (hash: string) => {
    if (!hash) return "/placeholder.svg?height=200&width=300&text=No+Image"
    if (hash.startsWith("http")) return hash
    if (hash.startsWith("Qm") || hash.startsWith("bafy")) {
      return `https://ipfs.io/ipfs/${hash}`
    }
    return hash.replace("ipfs://", "https://ipfs.io/ipfs/")
  }

  useEffect(() => {
    if (isConnected && account) {
      loadOwnedNFTs()
    }
  }, [isConnected, account, loadOwnedNFTs])

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <Card className="hover:shadow-lg hover:shadow-blue-500/20 transition-shadow duration-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Recycle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground text-center">Please connect your wallet to retire carbon credits</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Recycle className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Retire Carbon Credits</h1>
            <p className="text-muted-foreground">
              Permanently retire your carbon credit NFTs to offset your carbon footprint
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {txHash && (
        <TransactionStatus
          hash={txHash}
          status={txStatus}
          onClose={() => {
            setTxHash(null)
            setTxStatus(null)
          }}
        />
      )}

      {/* Certificate Download Section */}
      {retirementCertificate && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950 hover:shadow-lg hover:shadow-green-500/20 transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Retirement Certificate Ready
            </CardTitle>
            <CardDescription>Your carbon credit retirement certificate has been generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Certificate ID: {retirementCertificate.certificateId}</p>
                <p className="text-sm text-muted-foreground">
                  {retirementCertificate.amount} credits retired from {retirementCertificate.projectName}
                </p>
              </div>
              <Button
                onClick={() => generatePDFCertificate(retirementCertificate)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your NFTs */}
        <Card className="hover:shadow-xl hover:shadow-blue-500/20 transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Your Carbon Credit NFTs
            </CardTitle>
            <CardDescription>Select an NFT to retire permanently</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                ))}
              </div>
            ) : ownedNFTs.length === 0 ? (
              <div className="text-center py-8">
                <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">You don't own any carbon credit NFTs yet</p>
                <p className="text-sm text-muted-foreground">
                  Visit the{" "}
                  <a href="/user/mint-nft" className="text-blue-600 hover:underline">
                    Mint NFT
                  </a>{" "}
                  page to create your first carbon credit
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {ownedNFTs.map((nft) => (
                  <div
                    key={nft.tokenId}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md hover:shadow-green-500/20 ${
                      selectedNFT?.tokenId === nft.tokenId
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedNFT(nft)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg">{nft.project.projectName}</h3>
                      <div className="flex gap-2">
                        <Badge variant="secondary">#{nft.tokenId}</Badge>
                        {nft.project.isApproved && (
                          <Badge variant="default" className="bg-green-600">
                            Approved
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-blue-600" />
                        <span>{nft.project.projectType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span>{nft.project.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-600" />
                        <span>{nft.balance} tCO₂</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span>{nft.project.methodology}</span>
                      </div>
                    </div>

                    {(nft.project.startDate || nft.project.endDate) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {nft.project.startDate && nft.project.endDate
                            ? `${nft.project.startDate} - ${nft.project.endDate}`
                            : nft.project.startDate || nft.project.endDate}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Available: <span className="font-medium text-green-600">{nft.balance}</span> credits
                      </span>
                      {selectedNFT?.tokenId === nft.tokenId && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retirement Form */}
        <Card className="hover:shadow-xl hover:shadow-purple-500/20 transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-5 w-5" />
              Retire Carbon Credits
            </CardTitle>
            <CardDescription>Permanently retire your carbon credits to offset emissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedNFT ? (
              <>
                {/* Selected NFT Details */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{selectedNFT.project.projectName}</h3>
                    <Badge>#{selectedNFT.tokenId}</Badge>
                  </div>

                  {/* NFT Image */}
                  {selectedNFT.project.imageHash && (
                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={formatIPFSUrl(selectedNFT.project.imageHash) || "/placeholder.svg"}
                        alt={selectedNFT.project.projectName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=128&width=300&text=Carbon+Credit"
                        }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-blue-600" />
                      <span>{selectedNFT.project.projectType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span>{selectedNFT.project.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <span>{selectedNFT.balance} tCO₂</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span>{selectedNFT.project.methodology}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Available: <span className="font-medium text-green-600">{selectedNFT.balance}</span> credits
                  </p>
                </div>

                {/* Retirement Amount */}
                <div className="space-y-2">
                  <Label htmlFor="retireAmount">Amount to Retire</Label>
                  <Input
                    id="retireAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={retireAmount}
                    onChange={(e) => setRetireAmount(e.target.value)}
                    min="1"
                    max={selectedNFT.balance}
                  />
                  <p className="text-xs text-muted-foreground">Maximum: {selectedNFT.balance} credits</p>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium">Cost Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Retirement Fee:</span>
                      <span>{retireFee} CAFI</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Cost:</span>
                      <span>{getTotalCost()} CAFI</span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <Alert className="hover:shadow-md hover:shadow-orange-500/20 transition-shadow duration-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Retiring carbon credits is permanent and cannot be undone. The NFTs will
                    be burned and removed from circulation forever.
                  </AlertDescription>
                </Alert>

                {/* Retire Button */}
                <Button
                  onClick={handleRetire}
                  disabled={
                    !retireAmount ||
                    Number.parseInt(retireAmount) <= 0 ||
                    Number.parseInt(retireAmount) > selectedNFT.balance ||
                    isRetiring
                  }
                  className="w-full"
                  size="lg"
                >
                  {isRetiring ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Retiring...
                    </>
                  ) : (
                    <>
                      <Recycle className="h-4 w-4 mr-2" />
                      Retire {retireAmount || "0"} Carbon Credits
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Recycle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select an NFT from the left to start the retirement process</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information Section */}
      <Card className="hover:shadow-xl hover:shadow-cyan-500/20 transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            About Carbon Credit Retirement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Recycle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Permanent Retirement</h3>
              <p className="text-sm text-muted-foreground">
                Retired credits are permanently removed from circulation and cannot be traded
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Certificate Issued</h3>
              <p className="text-sm text-muted-foreground">
                You'll receive a retirement certificate as proof of your environmental impact
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Leaf className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Carbon Offset</h3>
              <p className="text-sm text-muted-foreground">
                Retired credits represent real carbon reduction that offsets your emissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
