"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { TransactionStatus } from "@/components/transaction-status"
import { useToast } from "@/components/ui/use-toast"
import { UserPlus, Users, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { contractService } from "@/lib/contract-utils"
import { VerifierApprovalStatus } from "@/components/verifier-approval-status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

interface Verifier {
  id: number
  name: string
  wallet: string
  isActive: boolean
}

export default function AdminVerifiersPage() {
  const { isConnected, isAdmin, account, nftContractExists, NFT_CONTRACT_ADDRESS } = useWeb3()
  const [verifierName, setVerifierName] = useState("")
  const [verifierWallet, setVerifierWallet] = useState("")
  const [verifiers, setVerifiers] = useState<Verifier[]>([])
  const [txStatus, setTxStatus] = useState<"loading" | "success" | "error" | null>(null)
  const [txHash, setTxHash] = useState("")
  const [txMessage, setTxMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingVerifiers, setIsLoadingVerifiers] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isConnected && account) {
      console.log("Admin verifiers page: Connected with account", account)
      console.log("NFT contract exists:", nftContractExists)
      console.log("NFT contract address:", NFT_CONTRACT_ADDRESS)

      // Check if NFT contract exists
      const checkNftContract = async () => {
        try {
          const exists = await contractService.contractExists(NFT_CONTRACT_ADDRESS)
          console.log("NFT contract exists (checked from admin page):", exists)

          if (exists) {
            loadVerifiers()
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

      checkNftContract()
    }
  }, [isConnected, nftContractExists, account])

  const loadVerifiers = async () => {
    try {
      setIsLoadingVerifiers(true)
      console.log("Loading verifiers...")

      // Use contractService to get the NFT contract
      const nftContract = await contractService.getNftContract()
      console.log("NFT contract instance created successfully")

      // Get verifiers
      const verifiersList: Verifier[] = []
      let index = 0

      try {
        while (true) {
          const verifier = await nftContract.verifiers(index)

          // If we get a verifier with a non-zero address, add it to the list
          if (verifier.wallet !== "0x0000000000000000000000000000000000000000") {
            verifiersList.push({
              id: index,
              name: verifier.name,
              wallet: verifier.wallet,
              isActive: verifier.isActive,
            })
          }

          index++

          // Limit to 20 verifiers to prevent infinite loop
          if (index >= 20) break
        }
      } catch (error) {
        // This is expected when we reach the end of the verifiers array
        console.log("Reached end of verifiers list or encountered an error")
      }

      console.log("Verifiers loaded:", verifiersList)
      setVerifiers(verifiersList)
    } catch (error) {
      console.error("Error loading verifiers:", error)
      toast({
        title: "Error loading verifiers",
        description: "Failed to load verifier information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingVerifiers(false)
    }
  }

  const addVerifier = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to add a verifier",
        variant: "destructive",
      })
      return
    }

    if (!nftContractExists) {
      toast({
        title: "Contract not found",
        description: "The NFT contract is not available on this network",
        variant: "destructive",
      })
      return
    }

    if (!verifierName || !verifierWallet) {
      toast({
        title: "Invalid input",
        description: "Please enter both name and wallet address",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`Adding verifier ${verifierName}...`)

      // Find the next available index
      const nextIndex = verifiers.length > 0 ? Math.max(...verifiers.map((v) => v.id)) + 1 : 0

      // Add verifier
      const nftContract = await contractService.getNftContract(NFT_CONTRACT_ADDRESS, true)
      console.log(`Adding verifier ${verifierName} with wallet ${verifierWallet} at index ${nextIndex}`)
      const tx = await nftContract.setVerifier(nextIndex, verifierName, verifierWallet)
      setTxHash(tx.hash)
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully added verifier ${verifierName}!`)

      // Refresh data
      await loadVerifiers()

      toast({
        title: "Verifier added",
        description: `You have successfully added ${verifierName} as a verifier`,
      })

      // Reset form
      setVerifierName("")
      setVerifierWallet("")
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

  const toggleVerifierStatus = async (id: number, currentStatus: boolean) => {
    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`${currentStatus ? "Deactivating" : "Activating"} verifier...`)

      // Toggle verifier status
      const nftContract = await contractService.getNftContract(NFT_CONTRACT_ADDRESS, true)
      console.log(`Toggling verifier status for ID ${id} from ${currentStatus} to ${!currentStatus}`)
      const tx = await nftContract.toggleVerifierStatus(id)
      setTxHash(tx.hash)
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully ${currentStatus ? "deactivated" : "activated"} verifier!`)

      // Refresh data
      await loadVerifiers()

      toast({
        title: "Verifier status updated",
        description: `Verifier has been ${currentStatus ? "deactivated" : "activated"}`,
      })
    } catch (error: any) {
      console.error("Error toggling verifier status:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to update verifier status")

      toast({
        title: "Failed to update verifier status",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshData = () => {
    loadVerifiers()

    toast({
      title: "Data refreshed",
      description: "Verifier information has been updated",
    })
  }

  if (!isConnected) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to manage verifier settings.</AlertDescription>
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
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Verifier Management</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshData}
          disabled={isLoadingVerifiers || isLoading}
          className="flex items-center gap-1 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <TransactionStatus status={txStatus} hash={txHash} message={txMessage} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Verifier */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-900 border border-gray-700">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-900/20 rounded-lg">
                  <UserPlus className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-white">Add Verifier</CardTitle>
              </div>
              <CardDescription className="text-gray-400">Add a new verifier to approve NFT minting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="verifierName" className="text-gray-300">
                    Verifier Name
                  </Label>
                  <Input
                    id="verifierName"
                    placeholder="Enter name"
                    value={verifierName}
                    onChange={(e) => setVerifierName(e.target.value)}
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
                    value={verifierWallet}
                    onChange={(e) => setVerifierWallet(e.target.value)}
                    className="bg-gray-800 text-white border-gray-700 focus:border-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={addVerifier}
                disabled={!isConnected || !verifierName || !verifierWallet || isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isLoading ? "Processing..." : "Add Verifier"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Verifiers List */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border border-gray-700">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-900/20 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-white">Verifiers</CardTitle>
              </div>
              <CardDescription className="text-gray-400">Manage existing verifiers</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingVerifiers ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800"
                    >
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-24"></div>
                        <div className="h-3 bg-gray-700 rounded w-40"></div>
                      </div>
                      <div className="h-8 w-20 bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : verifiers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No verifiers found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifiers.map((verifier) => (
                    <div
                      key={verifier.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800"
                    >
                      <div className="space-y-1 mb-3 sm:mb-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-white">{verifier.name}</h3>
                          {verifier.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/50 text-emerald-400">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 font-mono">
                          {verifier.wallet.substring(0, 6)}...{verifier.wallet.substring(38)}
                        </p>
                      </div>
                      <Button
                        variant={verifier.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleVerifierStatus(verifier.id, verifier.isActive)}
                        disabled={isLoading}
                        className={`w-full sm:w-auto ${verifier.isActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                      >
                        {verifier.isActive ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" /> Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" /> Activate
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Verifier Approval Status */}
      <Card className="bg-gray-900 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Verifier Approval Status</CardTitle>
          <CardDescription className="text-gray-400">
            Current status of auto-approval and verifier settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerifierApprovalStatus />
        </CardContent>
      </Card>

      {/* About Verifiers */}
      <Card className="bg-gray-900 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">About Verifiers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Verifiers are trusted entities responsible for validating carbon retirement claims. Only addresses granted
            the verifier role can approve or disapprove carbon retirement requests, ensuring the integrity of the
            system.
          </p>
        </CardContent>
      </Card>

      {/* Removed global styles as they are now inline or replaced */}
      <style jsx global>{`
        /* Removed .gradient-card, .card-hover, .btn-green as styles are now inline or replaced */
      `}</style>
    </div>
  )
}
