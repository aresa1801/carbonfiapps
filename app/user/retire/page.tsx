"use client"

import { CardDescription } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { formatEther, parseEther } from "ethers"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import type { RetirementCertificate } from "@/services/contract-service"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { contractService, type CarbonProject } from "@/lib/contract-utils"
import { Recycle, Leaf, Calendar, FileText, AlertCircle, CheckCircle, MapPin, Factory, Terminal } from "lucide-react"
import { retireCarbon, getRetiredAmount } from "@/lib/contract-service"

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

export default function RetirePage() {
  const {
    carbonRetireContract,
    nftContract: nftContractInstance,
    cafiTokenContract,
    signer,
    address,
    isConnected,
    refreshBalances,
    cafiBalance,
  } = useWeb3()
  const { toast } = useToast()

  const [tokenId, setTokenId] = useState("")
  const [amountToRetire, setAmountToRetire] = useState("")
  const [certificateURI, setCertificateURI] = useState("")
  const [retirementFee, setRetirementFee] = useState<string | null>(null)
  const [isRetiring, setIsRetiring] = useState(false)
  const [userRetirements, setUserRetirements] = useState<RetirementCertificate[]>([])
  const [ownedNFTs, setOwnedNFTs] = useState<NFTData[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retirementCertificate, setRetirementCertificate] = useState<RetirementCertificate | null>(null)
  const [retireAmount, setRetireAmount] = useState("")
  const [totalRetired, setTotalRetired] = useState("0")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRetirementData = async () => {
      if (isConnected && carbonRetireContract && address) {
        try {
          const fee = await carbonRetireContract.retirementFee()
          setRetirementFee(formatEther(fee))

          const retirementCount = await carbonRetireContract.getUserRetirementCount(address)
          const retirements: RetirementCertificate[] = []
          for (let i = 0; i < retirementCount; i++) {
            const cert = await carbonRetireContract.getUserRetirement(address, i)
            retirements.push({
              retirer: cert.retirer,
              tokenId: cert.tokenId,
              amount: cert.amount,
              timestamp: cert.timestamp,
              certificateId: cert.certificateId,
              certificateURI: cert.certificateURI,
            })
          }
          setUserRetirements(retirements)
        } catch (error) {
          console.error("Error fetching retirement data:", error)
          toast({
            title: "Error",
            description: "Failed to fetch carbon retirement data.",
            variant: "destructive",
          })
          setRetirementFee(null)
          setUserRetirements([])
        }
      } else {
        setRetirementFee(null)
        setUserRetirements([])
      }
    }
    fetchRetirementData()
  }, [isConnected, carbonRetireContract, address, refreshBalances])

  useEffect(() => {
    const loadOwnedNFTs = async () => {
      if (!address) return

      try {
        setIsLoading(true)
        console.log("Loading owned NFTs for account:", address)

        // Get contracts
        const nftContract = await contractService.getNftContract(nftContractInstance)

        // Check if carbon retire contract exists
        if (!carbonRetireContract) {
          console.error("Carbon retire contract address not configured for current network")
          toast({
            title: "Configuration Error",
            description: "Carbon retire contract is not properly configured for this network",
            variant: "destructive",
          })
          return
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
            const balance = await nftContract.balanceOf(address, tokenId)
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
    }
    loadOwnedNFTs()
  }, [address])

  useEffect(() => {
    const fetchRetiredAmount = async () => {
      if (carbonRetireContract && address) {
        try {
          const amount = await getRetiredAmount(carbonRetireContract, address)
          setTotalRetired(amount)
        } catch (err: any) {
          console.error("Error fetching retired amount:", err)
          setError(`Failed to fetch retired amount: ${err.message || "Unknown error"}`)
        }
      }
    }
    fetchRetiredAmount()
  }, [carbonRetireContract, address, refreshBalances])

  const handleRetireCarbon = async () => {
    if (
      !carbonRetireContract ||
      !nftContractInstance ||
      !tokenId ||
      !amountToRetire ||
      !certificateURI ||
      !address ||
      retirementFee === null
    ) {
      toast({
        title: "Error",
        description: "Please fill all fields and connect wallet.",
        variant: "destructive",
      })
      return
    }

    setIsRetiring(true)
    toast({
      title: "Approving NFT for retirement...",
      variant: "default",
    })
    try {
      const parsedTokenId = BigInt(tokenId)
      const parsedAmount = parseEther(amountToRetire)
      const feeInWei = parseEther(retirementFee)

      // Check NFT ownership and balance
      const nftBalance = await nftContractInstance.balanceOf(address)
      if (nftBalance < parsedAmount) {
        throw new Error("Insufficient NFT balance to retire this amount.")
      }

      // Approve NFT transfer to CarbonRetire contract
      const approveTx = await nftContractInstance.approve(await carbonRetireContract.getAddress(), parsedTokenId)
      await approveTx.wait()
      toast({
        title: "NFT approved. Retiring carbon...",
        variant: "default",
      })

      // Retire carbon
      const retireTx = await carbonRetireContract.retireCarbon(parsedTokenId, parsedAmount, certificateURI, {
        value: feeInWei,
      })
      await retireTx.wait()
      toast({
        title: "Retirement Successful",
        description: `Successfully retired ${amountToRetire} units of carbon for NFT ID ${tokenId}.`,
        variant: "success",
      })
      setTokenId("")
      setAmountToRetire("")
      setCertificateURI("")
      refreshBalances()
    } catch (error: any) {
      console.error("Error retiring carbon:", error)
      toast({
        title: "Retirement Failed",
        description: `Failed to retire carbon: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsRetiring(false)
    }
  }

  const handleRetire = async () => {
    if (!carbonRetireContract || !cafiTokenContract || !signer || !retireAmount || !address) {
      toast({
        title: "Error",
        description: "Wallet not connected or retire amount invalid.",
        variant: "destructive",
      })
      return
    }
    setIsRetiring(true)
    setError(null)
    try {
      const amount = parseEther(retireAmount)

      // First, approve the carbon retire contract to spend CAFI tokens
      const approveTx = await cafiTokenContract.approve(await carbonRetireContract.getAddress(), amount)
      await approveTx.wait()
      toast({
        title: "Approval Successful",
        description: "Carbon Retire contract approved to spend your CAFI tokens.",
        variant: "success",
      })

      // Then, retire
      await retireCarbon(carbonRetireContract, retireAmount)
      toast({
        title: "Retirement Successful",
        description: `${retireAmount} CAFI tokens retired.`,
        variant: "success",
      })
      setRetireAmount("")
      refreshBalances()
    } catch (err: any) {
      console.error("Retirement error:", err)
      setError(`Retirement failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Retirement Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsRetiring(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    refreshBalances()
  }

  if (!isConnected) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to retire carbon tokens.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Retire Carbon Credits</h1>

      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Your CAFI Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{cafiBalance} CAFI</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total CAFI Retired by You</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRetired} CAFI</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Retire Carbon NFT</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="token-id">NFT Token ID</Label>
            <Input
              id="token-id"
              type="number"
              placeholder="Enter NFT Token ID"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              disabled={isRetiring}
            />
          </div>
          <div>
            <Label htmlFor="amount-to-retire">Amount to Retire (Units)</Label>
            <Input
              id="amount-to-retire"
              type="number"
              placeholder="Enter amount to retire"
              value={amountToRetire}
              onChange={(e) => setAmountToRetire(e.target.value)}
              disabled={isRetiring}
            />
          </div>
          <div>
            <Label htmlFor="certificate-uri">Certificate URI</Label>
            <Input
              id="certificate-uri"
              placeholder="e.g., ipfs://..."
              value={certificateURI}
              onChange={(e) => setCertificateURI(e.target.value)}
              disabled={isRetiring}
            />
          </div>
          <div>
            <p className="text-sm font-medium">Retirement Fee:</p>
            <p className="text-lg font-bold">{retirementFee ? `${retirementFee} ETH/BNB/HBAR` : "Loading..."}</p>
          </div>
          <Button onClick={handleRetireCarbon} disabled={isRetiring}>
            {isRetiring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Retiring...
              </>
            ) : (
              "Retire Carbon"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retire CAFI Tokens</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="retire-amount">Amount to Retire</Label>
            <Input
              id="retire-amount"
              type="number"
              value={retireAmount}
              onChange={(e) => setRetireAmount(e.target.value)}
              placeholder="e.g., 100"
              disabled={isRetiring}
            />
          </div>
          <Button onClick={handleRetire} disabled={isRetiring || Number.parseFloat(retireAmount) <= 0}>
            {isRetiring ? "Retiring..." : "Retire CAFI"}
          </Button>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Your Retirement Certificates</h2>
      <Card>
        <CardHeader>
          <CardTitle>Issued Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          {userRetirements.length === 0 ? (
            <p className="text-muted-foreground">You have no retirement certificates yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate ID</TableHead>
                  <TableHead>NFT Token ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Certificate URI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRetirements.map((cert, index) => (
                  <TableRow key={index}>
                    <TableCell>{cert.certificateId}</TableCell>
                    <TableCell>{Number(cert.tokenId)}</TableCell>
                    <TableCell>{formatEther(cert.amount)}</TableCell>
                    <TableCell>{new Date(Number(cert.timestamp) * 1000).toLocaleString()}</TableCell>
                    <TableCell>
                      <a
                        href={cert.certificateURI}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View Certificate
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Your NFTs */}
      <Card className="bg-gray-950 text-gray-50 border-gray-800 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Leaf className="h-5 w-5" />
            Your Carbon Credit NFTs
          </CardTitle>
          <CardDescription className="text-gray-400">Select an NFT to retire permanently</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border border-gray-700 rounded-lg bg-gray-900">
                  <Skeleton className="h-4 w-3/4 mb-2 bg-gray-700" />
                  <Skeleton className="h-3 w-1/2 mb-2 bg-gray-700" />
                  <Skeleton className="h-3 w-1/4 bg-gray-700" />
                </div>
              ))}
            </div>
          ) : ownedNFTs.length === 0 ? (
            <div className="text-center py-8">
              <Leaf className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">You don't own any carbon credit NFTs yet</p>
              <p className="text-sm text-gray-500">
                Visit the{" "}
                <a href="/user/mint-nft" className="text-green-400 hover:underline">
                  Mint NFT
                </a>{" "}
                page to create your first carbon credit
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {ownedNFTs.map((nft) => (
                <div
                  key={nft.tokenId}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors bg-gray-900 ${
                    selectedNFT?.tokenId === nft.tokenId
                      ? "border-green-500 bg-green-950"
                      : "border-gray-700 hover:border-green-500"
                  }`}
                  onClick={() => setSelectedNFT(nft)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-50">{nft.project.projectName}</h3>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-gray-800 text-gray-300 border-gray-700">
                        #{nft.tokenId}
                      </Badge>
                      {nft.project.isApproved && (
                        <Badge variant="default" className="bg-green-600 text-white">
                          Approved
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3 text-gray-300">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-blue-400" />
                      <span>{nft.project.projectType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-400" />
                      <span>{nft.project.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-400" />
                      <span>{nft.balance} tCO₂</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      <span>{nft.project.methodology}</span>
                    </div>
                  </div>

                  {(nft.project.startDate || nft.project.endDate) && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {nft.project.startDate && nft.project.endDate
                          ? `${nft.project.startDate} - ${nft.project.endDate}`
                          : nft.project.startDate || nft.project.endDate}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      Available: <span className="font-medium text-green-400">{nft.balance}</span> credits
                    </span>
                    {selectedNFT?.tokenId === nft.tokenId && (
                      <Badge variant="outline" className="text-green-400 border-green-400 bg-green-950">
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
      <Card className="bg-gray-950 text-gray-50 border-gray-800 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Recycle className="h-5 w-5" />
            Retire Carbon Credits
          </CardTitle>
          <CardDescription className="text-gray-400">
            Permanently retire your carbon credits to offset emissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedNFT ? (
            <>
              {/* Selected NFT Details */}
              <div className="p-4 bg-gray-900 rounded-lg space-y-3 border border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-50">{selectedNFT.project.projectName}</h3>
                  <Badge className="bg-gray-800 text-gray-300 border-gray-700">#{selectedNFT.tokenId}</Badge>
                </div>

                {/* NFT Image */}
                {selectedNFT.project.imageHash && (
                  <div className="w-full h-32 bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={selectedNFT.project.imageHash || "/placeholder.svg"}
                      alt={selectedNFT.project.projectName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=128&width=300&text=Carbon+Credit"
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-blue-400" />
                    <span>{selectedNFT.project.projectType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span>{selectedNFT.project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-400" />
                    <span>{selectedNFT.balance} tCO₂</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-400" />
                    <span>{selectedNFT.project.methodology}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-400">
                  Available: <span className="font-medium text-green-400">{selectedNFT.balance}</span> credits
                </p>
              </div>

              {/* Retirement Amount */}
              <div className="space-y-2">
                <Label htmlFor="retireAmount" className="text-gray-50">
                  Amount to Retire
                </Label>
                <Input
                  id="retireAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={amountToRetire}
                  onChange={(e) => setAmountToRetire(e.target.value)}
                  min="1"
                  max={selectedNFT.balance}
                  className="bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-400">Maximum: {selectedNFT.balance} credits</p>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 p-4 bg-gray-900 rounded-lg border border-gray-700">
                <h4 className="font-medium text-gray-50">Cost Breakdown</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Retirement Fee:</span>
                    <span className="text-green-400">{retirementFee} ETH/BNB/HBAR</span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between font-medium text-gray-50">
                    <span>Total Cost:</span>
                    <span className="text-green-400">{retirementFee} ETH/BNB/HBAR</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <Alert className="bg-gray-900 border-yellow-500 text-yellow-300">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription>
                  <strong>Warning:</strong> Retiring carbon credits is permanent and cannot be undone. The NFTs will be
                  burned and removed from circulation forever.
                </AlertDescription>
              </Alert>

              {/* Retire Button */}
              <Button
                onClick={handleRetireCarbon}
                disabled={
                  !amountToRetire ||
                  Number.parseInt(amountToRetire) <= 0 ||
                  Number.parseInt(amountToRetire) > selectedNFT.balance ||
                  isRetiring
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white"
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
                    Retire {amountToRetire || "0"} Carbon Credits
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <Recycle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-400">Select an NFT from the left to start the retirement process</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Section */}
      <Card className="bg-gray-950 text-gray-50 border-gray-800 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            About Carbon Credit Retirement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Recycle className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-50">Permanent Retirement</h3>
              <p className="text-sm text-gray-400">
                Retired credits are permanently removed from circulation and cannot be traded
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-50">Certificate Issued</h3>
              <p className="text-sm text-gray-400">
                You'll receive a retirement certificate as proof of your environmental impact
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Leaf className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-50">Carbon Offset</h3>
              <p className="text-sm text-gray-400">
                Retired credits represent real carbon reduction that offsets your emissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
