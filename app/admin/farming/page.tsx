"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { TransactionStatus } from "@/components/transaction-status"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { formatEther, parseEther } from "ethers"
import { Sprout, Settings, RefreshCw, Plus, Edit, Pause, Play, AlertCircle } from "lucide-react"
import { contractService, CONTRACT_ADDRESSES, type FarmPackage } from "@/lib/contract-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function FarmingPage() {
  const {
    isConnected,
    account,
    tokenSymbol,
    farmingContractExists,
    isAdmin,
    farmingContract,
    cafiTokenContract,
    isRefreshing,
    refreshBalances,
  } = useWeb3()

  const [packages, setPackages] = useState<FarmPackage[]>([])
  const [txStatus, setTxStatus] = useState<"loading" | "success" | "error" | null>(null)
  const [txHash, setTxHash] = useState("")
  const [txMessage, setTxMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPackages, setIsLoadingPackages] = useState(false)
  const [contractPaused, setContractPaused] = useState(false)
  const [feePoolBalance, setFeePoolBalance] = useState("0")
  const [autoCompoundFeeBps, setAutoCompoundFeeBps] = useState("0")
  const [feeCollector, setFeeCollector] = useState("")

  const [newRewardRate, setNewRewardRate] = useState("")
  const [currentRewardRate, setCurrentRewardRate] = useState("Loading...")
  const [isUpdatingRate, setIsUpdatingRate] = useState(false)

  const [addFundsAmount, setAddFundsAmount] = useState("")
  const [isAddingFunds, setIsAddingFunds] = useState(false)
  const [rewardPoolBalance, setRewardPoolBalance] = useState("Loading...")
  const [totalStaked, setTotalStaked] = useState("Loading...")

  // New package form
  const [newPackage, setNewPackage] = useState({
    stakeToken: CONTRACT_ADDRESSES.CAFI_TOKEN,
    duration: "30",
    apyBps: "500", // 5%
    minStake: "100",
  })

  // Fee management
  const [newFeeBps, setNewFeeBps] = useState("")
  const [newFeeCollector, setNewFeeCollector] = useState("")

  useEffect(() => {
    if (isConnected && account) {
      console.log("Admin farming page: Connected with account", account)
      checkFarmingContract()

      // Set up auto-refresh interval
      const intervalId = setInterval(() => {
        loadFarmingData()
      }, 30000)

      return () => clearInterval(intervalId)
    }
  }, [isConnected, farmingContractExists, account])

  const checkFarmingContract = async () => {
    try {
      const exists = await contractService.contractExists(CONTRACT_ADDRESSES.FARMING)
      console.log("Farming contract exists:", exists)

      if (exists) {
        await loadFarmingData()
      } else {
        toast({
          title: "Farming Contract Not Found",
          description: "The farming contract could not be found on this network.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking farming contract:", error)
    }
  }

  const loadFarmingData = async () => {
    try {
      setIsLoadingPackages(true)
      console.log("Loading farming data...")

      const farmingContract = await contractService.getFarmingContract()

      // Load contract status
      const [paused, feePool, autoFee, collector] = await Promise.all([
        farmingContract.paused(),
        farmingContract.feePoolBalance(),
        farmingContract.autoCompoundFeeBps(),
        farmingContract.feeCollector(),
      ])

      setContractPaused(paused)
      setFeePoolBalance(contractService.formatTokenAmount(feePool))
      setAutoCompoundFeeBps(autoFee.toString())
      setFeeCollector(collector)

      // Load packages
      const packageCount = await farmingContract.getActivePackageCount()
      const loadedPackages: FarmPackage[] = []

      for (let i = 0; i < Number(packageCount); i++) {
        try {
          const packageDetails = await farmingContract.getPackageDetails(i)
          loadedPackages.push({
            id: i,
            stakeTokenAddress: packageDetails.stakeTokenAddress,
            lockDuration: packageDetails.lockDuration,
            apyBps: packageDetails.apyBps,
            minimumStakeAmount: packageDetails.minimumStakeAmount,
            isActive: packageDetails.isActive,
          })
        } catch (error) {
          console.error(`Error loading package ${i}:`, error)
        }
      }

      setPackages(loadedPackages)
      console.log("Loaded packages:", loadedPackages)
    } catch (error) {
      console.error("Error loading farming data:", error)
      toast({
        title: "Error loading farming data",
        description: "Failed to load farming information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPackages(false)
    }
  }

  const createNewPackage = async () => {
    if (!newPackage.stakeToken || !newPackage.duration || !newPackage.apyBps || !newPackage.minStake) {
      toast({
        title: "Invalid input",
        description: "Please fill in all package details",
        variant: "destructive",
      })
      return
    }

    if (contractPaused) {
      toast({
        title: "Contract paused",
        description: "The farming contract is currently paused",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage("Creating new farming package...")

      const farmingContract = await contractService.getFarmingContract(true)

      const durationInSeconds = Number(newPackage.duration) * 24 * 60 * 60 // Convert days to seconds
      const apyBps = Number(newPackage.apyBps)
      const minStakeAmount = contractService.parseTokenAmount(newPackage.minStake)

      console.log("Creating package with:", {
        stakeToken: newPackage.stakeToken,
        duration: durationInSeconds,
        apyBps,
        minStake: minStakeAmount.toString(),
      })

      const tx = await farmingContract.configureNewPackage(
        newPackage.stakeToken,
        durationInSeconds,
        apyBps,
        minStakeAmount,
      )
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage("Successfully created new farming package!")

      // Refresh data
      await loadFarmingData()

      toast({
        title: "Package created",
        description: "New farming package has been created successfully",
      })

      // Reset form
      setNewPackage({
        stakeToken: CONTRACT_ADDRESSES.CAFI_TOKEN,
        duration: "30",
        apyBps: "500",
        minStake: "100",
      })
    } catch (error: any) {
      console.error("Error creating package:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to create package")

      toast({
        title: "Failed to create package",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePackageStatus = async (packageId: number, isActive: boolean) => {
    if (contractPaused) {
      toast({
        title: "Contract paused",
        description: "The farming contract is currently paused",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`${isActive ? "Activating" : "Deactivating"} package ${packageId}...`)

      const farmingContract = await contractService.getFarmingContract(true)
      const tx = await farmingContract.updatePackageStatus(packageId, isActive)
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully ${isActive ? "activated" : "deactivated"} package!`)

      // Refresh data
      await loadFarmingData()

      toast({
        title: "Package updated",
        description: `Package ${packageId} has been ${isActive ? "activated" : "deactivated"}`,
      })
    } catch (error: any) {
      console.error("Error updating package status:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to update package")

      toast({
        title: "Failed to update package",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePackageAPY = async (packageId: number, newApyBps: string) => {
    if (!newApyBps || Number(newApyBps) < 0) {
      toast({
        title: "Invalid APY",
        description: "Please enter a valid APY in basis points",
        variant: "destructive",
      })
      return
    }

    if (contractPaused) {
      toast({
        title: "Contract paused",
        description: "The farming contract is currently paused",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`Updating APY for package ${packageId}...`)

      const farmingContract = await contractService.getFarmingContract(true)
      const tx = await farmingContract.updatePackageAPY(packageId, Number(newApyBps))
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage("Successfully updated package APY!")

      // Refresh data
      await loadFarmingData()

      toast({
        title: "APY updated",
        description: `Package ${packageId} APY has been updated to ${Number(newApyBps) / 100}%`,
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

  const updateFeeParameters = async () => {
    if (!newFeeBps || !newFeeCollector) {
      toast({
        title: "Invalid input",
        description: "Please enter both fee BPS and collector address",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage("Updating fee parameters...")

      const farmingContract = await contractService.getFarmingContract(true)
      const tx = await farmingContract.updateFeeParameters(Number(newFeeBps), newFeeCollector)
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage("Successfully updated fee parameters!")

      // Refresh data
      await loadFarmingData()

      toast({
        title: "Fee parameters updated",
        description: "Fee parameters have been updated successfully",
      })

      // Reset form
      setNewFeeBps("")
      setNewFeeCollector("")
    } catch (error: any) {
      console.error("Error updating fee parameters:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to update fee parameters")

      toast({
        title: "Failed to update fee parameters",
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
      setTxMessage(`${contractPaused ? "Unpausing" : "Pausing"} farming contract...`)

      const farmingContract = await contractService.getFarmingContract(true)
      const tx = contractPaused ? await farmingContract.emergencyUnpause() : await farmingContract.emergencyPause()
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully ${contractPaused ? "unpaused" : "paused"} farming contract!`)

      // Refresh data
      await loadFarmingData()

      toast({
        title: "Contract status updated",
        description: `Farming contract has been ${contractPaused ? "unpaused" : "paused"}`,
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

  const withdrawFees = async () => {
    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage("Withdrawing accumulated fees...")

      const farmingContract = await contractService.getFarmingContract(true)
      const tx = await farmingContract.withdrawAccumulatedFees()
      setTxHash(tx.hash)

      setTxMessage("Waiting for transaction confirmation...")
      await tx.wait()

      setTxStatus("success")
      setTxMessage("Successfully withdrew accumulated fees!")

      // Refresh data
      await loadFarmingData()

      toast({
        title: "Fees withdrawn",
        description: "Accumulated fees have been withdrawn successfully",
      })
    } catch (error: any) {
      console.error("Error withdrawing fees:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to withdraw fees")

      toast({
        title: "Failed to withdraw fees",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshData = () => {
    loadFarmingData()
    toast({
      title: "Data refreshed",
      description: "Farming information has been updated",
    })
  }

  const handleUpdateRewardRate = async () => {
    if (!farmingContract || !isAdmin || !newRewardRate) {
      toast({
        title: "Unauthorized",
        description: "You are not authorized to perform this action or wallet not connected.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingRate(true)
    try {
      const rate = parseEther(newRewardRate)
      const tx = await farmingContract.setRewardRate(rate)
      await tx.wait()
      toast({
        title: "Reward Rate Updated",
        description: `Farming reward rate set to ${newRewardRate} CAFI/block.`,
      })
      setNewRewardRate("")
      refreshBalances() // Refresh to show updated rate
    } catch (error: any) {
      console.error("Error updating reward rate:", error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update reward rate.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingRate(false)
    }
  }

  const handleAddFunds = async () => {
    if (!farmingContract || !cafiTokenContract || !isAdmin || !addFundsAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in the amount and ensure you are an admin.",
        variant: "destructive",
      })
      return
    }

    setIsAddingFunds(true)
    try {
      const amount = parseEther(addFundsAmount)

      // Check allowance first
      const allowance = await cafiTokenContract.allowance(farmingContract.runner?.address, farmingContract.target)
      if (allowance < amount) {
        toast({
          title: "Approval Needed",
          description: "Approving CAFI tokens for farming contract...",
        })
        const approveTx = await cafiTokenContract.approve(farmingContract.target, amount)
        await approveTx.wait()
        toast({
          title: "Approval Successful",
          description: "CAFI tokens approved. Proceeding to add funds.",
        })
      }

      const tx = await farmingContract.addRewardPoolFunds(amount)
      await tx.wait()
      toast({
        title: "Funds Added",
        description: `${addFundsAmount} CAFI added to the reward pool.`,
      })
      setAddFundsAmount("")
      refreshBalances() // Refresh to show updated pool balance
    } catch (error: any) {
      console.error("Error adding funds:", error)
      toast({
        title: "Add Funds Failed",
        description: error.message || "Failed to add funds to reward pool.",
        variant: "destructive",
      })
    } finally {
      setIsAddingFunds(false)
    }
  }

  useEffect(() => {
    const fetchFarmingStats = async () => {
      if (farmingContract) {
        try {
          const [rate, poolBalance, staked] = await Promise.all([
            farmingContract.getRewardRate(),
            farmingContract.rewardPoolBalance(),
            farmingContract.totalStaked(),
          ])
          setCurrentRewardRate(formatEther(rate))
          setRewardPoolBalance(formatEther(poolBalance))
          setTotalStaked(formatEther(staked))
        } catch (error) {
          console.error("Error fetching farming stats:", error)
          setCurrentRewardRate("Error")
          setRewardPoolBalance("Error")
          setTotalStaked("Error")
          toast({
            title: "Error",
            description: "Failed to fetch farming statistics.",
            variant: "destructive",
          })
        }
      }
    }
    fetchFarmingStats()
  }, [farmingContract, isRefreshing, toast])

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Farming Pool Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">You do not have admin privileges to view this section.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">Farming Management</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isLoadingPackages || isLoading}
            className="flex items-center gap-1 bg-transparent"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant={contractPaused ? "default" : "destructive"}
            size="sm"
            onClick={togglePause}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            {contractPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {contractPaused ? "Unpause" : "Pause"}
          </Button>
        </div>
      </div>

      {contractPaused && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The farming contract is currently paused. Some functions may not be available.
          </AlertDescription>
        </Alert>
      )}

      <TransactionStatus status={txStatus} hash={txHash} message={txMessage} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create New Package */}
        <div className="lg:col-span-2">
          <Card className="gradient-card card-hover border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-slate-900 dark:text-slate-50">Create New Farming Package</CardTitle>
              </div>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Configure a new farming package with custom parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="stakeToken" className="text-slate-700 dark:text-slate-300">
                    Stake Token Address
                  </Label>
                  <Input
                    id="stakeToken"
                    value={newPackage.stakeToken}
                    onChange={(e) => setNewPackage({ ...newPackage, stakeToken: e.target.value })}
                    className="border-slate-200 dark:border-slate-700"
                    placeholder="0x..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="duration" className="text-slate-700 dark:text-slate-300">
                    Lock Duration (Days)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newPackage.duration}
                    onChange={(e) => setNewPackage({ ...newPackage, duration: e.target.value })}
                    className="border-slate-200 dark:border-slate-700"
                    min="1"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apyBps" className="text-slate-700 dark:text-slate-300">
                    APY (Basis Points)
                  </Label>
                  <Input
                    id="apyBps"
                    type="number"
                    value={newPackage.apyBps}
                    onChange={(e) => setNewPackage({ ...newPackage, apyBps: e.target.value })}
                    className="border-slate-200 dark:border-slate-700"
                    placeholder="500 = 5%"
                    min="0"
                  />
                  <p className="text-xs text-slate-500">Current: {(Number(newPackage.apyBps) / 100).toFixed(1)}%</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="minStake" className="text-slate-700 dark:text-slate-300">
                    Minimum Stake ({tokenSymbol})
                  </Label>
                  <Input
                    id="minStake"
                    type="number"
                    value={newPackage.minStake}
                    onChange={(e) => setNewPackage({ ...newPackage, minStake: e.target.value })}
                    className="border-slate-200 dark:border-slate-700"
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={createNewPackage}
                disabled={!isConnected || isLoading || contractPaused}
                className="w-full btn-green"
              >
                {isLoading ? "Creating..." : "Create Package"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Contract Information */}
        <div className="space-y-6">
          <Card className="gradient-card card-hover border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Sprout className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-slate-900 dark:text-slate-50">Contract Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Fee Pool Balance</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    {isLoadingPackages ? (
                      <div className="animate-pulse h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    ) : (
                      `${Number.parseFloat(feePoolBalance).toFixed(4)} ${tokenSymbol}`
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Auto Compound Fee</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {Number(autoCompoundFeeBps) / 100}%
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Contract Status</div>
                  <div className={`text-lg font-bold ${contractPaused ? "text-red-600" : "text-green-600"}`}>
                    {contractPaused ? "Paused" : "Active"}
                  </div>
                </div>

                <Button
                  onClick={withdrawFees}
                  disabled={isLoading || Number.parseFloat(feePoolBalance) <= 0}
                  className="w-full bg-transparent"
                  variant="outline"
                >
                  Withdraw Fees
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fee Management */}
          <Card className="gradient-card border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <CardTitle className="text-slate-900 dark:text-slate-50">Fee Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">New Fee (Basis Points)</Label>
                <Input
                  type="number"
                  value={newFeeBps}
                  onChange={(e) => setNewFeeBps(e.target.value)}
                  placeholder="100 = 1%"
                  min="0"
                  max="1000"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">New Fee Collector</Label>
                <Input
                  value={newFeeCollector}
                  onChange={(e) => setNewFeeCollector(e.target.value)}
                  placeholder="0x..."
                />
              </div>

              <Button
                onClick={updateFeeParameters}
                disabled={!newFeeBps || !newFeeCollector || isLoading || contractPaused}
                className="w-full bg-transparent"
                variant="outline"
              >
                Update Fee Parameters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Farming Pool Statistics */}
        <Card className="gradient-card border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Farming Pool Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label>Current Reward Rate</Label>
              <p className="text-lg font-bold">{currentRewardRate} CAFI/block</p>
            </div>
            <div>
              <Label>Reward Pool Balance</Label>
              <p className="text-lg font-bold">{rewardPoolBalance} CAFI</p>
            </div>
            <div>
              <Label>Total Staked in Farm</Label>
              <p className="text-lg font-bold">{totalStaked} CAFI</p>
            </div>
          </CardContent>
        </Card>

        {/* Update Reward Rate */}
        <Card className="gradient-card border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Update Reward Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-reward-rate">New Reward Rate (CAFI/block)</Label>
              <Input
                id="new-reward-rate"
                type="number"
                placeholder="e.g., 0.001"
                value={newRewardRate}
                onChange={(e) => setNewRewardRate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleUpdateRewardRate} disabled={isUpdatingRate || !newRewardRate}>
              {isUpdatingRate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Rate
            </Button>
          </CardContent>
        </Card>

        {/* Add Funds to Reward Pool */}
        <Card className="gradient-card border-slate-200 dark:border-slate-700 md:col-span-2">
          <CardHeader>
            <CardTitle>Add Funds to Reward Pool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="add-funds-amount">Amount to Add (CAFI)</Label>
              <Input
                id="add-funds-amount"
                type="number"
                placeholder="e.g., 1000"
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleAddFunds} disabled={isAddingFunds || !addFundsAmount}>
              {isAddingFunds && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Funds
            </Button>
          </CardContent>
        </Card>

        {/* Existing Packages */}
        <Card className="gradient-card border-slate-200 dark:border-slate-700 md:col-span-2">
          <CardHeader>
            <CardTitle>Existing Farming Packages</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Manage existing farming packages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPackages ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No farming packages found. Create your first package above.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg, index) => (
                  <Card key={index} className="border border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Package #{index}</CardTitle>
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Duration:</span>
                          <span className="font-medium">{Number(pkg.lockDuration) / 86400} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">APY:</span>
                          <span className="font-medium">{Number(pkg.apyBps) / 100}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Min Stake:</span>
                          <span className="font-medium">
                            {Number.parseFloat(contractService.formatTokenAmount(pkg.minimumStakeAmount)).toFixed(0)}{" "}
                            {tokenSymbol}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="New APY (bps)"
                            className="text-sm"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                const target = e.target as HTMLInputElement
                                updatePackageAPY(index, target.value)
                                target.value = ""
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              const input = e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement
                              if (input?.value) {
                                updatePackageAPY(index, input.value)
                                input.value = ""
                              }
                            }}
                            disabled={isLoading || contractPaused}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          variant={pkg.isActive ? "destructive" : "default"}
                          onClick={() => updatePackageStatus(index, !pkg.isActive)}
                          disabled={isLoading || contractPaused}
                          className="w-full"
                        >
                          {pkg.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        .gradient-card {
          background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8));
        }
        .dark .gradient-card {
          background: linear-gradient(to bottom right, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.8));
        }
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .dark .card-hover:hover {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
        }
        .btn-green {
          background-color: #10b981;
          color: white;
        }
        .btn-green:hover {
          background-color: #059669;
        }
        .dark .btn-green {
          background-color: #059669;
        }
        .dark .btn-green:hover {
          background-color: #047857;
        }
      `}</style>
    </div>
  )
}
