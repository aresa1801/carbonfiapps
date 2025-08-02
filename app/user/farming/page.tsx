"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { formatEther, parseEther } from "ethers"

export default function FarmingPage() {
  const {
    address,
    isConnected,
    farmingContract,
    cafiTokenContract,
    isRefreshing,
    refreshBalances,
    stableTokenBalance,
  } = useWeb3()

  const [stakeAmount, setStakeAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isStaking, setIsStaking] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [stakedAmount, setStakedAmount] = useState("0")
  const [pendingRewards, setPendingRewards] = useState("0")
  const [rewardRate, setRewardRate] = useState("0")
  const [totalStaked, setTotalStaked] = useState("0")
  const [rewardPoolBalance, setRewardPoolBalance] = useState("0")

  const fetchFarmingData = async () => {
    if (!farmingContract || !address) return

    try {
      const [staked, pending, rate, total, poolBalance] = await Promise.all([
        farmingContract.getStakedAmount(address),
        farmingContract.getPendingRewards(address),
        farmingContract.getRewardRate(),
        farmingContract.totalStaked(),
        farmingContract.rewardPoolBalance(),
      ])
      setStakedAmount(formatEther(staked))
      setPendingRewards(formatEther(pending))
      setRewardRate(formatEther(rate))
      setTotalStaked(formatEther(total))
      setRewardPoolBalance(formatEther(poolBalance))
    } catch (error) {
      console.error("Error fetching farming data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch farming data.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (isConnected && farmingContract && address) {
      fetchFarmingData()
    }
  }, [isConnected, farmingContract, address, isRefreshing])

  const handleStake = async () => {
    if (!farmingContract || !cafiTokenContract || !address || !stakeAmount) {
      toast({
        title: "Missing Info",
        description: "Please connect wallet and enter amount.",
        variant: "destructive",
      })
      return
    }

    setIsStaking(true)
    try {
      const amount = parseEther(stakeAmount)

      // Check allowance first
      const allowance = await cafiTokenContract.allowance(address, farmingContract.target)
      if (allowance < amount) {
        toast({
          title: "Approval Needed",
          description: "Approving CAFI tokens for farming contract...",
        })
        const approveTx = await cafiTokenContract.approve(farmingContract.target, amount)
        await approveTx.wait()
        toast({
          title: "Approval Successful",
          description: "CAFI tokens approved. Proceeding with stake.",
        })
      }

      const tx = await farmingContract.stake(amount)
      await tx.wait()
      toast({
        title: "Stake Successful",
        description: `${stakeAmount} CAFI staked successfully!`,
      })
      setStakeAmount("")
      refreshBalances()
    } catch (error: any) {
      console.error("Error staking:", error)
      toast({
        title: "Stake Failed",
        description: error.message || "An error occurred during staking.",
        variant: "destructive",
      })
    } finally {
      setIsStaking(false)
    }
  }

  const handleWithdraw = async () => {
    if (!farmingContract || !withdrawAmount) {
      toast({
        title: "Missing Info",
        description: "Please connect wallet and enter amount.",
        variant: "destructive",
      })
      return
    }

    setIsWithdrawing(true)
    try {
      const amount = parseEther(withdrawAmount)
      const tx = await farmingContract.withdraw(amount)
      await tx.wait()
      toast({
        title: "Withdraw Successful",
        description: `${withdrawAmount} CAFI withdrawn successfully!`,
      })
      setWithdrawAmount("")
      refreshBalances()
    } catch (error: any) {
      console.error("Error withdrawing:", error)
      toast({
        title: "Withdraw Failed",
        description: error.message || "An error occurred during withdrawal.",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleClaimRewards = async () => {
    if (!farmingContract) {
      toast({
        title: "Missing Info",
        description: "Please connect wallet.",
        variant: "destructive",
      })
      return
    }

    setIsClaiming(true)
    try {
      const tx = await farmingContract.claimRewards()
      await tx.wait()
      toast({
        title: "Rewards Claimed",
        description: `${Number.parseFloat(pendingRewards).toFixed(4)} CAFI rewards claimed!`,
      })
      refreshBalances()
    } catch (error: any) {
      console.error("Error claiming rewards:", error)
      toast({
        title: "Claim Failed",
        description: error.message || "An error occurred during claiming rewards.",
        variant: "destructive",
      })
    } finally {
      setIsClaiming(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
        <p className="text-gray-400">Please connect your wallet to access the farming dashboard.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Your Staked CAFI</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{Number.parseFloat(stakedAmount).toFixed(4)} CAFI</p>
          <p className="text-sm text-gray-400">Amount of CAFI you have staked in the farm.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{Number.parseFloat(pendingRewards).toFixed(4)} CAFI</p>
          <p className="text-sm text-gray-400">Rewards accumulated from your staked CAFI.</p>
          <Button
            onClick={handleClaimRewards}
            disabled={isClaiming || Number.parseFloat(pendingRewards) === 0}
            className="mt-4 w-full"
          >
            {isClaiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Claim Rewards
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Farm Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <span className="font-medium">Reward Rate:</span> {Number.parseFloat(rewardRate).toFixed(4)} CAFI/block
          </p>
          <p>
            <span className="font-medium">Total Staked:</span> {Number.parseFloat(totalStaked).toFixed(4)} CAFI
          </p>
          <p>
            <span className="font-medium">Reward Pool:</span> {Number.parseFloat(rewardPoolBalance).toFixed(4)} CAFI
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Stake CAFI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="stake-amount">Amount to Stake</Label>
            <Input
              id="stake-amount"
              type="number"
              placeholder="0.0"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your CAFI Balance:{" "}
              {stableTokenBalance !== null
                ? Number.parseFloat(formatEther(stableTokenBalance)).toFixed(4)
                : "Loading..."}{" "}
              CAFI
            </p>
          </div>
          <Button onClick={handleStake} disabled={isStaking || !stakeAmount || Number.parseFloat(stakeAmount) <= 0}>
            {isStaking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Stake CAFI
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Withdraw CAFI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="0.0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">
              Currently Staked: {Number.parseFloat(stakedAmount).toFixed(4)} CAFI
            </p>
          </div>
          <Button
            onClick={handleWithdraw}
            disabled={
              isWithdrawing ||
              !withdrawAmount ||
              Number.parseFloat(withdrawAmount) <= 0 ||
              Number.parseFloat(withdrawAmount) > Number.parseFloat(stakedAmount)
            }
          >
            {isWithdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Withdraw CAFI
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
