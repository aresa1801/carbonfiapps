"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useWeb3 } from "@/components/web3-provider"
import { formatEther } from "ethers"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function FaucetStatCard() {
  const { faucetContract, isConnected, refreshBalances } = useWeb3()
  const [claimAmount, setClaimAmount] = useState<string | null>(null)
  const [claimInterval, setClaimInterval] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFaucetStats = async () => {
      if (isConnected && faucetContract) {
        setIsLoading(true)
        try {
          const amount = await faucetContract.claimAmount()
          const interval = await faucetContract.claimInterval()
          setClaimAmount(formatEther(amount))
          setClaimInterval(interval.toString()) // Interval is in seconds
        } catch (error) {
          console.error("Error fetching faucet stats:", error)
          toast({
            title: "Error",
            description: "Failed to fetch faucet statistics.",
            variant: "destructive",
          })
          setClaimAmount(null)
          setClaimInterval(null)
        } finally {
          setIsLoading(false)
        }
      } else {
        setClaimAmount(null)
        setClaimInterval(null)
        setIsLoading(false)
      }
    }
    fetchFaucetStats()
  }, [isConnected, faucetContract, refreshBalances])

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faucet Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect your wallet to view faucet statistics.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faucet Statistics</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading faucet stats...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faucet Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div>
          <p className="text-sm font-medium">Claim Amount:</p>
          <p className="text-lg font-bold">{claimAmount || "N/A"} CAFI</p>
        </div>
        <div>
          <p className="text-sm font-medium">Claim Interval:</p>
          <p className="text-lg font-bold">
            {claimInterval ? `${Number.parseInt(claimInterval) / 3600} hours` : "N/A"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
