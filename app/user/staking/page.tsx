"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { parseEther } from "ethers"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import {
  stakeTokens,
  unstakeTokens,
  getStakedBalance,
  getStakingRewardRate,
  getStakingRewards,
  claimStakingRewards,
} from "@/lib/contract-service"

export default function StakingPage() {
  const { stakingContract, cafiTokenContract, signer, address, isConnected, refreshBalances, cafiBalance } = useWeb3()
  const { toast } = useToast()

  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")
  const [stakedBalance, setStakedBalance] = useState("0")
  const [rewardRate, setRewardRate] = useState("0")
  const [availableRewards, setAvailableRewards] = useState("0")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStakingDetails = async () => {
      if (stakingContract && address) {
        try {
          const staked = await getStakedBalance(stakingContract, address)
          const rate = await getStakingRewardRate(stakingContract)
          const rewards = await getStakingRewards(stakingContract, address)
          setStakedBalance(staked)
          setRewardRate(rate)
          setAvailableRewards(rewards)
        } catch (err: any) {
          console.error("Error fetching staking details:", err)
          setError(`Failed to fetch staking details: ${err.message || "Unknown error"}`)
        }
      }
    }
    fetchStakingDetails()
  }, [stakingContract, address, refreshBalances])

  const handleStake = async () => {
    if (!stakingContract || !cafiTokenContract || !signer || !stakeAmount || !address) {
      toast({
        title: "Error",
        description: "Wallet not connected or stake amount invalid.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const amount = parseEther(stakeAmount)

      // First, approve the staking contract to spend CAFI tokens
      const approveTx = await cafiTokenContract.approve(await stakingContract.getAddress(), amount)
      await approveTx.wait()
      toast({
        title: "Approval Successful",
        description: "Staking contract approved to spend your CAFI tokens.",
      })

      // Then, stake
      await stakeTokens(stakingContract, stakeAmount)
      toast({
        title: "Stake Successful",
        description: `${stakeAmount} CAFI staked.`,
      })
      setStakeAmount("")
      refreshBalances()
    } catch (err: any) {
      console.error("Staking error:", err)
      setError(`Staking failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Stake Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnstake = async () => {
    if (!stakingContract || !signer || !unstakeAmount) {
      toast({
        title: "Error",
        description: "Wallet not connected or unstake amount invalid.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      await unstakeTokens(stakingContract, unstakeAmount)
      toast({
        title: "Unstake Successful",
        description: `${unstakeAmount} CAFI unstaked.`,
      })
      setUnstakeAmount("")
      refreshBalances()
    } catch (err: any) {
      console.error("Unstaking error:", err)
      setError(`Unstaking failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Unstake Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClaimRewards = async () => {
    if (!stakingContract || !signer) {
      toast({
        title: "Error",
        description: "Wallet not connected.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      await claimStakingRewards(stakingContract)
      toast({
        title: "Claim Successful",
        description: "Staking rewards claimed.",
      })
      setAvailableRewards("0")
      refreshBalances()
    } catch (err: any) {
      console.error("Claim rewards error:", err)
      setError(`Claim failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Claim Failed",
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
        <AlertDescription>Please connect your wallet to interact with the Staking Pool.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">CAFI Staking Pool</h1>

      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Your CAFI Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{cafiBalance} CAFI</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Staked CAFI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stakedBalance} CAFI</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{availableRewards} CAFI</p>
            <Button
              onClick={handleClaimRewards}
              disabled={loading || Number.parseFloat(availableRewards) <= 0}
              className="mt-4 w-full"
            >
              {loading ? "Claiming..." : "Claim Rewards"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stake CAFI</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="stake-amount">Amount to Stake</Label>
            <Input
              id="stake-amount"
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="e.g., 100"
              disabled={loading}
            />
          </div>
          <Button onClick={handleStake} disabled={loading || Number.parseFloat(stakeAmount) <= 0}>
            {loading ? "Staking..." : "Stake CAFI"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unstake CAFI</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="unstake-amount">Amount to Unstake</Label>
            <Input
              id="unstake-amount"
              type="number"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              placeholder="e.g., 50"
              disabled={loading}
            />
          </div>
          <Button onClick={handleUnstake} disabled={loading || Number.parseFloat(unstakeAmount) <= 0}>
            {loading ? "Unstaking..." : "Unstake CAFI"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staking Pool Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Reward Rate: {rewardRate} CAFI per second per staked token</p>
          {/* Add more details if available from the contract */}
        </CardContent>
      </Card>
    </div>
  )
}
