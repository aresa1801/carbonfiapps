"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { formatEther, parseEther } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import type { FarmPackage } from "@/services/contract-service"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

export default function AdminFarmingPage() {
  const { farmingContract, cafiTokenContract, isConnected, isAdmin, refreshBalances, setTransactionStatus } = useWeb3()

  const [farmPackages, setFarmPackages] = useState<FarmPackage[]>([])
  const [newPackageStakeToken, setNewPackageStakeToken] = useState("")
  const [newPackageDuration, setNewPackageDuration] = useState("")
  const [newPackageAPY, setNewPackageAPY] = useState("")
  const [newPackageMinStake, setNewPackageMinStake] = useState("")
  const [isCreatingPackage, setIsCreatingPackage] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPackageToUpdate, setSelectedPackageToUpdate] = useState<FarmPackage | null>(null)
  const [newPackageStatus, setNewPackageStatus] = useState(false)

  useEffect(() => {
    const fetchFarmPackages = async () => {
      if (isConnected && farmingContract) {
        try {
          const count = await farmingContract.farmPackageCount()
          const packages: FarmPackage[] = []
          for (let i = 0; i < count; i++) {
            const pkg = await farmingContract.getFarmPackage(i)
            packages.push({
              stakeToken: pkg.stakeToken,
              duration: pkg.duration,
              apy: pkg.apy,
              minStake: pkg.minStake,
              isActive: pkg.isActive,
            })
          }
          setFarmPackages(packages)
        } catch (error) {
          console.error("Error fetching farm packages:", error)
          toast({
            title: "Error",
            description: "Failed to fetch farming packages.",
            variant: "destructive",
          })
        }
      }
    }
    fetchFarmPackages()
  }, [isConnected, farmingContract, refreshBalances])

  const handleCreateFarmPackage = async () => {
    if (
      !farmingContract ||
      !cafiTokenContract ||
      !newPackageStakeToken ||
      !newPackageDuration ||
      !newPackageAPY ||
      !newPackageMinStake
    ) {
      toast({
        title: "Error",
        description: "Please fill all fields for the new farming package.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingPackage(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Creating new farming package..." })
    try {
      const durationInSeconds = BigInt(Number.parseInt(newPackageDuration) * 24 * 60 * 60) // Convert days to seconds
      const apy = BigInt(Number.parseInt(newPackageAPY))
      const minStake = parseEther(newPackageMinStake)

      const tx = await farmingContract.createFarmPackage(newPackageStakeToken, durationInSeconds, apy, minStake)
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "Farming package created successfully!" })
      toast({
        title: "Success",
        description: "New farming package created.",
      })
      setNewPackageStakeToken("")
      setNewPackageDuration("")
      setNewPackageAPY("")
      setNewPackageMinStake("")
      refreshBalances() // Trigger re-fetch of packages
    } catch (error: any) {
      console.error("Error creating farm package:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Failed to create package: ${error.reason || error.message}`,
      })
      toast({
        title: "Creation Failed",
        description: `Failed to create farming package: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsCreatingPackage(false)
    }
  }

  const openUpdateStatusDialog = (pkg: FarmPackage) => {
    setSelectedPackageToUpdate(pkg)
    setNewPackageStatus(pkg.isActive)
    setIsDialogOpen(true)
  }

  const handleUpdateFarmPackageStatus = async () => {
    if (!farmingContract || !selectedPackageToUpdate) {
      toast({
        title: "Error",
        description: "Farming contract not loaded or no package selected.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingStatus(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Updating package status..." })
    try {
      const packageId = farmPackages.indexOf(selectedPackageToUpdate)
      const tx = await farmingContract.updateFarmPackageStatus(packageId, newPackageStatus)
      await tx.wait()
      setTransactionStatus({
        hash: tx.hash,
        status: "success",
        message: "Farming package status updated successfully!",
      })
      toast({
        title: "Success",
        description: `Farming package status updated to ${newPackageStatus ? "Active" : "Inactive"}.`,
      })
      setIsDialogOpen(false)
      refreshBalances() // Trigger re-fetch of packages
    } catch (error: any) {
      console.error("Error updating farm package status:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Failed to update status: ${error.reason || error.message}`,
      })
      toast({
        title: "Update Failed",
        description: `Failed to update farming package status: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
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
        <p className="text-muted-foreground">Please connect your wallet to manage farming pools.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Farming Management</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create New Farming Package</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="stake-token-address">Stake Token Address (CAFI Token Address)</Label>
            <Input
              id="stake-token-address"
              value={newPackageStakeToken}
              onChange={(e) => setNewPackageStakeToken(e.target.value)}
              placeholder="e.g., 0x..."
              disabled={isCreatingPackage}
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (Days)</Label>
            <Input
              id="duration"
              type="number"
              value={newPackageDuration}
              onChange={(e) => setNewPackageDuration(e.target.value)}
              placeholder="e.g., 30"
              disabled={isCreatingPackage}
            />
          </div>
          <div>
            <Label htmlFor="apy">APY (%)</Label>
            <Input
              id="apy"
              type="number"
              value={newPackageAPY}
              onChange={(e) => setNewPackageAPY(e.target.value)}
              placeholder="e.g., 10"
              disabled={isCreatingPackage}
            />
          </div>
          <div>
            <Label htmlFor="min-stake">Minimum Stake (CAFI)</Label>
            <Input
              id="min-stake"
              type="number"
              value={newPackageMinStake}
              onChange={(e) => setNewPackageMinStake(e.target.value)}
              placeholder="e.g., 100"
              disabled={isCreatingPackage}
            />
          </div>
          <Button onClick={handleCreateFarmPackage} disabled={isCreatingPackage}>
            {isCreatingPackage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Package"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Farming Packages</CardTitle>
        </CardHeader>
        <CardContent>
          {farmPackages.length === 0 ? (
            <p className="text-muted-foreground">No farming packages created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package ID</TableHead>
                  <TableHead>Stake Token</TableHead>
                  <TableHead>Duration (Days)</TableHead>
                  <TableHead>APY (%)</TableHead>
                  <TableHead>Min Stake</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmPackages.map((pkg, index) => (
                  <TableRow key={index}>
                    <TableCell>{index}</TableCell>
                    <TableCell>{pkg.stakeToken}</TableCell>
                    <TableCell>{Number(pkg.duration) / (60 * 60 * 24)}</TableCell>
                    <TableCell>{Number(pkg.apy)}</TableCell>
                    <TableCell>{formatEther(pkg.minStake)}</TableCell>
                    <TableCell>{pkg.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateStatusDialog(pkg)}
                        disabled={isUpdatingStatus}
                      >
                        Update Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Farming Package Status</DialogTitle>
            <DialogDescription>Change the active status of the selected farming package.</DialogDescription>
          </DialogHeader>
          {selectedPackageToUpdate && (
            <div className="grid gap-4 py-4">
              <div>
                <Label>Package ID:</Label>
                <Input value={farmPackages.indexOf(selectedPackageToUpdate)} readOnly />
              </div>
              <div>
                <Label>Current Status:</Label>
                <Input value={selectedPackageToUpdate.isActive ? "Active" : "Inactive"} readOnly />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="package-status"
                  checked={newPackageStatus}
                  onCheckedChange={setNewPackageStatus}
                  disabled={isUpdatingStatus}
                />
                <Label htmlFor="package-status">Set to {newPackageStatus ? "Active" : "Inactive"}</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFarmPackageStatus} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating
                </>
              ) : (
                "Confirm Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
