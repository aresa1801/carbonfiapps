"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { ethers } from "ethers"
import { contractService } from "@/lib/contract-utils"
import { Droplets, Coins, TrendingUp, RefreshCw, AlertCircle, DollarSign, Activity } from "lucide-react"

interface FaucetStats {
  dailyLimit: string
  remainingQuota: string
  todayTotal: string
  contractBalance: string
}

export default function AdminDashboardPage() {
  const { isConnected, isAdmin, account, faucetContractExists, cafiTokenExists, currentNetworkContracts } = useWeb3()

  const [faucetStats, setFaucetStats] = useState<FaucetStats>({
    dailyLimit: "0",
    remainingQuota: "0",
    todayTotal: "0",
    contractBalance: "0",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newDailyLimit, setNewDailyLimit] = useState("")
  const [fundAmount, setFundAmount] = useState("")
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false)
  const [isFunding, setIsFunding] = useState(false)

  // Fetch faucet statistics
  const fetchFaucetStats = async () => {
    if (!faucetContractExists || !currentNetworkContracts.FAUCET) {
      setIsLoading(false)
      return
    }

    try {
      setIsRefreshing(true)
      console.log("Fetching faucet statistics...")

      const faucetContract = await contractService.getFaucetContract()

      // Fetch all data in parallel
      const [dailyLimitBN, remainingQuotaBN, todayTotalBN, contractBalanceBN] = await Promise.all([
        faucetContract.DAILY_LIMIT(),
        faucetContract.getRemainingDailyQuota(),
        faucetContract.todayTotal(),
        contractService
          .getProvider()
          .then((provider) =>
            contractService
              .getTokenContract(currentNetworkContracts.CAFI_TOKEN)
              .then((tokenContract) => tokenContract.balanceOf(currentNetworkContracts.FAUCET)),
          ),
      ])

      // Format the values
      const dailyLimit = ethers.formatEther(dailyLimitBN)
      const remainingQuota = ethers.formatEther(remainingQuotaBN)
      const todayTotal = ethers.formatEther(todayTotalBN)
      const contractBalance = ethers.formatEther(contractBalanceBN)

      setFaucetStats({
        dailyLimit,
        remainingQuota,
        todayTotal,
        contractBalance,
      })

      console.log("Faucet stats loaded:", {
        dailyLimit,
        remainingQuota,
        todayTotal,
        contractBalance,
      })
    } catch (error) {
      console.error("Error fetching faucet stats:", error)
      toast({
        title: "Error",
        description: "Failed to fetch faucet statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Update daily limit
  const updateDailyLimit = async () => {
    if (!newDailyLimit || !faucetContractExists) return

    try {
      setIsUpdatingLimit(true)
      console.log(`Updating daily limit to ${newDailyLimit} CAFI`)

      const faucetContract = await contractService.getFaucetContract(true)
      const limitInWei = ethers.parseEther(newDailyLimit)

      const tx = await faucetContract.setDailyLimit(limitInWei)

      toast({
        title: "Transaction Submitted",
        description: "Daily limit update transaction submitted. Please wait for confirmation.",
      })

      await tx.wait()

      toast({
        title: "Success",
        description: `Daily limit updated to ${newDailyLimit} CAFI`,
      })

      setNewDailyLimit("")
      await fetchFaucetStats()
    } catch (error: any) {
      console.error("Error updating daily limit:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update daily limit",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingLimit(false)
    }
  }

  // Fund faucet contract
  const fundFaucet = async () => {
    if (!fundAmount || !cafiTokenExists || !faucetContractExists) return

    try {
      setIsFunding(true)
      console.log(`Funding faucet with ${fundAmount} CAFI`)

      // First approve the tokens
      const tokenContract = await contractService.getTokenContract(currentNetworkContracts.CAFI_TOKEN, true)
      const amountInWei = ethers.parseEther(fundAmount)

      const approveTx = await tokenContract.approve(currentNetworkContracts.FAUCET, amountInWei)

      toast({
        title: "Approval Submitted",
        description: "Token approval transaction submitted. Please wait for confirmation.",
      })

      await approveTx.wait()

      // Then transfer the tokens to the faucet
      const transferTx = await tokenContract.transfer(currentNetworkContracts.FAUCET, amountInWei)

      toast({
        title: "Transfer Submitted",
        description: "Token transfer transaction submitted. Please wait for confirmation.",
      })

      await transferTx.wait()

      toast({
        title: "Success",
        description: `Faucet funded with ${fundAmount} CAFI tokens`,
      })

      setFundAmount("")
      await fetchFaucetStats()
    } catch (error: any) {
      console.error("Error funding faucet:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fund faucet",
        variant: "destructive",
      })
    } finally {
      setIsFunding(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (isConnected && isAdmin && faucetContractExists) {
      fetchFaucetStats()
    }
  }, [isConnected, isAdmin, faucetContractExists])

  if (!isConnected || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">Access Denied</h3>
            <p className="text-gray-400">Admin access required to view this page.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!faucetContractExists) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Faucet Management</h1>
            <p className="text-gray-400">Manage the CAFI token faucet</p>
          </div>
        </div>

        <Alert className="border-yellow-800 bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-200">
            Faucet contract not found on this network. Please ensure you're connected to the correct network.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Faucet Management</h1>
          <p className="text-gray-400">Manage the CAFI token faucet</p>
        </div>
        <Button
          onClick={fetchFaucetStats}
          disabled={isRefreshing}
          variant="outline"
          className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-gray-600"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Daily Limit</p>
                <div className="mt-2">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 bg-gray-700" />
                  ) : (
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(faucetStats.dailyLimit).toFixed(0)} CAFI
                    </p>
                  )}
                </div>
              </div>
              <Droplets className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Remaining Today</p>
                <div className="mt-2">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 bg-gray-700" />
                  ) : (
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(faucetStats.remainingQuota).toFixed(0)} CAFI
                    </p>
                  )}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Distributed Today</p>
                <div className="mt-2">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 bg-gray-700" />
                  ) : (
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(faucetStats.todayTotal).toFixed(0)} CAFI
                    </p>
                  )}
                </div>
              </div>
              <Activity className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Contract Balance</p>
                <div className="mt-2">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 bg-gray-700" />
                  ) : (
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(faucetStats.contractBalance).toFixed(0)} CAFI
                    </p>
                  )}
                </div>
              </div>
              <Coins className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Update Daily Limit */}
        <Card className="border-gray-700 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white">Update Daily Limit</CardTitle>
            <CardDescription className="text-gray-400">
              Set the maximum amount of CAFI tokens that can be distributed per day
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dailyLimit" className="text-gray-300">
                New Daily Limit (CAFI)
              </Label>
              <Input
                id="dailyLimit"
                type="number"
                placeholder="Enter amount"
                value={newDailyLimit}
                onChange={(e) => setNewDailyLimit(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <Button
              onClick={updateDailyLimit}
              disabled={!newDailyLimit || isUpdatingLimit}
              className="w-full bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-800 hover:text-emerald-100"
            >
              {isUpdatingLimit ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Daily Limit"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Fund Faucet */}
        <Card className="border-gray-700 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white">Fund Faucet</CardTitle>
            <CardDescription className="text-gray-400">
              Add CAFI tokens to the faucet contract for distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fundAmount" className="text-gray-300">
                Amount to Fund (CAFI)
              </Label>
              <Input
                id="fundAmount"
                type="number"
                placeholder="Enter amount"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <Button
              onClick={fundFaucet}
              disabled={!fundAmount || isFunding}
              className="w-full bg-blue-900/50 text-blue-400 border border-blue-700/50 hover:bg-blue-800 hover:text-blue-100"
            >
              {isFunding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Funding...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Fund Faucet
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contract Information */}
      <Card className="border-gray-700 bg-gray-900">
        <CardHeader>
          <CardTitle className="text-white">Contract Information</CardTitle>
          <CardDescription className="text-gray-400">Faucet contract details and addresses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Faucet Contract</Label>
              <p className="text-sm font-mono text-gray-400 bg-gray-800 p-2 rounded border border-gray-700">
                {currentNetworkContracts.FAUCET}
              </p>
            </div>
            <div>
              <Label className="text-gray-300">CAFI Token Contract</Label>
              <p className="text-sm font-mono text-gray-400 bg-gray-800 p-2 rounded border border-gray-700">
                {currentNetworkContracts.CAFI_TOKEN}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
