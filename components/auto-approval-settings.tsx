"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function AutoApprovalSettings() {
  const { nftContract, isAdmin, isRefreshing, refreshBalances } = useWeb3()
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)

  useEffect(() => {
    const fetchStatus = async () => {
      if (nftContract) {
        try {
          setIsLoading(true)
          const status = await nftContract.autoApproveEnabled()
          setAutoApproveEnabled(status)
        } catch (error) {
          console.error("Error fetching auto-approve status:", error)
          toast({
            title: "Error",
            description: "Failed to fetch auto-approval status.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }
    fetchStatus()
  }, [nftContract, isRefreshing, toast])

  const handleToggle = async () => {
    if (!nftContract || !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "You are not authorized to perform this action or wallet not connected.",
        variant: "destructive",
      })
      return
    }

    setIsToggling(true)
    try {
      const tx = await nftContract.toggleAutoApprove()
      await tx.wait()
      setAutoApproveEnabled((prev) => !prev)
      toast({
        title: "Auto-Approval Toggled",
        description: `Auto-approval is now ${autoApproveEnabled ? "disabled" : "enabled"}.`,
      })
      refreshBalances() // Refresh any related data
    } catch (error: any) {
      console.error("Error toggling auto-approval:", error)
      toast({
        title: "Toggle Failed",
        description: error.message || "Failed to toggle auto-approval.",
        variant: "destructive",
      })
    } finally {
      setIsToggling(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Auto-Approval Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">You do not have admin privileges to view this section.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Auto-Approval Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Loading status...</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-approve-switch">Enable Auto-Approval for NFTs</Label>
            <Switch
              id="auto-approve-switch"
              checked={autoApproveEnabled}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
          </div>
        )}
        {isToggling && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Toggling...</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          When enabled, newly minted NFTs will be automatically approved for marketplace listings.
        </p>
      </CardContent>
    </Card>
  )
}
