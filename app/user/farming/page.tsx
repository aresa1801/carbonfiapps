"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not connected</AlertTitle>
          <AlertDescription>Please connect your wallet to access farming features.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!farmingContractExists) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contract not found</AlertTitle>
          <AlertDescription>The farming contract is not available on this network.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sprout className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Yield Farming</h1>
            <p className="text-muted-foreground">Stake your tokens to earn farming rewards</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || loading}>
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stake">Stake Tokens</TabsTrigger>
          <TabsTrigger value="my-stakes">My Stakes</TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Stake {tokenSymbol} Tokens
              </CardTitle>
              <CardDescription>
                Choose a farming package and stake your tokens to earn rewards. Your balance: {balance} {tokenSymbol}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="package">Select Farming Package</Label>
                {loading ? (
                  <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                ) : farmPackages.length > 0 ? (
                  <div className="grid gap-3">
                    {farmPackages.map((pkg, index) => (
                      <div
                        key={pkg.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPackage === index ? "border-green-500 bg-green-50" : "hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedPackage(index)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold">{formatDuration(pkg.lockDurationDays)} Package</h3>
                          <Badge variant="secondary">{pkg.apyPercent.toFixed(1)}% APY</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Lock Duration: {formatDuration(pkg.lockDurationDays)}</p>
                          <p>
                            Minimum Stake: {pkg.minStakeFormatted} {tokenSymbol}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No farming packages available at the moment.</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Stake ({tokenSymbol})</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
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
                className="w-full"
              >
                {loading ? "Processing..." : `Stake ${tokenSymbol} Tokens`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="my-stakes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                My Active Stakes
              </CardTitle>
              <CardDescription>Manage your active farming positions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && userStakes.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : userStakes.length > 0 ? (
                <div className="space-y-4">
                  {userStakes.map((stake, index) => {
                    const farmPackage = farmPackages.find((pkg) => Number(pkg.id) === Number(stake.packageId))
                    return (
                      <Card key={index} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Stake #{index + 1}</CardTitle>
                            <div className="flex gap-2">
                              {stake.isAutoCompounding && <Badge variant="secondary">Auto-Compound</Badge>}
                              {farmPackage && <Badge>{farmPackage.apyPercent.toFixed(1)}% APY</Badge>}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-muted-foreground">Staked Amount</Label>
                              <p className="font-medium">
                                {stake.stakedAmountFormatted} {tokenSymbol}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Package</Label>
                              <p className="font-medium">
                                {farmPackage
                                  ? formatDuration(farmPackage.lockDurationDays)
                                  : `Package ${stake.packageId}`}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Start Date</Label>
                              <p className="font-medium">{stake.startDate.toLocaleDateString()}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Last Claim</Label>
                              <p className="font-medium">
                                {Number(stake.lastRewardClaimTimestamp) > 0
                                  ? stake.lastClaimDate.toLocaleDateString()
                                  : "Never"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button size="sm" onClick={() => handleClaimRewards(stake.stakeIndex)} disabled={loading}>
                              <Coins className="h-4 w-4 mr-1" />
                              Claim Rewards
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleAutoCompound(stake.stakeIndex)}
                              disabled={loading}
                            >
                              {stake.isAutoCompounding ? "Disable" : "Enable"} Auto-Compound
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleWithdrawStake(stake.stakeIndex)}
                              disabled={loading}
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
                  <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You don't have any active stakes</p>
                  <p className="text-sm text-muted-foreground mt-1">Start farming by staking your tokens!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
