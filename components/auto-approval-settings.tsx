"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useWeb3 } from "@/components/web3-provider"
import { Settings, CheckCircle, Clock, AlertTriangle, Coins } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AutoApprovalSettings() {
  const {
    isConnected,
    nftContractExists,
    isAdmin,
    getAutoApproveEnabled,
    getMintFee,
    setMintFee,
    toggleAutoApprove: toggleAutoApproveMethod,
  } = useWeb3()
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(true) // Default to true
  const [autoApproveFee, setAutoApproveFee] = useState("0")
  const [newFee, setNewFee] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFee, setIsLoadingFee] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const { toast } = useToast()

  // Load settings from contract on component mount
  useEffect(() => {
    const loadContractSettings = async () => {
      if (nftContractExists && isAdmin) {
        try {
          const [enabled, fee] = await Promise.all([getAutoApproveEnabled(), getMintFee()])

          setAutoApprovalEnabled(enabled)
          setAutoApproveFee(fee)
          setNewFee(fee)
          setIsInitialized(true)

          // If contract has auto-approval disabled but we want it enabled by default,
          // show a notification to admin
          if (!enabled) {
            toast({
              title: "Auto-Approval Disabled",
              description:
                "Auto-approval is currently disabled in the contract. Consider enabling it for better user experience.",
              variant: "default",
            })
          }
        } catch (error) {
          console.error("Error loading contract settings:", error)
          // Keep default enabled state if contract read fails
          setIsInitialized(true)
        }
      } else {
        // If not admin or contract doesn't exist, still show default enabled state
        setIsInitialized(true)
      }
    }

    loadContractSettings()
  }, [nftContractExists, isAdmin, getAutoApproveEnabled, getMintFee, toast])

  const handleToggleAutoApproval = async () => {
    if (!isConnected || !isAdmin) {
      toast({
        title: "Access denied",
        description: "Only admin can change auto-approval settings",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const tx = await toggleAutoApproveMethod()
      await tx.wait()

      // Refresh the actual state from contract
      const newState = await getAutoApproveEnabled()
      setAutoApprovalEnabled(newState)

      toast({
        title: "Settings updated",
        description: `Auto-approval has been ${newState ? "enabled" : "disabled"}`,
      })
    } catch (error: any) {
      console.error("Error updating auto-approval setting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update auto-approval setting",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateFee = async () => {
    if (!isConnected || !isAdmin) {
      toast({
        title: "Access denied",
        description: "Only admin can change auto-approval fee",
        variant: "destructive",
      })
      return
    }

    if (!newFee || Number.parseFloat(newFee) < 0) {
      toast({
        title: "Invalid fee",
        description: "Please enter a valid fee amount",
        variant: "destructive",
      })
      return
    }

    setIsLoadingFee(true)

    try {
      const tx = await setMintFee(newFee)
      await tx.wait()

      setAutoApproveFee(newFee)

      toast({
        title: "Fee updated",
        description: `Auto-approval fee has been set to ${newFee} CAFI`,
      })
    } catch (error: any) {
      console.error("Error updating auto-approval fee:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update auto-approval fee",
        variant: "destructive",
      })
    } finally {
      setIsLoadingFee(false)
    }
  }

  // Auto-enable feature for new deployments
  const handleEnableByDefault = async () => {
    if (!isConnected || !isAdmin) {
      toast({
        title: "Access denied",
        description: "Only admin can enable auto-approval by default",
        variant: "destructive",
      })
      return
    }

    if (autoApprovalEnabled) {
      toast({
        title: "Already enabled",
        description: "Auto-approval is already enabled",
        variant: "default",
      })
      return
    }

    try {
      setIsLoading(true)
      const tx = await toggleAutoApproveMethod()
      await tx.wait()

      const newState = await getAutoApproveEnabled()
      setAutoApprovalEnabled(newState)

      toast({
        title: "Auto-approval enabled",
        description: "Auto-approval has been enabled by default for better user experience",
      })
    } catch (error: any) {
      console.error("Error enabling auto-approval:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to enable auto-approval",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add this useEffect after the existing one
  useEffect(() => {
    const refreshContractState = async () => {
      if (nftContractExists && isAdmin && isConnected && isInitialized) {
        try {
          const [enabled, fee] = await Promise.all([getAutoApproveEnabled(), getMintFee()])
          setAutoApprovalEnabled(enabled)
          setAutoApproveFee(fee)
          setNewFee(fee)
        } catch (error) {
          console.error("Error refreshing contract state:", error)
        }
      }
    }

    // Refresh every 5 seconds when connected
    const interval = setInterval(refreshContractState, 5000)
    return () => clearInterval(interval)
  }, [nftContractExists, isAdmin, isConnected, isInitialized, getAutoApproveEnabled, getMintFee])

  if (!nftContractExists) {
    return (
      <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          NFT contract not found. Auto-approval settings are not available.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="gradient-card card-hover border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-slate-900 dark:text-slate-50">Auto-Approval Settings</CardTitle>
        </div>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Configure automatic approval behavior for new NFT mints (Default: Enabled)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-approval" className="text-base font-medium">
              Enable Auto-Approval
            </Label>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Automatically approve NFTs from all registered verifiers upon minting (Recommended: Enabled)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-approval"
              checked={autoApprovalEnabled}
              onCheckedChange={handleToggleAutoApproval}
              disabled={!isConnected || !isAdmin || isLoading}
            />
            {!autoApprovalEnabled && isAdmin && (
              <Button onClick={handleEnableByDefault} size="sm" variant="outline" disabled={isLoading} className="ml-2">
                Enable Default
              </Button>
            )}
          </div>
        </div>

        {/* Auto-Approval Fee Setting */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Auto-Approval Fee</Label>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Fee charged for automatic approval service (in CAFI tokens)
          </p>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="0.0"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
              className="flex-1"
              min="0"
              step="0.01"
              disabled={!isConnected || !isAdmin}
            />
            <Button
              onClick={handleUpdateFee}
              disabled={!isConnected || !isAdmin || isLoadingFee || newFee === autoApproveFee}
              variant="outline"
            >
              <Coins className="mr-2 h-4 w-4" />
              {isLoadingFee ? "Updating..." : "Update Fee"}
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Current fee: {autoApproveFee} CAFI tokens</p>
        </div>

        {/* Status indicator */}
        <Alert
          className={`${
            autoApprovalEnabled
              ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20"
              : "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20"
          }`}
        >
          {autoApprovalEnabled ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          )}
          <AlertDescription
            className={
              autoApprovalEnabled ? "text-green-800 dark:text-green-200" : "text-yellow-800 dark:text-yellow-200"
            }
          >
            {autoApprovalEnabled
              ? `✅ Auto-approval is enabled (Default). Fee: ${autoApproveFee} CAFI tokens per approval.`
              : "⚠️ Auto-approval is disabled. Consider enabling for better user experience. New NFTs will require manual approval from verifiers."}
          </AlertDescription>
        </Alert>

        {/* Recommendation for disabled state */}
        {!autoApprovalEnabled && (
          <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Recommendation:</strong> Enable auto-approval for better user experience. This allows users to
              mint NFTs instantly without waiting for manual verifier approval.
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Default Configuration:</h4>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <li>• ✅ Auto-approval is enabled by default for optimal user experience</li>
            <li>• Settings are stored directly in the smart contract</li>
            <li>• Auto-approval happens on-chain during minting</li>
            <li>• Fee is automatically deducted from user's balance</li>
            <li>• Only admin can modify these settings</li>
            <li>• Changes take effect immediately for all users</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
