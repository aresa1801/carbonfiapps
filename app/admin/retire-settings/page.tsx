"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { formatEther, parseEther } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function RetireSettingsPage() {
  const { carbonRetireContract, isConnected, isAdmin, refreshBalances, setTransactionStatus } = useWeb3()
  const [retirementFee, setRetirementFee] = useState("")
  const [newRetirementFee, setNewRetirementFee] = useState("")
  const [nftContractAddress, setNftContractAddress] = useState("")
  const [newNftContractAddress, setNewNftContractAddress] = useState("")
  const [isUpdatingFee, setIsUpdatingFee] = useState(false)
  const [isUpdatingNftAddress, setIsUpdatingNftAddress] = useState(false)

  useEffect(() => {
    const fetchRetireSettings = async () => {
      if (isConnected && carbonRetireContract) {
        try {
          const fee = await carbonRetireContract.retirementFee()
          setRetirementFee(formatEther(fee))
          setNewRetirementFee(formatEther(fee))

          const nftAddress = await carbonRetireContract.nftContract()
          setNftContractAddress(nftAddress)
          setNewNftContractAddress(nftAddress)
        } catch (error) {
          console.error("Error fetching retirement settings:", error)
          toast({
            title: "Error",
            description: "Failed to fetch carbon retirement settings.",
            variant: "destructive",
          })
        }
      }
    }
    fetchRetireSettings()
  }, [isConnected, carbonRetireContract, refreshBalances])

  const handleUpdateRetirementFee = async () => {
    if (!carbonRetireContract || !newRetirementFee || !isAdmin) {
      toast({
        title: "Error",
        description: "Please connect wallet, ensure you are an admin, and enter a new fee.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingFee(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Updating retirement fee..." })
    try {
      const feeInWei = parseEther(newRetirementFee)
      const tx = await carbonRetireContract.updateRetirementFee(feeInWei)
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "Retirement fee updated successfully!" })
      toast({
        title: "Success",
        description: "Retirement fee updated.",
      })
      setRetirementFee(newRetirementFee)
      refreshBalances()
    } catch (error: any) {
      console.error("Error updating retirement fee:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Failed to update fee: ${error.reason || error.message}`,
      })
      toast({
        title: "Update Failed",
        description: `Failed to update retirement fee: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingFee(false)
    }
  }

  const handleUpdateNftContractAddress = async () => {
    if (!carbonRetireContract || !newNftContractAddress || !isAdmin) {
      toast({
        title: "Error",
        description: "Please connect wallet, ensure you are an admin, and enter a new NFT contract address.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingNftAddress(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Updating NFT contract address..." })
    try {
      const tx = await carbonRetireContract.updateNftAddress(newNftContractAddress)
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "NFT contract address updated successfully!" })
      toast({
        title: "Success",
        description: "NFT contract address updated.",
      })
      setNftContractAddress(newNftContractAddress)
      refreshBalances()
    } catch (error: any) {
      console.error("Error updating NFT contract address:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Failed to update NFT address: ${error.reason || error.message}`,
      })
      toast({
        title: "Update Failed",
        description: `Failed to update NFT contract address: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingNftAddress(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">You do not have administrative privileges to view this page.</p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">Please connect your wallet to manage retirement settings.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Carbon Retirement Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Retirement Fee</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="current-fee">Current Retirement Fee (ETH/BNB/HBAR)</Label>
            <Input id="current-fee" value={retirementFee} readOnly />
          </div>
          <div>
            <Label htmlFor="new-fee">New Retirement Fee (ETH/BNB/HBAR)</Label>
            <Input
              id="new-fee"
              type="number"
              placeholder="Enter new fee"
              value={newRetirementFee}
              onChange={(e) => setNewRetirementFee(e.target.value)}
              disabled={isUpdatingFee}
            />
          </div>
          <Button onClick={handleUpdateRetirementFee} disabled={isUpdatingFee}>
            {isUpdatingFee ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update Retirement Fee"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NFT Contract Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="current-nft-address">Current NFT Contract Address</Label>
            <Input id="current-nft-address" value={nftContractAddress} readOnly />
          </div>
          <div>
            <Label htmlFor="new-nft-address">New NFT Contract Address</Label>
            <Input
              id="new-nft-address"
              placeholder="Enter new NFT contract address"
              value={newNftContractAddress}
              onChange={(e) => setNewNftContractAddress(e.target.value)}
              disabled={isUpdatingNftAddress}
            />
          </div>
          <Button onClick={handleUpdateNftContractAddress} disabled={isUpdatingNftAddress}>
            {isUpdatingNftAddress ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update NFT Contract Address"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
