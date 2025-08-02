"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useWeb3 } from "@/components/web3-provider"
import { useToast } from "@/hooks/use-toast"
import { isVerifier, setVerifierStatus } from "@/lib/contract-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export function VerifierApprovalStatus() {
  const { signer, chainId, isConnected, isAdmin, refreshBalances } = useWeb3()
  const { toast } = useToast()

  const [verifierAddress, setVerifierAddress] = useState("")
  const [isCurrentlyVerifier, setIsCurrentlyVerifier] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVerifierStatus = async () => {
      if (verifierAddress && chainId && signer) {
        setLoading(true)
        setError(null)
        try {
          const status = await isVerifier(signer.provider, verifierAddress)
          setIsCurrentlyVerifier(status)
        } catch (err: any) {
          console.error("Error fetching verifier status:", err)
          setError(`Failed to fetch status: ${err.message || "Unknown error"}`)
          setIsCurrentlyVerifier(false)
        } finally {
          setLoading(false)
        }
      } else {
        setIsCurrentlyVerifier(false)
      }
    }
    fetchVerifierStatus()
  }, [verifierAddress, chainId, signer])

  const handleToggleVerifierStatus = async () => {
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
      await setVerifierStatus(signer, verifierAddress, !isCurrentlyVerifier)
      setIsCurrentlyVerifier(!isCurrentlyVerifier)
      toast({
        title: "Success",
        description: `Verifier status for ${verifierAddress.substring(0, 6)}...${verifierAddress.slice(-4)} set to ${!isCurrentlyVerifier}.`,
      })
      refreshBalances() // Refresh to reflect any potential changes
    } catch (err: any) {
      console.error("Error toggling verifier status:", err)
      setError(`Failed to set verifier status: ${err.message || err.reason || "Unknown error"}`)
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
        <AlertDescription>Please connect your wallet to manage verifier settings.</AlertDescription>
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
        <CardTitle>Verifier Status Management</CardTitle>
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
          <Label htmlFor="verifier-status-switch">Is Verifier?</Label>
          <Switch
            id="verifier-status-switch"
            checked={isCurrentlyVerifier}
            onCheckedChange={handleToggleVerifierStatus}
            disabled={loading || !verifierAddress}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {isCurrentlyVerifier
            ? `The address ${verifierAddress || "entered"} is currently a verifier.`
            : `The address ${verifierAddress || "entered"} is NOT currently a verifier.`}
        </p>
        <Button onClick={handleToggleVerifierStatus} disabled={loading || !verifierAddress}>
          {loading ? "Updating..." : `Toggle Verifier Status to ${isCurrentlyVerifier ? "Disable" : "Enable"}`}
        </Button>
      </CardContent>
    </Card>
  )
}
