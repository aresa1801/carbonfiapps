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
import { ImageIcon, Settings, RefreshCw, Plus, AlertCircle, Terminal } from "lucide-react"
import { contractService, CONTRACT_ADDRESSES, type Verifier } from "@/lib/contract-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { setNFTBaseURI } from "@/lib/contract-service"

export default function NFTSettingsPage() {
  const { isConnected, account, tokenSymbol, nftContractExists, nftContract, signer, isAdmin, refreshBalances } =
    useWeb3()
  const { toast } = useToast()

  const [mintFee, setMintFee] = useState("0")
  const [newMintFee, setNewMintFee] = useState("")
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false)
  const [verifiers, setVerifiers] = useState<(Verifier & { index: number })[]>([])
  const [contractPaused, setContractPaused] = useState(false)
  const [taxWallet, setTaxWallet] = useState("")
  const [managementWallet, setManagementWallet] = useState("")
  const [currentTokenId, setCurrentTokenId] = useState("0")
  const [currentBaseURI, setCurrentBaseURI] = useState("")
  const [newBaseURI, setNewBaseURI] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const nftContract = await contractService.getNftContract(CONTRACT_ADDRESSES.NFT, true)
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

      const nftContract = await contractService.getNftContract(CONTRACT_ADDRESSES.NFT, true)
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

      const nftContract = await contractService.getNftContract(CONTRACT_ADDRESSES.NFT, true)

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

      const nftContract = await contractService.getNftContract(CONTRACT_ADDRESSES.NFT, true)
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

      const nftContract = await contractService.getNftContract(CONTRACT_ADDRESSES.NFT, true)
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

  const handleSetBaseURI = async () => {
    if (!nftContract || !signer || !newBaseURI) {
      toast({
        title: "Error",
        description: "Wallet not connected or new base URI is empty.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      await setNFTBaseURI(nftContract, newBaseURI)
      toast({
        title: "Success",
        description: `NFT Base URI set to ${newBaseURI}.`,
      })
      setNewBaseURI("")
      refreshBalances()
    } catch (err: any) {
      console.error("Set base URI error:", err)
      setError(`Failed to set base URI: ${err.message?.substring(0, 100) || err.reason || "Unknown error"}`)
      toast({
        title: "Transaction Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to manage NFT settings.</AlertDescription>
      </Alert>
    )
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Unauthorized Access</AlertTitle>
        <AlertDescription>You do not have admin privileges to access this page.</AlertDescription>
      </Alert>
    )
  }

  return (
    <AdminGuard>
      <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">NFT Settings</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={isLoadingData || isLoading}
              className="flex items-center gap-1 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant={contractPaused ? "default" : "destructive"}
              size="sm"
              onClick={togglePause}
              disabled={isLoading}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {contractPaused ? "Unpause" : "Pause"} Contract
            </Button>
          </div>
        </div>

        {contractPaused && (
          <Alert variant="destructive" className="border-red-700 bg-red-900/20 text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription>
              The NFT contract is currently paused. Some functions may not be available.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TransactionStatus status={txStatus} hash={txHash} message={txMessage} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contract Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mint Fee Settings */}
            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Mint Fee Settings</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Configure the fee required to mint carbon NFTs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rewardAmount" className="text-gray-300">
                      Amount to Add ({tokenSymbol})
                    </Label>
                    <Input
                      id="rewardAmount"
                      type="number"
                      placeholder="0.0"
                      value={newMintFee}
                      onChange={(e) => setNewMintFee(e.target.value)}
                      className="bg-gray-800 text-white border-gray-700 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  onClick={updateMintFee}
                  disabled={!isConnected || isLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Update Mint Fee
                </Button>
              </CardFooter>
            </Card>

            {/* Auto Approve Settings */}
            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Auto Approve Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure automatic approval for new NFT projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-300">Auto Approve New Projects</Label>
                    <p className="text-sm text-gray-400">
                      When enabled, new projects will be automatically approved without verifier review
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={autoApproveEnabled} onCheckedChange={toggleAutoApprove} disabled={isLoading} />
                    <Badge
                      variant={autoApproveEnabled ? "default" : "secondary"}
                      className="bg-emerald-900/50 text-emerald-400 border-emerald-700/50"
                    >
                      {autoApproveEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add New Verifier */}
            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                    <Plus className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Add New Verifier</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Add a new verifier to approve carbon NFT projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="verifierName" className="text-gray-300">
                      Verifier Name
                    </Label>
                    <Input
                      id="verifierName"
                      placeholder="Enter name"
                      value={newVerifier.name}
                      onChange={(e) => setNewVerifier({ ...newVerifier, name: e.target.value })}
                      className="bg-gray-800 text-white border-gray-700 focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="verifierWallet" className="text-gray-300">
                      Wallet Address
                    </Label>
                    <Input
                      id="verifierWallet"
                      placeholder="0x..."
                      value={newVerifier.wallet}
                      onChange={(e) => setNewVerifier({ ...newVerifier, wallet: e.target.value })}
                      className="bg-gray-800 text-white border-gray-700 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={addVerifier}
                  disabled={!isConnected || isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Add Verifier
                </Button>
              </CardFooter>
            </Card>

            {/* Set New Base URI */}
            <Card>
              <CardHeader>
                <CardTitle>Set New Base URI</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-base-uri">New Base URI</Label>
                  <Input
                    id="new-base-uri"
                    type="text"
                    value={newBaseURI}
                    onChange={(e) => setNewBaseURI(e.target.value)}
                    placeholder="e.g., ipfs://your-ipfs-hash/"
                    disabled={loading}
                  />
                </div>
                <Button onClick={handleSetBaseURI} disabled={loading || !newBaseURI}>
                  {loading ? "Setting..." : "Set Base URI"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contract Information */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                    <Settings className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Contract Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Staking Contract:</span>
                    <span className="font-mono text-xs text-gray-100">0x...{account?.substring(38)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Token Contract:</span>
                    <span className="font-mono text-xs text-gray-100">0x...{account?.substring(38)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Current Base URI:</span>
                    <span className="font-mono text-xs text-gray-100 break-all">{currentBaseURI || "Not set"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Removed global styles as they are now inline or replaced */}
        <style jsx global>{`
          /* Removed .gradient-card, .card-hover, .btn-purple as styles are now inline or replaced */
        `}</style>
      </div>
    </AdminGuard>
  )
}
