"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { getFarmingRewardRate, setFarmingRewardRate } from "@/lib/contract-service"

export default function AdminFarmingPage() {
  const { farmingContract, signer, isConnected, isAdmin, refreshBalances } = useWeb3()
  const { toast } = useToast()

  const [currentRewardRate, setCurrentRewardRate] = useState("0")
  const [newRewardRate, setNewRewardRate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRewardRate = async () => {
      if (farmingContract) {
        try {
          const rate = await getFarmingRewardRate(farmingContract)
          setCurrentRewardRate(rate)
        } catch (err: any) {
          console.error("Error fetching farming reward rate:", err)
          setError(`Failed to fetch reward rate: ${err.message || "Unknown error"}`)
        }
      }
    }
    fetchRewardRate()
  }, [farmingContract, refreshBalances])

  const handleSetRewardRate = async () => {
    if (!farmingContract || !signer || !newRewardRate) {
      toast({
        title: "Error",
        description: "Wallet not connected or new reward rate invalid.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      await setFarmingRewardRate(farmingContract, newRewardRate)
      toast({
        title: "Success",
        description: `Farming reward rate set to ${newRewardRate}.`,
      })
      setNewRewardRate("")
      refreshBalances()
    } catch (err: any) {
      console.error("Set reward rate error:", err)
      setError(`Failed to set reward rate: ${err.message || err.reason || "Unknown error"}`)
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
        <AlertDescription>Please connect your wallet to manage farming pool settings.</AlertDescription>
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
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Admin Farming Pool Settings</h1>

      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Farming Reward Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{currentRewardRate} CAFI per second per staked token</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Set New Reward Rate</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-reward-rate">New Reward Rate (CAFI per second per staked token)</Label>
            <Input
              id="new-reward-rate"
              type="number"
              value={newRewardRate}
              onChange={(e) => setNewRewardRate(e.target.value)}
              placeholder="e.g., 0.000000000000000001"
              disabled={loading}
            />
          </div>
          <Button onClick={handleSetRewardRate} disabled={loading || Number.parseFloat(newRewardRate) <= 0}>
            {loading ? "Setting..." : "Set Reward Rate"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
