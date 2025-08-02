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
import type { FarmPackage, UserStake } from "@/services/contract-service"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function FarmingPage() {
  const { farmingContract, cafiTokenContract, address, isConnected, refreshBalances, setTransactionStatus } = useWeb3()

  const [farmPackages, setFarmPackages] = useState<FarmPackage[]>([])
  const [userStakes, setUserStakes] = useState<UserStake[]>([])
  const [selectedPackage, setSelectedPackage] = useState<FarmPackage | null>(null)
  const [stakeAmount, setStakeAmount] = useState("")
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUserStake, setSelectedUserStake] = useState<UserStake | null>(null)

  useEffect(() => {
    const fetchFarmData = async () => {
      if (isConnected && farmingContract && address) {
        try {
          // Fetch farm packages
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

          // Fetch user stakes
          const userStakeCount = await farmingContract.getUserStakeCount(address)
          const stakes: UserStake[] = []
          for (let i = 0; i < userStakeCount; i++) {
            const stake = await farmingContract.getUserStake(address, i)
            stakes.push({
              packageId: stake.packageId,
              amount: stake.amount,
              startTime: stake.startTime,
              lastClaimTime: stake.lastClaimTime,
              isAutoFarming: stake.isAutoFarming,
            })
          }
          setUserStakes(stakes)
        } catch (error) {
          console.error("Error fetching farming data:", error)
          toast({
            title: "Error",
            description: "Failed to fetch farming data.",
            variant: "destructive",
          })
        }
      }
    }
    fetchFarmData()
  }, [isConnected, farmingContract, address, refreshBalances])

  const handleStake = async () => {
    if (!selectedPackage || !stakeAmount || !cafiTokenContract || !farmingContract || !address) {
      toast({
        title: "Error",
        description: "Please select a package and enter a valid amount.",
        variant: "destructive",
      })
      return
    }

    setIsStaking(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Approving CAFI tokens..." })
    try {
      const amount = parseEther(stakeAmount)
      if (amount < selectedPackage.minStake) {
        throw new Error(`Amount must be at least ${formatEther(selectedPackage.minStake)} CAFI.`)
      }

      // Approve tokens
      const approveTx = await cafiTokenContract.approve(await farmingContract.getAddress(), amount)
      await approveTx.wait()
      setTransactionStatus({
        hash: approveTx.hash,
        status: "pending",
        message: "Approval successful. Staking tokens...",
      })

      // Stake tokens
      const stakeTx = await farmingContract.stake(farmPackages.indexOf(selectedPackage), amount)
      await stakeTx.wait()
      setTransactionStatus({ hash: stakeTx.hash, status: "success", message: "Tokens staked successfully!" })
      setStakeAmount("")
      setIsDialogOpen(false)
      refreshBalances()
    } catch (error: any) {
      console.error("Error staking tokens:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Staking failed: ${error.reason || error.message}`,
      })
      toast({
        title: "Staking Failed",
        description: `Failed to stake tokens: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async (stake: UserStake) => {
    if (!farmingContract || !address) {
      toast({
        title: "Error",
        description: "Wallet not connected or farming contract not loaded.",
        variant: "destructive",
      })
      return
    }

    setIsUnstaking(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Unstaking tokens..." })
    try {
      const tx = await farmingContract.unstake(stake.packageId, stake.amount)
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "Tokens unstaked successfully!" })
      refreshBalances()
    } catch (error: any) {
      console.error("Error unstaking tokens:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Unstaking failed: ${error.reason || error.message}`,
      })
      toast({
        title: "Unstaking Failed",
        description: `Failed to unstake tokens: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUnstaking(false)
    }
  }

  const handleClaimRewards = async (stake: UserStake) => {
    if (!farmingContract || !address) {
      toast({
        title: "Error",
        description: "Wallet not connected or farming contract not loaded.",
        variant: "destructive",
      })
      return
    }

    setIsClaiming(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Claiming rewards..." })
    try {
      const tx = await farmingContract.claimRewards(stake.packageId)
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "Rewards claimed successfully!" })
      refreshBalances()
    } catch (error: any) {
      console.error("Error claiming rewards:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Claiming failed: ${error.reason || error.message}`,
      })
      toast({
        title: "Claim Failed",
        description: `Failed to claim rewards: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsClaiming(false)
    }
  }

  const openStakeDialog = (pkg: FarmPackage) => {
    setSelectedPackage(pkg)
    setStakeAmount("")
    setIsDialogOpen(true)
  }

  const calculatePotentialRewards = (stake: UserStake) => {
    const pkg = farmPackages[Number(stake.packageId)]
    if (!pkg) return "0.00"

    const currentTime = BigInt(Math.floor(Date.now() / 1000))
    const stakeDuration = currentTime - stake.startTime
    const totalDuration = pkg.duration

    if (stakeDuration <= 0 || totalDuration <= 0) return "0.00"

    // Calculate rewards based on APY and duration
    // This is a simplified calculation. Real world APY calculation is more complex.
    const principal = stake.amount
    const apy = pkg.apy
    const rewards = (principal * apy * stakeDuration) / (BigInt(100) * totalDuration)
    return formatEther(rewards)
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">Please connect your wallet to view farming pools.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Farming Pools</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Farming Packages</CardTitle>
        </CardHeader>
        <CardContent>
          {farmPackages.length === 0 ? (
            <p className="text-muted-foreground">No farming packages available.</p>
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
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmPackages.map((pkg, index) => (
                  <TableRow key={index}>
                    <TableCell>{index}</TableCell>
                    <TableCell>CAFI</TableCell> {/* Assuming CAFI for now */}
                    <TableCell>{Number(pkg.duration) / (60 * 60 * 24)}</TableCell>
                    <TableCell>{Number(pkg.apy)}</TableCell>
                    <TableCell>{formatEther(pkg.minStake)}</TableCell>
                    <TableCell>{pkg.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell>
                      <Button onClick={() => openStakeDialog(pkg)} disabled={!pkg.isActive || isStaking}>
                        Stake
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Your Staked Assets</h2>
      <Card>
        <CardHeader>
          <CardTitle>Your Active Stakes</CardTitle>
        </CardHeader>
        <CardContent>
          {userStakes.length === 0 ? (
            <p className="text-muted-foreground">You have no active stakes.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package ID</TableHead>
                  <TableHead>Staked Amount</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Potential Rewards</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStakes.map((stake, index) => (
                  <TableRow key={index}>
                    <TableCell>{Number(stake.packageId)}</TableCell>
                    <TableCell>{formatEther(stake.amount)} CAFI</TableCell>
                    <TableCell>{new Date(Number(stake.startTime) * 1000).toLocaleString()}</TableCell>
                    <TableCell>{calculatePotentialRewards(stake)} CAFI</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" onClick={() => handleClaimRewards(stake)} disabled={isClaiming}>
                        {isClaiming ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Claiming
                          </>
                        ) : (
                          "Claim Rewards"
                        )}
                      </Button>
                      <Button variant="destructive" onClick={() => handleUnstake(stake)} disabled={isUnstaking}>
                        {isUnstaking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Unstaking
                          </>
                        ) : (
                          "Unstake"
                        )}
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
            <DialogTitle>Stake CAFI Tokens</DialogTitle>
            <DialogDescription>Stake your CAFI tokens in the selected farming package.</DialogDescription>
          </DialogHeader>
          {selectedPackage && (
            <div className="grid gap-4 py-4">
              <div>
                <Label>Package ID:</Label>
                <Input value={farmPackages.indexOf(selectedPackage)} readOnly />
              </div>
              <div>
                <Label>Duration:</Label>
                <Input value={`${Number(selectedPackage.duration) / (60 * 60 * 24)} Days`} readOnly />
              </div>
              <div>
                <Label>APY:</Label>
                <Input value={`${Number(selectedPackage.apy)}%`} readOnly />
              </div>
              <div>
                <Label>Minimum Stake:</Label>
                <Input value={`${formatEther(selectedPackage.minStake)} CAFI`} readOnly />
              </div>
              <div>
                <Label htmlFor="stake-amount">Amount to Stake</Label>
                <Input
                  id="stake-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  min={formatEther(selectedPackage.minStake)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStake} disabled={isStaking}>
              {isStaking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Staking
                </>
              ) : (
                "Confirm Stake"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
