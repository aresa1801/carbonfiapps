"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { useEffect, useState } from "react"
import { getClaimStatus, claimFaucetTokens } from "@/lib/contract-service"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNowStrict } from "date-fns"
import { Loader2 } from "lucide-react"

export function ClaimStatusCard() {
  const { faucetContract, address, isConnected, signer, refreshBalances } = useWeb3()
  const { toast } = useToast()

  const [canClaim, setCanClaim] = useState(false)
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState<string | null>(null)

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    const fetchStatus = async () => {
      if (faucetContract && address) {
        try {
          const { canClaim: newCanClaim, timeUntilNextClaim: newTimeUntilNextClaim } = await getClaimStatus(
            faucetContract,
            address,
          )
          setCanClaim(newCanClaim)
          setTimeUntilNextClaim(newTimeUntilNextClaim)

          if (!newCanClaim && newTimeUntilNextClaim > 0) {
            const targetTime = Date.now() + newTimeUntilNextClaim * 1000
            timer = setInterval(() => {
              const remaining = targetTime - Date.now()
              if (remaining <= 0) {
                clearInterval(timer!)
                setCountdown(null)
                fetchStatus() // Re-fetch status to update canClaim
              } else {
                setCountdown(formatDistanceToNowStrict(targetTime, { addSuffix: true }))
              }
            }, 1000)
          } else {
            setCountdown(null)
          }
        } catch (error) {
          console.error("Error fetching claim status:", error)
          setCanClaim(false)
          setTimeUntilNextClaim(null)
          setCountdown(null)
        }
      }
    }

    fetchStatus()

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [faucetContract, address, refreshBalances])

  const handleClaim = async () => {
    if (!faucetContract || !signer) {
      toast({
        title: "Error",
        description: "Wallet not connected.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      await claimFaucetTokens(faucetContract)
      toast({
        title: "Claim Successful",
        description: "Tokens claimed from faucet!",
      })
      refreshBalances()
      // Immediately set canClaim to false and start countdown for next claim
      setCanClaim(false)
      // Assuming a default interval if not fetched immediately after claim
      const defaultInterval = 24 * 60 * 60 // 24 hours in seconds
      setTimeUntilNextClaim(defaultInterval)
      const targetTime = Date.now() + defaultInterval * 1000
      const timer = setInterval(() => {
        const remaining = targetTime - Date.now()
        if (remaining <= 0) {
          clearInterval(timer!)
          setCountdown(null)
          fetchStatus() // Re-fetch status to update canClaim
        } else {
          setCountdown(formatDistanceToNowStrict(targetTime, { addSuffix: true }))
        }
      }, 1000)
    } catch (err: any) {
      console.error("Claim error:", err)
      toast({
        title: "Claim Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Claim Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect your wallet to see claim status.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canClaim ? (
          <>
            <p className="text-lg font-semibold text-green-500">You can claim tokens now!</p>
            <Button onClick={handleClaim} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                "Claim CAFI Tokens"
              )}
            </Button>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-red-500">Claim not available yet.</p>
            {countdown && <p className="text-muted-foreground">Next claim: {countdown}</p>}
            <Button disabled className="w-full">
              Claim Not Ready
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
