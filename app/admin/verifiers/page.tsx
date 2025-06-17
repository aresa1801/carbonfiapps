"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { TransactionStatus } from "@/components/transaction-status"
import { useToast } from "@/components/ui/use-toast"
import { AdminGuard } from "@/components/admin-guard"
import { UserPlus, Users, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { contractService } from "@/lib/contract-utils"
import { VerifierApprovalStatus } from "@/components/verifier-approval-status"

interface Verifier {
  id: number
  name: string
  wallet: string
  isActive: boolean
}

export default function VerifiersPage() {
  const { isConnected, account, nftContractExists, NFT_CONTRACT_ADDRESS } = useWeb3()

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
      const nftContract = await contractService.getNftContract(true)
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
      const nftContract = await contractService.getNftContract(true)
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

  return (
    <AdminGuard>
      <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">Verifier Management</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isLoadingVerifiers || isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <TransactionStatus status={txStatus} hash={txHash} message={txMessage} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Verifier */}
          <div className="lg:col-span-1">
            <Card className="gradient-card card-hover border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-slate-50">Add Verifier</CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Add a new verifier to approve NFT minting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="verifierName" className="text-slate-700 dark:text-slate-300">
                      Verifier Name
                    </Label>
                    <Input
                      id="verifierName"
                      placeholder="Enter name"
                      value={verifierName}
                      onChange={(e) => setVerifierName(e.target.value)}
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
                      value={verifierWallet}
                      onChange={(e) => setVerifierWallet(e.target.value)}
                      className="border-slate-200 dark:border-slate-700 focus:border-green-500 dark:focus:border-green-400"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={addVerifier}
                  disabled={!isConnected || !verifierName || !verifierWallet || isLoading}
                  className="w-full btn-green"
                >
                  {isLoading ? "Processing..." : "Add Verifier"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Verifiers List */}
          <div className="lg:col-span-2">
            <Card className="gradient-card border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-slate-50">Verifiers</CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Manage existing verifiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingVerifiers ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
                        </div>
                        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : verifiers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 dark:text-slate-400">No verifiers found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verifiers.map((verifier) => (
                      <div
                        key={verifier.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <div className="space-y-1 mb-3 sm:mb-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-slate-900 dark:text-slate-50">{verifier.name}</h3>
                            {verifier.isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                            {verifier.wallet.substring(0, 6)}...{verifier.wallet.substring(38)}
                          </p>
                        </div>
                        <Button
                          variant={verifier.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleVerifierStatus(verifier.id, verifier.isActive)}
                          disabled={isLoading}
                          className="w-full sm:w-auto"
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
        <Card className="gradient-card border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-50">Verifier Approval Status</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Current status of auto-approval and verifier settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VerifierApprovalStatus />
          </CardContent>
        </Card>

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
          .btn-green {
            background-color: #10b981;
            color: white;
          }
          .btn-green:hover {
            background-color: #059669;
          }
          .dark .btn-green {
            background-color: #059669;
          }
          .dark .btn-green:hover {
            background-color: #047857;
          }
        `}</style>
      </div>
    </AdminGuard>
  )
}
