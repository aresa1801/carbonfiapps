"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWeb3 } from "@/components/web3-provider"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function VerifierApprovalStatus() {
  const { faucetContract, address, isConnected, refreshBalances } = useWeb3()
  const [isApproved, setIsApproved] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (isConnected && faucetContract && address) {
        setIsLoading(true)
        try {
          const approved = await faucetContract.isVerifierApproved(address)
          setIsApproved(approved)
        } catch (error) {
          console.error("Error fetching verifier approval status:", error)
          toast({
            title: "Error",
            description: "Failed to fetch verifier approval status.",
            variant: "destructive",
          })
          setIsApproved(null) // Indicate an error state
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsApproved(null)
        setIsLoading(false)
      }
    }
    fetchApprovalStatus()
  }, [isConnected, faucetContract, address, refreshBalances])

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verifier Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect your wallet to see your verifier status.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verifier Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading verifier status...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verifier Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isApproved === true && (
          <Badge variant="default" className="bg-green-500 hover:bg-green-500">
            Approved Verifier
          </Badge>
        )}
        {isApproved === false && <Badge variant="destructive">Not an Approved Verifier</Badge>}
        {isApproved === null && <Badge variant="secondary">Status Unknown (Error)</Badge>}
        <p className="text-sm text-muted-foreground mt-2">
          {isApproved
            ? "You are an approved verifier and can manage user claims."
            : "You are not currently an approved verifier. Contact an administrator for approval."}
        </p>
      </CardContent>
    </Card>
  )
}
