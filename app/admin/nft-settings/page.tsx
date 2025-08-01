"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useWeb3 } from "@/components/web3-provider"
import { TransactionStatus } from "@/components/transaction-status"
import { useToast } from "@/components/ui/use-toast"
import { AdminGuard } from "@/components/admin-guard"
import { ImageIcon, Settings, RefreshCw, Plus, AlertCircle } from "lucide-react"
import { contractService, CONTRACT_ADDRESSES, type Verifier } from "@/lib/contract-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function NFTSettingsPage() {
  const { isConnected, account, tokenSymbol, nftContractExists } = useWeb3()

  const [mintFee, setMintFee] = useState("0")
  const [newMintFee, setNewMintFee] = useState("")
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false)
  const [verifiers, setVerifiers] = useState<(Verifier & { index: number })[]>([])
  const [contractPaused, setContractPaused] = useState(false)
  const [taxWallet, setTaxWallet] = useState("")
  const [managementWallet, setManagementWallet] = useState("")
  const [currentTokenId, setCurrentTokenId] = useState("0")

  const [txStatus, setTxStatus] = useState<"loading" | "success" | "error" | null>(null)
  const [txHash, setTxHash] = useState("")
  const [txMessage, setTxMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // New verifier form
  const [newVerifier, setNewVerifier] = useState({
    name: "",
    wallet: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    if (isConnected && account) {
      console.log("Admin NFT settings page: Connected with account", account)
      checkNFTContract()

      // Set up auto-refresh interval
      const intervalId = setInterval(() => {
        loadNFTData()
      }, 30000)

      return () => clearInterval(intervalId)
    }
  }, [isConnected, nftContractExists, account])

  const checkNFTContract = async () => {
    try {
      const exists = await contractService.contractExists(CONTRACT_ADDRESSES.NFT)
      console.log("NFT contract exists:", exists)

      if (exists) {
        await loadNFTData()
      } else {
        toast({
          title: "NFT Contract Not Found",
          description: "The NFT contract could not be found on this network.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking NFT contract:", error)
    }
  }

  const loadNFTData = async () => {
    try {
      setIsLoadingData(true)
      console.log("Loading NFT contract data...")

      const nftContract = await contractService.getNftContract()

      // Load contract settings
      const [mintFeePerTon, autoApprove, paused, tax, management, tokenId] = await Promise.all([
        nftContract.mintFeePerTon(),
        nftContract.autoApproveEnabled(),
        nftContract.paused(),
        nftContract.taxWallet(),
        nftContract.managementWallet(),
        nftContract.getCurrentTokenId(),
      ])

      setMintFee(contractService.formatTokenAmount(mintFeePerTon))
      setAutoApproveEnabled(autoApprove)
      setContractPaused(paused)
      setTaxWallet(tax)
      setManagementWallet(management)
      setCurrentTokenId(tokenId.toString())

      // Load verifiers
      await loadVerifiers()

      console.log("NFT contract data loaded successfully")
    } catch (error) {
      console.error("Error loading NFT data:", error)
      toast({
        title: "Error loading NFT data",
        description: "Failed to load NFT contract information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadVerifiers = async () => {
    try {
      const nftContract = await contractService.getNftContract()
      const loadedVerifiers: (Verifier & { index: number })[] = []

      // Try to load verifiers from index 0 to 9
      for (let i = 0; i < 10; i++) {
        try {
          const verifier = await nftContract.verifiers(i)
          if (verifier && verifier.wallet !== "0x0000000000000000000000000000000000000000") {
            loadedVerifiers.push({
              index: i,
              name: verifier.name,
              wallet: verifier.wallet,
              isActive: verifier.isActive,
            })
          }
        } catch (error) {
          // Stop when we can't get more verifiers
          break
        }
      }

      setVerifiers(loadedVerifiers)
      console.log("Loaded verifiers:", loadedVerifiers)
    } catch (error) {
      console.error("Error loading verifiers:", error)
    }
  }

  const updateMintFee = async () => {
    if (!newMintFee || Number.parseFloat(newMintFee) < 0) {
      toast({
        title: "Invalid fee",
        description: "Please enter a valid mint fee",
        variant: "destructive",
      })
      return
    }

    if (contractPaused) {
      toast({
        title: "Contract paused",
        description: "The NFT contract is currently paused",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`Updating mint fee to ${newMintFee} ${tokenSymbol}...`)

      const nftContract = await contractService.getNftContract(true)
      const feeInWei = contractService.parseTokenAmount(newMintFee)

      const tx = await nftContract.setMintFeePerTon(feeInWei)
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully updated mint fee to ${newMintFee} ${tokenSymbol}!`)

      // Refresh data
      await loadNFTData()

      toast({
        title: "Mint fee updated",
        description: `Mint fee has been updated to ${newMintFee} ${tokenSymbol}`,
      })

      // Reset form
      setNewMintFee("")
    } catch (error: any) {
      console.error("Error updating mint fee:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to update mint fee")

      toast({
        title: "Failed to update mint fee",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAutoApprove = async () => {
    if (contractPaused) {
      toast({
        title: "Contract paused",
        description: "The NFT contract is currently paused",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`${autoApproveEnabled ? "Disabling" : "Enabling"} auto-approve...`)

      const nftContract = await contractService.getNftContract(true)
      const tx = await nftContract.toggleAutoApprove()
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully ${autoApproveEnabled ? "disabled" : "enabled"} auto-approve!`)

      // Refresh data
      await loadNFTData()

      toast({
        title: "Auto-approve updated",
        description: `Auto-approve has been ${autoApproveEnabled ? "disabled" : "enabled"}`,
      })
    } catch (error: any) {
      console.error("Error toggling auto-approve:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to toggle auto-approve")

      toast({
        title: "Failed to update auto-approve",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addVerifier = async () => {
    if (!newVerifier.name || !newVerifier.wallet) {
      toast({
        title: "Invalid input",
        description: "Please enter both verifier name and wallet address",
        variant: "destructive",
      })
      return
    }

    if (contractPaused) {
      toast({
        title: "Contract paused",
        description: "The NFT contract is currently paused",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`Adding verifier ${newVerifier.name}...`)

      const nftContract = await contractService.getNftContract(true)

      // Find next available index
      let nextIndex = verifiers.length
      for (let i = 0; i < 10; i++) {
        const existingVerifier = verifiers.find((v) => v.index === i)
        if (!existingVerifier) {
          nextIndex = i
          break
        }
      }

      const tx = await nftContract.setVerifier(nextIndex, newVerifier.name, newVerifier.wallet)
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully added verifier ${newVerifier.name}!`)

      // Refresh data
      await loadVerifiers()

      toast({
        title: "Verifier added",
        description: `Verifier ${newVerifier.name} has been added successfully`,
      })

      // Reset form
      setNewVerifier({ name: "", wallet: "" })
    } catch (error: any) {
      console.error("Error adding verifier:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to add verifier")

      toast({
        title: "Failed to add verifier",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateVerifier = async (index: number, name: string, wallet: string) => {
    if (!name || !wallet) {
      toast({
        title: "Invalid input",
        description: "Please enter both verifier name and wallet address",
        variant: "destructive",
      })
      return
    }

    if (contractPaused) {
      toast({
        title: "Contract paused",
        description: "The NFT contract is currently paused",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`Updating verifier at index ${index}...`)

      const nftContract = await contractService.getNftContract(true)
      const tx = await nftContract.setVerifier(index, name, wallet)
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully updated verifier!`)

      // Refresh data
      await loadVerifiers()

      toast({
        title: "Verifier updated",
        description: `Verifier at index ${index} has been updated`,
      })
    } catch (error: any) {
      console.error("Error updating verifier:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to update verifier")

      toast({
        title: "Failed to update verifier",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePause = async () => {
    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`${contractPaused ? "Unpausing" : "Pausing"} NFT contract...`)

      const nftContract = await contractService.getNftContract(true)
      const tx = await nftContract.togglePause()
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully ${contractPaused ? "unpaused" : "paused"} NFT contract!`)

      // Refresh data
      await loadNFTData()

      toast({
        title: "Contract status updated",
        description: `NFT contract has been ${contractPaused ? "unpaused" : "paused"}`,
      })
    } catch (error: any) {
      console.error("Error toggling pause:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to toggle pause")

      toast({
        title: "Failed to update contract status",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshData = () => {
    loadNFTData()
    toast({
      title: "Data refreshed",
      description: "NFT contract information has been updated",
    })
  }

  return (
    <AdminGuard>
      <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">NFT Settings</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={isLoadingData || isLoading}
              className="flex items-center gap-1 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant={contractPaused ? "default" : "destructive"}
              size="sm"
              onClick={togglePause}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              {contractPaused ? "Unpause" : "Pause"} Contract
            </Button>
          </div>
        </div>

        {contractPaused && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The NFT contract is currently paused. Some functions may not be available.
            </AlertDescription>
          </Alert>
        )}

        <TransactionStatus status={txStatus} hash={txHash} message={txMessage} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contract Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mint Fee Settings */}
            <Card className="gradient-card card-hover border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-slate-50">Mint Fee Settings</CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Configure the fee required to mint carbon NFTs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rewardAmount" className="text-slate-700 dark:text-slate-300">
                      Amount to Add ({tokenSymbol})
                    </Label>
                    <Input
                      id="rewardAmount"
                      type="number"
                      placeholder="0.0"
                      value={newMintFee}
                      className="border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  onClick={updateMintFee}
                  disabled={!isConnected || isLoading}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  Update Mint Fee
                </Button>
              </CardFooter>
            </Card>

            {/* Auto Approve Settings */}
            <Card className="gradient-card card-hover border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50">Auto Approve Settings</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Configure automatic approval for new NFT projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-slate-700 dark:text-slate-300">Auto Approve New Projects</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      When enabled, new projects will be automatically approved without verifier review
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={autoApproveEnabled} onCheckedChange={toggleAutoApprove} disabled={isLoading} />
                    <Badge variant={autoApproveEnabled ? "default" : "secondary"}>
                      {autoApproveEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add New Verifier */}
            <Card className="gradient-card card-hover border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-slate-50">Add New Verifier</CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Add a new verifier to approve carbon NFT projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="verifierName" className="text-slate-700 dark:text-slate-300">
                      Verifier Name
                    </Label>
                    <Input
                      id="verifierName"
                      placeholder="Enter name"
                      className="border-slate-200 dark:border-slate-700 focus:border-green-500 dark:focus:border-green-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="verifierWallet" className="text-slate-700 dark:text-slate-300">
                      Wallet Address
                    </Label>
                    <Input
                      id="verifierWallet"
                      placeholder="0x..."
                      className="border-slate-200 dark:border-slate-700 focus:border-green-500 dark:focus:border-green-400"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => {}} disabled={!isConnected} className="w-full btn-purple">
                  Add Verifier
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Contract Information */}
          <div className="space-y-6">
            <Card className="gradient-card card-hover border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-slate-50">Contract Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Staking Contract:</span>
                    <span className="font-mono text-xs">0x...{account?.substring(38)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Token Contract:</span>
                    <span className="font-mono text-xs">0x...{account?.substring(38)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <style jsx global>{`
          .gradient-card {
            background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8));
          }
          .dark .gradient-card {
            background: linear-gradient(to bottom right, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.8));
          }
          .card-hover {
            transition: all 0.3s ease;
          }
          .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          }
          .dark .card-hover:hover {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
          }
          .btn-purple {
            background-color: #8b5cf6;
            color: white;
          }
          .btn-purple:hover {
            background-color: #7c3aed;
          }
          .dark .btn-purple {
            background-color: #7c3aed;
          }
          .dark .btn-purple:hover {
            background-color: #6d28d9;
          }
        `}</style>
      </div>
    </AdminGuard>
  )
}
