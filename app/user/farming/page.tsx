"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { parseEther } from "ethers"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import {
  depositFarmingTokens,
  withdrawFarmingTokens,
  getFarmingStakedBalance,
  getFarmingRewardRate,
  getFarmingRewards,
  claimFarmingRewards,
} from "@/lib/contract-service"

export default function FarmingPage() {
  const { farmingContract, cafiTokenContract, signer, address, isConnected, refreshBalances, cafiBalance } = useWeb3()
  const { toast } = useToast()

  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [stakedBalance, setStakedBalance] = useState("0")
  const [rewardRate, setRewardRate] = useState("0")
  const [availableRewards, setAvailableRewards] = useState("0")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFarmingDetails = async () => {
      if (farmingContract && address) {
        try {
          const staked = await getFarmingStakedBalance(farmingContract, address)
          const rate = await getFarmingRewardRate(farmingContract)
          const rewards = await getFarmingRewards(farmingContract, address)
          setStakedBalance(staked)
          setRewardRate(rate)
          setAvailableRewards(rewards)
        } catch (err: any) {
          console.error("Error fetching farming details:", err)
          setError(`Failed to fetch farming details: ${err.message || "Unknown error"}`)
        }
      }
    }
    fetchFarmingDetails()
  }, [farmingContract, address, refreshBalances])

  const handleDeposit = async () => {
    if (!farmingContract || !cafiTokenContract || !signer || !depositAmount || !address) {
      toast({
        title: "Error",
        description: "Wallet not connected or deposit amount invalid.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const amount = parseEther(depositAmount)

      // First, approve the farming contract to spend CAFI tokens
      const approveTx = await cafiTokenContract.approve(await farmingContract.getAddress(), amount)
      await approveTx.wait()
      toast({
        title: "Approval Successful",
        description: "Farming contract approved to spend your CAFI tokens.",
      })

      // Then, deposit
      await depositFarmingTokens(farmingContract, depositAmount)
      toast({
        title: "Deposit Successful",
        description: `${depositAmount} CAFI deposited for farming.`,
      })
      setDepositAmount("")
      refreshBalances()
    } catch (err: any) {
      console.error("Deposit error:", err)
      setError(`Deposit failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Deposit Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!farmingContract || !signer || !withdrawAmount) {
      toast({
        title: "Error",
        description: "Wallet not connected or withdraw amount invalid.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      await withdrawFarmingTokens(farmingContract, withdrawAmount)
      toast({
        title: "Withdrawal Successful",
        description: `${withdrawAmount} CAFI withdrawn from farming.`,
      })
      setWithdrawAmount("")
      refreshBalances()
    } catch (err: any) {
      console.error("Withdrawal error:", err)
      setError(`Withdrawal failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Withdrawal Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClaimRewards = async () => {
    if (!farmingContract || !signer) {
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
      await claimFarmingRewards(farmingContract)
      toast({
        title: "Claim Successful",
        description: "Farming rewards claimed.",
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
        <AlertDescription>Please connect your wallet to interact with the Farming Pool.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">CAFI Farming Pool</h1>

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
          <CardTitle>Deposit CAFI</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="deposit-amount">Amount to Deposit</Label>
            <Input
              id="deposit-amount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g., 100"
              disabled={loading}
            />
          </div>
          <Button onClick={handleDeposit} disabled={loading || Number.parseFloat(depositAmount) <= 0}>
            {loading ? "Depositing..." : "Deposit CAFI"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw CAFI</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
            <Input
              id="withdraw-amount"
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="e.g., 50"
              disabled={loading}
            />
          </div>
          <Button onClick={handleWithdraw} disabled={loading || Number.parseFloat(withdrawAmount) <= 0}>
            {loading ? "Withdrawing..." : "Withdraw CAFI"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Farming Pool Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Reward Rate: {rewardRate} CAFI per second per staked token</p>
          {/* Add more details if available from the contract */}
        </CardContent>
      </Card>
    </div>
  )
}
