"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function StakingPoolPage() {
  const { stakingContract, isConnected, isAdmin, refreshBalances, setTransactionStatus } = useWeb3()
  const [stakingAPY, setStakingAPY] = useState("")
  const [newStakingAPY, setNewStakingAPY] = useState("")
  const [stakingDuration, setStakingDuration] = useState("")
  const [newStakingDuration, setNewStakingDuration] = useState("")
  const [isUpdatingAPY, setIsUpdatingAPY] = useState(false)
  const [isUpdatingDuration, setIsUpdatingDuration] = useState(false)

  useEffect(() => {
    const fetchStakingSettings = async () => {
      if (isConnected && stakingContract) {
        try {
          const apy = await stakingContract.stakingAPY()
          setStakingAPY(apy.toString())
          setNewStakingAPY(apy.toString())

          const duration = await stakingContract.stakingDuration()
          setStakingDuration(duration.toString())
          setNewStakingDuration(duration.toString())
        } catch (error) {
          console.error("Error fetching staking settings:", error)
          toast({
            title: "Error",
            description: "Failed to fetch staking pool settings.",
            variant: "destructive",
          })
        }
      }
    }
    fetchStakingSettings()
  }, [isConnected, stakingContract, refreshBalances])

  const handleUpdateStakingAPY = async () => {
    if (!stakingContract || !newStakingAPY || !isAdmin) {
      toast({
        title: "Error",
        description: "Please connect wallet, ensure you are an admin, and enter a new APY.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingAPY(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Updating staking APY..." })
    try {
      const apy = Number.parseInt(newStakingAPY)
      const tx = await stakingContract.updateStakingAPY(apy)
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "Staking APY updated successfully!" })
      toast({
        title: "Success",
        description: "Staking APY updated.",
      })
      setStakingAPY(newStakingAPY)
      refreshBalances()
    } catch (error: any) {
      console.error("Error updating staking APY:", error)
      setTransactionStatus({ hash: error.hash || null, status: "failed", message: `Failed to update APY: ${error.reason || error.message}` })
      toast({
        title: "Update Failed",
        description: `Failed to update staking APY: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingAPY(false)
    }
  }

  const handleUpdateStakingDuration = async () => {
    if (!stakingContract || !newStakingDuration || !isAdmin) {
      toast({
        title: "Error",
        description: "Please connect wallet, ensure you are an admin, and enter a new duration.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingDuration(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Updating staking duration..." })
    try {
      const durationInSeconds = Number.parseInt(newStakingDuration) * 24 * 60 * 60 // Convert days to seconds
      const tx = await stakingContract.updateStakingDuration(durationInSeconds)
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "Staking duration updated successfully!" })
      toast({
        title: "Success",
        description: "Staking duration updated.",
      })
      setStakingDuration(newStakingDuration)
      refreshBalances()
    } catch (error: any) {
      console.error("Error updating staking duration:", error)
      setTransactionStatus({ hash: error.hash || null, status: "failed", message: `Failed to update duration: ${error.reason || error.message}` })
      toast({
        title: "Update Failed",
        description: `Failed to update staking duration: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingDuration(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">You do not have administrative privileges to view this page.</p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">Please connect your wallet to manage staking pool settings.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Staking Pool Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Staking APY</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="current-apy">Current APY (%)</Label>
            <Input id="current-apy" value={stakingAPY} readOnly />
          </div>
          <div>
            <Label htmlFor="new-apy">New APY (%)</Label>
            <Input
              id="new-apy"
              type="number"
              placeholder="Enter new APY"
              value={newStakingAPY}
              onChange={(e) => setNewStakingAPY(e.target.value)}
              disabled={isUpdatingAPY}
            />
          </div>
          <Button onClick={handleUpdateStakingAPY} disabled={isUpdatingAPY}>
            {isUpdatingAPY ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update APY"
            )}
          </Button>
        </CardContent>
      </Card\
