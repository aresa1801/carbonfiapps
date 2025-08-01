"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { TransactionStatus } from "@/components/transaction-status"
import { useToast } from "@/components/ui/use-toast"
import { AdminGuard } from "@/components/admin-guard"
import { TrendingUp, Settings, RefreshCw, Coins, ArrowRight, AlertCircle } from "lucide-react"
import { contractService, CONTRACT_ADDRESSES } from "@/lib/contract-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function StakingPoolPage() {
  const { isConnected, account, tokenSymbol, stakingContractExists, STAKING_CONTRACT_ADDRESS } = useWeb3()

  const [rewardAmount, setRewardAmount] = useState("")
  const [apyValues, setApyValues] = useState(["5", "10", "15"])
  const [rewardPool, setRewardPool] = useState("0")
  const [totalStaked, setTotalStaked] = useState("0")
  const [txStatus, setTxStatus] = useState<"loading" | "success" | "error" | null>(null)
  const [txHash, setTxHash] = useState("")
  const [txMessage, setTxMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPoolData, setIsLoadingPoolData] = useState(false)
  const [allowance, setAllowance] = useState("0")
  const [needsApproval, setNeedsApproval] = useState(false)
  const [stakingContractPaused, setStakingContractPaused] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isConnected && account) {
      console.log("Admin staking pool page: Connected with account", account)
      console.log("Staking contract exists:", stakingContractExists)
      console.log("Staking contract address:", STAKING_CONTRACT_ADDRESS)

      checkStakingContract()

      // Set up auto-refresh interval
      const intervalId = setInterval(() => {
        loadStakingData()
        checkAllowance()
      }, 30000)

      return () => clearInterval(intervalId)
    }
  }, [isConnected, stakingContractExists, account])

  // Check allowance when reward amount changes
  useEffect(() => {
    if (rewardAmount && account) {
      checkAllowance()
    }
  }, [rewardAmount, account])

  const checkStakingContract = async () => {
    try {
      const exists = await contractService.contractExists(CONTRACT_ADDRESSES.STAKING)
      console.log("Staking contract exists (checked from admin page):", exists)

      if (exists) {
        await Promise.all([loadStakingData(), loadAPYValues(), checkContractStatus(), checkAllowance()])
      } else {
        toast({
          title: "Staking Contract Not Found",
          description: "The staking contract could not be found on this network.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking staking contract:", error)
    }
  }

  const checkContractStatus = async () => {
    try {
      const stakingContract = await contractService.getStakingContract()
      const paused = await stakingContract.paused()
      setStakingContractPaused(paused)
      console.log("Staking contract paused:", paused)
    } catch (error) {
      console.error("Error checking contract status:", error)
    }
  }

  const checkAllowance = async () => {
    try {
      if (!account || !rewardAmount || !CONTRACT_ADDRESSES.CAFI_TOKEN) return

      const tokenContract = await contractService.getCAFITokenContract()
      const currentAllowance = await tokenContract.allowance(account, CONTRACT_ADDRESSES.STAKING)
      const allowanceFormatted = contractService.formatTokenAmount(currentAllowance)
      setAllowance(allowanceFormatted)

      const rewardAmountBN = contractService.parseTokenAmount(rewardAmount)
      setNeedsApproval(currentAllowance < rewardAmountBN)

      console.log("Current allowance:", allowanceFormatted)
      console.log("Needs approval:", currentAllowance < rewardAmountBN)
    } catch (error) {
      console.error("Error checking allowance:", error)
      setAllowance("0")
      setNeedsApproval(true)
    }
  }

  const loadStakingData = async () => {
    try {
      setIsLoadingPoolData(true)
      console.log("Loading staking pool data...")

      const stakingContract = await contractService.getStakingContract()
      console.log("Staking contract instance created successfully")

      // Get reward pool balance and total staked amount
      try {
        const poolBalance = await stakingContract.getRewardPoolBalance()
        const formattedPoolBalance = contractService.formatTokenAmount(poolBalance)
        console.log("Reward pool balance:", formattedPoolBalance)
        setRewardPool(Number.parseFloat(formattedPoolBalance).toFixed(4))
      } catch (error) {
        console.error("Error getting reward pool balance:", error)
        // Try fallback method
        try {
          const poolBalance = await stakingContract.rewardPoolBalance()
          const formattedPoolBalance = contractService.formatTokenAmount(poolBalance)
          setRewardPool(Number.parseFloat(formattedPoolBalance).toFixed(4))
        } catch (fallbackError) {
          console.error("Error getting reward pool balance (fallback):", fallbackError)
        }
      }

      try {
        const totalStakedAmount = await stakingContract.totalStaked()
        const formattedTotalStaked = contractService.formatTokenAmount(totalStakedAmount)
        console.log("Total staked:", formattedTotalStaked)
        setTotalStaked(Number.parseFloat(formattedTotalStaked).toFixed(4))
      } catch (error) {
        console.error("Error getting total staked:", error)
      }
    } catch (error) {
      console.error("Error loading staking data:", error)
      toast({
        title: "Error loading staking data",
        description: "Failed to load staking pool information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPoolData(false)
    }
  }

  const loadAPYValues = async () => {
    try {
      console.log("Loading APY values...")

      const stakingContract = await contractService.getStakingContract()

      // Get APY values for each staking period
      const newApyValues = await Promise.all(
        [0, 1, 2].map(async (index) => {
          try {
            const apy = await stakingContract.apyRates(index)
            // Convert from basis points to percentage (500 basis points = 5%)
            return (Number(apy) / 100).toString()
          } catch (error) {
            console.error(`Error loading APY for period ${index}:`, error)
            return apyValues[index] // Return current value if error
          }
        }),
      )

      console.log("APY values loaded:", newApyValues)
      setApyValues(newApyValues)
    } catch (error) {
      console.error("Error loading APY values:", error)
    }
  }

  const approveTokens = async () => {
    if (!rewardAmount || Number.parseFloat(rewardAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to approve",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`Approving ${rewardAmount} ${tokenSymbol} tokens...`)

      const tokenContract = await contractService.getCAFITokenContract(undefined, true) // Corrected line
      const amountInWei = contractService.parseTokenAmount(rewardAmount)

      console.log(`Approving ${rewardAmount} tokens for staking contract: ${CONTRACT_ADDRESSES.STAKING}`)
      const tx = await tokenContract.approve(CONTRACT_ADDRESSES.STAKING, amountInWei)
      setTxHash(tx.hash)

      setTxMessage("Waiting for approval confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully approved ${rewardAmount} ${tokenSymbol} tokens!`)

      // Refresh allowance
      await checkAllowance()

      toast({
        title: "Tokens approved",
        description: `You have successfully approved ${rewardAmount} ${tokenSymbol} tokens`,
      })
    } catch (error: any) {
      console.error("Error approving tokens:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to approve tokens")

      toast({
        title: "Failed to approve tokens",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addRewardPoolFunds = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to add funds",
        variant: "destructive",
      })
      return
    }

    if (!stakingContractExists) {
      toast({
        title: "Contract not found",
        description: "The staking contract is not available on this network",
        variant: "destructive",
      })
      return
    }

    if (!rewardAmount || Number.parseFloat(rewardAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to add",
        variant: "destructive",
      })
      return
    }

    if (stakingContractPaused) {
      toast({
        title: "Contract paused",
        description: "The staking contract is currently paused",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`Adding ${rewardAmount} ${tokenSymbol} to reward pool...`)

      // Check if approval is needed
      if (needsApproval) {
        setTxMessage("Approval required first. Please approve tokens.")
        setTxStatus("error")
        return
      }

      // Add funds to reward pool
      const stakingContract = await contractService.getStakingContract(undefined, true)
      const amountInWei = contractService.parseTokenAmount(rewardAmount)

      console.log(`Adding ${rewardAmount} tokens to reward pool`)
      const tx = await stakingContract.addRewardPoolFunds(amountInWei)
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully added ${rewardAmount} ${tokenSymbol} to reward pool!`)

      // Refresh data
      await Promise.all([loadStakingData(), checkAllowance()])

      toast({
        title: "Funds added",
        description: `You have successfully added ${rewardAmount} ${tokenSymbol} to the reward pool`,
      })

      // Reset form
      setRewardAmount("")
    } catch (error: any) {
      console.error("Error adding funds to reward pool:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to add funds")

      toast({
        title: "Failed to add funds",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateAPY = async (periodIndex: number) => {
    const apy = apyValues[periodIndex]

    if (!apy || Number.parseFloat(apy) < 0) {
      toast({
        title: "Invalid APY",
        description: "Please enter a valid APY percentage",
        variant: "destructive",
      })
      return
    }

    if (stakingContractPaused) {
      toast({
        title: "Contract paused",
        description: "The staking contract is currently paused",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`Updating APY for period ${periodIndex + 1} to ${apy}%...`)

      const stakingContract = await contractService.getStakingContract(undefined, true)
      // Convert APY percentage to basis points (e.g., 5% = 500)
      const apyInBasisPoints = Math.round(Number.parseFloat(apy) * 100)
      console.log(`Setting APY for period ${periodIndex} to ${apyInBasisPoints} basis points`)

      const tx = await stakingContract.setAPY(periodIndex, apyInBasisPoints)
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully updated APY for period ${periodIndex + 1} to ${apy}%!`)

      toast({
        title: "APY updated",
        description: `APY for period ${periodIndex + 1} has been updated to ${apy}%`,
      })
    } catch (error: any) {
      console.error("Error updating APY:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to update APY")

      toast({
        title: "Failed to update APY",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePause = async () => {
    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`${stakingContractPaused ? "Unpausing" : "Pausing"} staking contract...`)

      const stakingContract = await contractService.getStakingContract(undefined, true)
      const tx = await stakingContract.togglePause()
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully ${stakingContractPaused ? "unpaused" : "paused"} staking contract!`)

      // Refresh contract status
      await checkContractStatus()

      toast({
        title: "Contract status updated",
        description: `Staking contract has been ${stakingContractPaused ? "unpaused" : "paused"}`,
      })
    } catch (error: any) {
      console.error("Error toggling pause:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to toggle pause")

      toast({
        title: "Failed to update contract status",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshData = () => {
    Promise.all([loadStakingData(), loadAPYValues(), checkContractStatus(), checkAllowance()])

    toast({
      title: "Data refreshed",
      description: "Staking pool information has been updated",
    })
  }

  return (
    <AdminGuard>
      <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Staking Pool Management</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={isLoadingPoolData || isLoading}
              className="flex items-center gap-1 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant={stakingContractPaused ? "default" : "destructive"}
              size="sm"
              onClick={togglePause}
              disabled={isLoading}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {stakingContractPaused ? "Unpause" : "Pause"} Contract
            </Button>
          </div>
        </div>

        {stakingContractPaused && (
          <Alert variant="destructive" className="border-red-700 bg-red-900/20 text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription>
              The staking contract is currently paused. Some functions may not be available.
            </AlertDescription>
          </Alert>
        )}

        <TransactionStatus status={txStatus} hash={txHash} message={txMessage} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Reward Pool Funds */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                    <Coins className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Add Reward Pool Funds</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Add {tokenSymbol} tokens to the staking reward pool
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rewardAmount" className="text-gray-300">
                      Amount to Add ({tokenSymbol})
                    </Label>
                    <Input
                      id="rewardAmount"
                      type="number"
                      placeholder="0.0"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      className="bg-gray-800 text-white border-gray-700 focus:border-emerald-500"
                    />
                    {rewardAmount && (
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>
                          Current allowance: {Number.parseFloat(allowance).toFixed(4)} {tokenSymbol}
                        </p>
                        {needsApproval && <p className="text-orange-400">⚠️ Approval required before adding funds</p>}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                {needsApproval && rewardAmount && Number.parseFloat(rewardAmount) > 0 && (
                  <Button
                    onClick={approveTokens}
                    disabled={!isConnected || isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? "Approving..." : `Approve ${tokenSymbol}`}
                  </Button>
                )}
                <Button
                  onClick={addRewardPoolFunds}
                  disabled={
                    !isConnected ||
                    !rewardAmount ||
                    Number.parseFloat(rewardAmount) <= 0 ||
                    needsApproval ||
                    isLoading ||
                    stakingContractPaused
                  }
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? "Processing..." : `Add ${tokenSymbol} to Pool`}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Pool Information */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Pool Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="text-sm font-medium text-gray-400 mb-1">Reward Pool</div>
                    <div className="text-xl md:text-2xl font-bold text-white">
                      {isLoadingPoolData ? (
                        <div className="animate-pulse h-6 md:h-8 w-20 md:w-24 bg-gray-700 rounded"></div>
                      ) : (
                        `${rewardPool} ${tokenSymbol}`
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="text-sm font-medium text-gray-400 mb-1">Total Staked</div>
                    <div className="text-xl md:text-2xl font-bold text-white">
                      {isLoadingPoolData ? (
                        <div className="animate-pulse h-6 md:h-8 w-20 md:w-24 bg-gray-700 rounded"></div>
                      ) : (
                        `${totalStaked} ${tokenSymbol}`
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="text-sm font-medium text-gray-400 mb-1">Contract Status</div>
                    <div className={`text-lg font-bold ${stakingContractPaused ? "text-red-400" : "text-emerald-400"}`}>
                      {stakingContractPaused ? "Paused" : "Active"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                    <Settings className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Contract Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Staking Contract:</span>
                    <span className="font-mono text-xs text-gray-100">
                      {CONTRACT_ADDRESSES.STAKING.substring(0, 10)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Token Contract:</span>
                    <span className="font-mono text-xs text-gray-100">
                      {CONTRACT_ADDRESSES.CAFI_TOKEN.substring(0, 10)}...
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* APY Management */}
        <Card className="bg-gray-900 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">APY Management</CardTitle>
            <CardDescription className="text-gray-400">
              Configure APY rates for different staking periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* 30 Days APY */}
              <Card className="bg-gray-800 border border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">30 Days Period</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={apyValues[0]}
                      onChange={(e) => setApyValues([e.target.value, apyValues[1], apyValues[2]])}
                      className="bg-gray-700 text-white border-gray-600"
                      step="0.1"
                      min="0"
                    />
                    <span className="text-lg font-bold text-white">%</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => updateAPY(0)}
                    disabled={isLoading || stakingContractPaused}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Update <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* 90 Days APY */}
              <Card className="bg-gray-800 border border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">90 Days Period</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={apyValues[1]}
                      onChange={(e) => setApyValues([apyValues[0], e.target.value, apyValues[2]])}
                      className="bg-gray-700 text-white border-gray-600"
                      step="0.1"
                      min="0"
                    />
                    <span className="text-lg font-bold text-white">%</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => updateAPY(1)}
                    disabled={isLoading || stakingContractPaused}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Update <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* 180 Days APY */}
              <Card className="bg-gray-800 border border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">180 Days Period</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={apyValues[2]}
                      onChange={(e) => setApyValues([apyValues[0], apyValues[1], e.target.value])}
                      className="bg-gray-700 text-white border-gray-600"
                      step="0.1"
                      min="0"
                    />
                    <span className="text-lg font-bold text-white">%</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => updateAPY(2)}
                    disabled={isLoading || stakingContractPaused}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Update <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Removed global styles as they are now inline or replaced */}
        <style jsx global>{`
          /* Removed .gradient-card, .card-hover, .btn-blue as styles are now inline or replaced */
        `}</style>
      </div>
    </AdminGuard>
  )
}
