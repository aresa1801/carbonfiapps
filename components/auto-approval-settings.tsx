"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { toast } from "@/components/ui/use-toast"
import { checkAutoApprovalStatus, toggleAutoApproval } from "@/lib/auto-approval-utils"

export function AutoApprovalSettings() {
  const { provider, signer, chainId, isConnected, isAdmin, refreshBalances } = useWeb3()
  const [isAutoApprovalEnabled, setIsAutoApprovalEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      if (isConnected && provider && chainId) {
        setIsLoading(true)
        const status = await checkAutoApprovalStatus(provider, chainId)
        setIsAutoApprovalEnabled(status)
        setIsLoading(false)
      }
    }
    fetchStatus()
  }, [isConnected, provider, chainId, refreshBalances])

  const handleToggle = async () => {
    if (!isAdmin || !signer || !chainId) {
      toast({
        title: "Error",
        description: "You are not authorized to perform this action or wallet not connected.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const success = await toggleAutoApproval(signer, chainId)
      if (success) {
        setIsAutoApprovalEnabled((prev) => !prev)
        toast({
          title: "Success",
          description: `Auto-approval ${isAutoApprovalEnabled ? "disabled" : "enabled"}.`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to toggle auto-approval.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error toggling auto-approval:", error)
      toast({
        title: "Error",
        description: `Failed to toggle auto-approval: ${error.message || error}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto-Approval Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You do not have administrative privileges to view or modify these settings.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Approval Settings</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Label htmlFor="auto-approval-switch">Enable Auto-Approval for Faucet</Label>
        <Switch
          id="auto-approval-switch"
          checked={isAutoApprovalEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading || !isConnected}
        />
      </CardContent>
    </Card>
  )
}
