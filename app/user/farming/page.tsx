"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { contractService, type FarmPackage, type UserStake } from "@/lib/contract-utils"
import { AlertCircle, Sprout, TrendingUp, Coins, RefreshCw } from "lucide-react"
import { TransactionStatus } from "@/components/transaction-status"

export default function FarmingPage() {
  const { account, isConnected, balance, tokenSymbol, farmingContractExists } = useWeb3()
  const { toast } = useToast()

  const [farmPackages, setFarmPackages] = useState<FarmPackage[]>([])
  const [userStakes, setUserStakes] = useState<UserStake[]>([])
  const [stakeAmount, setStakeAmount] = useState("")
  const [selectedPackage, setSelectedPackage] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "error" | null>(null)

  useEffect(() => {
    if (isConnected && account && farmingContractExists) {
      loadFarmingData()
    }
  }, [isConnected, account, farmingContractExists])

  const loadFarmingData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadFarmPackages(), loadUserStakes()])
    } catch (error) {
      console.error("Error loading farming data:", error)
      toast({
        title: "Error",
        description: "Failed to load farming data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const loadFarmPackages = async () => {
    try {
      const packages = await contractService.getFarmingPackages()
      setFarmPackages(packages.filter((pkg) => pkg.isActive))
      console.log("Loaded farm packages:", packages)
    } catch (error) {
      console.error("Error loading farm packages:", error)
    }
  }

  const loadUserStakes = async () => {
    try {
      if (!account) return

      const farmingContract = await contractService.getFarmingContract()
      const stakes = await farmingContract.getUserStakes(account)

      // Process stakes and add computed fields
      const processedStakes = stakes.map((stake: any, index: number) => ({
        ...stake,
        stakeIndex: index,
        stakedAmountFormatted: contractService.formatTokenAmount(stake.stakedAmount),
        startDate: new Date(Number(stake.stakeStartTimestamp) * 1000),
        lastClaimDate: new Date(Number(stake.lastRewardClaimTimestamp) * 1000),
      }))

      setUserStakes(processedStakes)
      console.log("Loaded user stakes:", processedStakes)
    } catch (error) {
      console.error("Error loading user stakes:", error)
    }
  }

  const handleStake = async () => {
    if (!isConnected || !account || !stakeAmount || Number.parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid amount to stake",
        variant: "destructive",
      })
      return
    }

    if (!farmingContractExists) {
      toast({
        title: "Contract not found",
        description: "The farming contract is not available on this network",
        variant: "destructive",
      })
      return
    }

    const selectedPkg = farmPackages[selectedPackage]
    if (!selectedPkg) {
      toast({
        title: "Invalid package",
        description: "Please select a valid farming package",
        variant: "destructive",
      })
      return
    }

    // Check minimum stake requirement
    const stakeAmountNum = Number.parseFloat(stakeAmount)
    const minStakeNum = Number.parseFloat(selectedPkg.minStakeFormatted)

    if (stakeAmountNum < minStakeNum) {
      toast({
        title: "Amount too low",
        description: `Minimum stake amount is ${selectedPkg.minStakeFormatted} ${tokenSymbol}`,
        variant: "destructive",
      })
      return
    }

    // Check balance
    if (stakeAmountNum > Number.parseFloat(balance)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough tokens to stake",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setTxStatus("pending")

      // First approve tokens for farming contract
      const tokenContract = await contractService.getTokenContract(contractService.CONTRACT_ADDRESSES.CAFI_TOKEN, true)
      const stakeAmountWei = contractService.parseTokenAmount(stakeAmount)

      console.log("Approving tokens for farming...")
      const approveTx = await tokenContract.approve(contractService.CONTRACT_ADDRESSES.FARMING, stakeAmountWei)
      setTxHash(approveTx.hash)
      await approveTx.wait()

      // Now create the stake
      console.log("Creating stake...")
      const farmingContract = await contractService.getFarmingContract(true)
      const stakeTx = await farmingContract.createStake(selectedPkg.id, stakeAmountWei)
      setTxHash(stakeTx.hash)

      const receipt = await stakeTx.wait()

      if (receipt?.status === 1) {
        setTxStatus("success")
        toast({
          title: "Stake created successfully",
          description: `You have staked ${stakeAmount} ${tokenSymbol} in ${selectedPkg.lockDurationDays} days package`,
        })

        // Reset form and refresh data
        setStakeAmount("")
        await loadFarmingData()
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Error staking tokens:", error)
      setTxStatus("error")

      let errorMessage = "Failed to stake tokens"
      if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user"
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas"
      }

      toast({
        title: "Staking failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClaimRewards = async (stakeIndex: number) => {
    try {
      setLoading(true)
      setTxStatus("pending")

      const farmingContract = await contractService.getFarmingContract(true)
      const tx = await farmingContract.claimStakeRewards(stakeIndex)
      setTxHash(tx.hash)

      const receipt = await tx.wait()

      if (receipt?.status === 1) {
        setTxStatus("success")
        toast({
          title: "Rewards claimed",
          description: "Your farming rewards have been claimed successfully",
        })

        await loadFarmingData()
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Error claiming rewards:", error)
      setTxStatus("error")
      toast({
        title: "Claim failed",
        description: error.message || "Failed to claim rewards",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawStake = async (stakeIndex: number) => {
    try {
      setLoading(true)
      setTxStatus("pending")

      const farmingContract = await contractService.getFarmingContract(true)
      const tx = await farmingContract.withdrawStake(stakeIndex)
      setTxHash(tx.hash)

      const receipt = await tx.wait()

      if (receipt?.status === 1) {
        setTxStatus("success")
        toast({
          title: "Stake withdrawn",
          description: "Your stake has been withdrawn successfully",
        })

        await loadFarmingData()
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Error withdrawing stake:", error)
      setTxStatus("error")
      toast({
        title: "Withdrawal failed",
        description: error.message || "Failed to withdraw stake",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAutoCompound = async (stakeIndex: number) => {
    try {
      setLoading(true)
      setTxStatus("pending")

      const farmingContract = await contractService.getFarmingContract(true)
      const tx = await farmingContract.toggleAutoCompound(stakeIndex)
      setTxHash(tx.hash)

      const receipt = await tx.wait()

      if (receipt?.status === 1) {
        setTxStatus("success")
        toast({
          title: "Auto-compound toggled",
          description: "Auto-compound setting has been updated",
        })

        await loadFarmingData()
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Error toggling auto-compound:", error)
      setTxStatus("error")
      toast({
        title: "Toggle failed",
        description: error.message || "Failed to toggle auto-compound",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadFarmingData()
  }

  const formatDuration = (days: number) => {
    if (days < 30) return `${days} days`
    if (days < 365) return `${Math.round(days / 30)} months`
    return `${Math.round(days / 365)} years`
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <Card className="group overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 hover:border-green-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-2 hover:scale-[1.02]">
          <CardContent className="flex flex-col items-center justify-center py-12 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <AlertCircle className="h-12 w-12 text-green-400 mb-4 group-hover:text-green-300 group-hover:scale-110 transition-all duration-300 relative z-10" />
            <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-green-300 transition-colors duration-300 relative z-10">
              Not connected
            </h3>
            <p className="text-gray-400 text-center group-hover:text-gray-300 transition-colors duration-300 relative z-10">
              Please connect your wallet to access farming features.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!farmingContractExists) {
    return (
      <div className="container mx-auto p-6">
        <Card className="group overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-900 border-red-700 hover:border-red-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20 hover:-translate-y-2 hover:scale-[1.02]">
          <CardContent className="flex flex-col items-center justify-center py-12 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <AlertCircle className="h-12 w-12 text-red-400 mb-4 group-hover:text-red-300 group-hover:scale-110 transition-all duration-300 relative z-10" />
            <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-red-300 transition-colors duration-300 relative z-10">
              Contract not found
            </h3>
            <p className="text-gray-400 text-center group-hover:text-gray-300 transition-colors duration-300 relative z-10">
              The farming contract is not available on this network.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sprout className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-white">Yield Farming</h1>
            <p className="text-gray-400">Stake your tokens to earn farming rewards</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {txHash && (
        <TransactionStatus
          hash={txHash}
          status={txStatus}
          onClose={() => {
            setTxHash("")
            setTxStatus(null)
          }}
        />
      )}

      <Tabs defaultValue="stake" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
          <TabsTrigger
            value="stake"
            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
          >
            Stake Tokens
          </TabsTrigger>
          <TabsTrigger
            value="my-stakes"
            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
          >
            My Stakes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="space-y-6">
          <Card className="group overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 border-green-700 hover:border-green-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-2 hover:scale-[1.01]">
            <CardHeader className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardTitle className="flex items-center gap-2 text-white group-hover:text-green-100 transition-colors duration-300 relative z-10">
                <Coins className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                Stake {tokenSymbol} Tokens
              </CardTitle>
              <CardDescription className="text-green-300 group-hover:text-green-200 transition-colors duration-300 relative z-10">
                Choose a farming package and stake your tokens to earn rewards. Your balance: {balance} {tokenSymbol}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="space-y-2">
                <Label
                  htmlFor="package"
                  className="text-green-200 group-hover:text-white transition-colors duration-300"
                >
                  Select Farming Package
                </Label>
                {loading ? (
                  <div className="h-10 bg-green-800/50 animate-pulse rounded"></div>
                ) : farmPackages.length > 0 ? (
                  <div className="grid gap-3">
                    {farmPackages.map((pkg, index) => (
                      <div
                        key={pkg.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedPackage === index
                            ? "border-green-400 bg-green-800/50 shadow-lg shadow-green-500/20"
                            : "border-green-600 bg-green-800/30 hover:border-green-500 hover:bg-green-700/50"
                        }`}
                        onClick={() => setSelectedPackage(index)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-white">{formatDuration(pkg.lockDurationDays)} Package</h3>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                            {pkg.apyPercent.toFixed(1)}% APY
                          </Badge>
                        </div>
                        <div className="text-sm text-green-300">
                          <p>Lock Duration: {formatDuration(pkg.lockDurationDays)}</p>
                          <p>
                            Minimum Stake: {pkg.minStakeFormatted} {tokenSymbol}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert className="border-yellow-600 bg-yellow-900/20">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-300">
                      No farming packages available at the moment.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="amount"
                  className="text-green-200 group-hover:text-white transition-colors duration-300"
                >
                  Amount to Stake ({tokenSymbol})
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  disabled={loading}
                  className="bg-green-800/50 border-green-600 text-white placeholder:text-green-300 focus:border-green-400 focus:ring-green-400/20 transition-all duration-300"
                />
                <p className="text-sm text-green-300 group-hover:text-green-200 transition-colors duration-300">
                  Available: {balance} {tokenSymbol}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleStake}
                disabled={
                  loading ||
                  !stakeAmount ||
                  Number.parseFloat(stakeAmount) <= 0 ||
                  farmPackages.length === 0 ||
                  Number.parseFloat(stakeAmount) > Number.parseFloat(balance)
                }
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium shadow-lg hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300"
              >
                {loading ? "Processing..." : `Stake ${tokenSymbol} Tokens`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="my-stakes" className="space-y-6">
          <Card className="group overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 border-blue-700 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 hover:scale-[1.01]">
            <CardHeader className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardTitle className="flex items-center gap-2 text-white group-hover:text-blue-100 transition-colors duration-300 relative z-10">
                <TrendingUp className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                My Active Stakes
              </CardTitle>
              <CardDescription className="text-blue-300 group-hover:text-blue-200 transition-colors duration-300 relative z-10">
                Manage your active farming positions
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {loading && userStakes.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border border-blue-600 rounded-lg bg-blue-800/30">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-blue-700 rounded w-3/4"></div>
                        <div className="h-3 bg-blue-700 rounded w-1/2"></div>
                        <div className="h-3 bg-blue-700 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : userStakes.length > 0 ? (
                <div className="space-y-4">
                  {userStakes.map((stake, index) => {
                    const farmPackage = farmPackages.find((pkg) => Number(pkg.id) === Number(stake.packageId))
                    return (
                      <Card
                        key={index}
                        className="group/stake overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 hover:border-slate-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-slate-500/20 hover:-translate-y-1 hover:scale-[1.02]"
                      >
                        <CardHeader className="pb-3 relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-400/5 opacity-0 group-hover/stake:opacity-100 transition-opacity duration-500" />
                          <div className="flex justify-between items-center relative z-10">
                            <CardTitle className="text-lg text-white group-hover/stake:text-slate-200 transition-colors duration-300">
                              Stake #{index + 1}
                            </CardTitle>
                            <div className="flex gap-2">
                              {stake.isAutoCompounding && (
                                <Badge
                                  variant="secondary"
                                  className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                >
                                  Auto-Compound
                                </Badge>
                              )}
                              {farmPackage && (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                  {farmPackage.apyPercent.toFixed(1)}% APY
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 relative">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-slate-400 group-hover/stake:text-slate-300 transition-colors duration-300">
                                Staked Amount
                              </Label>
                              <p className="font-medium text-white group-hover/stake:text-slate-200 transition-colors duration-300">
                                {stake.stakedAmountFormatted} {tokenSymbol}
                              </p>
                            </div>
                            <div>
                              <Label className="text-slate-400 group-hover/stake:text-slate-300 transition-colors duration-300">
                                Package
                              </Label>
                              <p className="font-medium text-white group-hover/stake:text-slate-200 transition-colors duration-300">
                                {farmPackage
                                  ? formatDuration(farmPackage.lockDurationDays)
                                  : `Package ${stake.packageId}`}
                              </p>
                            </div>
                            <div>
                              <Label className="text-slate-400 group-hover/stake:text-slate-300 transition-colors duration-300">
                                Start Date
                              </Label>
                              <p className="font-medium text-white group-hover/stake:text-slate-200 transition-colors duration-300">
                                {stake.startDate.toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Label className="text-slate-400 group-hover/stake:text-slate-300 transition-colors duration-300">
                                Last Claim
                              </Label>
                              <p className="font-medium text-white group-hover/stake:text-slate-200 transition-colors duration-300">
                                {Number(stake.lastRewardClaimTimestamp) > 0
                                  ? stake.lastClaimDate.toLocaleDateString()
                                  : "Never"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleClaimRewards(stake.stakeIndex)}
                              disabled={loading}
                              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 transition-all duration-300 hover:scale-105"
                            >
                              <Coins className="h-4 w-4 mr-1" />
                              Claim Rewards
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleAutoCompound(stake.stakeIndex)}
                              disabled={loading}
                              className="border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all duration-300 hover:scale-105"
                            >
                              {stake.isAutoCompounding ? "Disable" : "Enable"} Auto-Compound
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleWithdrawStake(stake.stakeIndex)}
                              disabled={loading}
                              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-300 hover:scale-105"
                            >
                              Withdraw Stake
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sprout className="h-12 w-12 text-blue-400 mx-auto mb-4 group-hover:text-blue-300 group-hover:scale-110 transition-all duration-300" />
                  <p className="text-blue-300 group-hover:text-blue-200 transition-colors duration-300">
                    You don't have any active stakes
                  </p>
                  <p className="text-sm text-blue-400 group-hover:text-blue-300 mt-1 transition-colors duration-300">
                    Start farming by staking your tokens!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
