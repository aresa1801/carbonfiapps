"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { getAutoApprovalStatus, toggleAutoApproval } from "@/lib/auto-approval-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { setIsRefreshing } from "@/components/set-is-refreshing" // Declare the variable before using it

export function AutoApprovalSettings() {
  const { isConnected, isAdmin, carbonRetireContractExists, reinitializeMetaMask, isRefreshing } = useWeb3()
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)

  const fetchAutoApprovalStatus = async () => {
    if (!carbonRetireContractExists) {
      setIsLoading(false)
      return
    }
    setIsRefreshing(true)
    const status = await getAutoApprovalStatus()
    setAutoApprovalEnabled(status)
    setIsLoading(false)
    setIsRefreshing(false)
  }

  const handleToggleAutoApproval = async () => {
    setIsToggling(true)
    const success = await toggleAutoApproval(autoApprovalEnabled)
    if (success) {
      setAutoApprovalEnabled(!autoApprovalEnabled)
    }
    setIsToggling(false)
  }

  useEffect(() => {
    if (isConnected && isAdmin && carbonRetireContractExists) {
      fetchAutoApprovalStatus()
    }
  }, [isConnected, isAdmin, carbonRetireContractExists])

  if (!isConnected || !isAdmin) {
    return null // Render nothing if not connected or not admin
  }

  if (!carbonRetireContractExists) {
    return (
      <Card className="border-yellow-800 bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="text-yellow-200">Carbon Retire Contract Not Found</CardTitle>
          <CardDescription className="text-yellow-300">
            Carbon Retire contract not found on this network. Please ensure you're connected to the correct network.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-gray-700 bg-gray-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Auto-Approval Settings</CardTitle>
          <Button
            onClick={reinitializeMetaMask}
            disabled={isRefreshing}
            variant="outline"
            className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-gray-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <CardDescription className="text-gray-400">
          Configure automatic approval for carbon retirement certificates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-approval-switch" className="text-gray-300">
            Enable Auto-Approval
          </Label>
          {isLoading ? (
            <Skeleton className="h-6 w-12 bg-gray-700" />
          ) : (
            <Switch
              id="auto-approval-switch"
              checked={autoApprovalEnabled}
              onCheckedChange={handleToggleAutoApproval}
              disabled={isToggling}
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          When enabled, carbon retirement certificates will be automatically approved without requiring manual verifier
          action.
        </p>
      </CardContent>
    </Card>
  )
}
