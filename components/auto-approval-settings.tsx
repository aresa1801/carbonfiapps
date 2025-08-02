"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useWeb3 } from "@/components/web3-provider"
import { useToast } from "@/hooks/use-toast"
import { getAutoApprovalStatus, setAutoApprovalStatus } from "@/lib/auto-approval-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export function AutoApprovalSettings() {
  const { signer, chainId, isConnected, isAdmin, refreshBalances } = useWeb3()
  const { toast } = useToast()

  const [verifierAddress, setVerifierAddress] = useState("")
  const [isApproved, setIsApproved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (verifierAddress && chainId && signer) {
        setLoading(true)
        setError(null)
        try {
          const status = await getAutoApprovalStatus(verifierAddress, chainId, signer.provider)
          setIsApproved(status)
        } catch (err: any) {
          console.error("Error fetching auto-approval status:", err)
          setError(`Failed to fetch status: ${err.message || "Unknown error"}`)
          setIsApproved(false)
        } finally {
          setLoading(false)
        }
      } else {
        setIsApproved(false)
      }
    }
    fetchApprovalStatus()
  }, [verifierAddress, chainId, signer])

  const handleToggleApproval = async () => {
    if (!verifierAddress || !chainId || !signer) {
      toast({
        title: "Error",
        description: "Please enter a verifier address and connect your wallet.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      await setAutoApprovalStatus(verifierAddress, !isApproved, chainId, signer)
      setIsApproved(!isApproved)
      toast({
        title: "Success",
        description: `Auto-approval for ${verifierAddress.substring(0, 6)}...${verifierAddress.slice(-4)} set to ${!isApproved}.`,
      })
      refreshBalances() // Refresh to reflect any potential changes
    } catch (err: any) {
      console.error("Error toggling auto-approval:", err)
      setError(`Failed to set auto-approval: ${err.message || err.reason || "Unknown error"}`)
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
        <AlertDescription>Please connect your wallet to manage auto-approval settings.</AlertDescription>
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
    <Card>
      <CardHeader>
        <CardTitle>Auto-Approval Settings</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="verifier-address">Verifier Address</Label>
          <Input
            id="verifier-address"
            type="text"
            placeholder="Enter verifier address (e.g., 0x...)"
            value={verifierAddress}
            onChange={(e) => setVerifierAddress(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-approval-switch">Auto-Approval Status</Label>
          <Switch
            id="auto-approval-switch"
            checked={isApproved}
            onCheckedChange={handleToggleApproval}
            disabled={loading || !verifierAddress}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {isApproved
            ? `Auto-approval is ENABLED for ${verifierAddress || "this address"}.`
            : `Auto-approval is DISABLED for ${verifierAddress || "this address"}.`}
        </p>
        <Button onClick={handleToggleApproval} disabled={loading || !verifierAddress}>
          {loading ? "Updating..." : `Toggle Auto-Approval to ${isApproved ? "Disable" : "Enable"}`}
        </Button>
      </CardContent>
    </Card>
  )
}
