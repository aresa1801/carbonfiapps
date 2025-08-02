"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { useEffect, useState } from "react"
import { formatEther } from "ethers"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function ClaimStatusCard() {
  const { faucetContract, address, isConnected, refreshBalances, setTransactionStatus } = useWeb3()
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null)
  const [claimInterval, setClaimInterval] = useState<number | null>(null)
  const [claimAmount, setClaimAmount] = useState<string | null>(null)
  const [canClaim, setCanClaim] = useState(false)
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    const fetchClaimStatus = async () => {
      if (isConnected && faucetContract && address) {
        setIsLoading(true)
        try {
          const lastTime = await faucetContract.lastClaimTime(address)
          const interval = await faucetContract.claimInterval()
          const amount = await faucetContract.claimAmount()

          setLastClaimTime(Number(lastTime))
          setClaimInterval(Number(interval))
          setClaimAmount(formatEther(amount))

          const currentTime = Math.floor(Date.now() / 1000)
          const nextClaimTimestamp = Number(lastTime) + Number(interval)
          const remainingTime = nextClaimTimestamp - currentTime

          if (remainingTime <= 0) {
            setCanClaim(true)
            setTimeUntilNextClaim("Ready to claim!")
          } else {
            setCanClaim(false)
            const hours = Math.floor(remainingTime / 3600)
            const minutes = Math.floor((remainingTime % 3600) / 60)
            const seconds = remainingTime % 60
            setTimeUntilNextClaim(`${hours}h ${minutes}m ${seconds}s`)

            // Set up a countdown timer
            if (timer) clearInterval(timer)
            timer = setInterval(() => {
              const newRemainingTime = nextClaimTimestamp - Math.floor(Date.now() / 1000)
              if (newRemainingTime <= 0) {
                setCanClaim(true)
                setTimeUntilNextClaim("Ready to claim!")
                if (timer) clearInterval(timer)
                refreshBalances() // Refresh balances when claim becomes available
              } else {
                const h = Math.floor(newRemainingTime / 3600)
                const m = Math.floor((newRemainingTime % 3600) / 60)
                const s = newRemainingTime % 60
                setTimeUntilNextClaim(`${h}h ${m}m ${s}s`)
              }
            }, 1000)
          }
        } catch (error) {
          console.error("Error fetching claim status:", error)
          toast({
            title: "Error",
            description: "Failed to fetch claim status.",
            variant: "destructive",
          })
          setLastClaimTime(null)
          setClaimInterval(null)
          setClaimAmount(null)
          setCanClaim(false)
          setTimeUntilNextClaim("Error fetching status.")
        } finally {
          setIsLoading(false)
        }
      } else {
        setLastClaimTime(null)
        setClaimInterval(null)
        setClaimAmount(null)
        setCanClaim(false)
        setTimeUntilNextClaim(null)
        setIsLoading(false)
      }
    }

    fetchClaimStatus()

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isConnected, faucetContract, address, refreshBalances])

  const handleClaim = async () => {
    if (!faucetContract || !canClaim) {
      toast({
        title: "Error",
        description: "Cannot claim tokens at this time.",
        variant: "destructive",
      })
      return
    }

    setIsClaiming(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Claiming tokens..." })
    try {
      const tx = await faucetContract.claim()
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "Tokens claimed successfully!" })
      toast({
        title: "Claim Successful",
        description: `${claimAmount} CAFI tokens claimed.`,
      })
      refreshBalances() // Trigger a full refresh after successful claim
    } catch (error: any) {
      console.error("Error claiming tokens:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Claim failed: ${error.reason || error.message}`,
      })
      toast({
        title: "Claim Failed",
        description: `Failed to claim tokens: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsClaiming(false)
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Claim CAFI Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect your wallet to claim CAFI tokens.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Claim CAFI Tokens</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading claim status...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim CAFI Tokens</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <p className="text-sm font-medium">Last Claim:</p>
          <p className="text-lg font-bold">
            {lastClaimTime ? new Date(lastClaimTime * 1000).toLocaleString() : "Never"}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Next Claim Available In:</p>
          <p className="text-lg font-bold">{timeUntilNextClaim}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Claim Amount:</p>
          <p className="text-lg font-bold">{claimAmount || "N/A"} CAFI</p>
        </div>
        <Button onClick={handleClaim} disabled={!canClaim || isClaiming}>
          {isClaiming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Claiming...
            </>
          ) : (
            "Claim CAFI"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
