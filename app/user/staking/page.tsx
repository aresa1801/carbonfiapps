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
import type { StakeInfo } from "@/services/contract-service"

export default function StakingPage() {
  const { stakingContract, cafiTokenContract, address, isConnected, refreshBalances, setTransactionStatus } = useWeb3()

  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")
  const [stakingAPY, setStakingAPY] = useState<string | null>(null)
  const [stakingDuration, setStakingDuration] = useState<string | null>(null)
  const [userStake, setUserStake] = useState<StakeInfo | null>(null)
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isClaimingRewards, setIsClaimingRewards] = useState(false)
  const [calculatedRewards, setCalculatedRewards] = useState<string | null>(null)

  useEffect(() => {
    const fetchStakingData = async () => {
      if (isConnected && stakingContract && address) {
        try {
          const apy = await stakingContract.stakingAPY()
          const duration = await stakingContract.stakingDuration()
          const stake = await stakingContract.stakes(address)
          const rewards = await stakingContract.calculateRewards(address)

          setStakingAPY(apy.toString())
          setStakingDuration(duration.toString())
          setUserStake({
            amount: stake.amount,
            stakeTime: stake.stakeTime,
            unlockTime: stake.unlockTime,
            claimed: stake.claimed,
            autoStaking: stake.autoStaking,
            compoundedAmount: stake.compoundedAmount,
          })
          setCalculatedRewards(formatEther(rewards))
        } catch (error) {
          console.error("Error fetching staking data:", error)
          toast({
            title: "Error",
            description: "Failed to fetch staking data.",
            variant: "destructive",
          })
          setStakingAPY(null)
          setStakingDuration(null)
          setUserStake(null)
          setCalculatedRewards(null)
        }
      } else {
        setStakingAPY(null)
        setStakingDuration(null)
        setUserStake(null)
        setCalculatedRewards(null)
      }
    }
    fetchStakingData()
  }, [isConnected, stakingContract, address, refreshBalances])

  const handleStake = async () => {
    if (!stakingContract || !cafiTokenContract || !stakeAmount || !address) {
      toast({
        title: "Error",
        description: "Please connect wallet and enter stake amount.",
        variant: "destructive",
      })
      return
    }

    setIsStaking(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Approving CAFI tokens..." })
    try {
      const amount = parseEther(stakeAmount)

      // Approve tokens
      const approveTx = await cafiTokenContract.approve(await stakingContract.getAddress(), amount)
      await approveTx.wait()
      setTransactionStatus({
        hash: approveTx.hash,
        status: "pending",
        message: "Approval successful. Staking tokens...",
      })

      // Stake tokens
      const stakeTx = await stakingContract.stake(amount)
      await stakeTx.wait()
      setTransactionStatus({ hash: stakeTx.hash, status: "success", message: "Tokens staked successfully!" })
      setStakeAmount("")
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

  const handleUnstake = async () => {
    if (!stakingContract || !unstakeAmount || !address) {
      toast({
        title: "Error",
        description: "Please connect wallet and enter unstake amount.",
        variant: "destructive",
      })
      return
    }

    setIsUnstaking(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Unstaking tokens..." })
    try {
      const amount = parseEther(unstakeAmount)
      const tx = await stakingContract.unstake(amount)
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "Tokens unstaked successfully!" })
      setUnstakeAmount("")
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

  const handleClaimRewards = async () => {
    if (!stakingContract || !address) {
      toast({
        title: "Error",
        description: "Wallet not connected or staking contract not loaded.",
        variant: "destructive",
      })
      return
    }

    setIsClaimingRewards(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Claiming rewards..." })
    try {
      const tx = await stakingContract.claimRewards()
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
      setIsClaimingRewards(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">Please connect your wallet to view staking information.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">CAFI Staking</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Staking Pool Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div>
              <p className="text-sm font-medium">Annual Percentage Yield (APY):</p>
              <p className="text-lg font-bold">{stakingAPY ? `${stakingAPY}%` : "Loading..."}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Staking Duration:</p>
              <p className="text-lg font-bold">
                {stakingDuration ? `${Number(stakingDuration) / (24 * 3600)} Days` : "Loading..."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Current Stake</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div>
              <p className="text-sm font-medium">Staked Amount:</p>
              <p className="text-lg font-bold">
                {userStake?.amount ? `${formatEther(userStake.amount)} CAFI` : "0 CAFI"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Stake Time:</p>
              <p className="text-lg font-bold">
                {userStake?.stakeTime ? new Date(Number(userStake.stakeTime) * 1000).toLocaleString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Unlock Time:</p>
              <p className="text-lg font-bold">
                {userStake?.unlockTime ? new Date(Number(userStake.unlockTime) * 1000).toLocaleString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Claimable Rewards:</p>
              <p className="text-lg font-bold">{calculatedRewards || "0.00"} CAFI</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stake CAFI</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="stake-amount">Amount to Stake</Label>
              <Input
                id="stake-amount"
                type="number"
                placeholder="Enter amount"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                disabled={isStaking}
              />
            </div>
            <Button onClick={handleStake} disabled={isStaking}>
              {isStaking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Staking...
                </>
              ) : (
                "Stake CAFI"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unstake CAFI & Claim Rewards</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="unstake-amount">Amount to Unstake</Label>
              <Input
                id="unstake-amount"
                type="number"
                placeholder="Enter amount"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                disabled={isUnstaking}
              />
            </div>
            <Button onClick={handleUnstake} disabled={isUnstaking} variant="destructive">
              {isUnstaking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Unstaking...
                </>
              ) : (
                "Unstake CAFI"
              )}
            </Button>
            <Button onClick={handleClaimRewards} disabled={isClaimingRewards}>
              {isClaimingRewards ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Claiming...
                </>
              ) : (
                "Claim Rewards"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
