"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton component

export function TokenConfig() {
  const {
    isConnected,
    isAdmin,
    nftContractExists,
    tokenSymbol,
    tokenDecimals,
    getMintFee,
    setMintFee,
    getTaxWallet,
    getManagementWallet,
    reinitializeMetaMask,
    isRefreshing,
  } = useWeb3()

  const [mintFee, setMintFeeState] = useState("0")
  const [newMintFee, setNewMintFee] = useState("")
  const [isUpdatingMintFee, setIsUpdatingMintFee] = useState(false)
  const [taxWallet, setTaxWallet] = useState("")
  const [managementWallet, setManagementWallet] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const fetchTokenConfig = async () => {
    if (!nftContractExists) {
      setIsLoading(false)
      return
    }
    try {
      const fee = await getMintFee()
      setMintFeeState(fee)
      const tax = await getTaxWallet()
      setTaxWallet(tax)
      const management = await getManagementWallet()
      setManagementWallet(management)
    } catch (error) {
      console.error("Error fetching token config:", error)
      toast({
        title: "Error",
        description: "Failed to fetch token configuration.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetMintFee = async () => {
    if (!newMintFee) return
    try {
      setIsUpdatingMintFee(true)
      const tx = await setMintFee(newMintFee)
      toast({
        title: "Transaction Submitted",
        description: "Mint fee update transaction submitted. Please wait for confirmation.",
      })
      await tx.wait()
      toast({
        title: "Success",
        description: `Mint fee updated to ${newMintFee} ${tokenSymbol}.`,
      })
      setNewMintFee("")
      fetchTokenConfig()
    } catch (error: any) {
      console.error("Error setting mint fee:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update mint fee.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingMintFee(false)
    }
  }

  useEffect(() => {
    if (isConnected && isAdmin && nftContractExists) {
      fetchTokenConfig()
    }
  }, [isConnected, isAdmin, nftContractExists])

  if (!isConnected || !isAdmin) {
    return null // Render nothing if not connected or not admin
  }

  if (!nftContractExists) {
    return (
      <Card className="border-yellow-800 bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="text-yellow-200">NFT Contract Not Found</CardTitle>
          <CardDescription className="text-yellow-300">
            NFT contract not found on this network. Please ensure you're connected to the correct network.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-gray-700 bg-gray-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">NFT Token Configuration</CardTitle>
          <Button
            onClick={reinitializeMetaMask}
            disabled={isRefreshing}
            variant="outline"
            className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-gray-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <CardDescription className="text-gray-400">Manage the settings for the CarbonFi NFT token.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Current Mint Fee per Ton</Label>
            <p className="text-lg font-bold text-white">
              {isLoading ? <Skeleton className="h-6 w-24 bg-gray-700" /> : `${mintFee} ${tokenSymbol}`}
            </p>
          </div>
          <div>
            <Label className="text-gray-300">Tax Wallet Address</Label>
            <p className="text-sm font-mono text-gray-400 bg-gray-800 p-2 rounded border border-gray-700 break-all">
              {isLoading ? <Skeleton className="h-6 w-full bg-gray-700" /> : taxWallet}
            </p>
          </div>
          <div>
            <Label className="text-gray-300">Management Wallet Address</Label>
            <p className="text-sm font-mono text-gray-400 bg-gray-800 p-2 rounded border border-gray-700 break-all">
              {isLoading ? <Skeleton className="h-6 w-full bg-gray-700" /> : managementWallet}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newMintFee" className="text-gray-300">
            Set New Mint Fee per Ton ({tokenSymbol})
          </Label>
          <Input
            id="newMintFee"
            type="number"
            placeholder="Enter new fee"
            value={newMintFee}
            onChange={(e) => setNewMintFee(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          />
          <Button
            onClick={handleSetMintFee}
            disabled={!newMintFee || isUpdatingMintFee}
            className="w-full mt-2 bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-800 hover:text-emerald-100"
          >
            {isUpdatingMintFee ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Mint Fee"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
