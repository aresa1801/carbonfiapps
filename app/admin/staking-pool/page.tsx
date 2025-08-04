"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { useToast } from "@/hooks/use-toast"
import { TransactionAlert } from "@/components/transaction-alert"
import { Loader2, RefreshCw } from "lucide-react"
import { contractService } from "@/lib/contract-utils"

export default function StakingPoolPage() {
  const {
    account,
    isConnected,
    isAdmin,
    stakingContractExists,
    cafiTokenExists,
    refreshBalances,
    tokenSymbol,
    currentNetworkContracts,
    approveTokens, // This is from Web3Provider, but we're using contractService directly
    checkAllowance,
    addRewardPoolFunds, // This is from Web3Provider, but we're using contractService directly
    setAPY, // This is from Web3Provider, but we're using contractService directly
    getRewardPoolBalance,
    getTotalStaked,
  } = useWeb3()
  const { toast } = useToast()

  const [rewardPoolBalance, setRewardPoolBalance] = useState("0")
  const [totalStaked, setTotalStaked] = useState("0")
  const [newRewardAmount, setNewRewardAmount] = useState("")
  const [newAPY, setNewAPY] = useState("")
  const [apyPeriodIndex, setApyPeriodIndex] = useState(0)
  const [isAddingReward, setIsAddingReward] = useState(false)
  const [isUpdatingAPY, setIsUpdatingAPY] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [txStatus, setTxStatus] = useState<"success" | "error" | "none">("none")
  const [txMessage, setTxMessage] = useState("")
  const [allowance, setAllowance] = useState("0")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stakingContractPaused, setStakingContractPaused] = useState(false) // State for contract pause status
  const [isLoading, setIsLoading] = useState(false) // Declare setIsLoading here

  const checkContractStatus = useCallback(async () => {
    try {
      if (!stakingContractExists) return
      const stakingContract = await contractService.getStakingContract()
      const paused = await stakingContract.paused()
      setStakingContractPaused(paused)
    } catch (error) {
      console.error("Error checking contract status:", error)
    }
  }, [stakingContractExists])

  const fetchStakingData = useCallback(async () => {
    if (!isConnected || !stakingContractExists || !cafiTokenExists || !account) return

    try {
      setIsRefreshing(true)
      const [poolBalance, stakedTotal, currentAllowance] = await Promise.all([
        getRewardPoolBalance(),
        getTotalStaked(),
        checkAllowance(account, currentNetworkContracts.STAKING),
      ])
      setRewardPoolBalance(poolBalance)
      setTotalStaked(stakedTotal)
      setAllowance(currentAllowance)
      setTxStatus("none") // Clear transaction status on successful refresh
    } catch (error) {
      console.error("Error fetching staking data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch staking pool data.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [
    isConnected,
    stakingContractExists,
    cafiTokenExists,
    account,
    getRewardPoolBalance,
    getTotalStaked,
    checkAllowance,
    currentNetworkContracts.STAKING,
    toast,
  ])

  const loadAPYValues = useCallback(async () => {
    try {
      if (!stakingContractExists) return
      const stakingContract = await contractService.getStakingContract()
      const newApyValues = await Promise.all(
        [0, 1, 2].map(async (index) => {
          try {
            const apy = await stakingContract.apyRates(index)
            return (Number(apy) / 100).toString()
          } catch (error) {
            console.error(`Error loading APY for period ${index}:`, error)
            return "0" // Default to 0 if error
          }
        }),
      )
      setApyPeriodIndex(0) // Reset to first period for input
      setNewAPY(newApyValues[0]) // Set default APY value for input
      // Update the state that holds all APY values for display/internal use
      // If you have a state like `allApyRates`
      // setAllApyRates(newApyValues);
    } catch (error) {
      console.error("Error loading APY values:", error)
    }
  }, [stakingContractExists])

  useEffect(() => {
    if (isConnected && account) {
      fetchStakingData()
      loadAPYValues()
      checkContractStatus()
    }
  }, [isConnected, account, fetchStakingData, loadAPYValues, checkContractStatus])

  const handleAddRewardPoolFunds = async () => {
    if (!account || !isConnected || !stakingContractExists || !cafiTokenExists) {
      toast({
        title: "Wallet not connected or contracts not available",
        description: "Please connect your wallet and ensure contracts are deployed.",
        variant: "destructive",
      })
      return
    }

    if (Number(newRewardAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount for rewards.",
        variant: "destructive",
      })
      return
    }

    if (stakingContractPaused) {
      toast({
        title: "Contract Paused",
        description: "The staking contract is currently paused. Cannot add funds.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAddingReward(true)
      setTxStatus("none")

      // Check allowance first
      const currentAllowance = await checkAllowance(account, currentNetworkContracts.STAKING)
      if (Number(currentAllowance) < Number(newRewardAmount)) {
        setIsApproving(true)
        toast({
          title: "Approval Required",
          description: `Approving ${newRewardAmount} ${tokenSymbol} for staking contract...`,
        })
        const tokenContract = await contractService.getCAFITokenContract(undefined, true) // Corrected
        const approveTx = await tokenContract.approve(
          currentNetworkContracts.STAKING,
          contractService.parseTokenAmount(newRewardAmount),
        )
        await approveTx.wait()
        toast({
          title: "Approval Successful",
          description: "Tokens approved for staking contract.",
        })
        setIsApproving(false)
      }

      toast({
        title: "Adding Reward Funds",
        description: "Confirm transaction in your wallet...",
      })
      const tx = await contractService.addRewardPoolFunds(newRewardAmount) // Using contractService directly
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setTxStatus("success")
        setTxMessage(`Successfully added ${newRewardAmount} ${tokenSymbol} to reward pool!`)
        setNewRewardAmount("")
        await fetchStakingData()
        await refreshBalances()
        toast({
          title: "Success",
          description: "Reward funds added successfully.",
        })
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Error adding reward pool funds:", error)
      setTxStatus("error")
      let errorMessage = "Failed to add reward pool funds."
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user."
      } else if (error.reason) {
        errorMessage = error.reason
      } else if (error.message) {
        errorMessage = error.message
      }
      setTxMessage(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsAddingReward(false)
      setIsApproving(false)
    }
  }

  const handleUpdateAPY = async () => {
    if (!account || !isConnected || !stakingContractExists) {
      toast({
        title: "Wallet not connected or contract not available",
        description: "Please connect your wallet and ensure staking contract is deployed.",
        variant: "destructive",
      })
      return
    }

    if (Number(newAPY) < 0 || Number(newAPY) > 10000) {
      // Example validation: 0-10000%
      toast({
        title: "Invalid APY",
        description: "Please enter a valid APY percentage (e.g., 5 for 5%).",
        variant: "destructive",
      })
      return
    }

    if (stakingContractPaused) {
      toast({
        title: "Contract Paused",
        description: "The staking contract is currently paused. Cannot update APY.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdatingAPY(true)
      setTxStatus("none")
      toast({
        title: "Updating APY",
        description: "Confirm transaction in your wallet...",
      })
      const tx = await contractService.setAPY(apyPeriodIndex, newAPY) // Using contractService directly
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setTxStatus("success")
        setTxMessage(`Successfully updated APY for period ${apyPeriodIndex} to ${newAPY}%!`)
        setNewAPY("")
        await loadAPYValues() // Reload APY values after update
        toast({
          title: "Success",
          description: "APY updated successfully.",
        })
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Error updating APY:", error)
      setTxStatus("error")
      let errorMessage = "Failed to update APY."
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user."
      } else if (error.reason) {
        errorMessage = error.reason
      } else if (error.message) {
        errorMessage = error.message
      }
      setTxMessage(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingAPY(false)
    }
  }

  const handleTogglePause = async () => {
    if (!account || !isConnected || !stakingContractExists) {
      toast({
        title: "Wallet not connected or contract not available",
        description: "Please connect your wallet and ensure staking contract is deployed.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true) // Using a generic isLoading for this action
      setTxStatus("none")
      toast({
        title: `${stakingContractPaused ? "Unpausing" : "Pausing"} Contract`,
        description: "Confirm transaction in your wallet...",
      })
      const stakingContract = await contractService.getStakingContract(undefined, true) // Corrected
      const tx = await stakingContract.togglePause()
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setTxStatus("success")
        setTxMessage(`Successfully ${stakingContractPaused ? "unpaused" : "paused"} staking contract!`)
        await checkContractStatus() // Refresh pause status
        toast({
          title: "Success",
          description: `Contract ${stakingContractPaused ? "unpaused" : "paused"} successfully.`,
        })
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Error toggling pause:", error)
      setTxStatus("error")
      let errorMessage = `Failed to ${stakingContractPaused ? "unpause" : "pause"} contract.`
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user."
      } else if (error.reason) {
        errorMessage = error.reason
      } else if (error.message) {
        errorMessage = error.message
      }
      setTxMessage(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <Card className="w-full max-w-md bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-50">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">You must be connected as an admin to view this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Staking Pool Management</h1>

      {txStatus !== "none" && (
        <div className="mb-6">
          <TransactionAlert status={txStatus} message={txMessage} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Reward Pool Balance</CardTitle>
            <RefreshCw
              className={`h-4 w-4 text-gray-400 cursor-pointer ${isRefreshing ? "animate-spin" : ""}`}
              onClick={fetchStakingData}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isRefreshing ? <Loader2 className="h-6 w-6 animate-spin" /> : `${rewardPoolBalance} ${tokenSymbol}`}
            </div>
            <p className="text-xs text-gray-400">Total CAFI available for rewards</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Staked</CardTitle>
            <RefreshCw
              className={`h-4 w-4 text-gray-400 cursor-pointer ${isRefreshing ? "animate-spin" : ""}`}
              onClick={fetchStakingData}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isRefreshing ? <Loader2 className="h-6 w-6 animate-spin" /> : `${totalStaked} ${tokenSymbol}`}
            </div>
            <p className="text-xs text-gray-400">Total CAFI staked by users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-50">Add Reward Pool Funds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reward-amount" className="text-gray-300">
                Amount ({tokenSymbol})
              </Label>
              <Input
                id="reward-amount"
                type="number"
                placeholder="e.g., 1000"
                value={newRewardAmount}
                onChange={(e) => setNewRewardAmount(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <Button
              onClick={handleAddRewardPoolFunds}
              disabled={
                isAddingReward || isApproving || !stakingContractExists || !cafiTokenExists || stakingContractPaused
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isAddingReward ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isApproving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isApproving ? "Approving..." : isAddingReward ? "Adding Funds..." : "Add Funds"}
            </Button>
            <p className="text-sm text-gray-400">
              Current Allowance: {allowance} {tokenSymbol}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-50">Update APY</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apy-period" className="text-gray-300">
                Period Index (0, 1, 2 for 30, 90, 180 days)
              </Label>
              <Input
                id="apy-period"
                type="number"
                placeholder="e.g., 0 for 30 days, 1 for 90 days"
                value={apyPeriodIndex}
                onChange={(e) => setApyPeriodIndex(Number(e.target.value))}
                className="bg-gray-800 border-gray-600 text-white focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-apy" className="text-gray-300">
                New APY (%)
              </Label>
              <Input
                id="new-apy"
                type="number"
                placeholder="e.g., 5 for 5%"
                value={newAPY}
                onChange={(e) => setNewAPY(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <Button
              onClick={handleUpdateAPY}
              disabled={isUpdatingAPY || !stakingContractExists || stakingContractPaused}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isUpdatingAPY ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUpdatingAPY ? "Updating APY..." : "Update APY"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-50">Contract Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-gray-300">Current Status:</p>
            <span className={`font-bold ${stakingContractPaused ? "text-red-400" : "text-emerald-400"}`}>
              {stakingContractPaused ? "Paused" : "Active"}
            </span>
            <Button
              onClick={handleTogglePause}
              disabled={!stakingContractExists || isAddingReward || isUpdatingAPY} // Use generic isLoading if available
              className={`ml-4 ${stakingContractPaused ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"} text-white`}
            >
              {stakingContractPaused ? "Unpause Contract" : "Pause Contract"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
