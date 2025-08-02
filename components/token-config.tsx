"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { parseEther, formatEther } from "ethers"

export function TokenConfig() {
  const { signer, cafiTokenContract, isAdmin, isRefreshing, refreshBalances, chainId } = useWeb3()
  const [newSupply, setNewSupply] = useState("")
  const [currentSupply, setCurrentSupply] = useState("Loading...")
  const [isUpdatingSupply, setIsUpdatingSupply] = useState(false)

  useEffect(() => {
    const fetchSupply = async () => {
      if (cafiTokenContract) {
        try {
          const supply = await cafiTokenContract.totalSupply()
          setCurrentSupply(formatEther(supply))
        } catch (error) {
          console.error("Error fetching total supply:", error)
          setCurrentSupply("Error")
          toast({
            title: "Error",
            description: "Failed to fetch total supply.",
            variant: "destructive",
          })
        }
      }
    }
    fetchSupply()
  }, [cafiTokenContract, isRefreshing, toast])

  const handleUpdateSupply = async () => {
    if (!signer || !cafiTokenContract || !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "You are not authorized to perform this action or wallet not connected.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdatingSupply(true)
      const amount = parseEther(newSupply)
      const tx = await cafiTokenContract.mint(signer.address, amount)
      await tx.wait()
      toast({
        title: "Supply Updated",
        description: "Token supply has been successfully updated.",
      })
      setNewSupply("")
      refreshBalances() // Refresh balances to show updated supply
    } catch (error: any) {
      console.error("Error updating supply:", error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update token supply.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingSupply(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Token Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">You do not have admin privileges to view this section.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Token Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="current-supply">Current Total Supply</Label>
          <Input id="current-supply" value={currentSupply} readOnly className="mt-1" />
        </div>
        <div>
          <Label htmlFor="new-supply">Mint New Tokens (CAFI)</Label>
          <Input
            id="new-supply"
            type="number"
            placeholder="e.g., 1000.0"
            value={newSupply}
            onChange={(e) => setNewSupply(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button onClick={handleUpdateSupply} disabled={isUpdatingSupply || !newSupply}>
          {isUpdatingSupply && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Mint Tokens
        </Button>
      </CardContent>
    </Card>
  )
}
