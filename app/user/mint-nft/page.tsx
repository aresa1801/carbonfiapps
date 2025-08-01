"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"
import { TransactionStatus } from "@/components/transaction-status"
import { VerifierApprovalStatus } from "@/components/verifier-approval-status"
import { contractService } from "@/lib/contract-utils"
import { CONTRACT_ADDRESSES } from "@/lib/constants"
import { AlertCircle, CheckCircle2, Leaf, Calendar, Upload, FileText, ImageIcon, X } from "lucide-react"
import { Slider } from "@/components/ui/slider"

const CARBON_PROJECT_TYPES = [
  "Reforestation & Afforestation",
  "Solar Energy",
  "Wind Energy",
  "Hydroelectric Power",
  "Biomass Energy",
  "Carbon Capture & Storage",
  "Energy Efficiency",
]

export default function MintNFTPage() {
  const { account, isConnected } = useWeb3()
  const { toast } = useToast()
  const [projectName, setProjectName] = useState("")
  const [projectType, setProjectType] = useState("")
  const [location, setLocation] = useState("")
  const [carbonReduction, setCarbonReduction] = useState("")
  const [methodology, setMethodology] = useState("")
  const [documentHash, setDocumentHash] = useState("")
  const [imageHash, setImageHash] = useState("")
  const [durationDays, setDurationDays] = useState(365) // Default to 1 year
  const [verifierIndex, setVerifierIndex] = useState("0")
  const [verifiers, setVerifiers] = useState<Array<{ name: string; wallet: string; isActive: boolean }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [mintFeePerTon, setMintFeePerTon] = useState<string>("0")
  const [totalFee, setTotalFee] = useState<string>("0")
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false)
  const [tokenId, setTokenId] = useState<number | null>(null)
  const [isApproved, setIsApproved] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())

  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [documentPreview, setDocumentPreview] = useState<string>("")
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (isConnected) {
      loadVerifiers()
      loadMintFee()
      loadAutoApproveStatus()
    }
  }, [isConnected])

  useEffect(() => {
    // Calculate end date based on duration
    const end = new Date(startDate)
    end.setDate(end.getDate() + durationDays)
    setEndDate(end)

    // Calculate total fee based on carbon reduction and fee per ton
    if (carbonReduction && mintFeePerTon) {
      const tons = Number.parseFloat(carbonReduction)
      const feePerTon = Number.parseFloat(mintFeePerTon)
      if (!isNaN(tons) && !isNaN(feePerTon)) {
        setTotalFee((tons * feePerTon).toString())
      }
    }
  }, [carbonReduction, mintFeePerTon, durationDays, startDate])

  const loadVerifiers = async () => {
    try {
      setIsLoading(true)
      const nftContract = await contractService.getNftContract()
      const verifiersList = []

      // Get VERIFIER_COUNT constant first
      let verifierCount = 0
      try {
        verifierCount = await nftContract.VERIFIER_COUNT()
        console.log(`Total verifier slots: ${verifierCount}`)
      } catch (error) {
        console.log("VERIFIER_COUNT not available, trying manual loading")
        verifierCount = 10 // fallback to manual loading
      }

      // Load verifiers
      for (let i = 0; i < verifierCount; i++) {
        try {
          const verifier = await nftContract.verifiers(i)
          if (verifier && verifier.wallet !== ethers.ZeroAddress) {
            verifiersList.push({
              name: verifier.name || `Verifier ${i + 1}`,
              wallet: verifier.wallet,
              isActive: verifier.isActive !== false,
            })
            console.log(`Loaded verifier ${i}:`, verifier.name)
          }
        } catch (error) {
          console.log(`No verifier found at index ${i}`)
          if (verifierCount === 10) break // Stop manual loading
        }
      }

      setVerifiers(verifiersList)
      console.log(`Loaded ${verifiersList.length} verifiers`)

      if (verifiersList.length === 0) {
        toast({
          title: "Warning",
          description: "No verifiers found. Please contact admin to add verifiers.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading verifiers:", error)
      toast({
        title: "Error",
        description: "Failed to load verifiers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadMintFee = async () => {
    try {
      const nftContract = await contractService.getNftContract()
      const fee = await nftContract.mintFeePerTon()
      setMintFeePerTon(ethers.formatEther(fee))
    } catch (error) {
      console.error("Error loading mint fee:", error)
    }
  }

  const loadAutoApproveStatus = async () => {
    try {
      const nftContract = await contractService.getNftContract()
      const status = await nftContract.autoApproveEnabled()
      setAutoApproveEnabled(status)
    } catch (error) {
      console.error("Error loading auto-approve status:", error)
    }
  }

  const generateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return `Qm${hashHex.substring(0, 44)}` // Simulate IPFS hash format
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Document must be smaller than 2MB",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, DOC, DOCX, or TXT files only",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadingDocument(true)
      const hash = await generateFileHash(file)
      setDocumentHash(hash)
      setDocumentFile(file)
      setDocumentPreview(file.name)

      toast({
        title: "Document Uploaded",
        description: `Document hash generated: ${hash.substring(0, 20)}...`,
      })
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to process document",
        variant: "destructive",
      })
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be smaller than 2MB",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload JPEG, PNG, GIF, or WebP images only",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadingImage(true)
      const hash = await generateFileHash(file)
      setImageHash(hash)
      setImageFile(file)

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)

      toast({
        title: "Image Uploaded",
        description: `Image hash generated: ${hash.substring(0, 20)}...`,
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to process image",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const removeDocument = () => {
    setDocumentFile(null)
    setDocumentHash("")
    setDocumentPreview("")
  }

  const removeImage = () => {
    setImageFile(null)
    setImageHash("")
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview("")
  }

  const handleMint = async () => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!projectName || !projectType || !location || !carbonReduction || !methodology) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (verifiers.length === 0) {
      toast({
        title: "Error",
        description: "No verifiers available. Please contact admin.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Get the NFT contract with signer
      const nftContract = await contractService.getNftContract(CONTRACT_ADDRESSES.NFT, true)

      // Calculate mint fee
      const carbonTons = ethers.parseUnits(carbonReduction, 0)
      const feePerTon = await nftContract.mintFeePerTon()
      const totalFee = carbonTons * feePerTon

      // Check and approve tokens if needed
      if (totalFee > 0) {
        const tokenContract = await contractService.getTokenContract(CONTRACT_ADDRESSES.CAFI_TOKEN, true)
        const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESSES.NFT)

        if (allowance < totalFee) {
          console.log("Approving tokens for mint fee...")
          toast({
            title: "Approval Required",
            description: "Approving CAFI tokens for mint fee...",
          })
          const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.NFT, totalFee)
          await approveTx.wait()
          console.log("Token approval successful")
        }
      }

      // Prepare mint parameters according to the ABI struct
      const mintParams = {
        projectName,
        projectType,
        location,
        carbonTons: carbonTons, // Note: ABI uses 'carbonTons' not 'carbonReduction'
        methodology,
        documentHash: documentHash || "",
        imageCID: imageHash || "", // Note: ABI uses 'imageCID' not 'imageHash'
        durationDays: BigInt(durationDays),
        verifierIndex: BigInt(verifierIndex), // Include verifierIndex in the struct
      }

      console.log("Minting with params:", mintParams)

      // Mint the NFT - pass only the struct parameter
      const tx = await nftContract.mintCarbonNFT(mintParams)
      setTxHash(tx.hash)
      console.log("Mint transaction submitted:", tx.hash)

      toast({
        title: "Transaction Submitted",
        description: "Minting transaction has been submitted. Please wait for confirmation...",
      })

      // Wait for transaction to be mined
      const receipt = await tx.wait()
      console.log("Mint transaction confirmed:", receipt)

      // Get token ID from events
      let newTokenId = null
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = nftContract.interface.parseLog({
              topics: log.topics,
              data: log.data,
            })
            if (parsedLog && parsedLog.name === "ProjectMinted") {
              newTokenId = Number(parsedLog.args.tokenId)
              console.log("Token ID from event:", newTokenId)
              break
            }
          } catch (e) {
            // Skip logs that can't be parsed
          }
        }
      }

      // Fallback to get current token ID
      if (!newTokenId) {
        try {
          const currentTokenId = await nftContract.getCurrentTokenId()
          newTokenId = Number(currentTokenId) - 1
          console.log("Token ID from getCurrentTokenId:", newTokenId)
        } catch (error) {
          console.error("Error getting token ID:", error)
        }
      }

      if (newTokenId) {
        setTokenId(newTokenId)
      }

      setIsSubmitted(true)

      // Check approval status
      const autoApproveEnabled = await nftContract.autoApproveEnabled()
      if (autoApproveEnabled) {
        setIsApproved(true)
      } else if (newTokenId) {
        const selectedVerifier = verifiers[Number.parseInt(verifierIndex)]
        if (selectedVerifier) {
          try {
            const approved = await nftContract.isApproved(newTokenId, selectedVerifier.wallet)
            setIsApproved(approved)
          } catch (error) {
            console.error("Error checking approval status:", error)
          }
        }
      }

      toast({
        title: "Success",
        description: "Carbon NFT minted successfully!",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error minting NFT:", error)
      let errorMessage = "Failed to mint NFT"

      if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees"
      } else if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user"
      } else if (error.message?.includes("execution reverted")) {
        errorMessage = "Transaction failed - please check your inputs and try again"
      } else if (error.message?.includes("no matching fragment")) {
        errorMessage = "Contract method not found - please contact support"
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setProjectName("")
    setProjectType("")
    setLocation("")
    setCarbonReduction("")
    setMethodology("")
    setDocumentHash("")
    setImageHash("")
    setDurationDays(365)
    setVerifierIndex("0")
    setTxHash("")
    setTokenId(null)
    setIsApproved(false)
    setIsSubmitted(false)
    setDocumentFile(null)
    setImageFile(null)
    setDocumentPreview("")
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview("")
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-50">Mint Carbon NFT</h1>

      {!isConnected ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Connected</AlertTitle>
          <AlertDescription>Please connect your wallet to mint NFTs.</AlertDescription>
        </Alert>
      ) : (
        <>
          {autoApproveEnabled && (
            <Alert className="mb-6 bg-black text-white border-green-700">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertTitle className="text-green-400">Auto-Approval Enabled</AlertTitle>
              <AlertDescription className="text-gray-300">
                Your NFT will be automatically approved after minting.
              </AlertDescription>
            </Alert>
          )}

          {isSubmitted && tokenId !== null ? (
            <Card className="mb-6 bg-gray-950 text-gray-50 border-gray-800 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-green-400">
                  <Leaf className="mr-2 h-5 w-5" />
                  NFT Minted Successfully
                </CardTitle>
                <CardDescription className="text-gray-300">Your carbon offset NFT has been created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-300">Project Name:</p>
                    <p>{projectName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-300">Token ID:</p>
                    <p>{tokenId}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-300">Carbon Reduction:</p>
                    <p>{carbonReduction} tons</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-300">Duration:</p>
                    <p>
                      {durationDays} days ({formatDate(startDate)} - {formatDate(endDate)})
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-300">Transaction:</p>
                    <p className="text-sm font-mono break-all">{txHash}</p>
                  </div>
                  <VerifierApprovalStatus
                    tokenId={tokenId.toString()}
                    approvals={[]}
                    isAutoApprovalEnabled={autoApproveEnabled}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Mint Another NFT
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="bg-gray-950 text-gray-50 border-gray-800 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-gray-50">Mint a New Carbon NFT</CardTitle>
                <CardDescription className="text-gray-300">
                  Create a new carbon offset NFT with verifiable data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName" className="text-gray-300">
                        Project Name *
                      </Label>
                      <Input
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name"
                        required
                        className="bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectType" className="text-gray-300">
                        Project Type *
                      </Label>
                      <Select value={projectType} onValueChange={setProjectType}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-50 focus:border-emerald-500">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-gray-50">
                          {CARBON_PROJECT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-gray-300">
                        Location *
                      </Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Project location"
                        required
                        className="bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carbonReduction" className="text-gray-300">
                        Carbon Reduction (tons) *
                      </Label>
                      <Input
                        id="carbonReduction"
                        type="number"
                        value={carbonReduction}
                        onChange={(e) => setCarbonReduction(e.target.value)}
                        placeholder="Amount in tons"
                        required
                        className="bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="methodology" className="text-gray-300">
                      Methodology *
                    </Label>
                    <Input
                      id="methodology"
                      value={methodology}
                      onChange={(e) => setMethodology(e.target.value)}
                      placeholder="Verification methodology"
                      required
                      className="bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="durationDays" className="flex items-center text-gray-300">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        Project Duration: {durationDays} days
                      </Label>
                      <div className="text-sm text-gray-400">
                        {formatDate(startDate)} - {formatDate(endDate)}
                      </div>
                    </div>
                    <Slider
                      id="durationDays"
                      min={30}
                      max={3650}
                      step={30}
                      value={[durationDays]}
                      onValueChange={(value) => setDurationDays(value[0])}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>30 days</span>
                      <span>1 year</span>
                      <span>10 years</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documentUpload" className="text-gray-300">
                        Project Documentation
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("documentUpload")?.click()}
                            disabled={uploadingDocument}
                            className="w-full bg-gray-800 border-gray-700 text-gray-50 hover:bg-gray-700"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {uploadingDocument ? "Processing..." : "Upload Document"}
                          </Button>
                          <input
                            id="documentUpload"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleDocumentUpload}
                            className="hidden"
                          />
                        </div>
                        {documentFile && (
                          <div className="flex items-center justify-between p-2 bg-gray-800 rounded-md text-gray-50">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-sm truncate">{documentPreview}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeDocument}
                              className="text-gray-400 hover:text-gray-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {documentHash && (
                          <div className="text-xs text-gray-400">Hash: {documentHash.substring(0, 20)}...</div>
                        )}
                        <div className="text-xs text-gray-400">Max 2MB • PDF, DOC, DOCX, TXT</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageUpload" className="text-gray-300">
                        Project Image
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("imageUpload")?.click()}
                            disabled={uploadingImage}
                            className="w-full bg-gray-800 border-gray-700 text-gray-50 hover:bg-gray-700"
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            {uploadingImage ? "Processing..." : "Upload Image"}
                          </Button>
                          <input
                            id="imageUpload"
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                        {imageFile && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-gray-800 rounded-md text-gray-50">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm truncate">{imageFile.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeImage}
                                className="text-gray-400 hover:text-gray-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {imagePreview && (
                              <div className="relative w-full h-32 bg-gray-800 rounded-md overflow-hidden">
                                <img
                                  src={imagePreview || "/placeholder.svg"}
                                  alt="Project preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {imageHash && (
                          <div className="text-xs text-gray-400">Hash: {imageHash.substring(0, 20)}...</div>
                        )}
                        <div className="text-xs text-gray-400">Max 2MB • JPEG, PNG, GIF, WebP</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verifier" className="text-gray-300">
                      Verifier *
                    </Label>
                    <Select value={verifierIndex} onValueChange={setVerifierIndex}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-50 focus:border-emerald-500">
                        <SelectValue placeholder="Select a verifier" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-gray-50">
                        {verifiers.length > 0 ? (
                          verifiers.map((verifier, index) => (
                            <SelectItem key={index} value={index.toString()} disabled={!verifier.isActive}>
                              {verifier.name} {!verifier.isActive && "(Inactive)"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No verifiers available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2">
                    <Alert className="bg-gray-800 text-gray-50 border-gray-700">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <AlertTitle className="text-gray-50">Mint Fee</AlertTitle>
                      <AlertDescription className="text-gray-300">
                        Fee per ton: {mintFeePerTon} CAFI
                        <br />
                        Total fee: {totalFee} CAFI ({carbonReduction || 0} tons × {mintFeePerTon} CAFI)
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleMint}
                  disabled={isLoading || verifiers.length === 0}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? "Minting..." : "Mint Carbon NFT"}
                </Button>
              </CardFooter>
            </Card>
          )}

          {txHash && (
            <div className="mt-6">
              <TransactionStatus hash={txHash} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
