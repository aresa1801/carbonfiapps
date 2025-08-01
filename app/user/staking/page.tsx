"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useWeb3 } from "@/components/web3-provider"
import { TransactionStatus } from "@/components/transaction-status"
import { useToast } from "@/components/ui/use-toast"
import { Landmark, TrendingUp, Settings, CheckCircle2, XCircle, Coins, Zap, RefreshCw } from "lucide-react"
import type { StakeInfo } from "@/lib/contract-utils"
import { contractService, CONTRACT_ADDRESSES } from "@/lib/contract-utils"

export default function StakingPage() {
  const { account, isConnected, balance, tokenSymbol, stakingContractExists, STAKING_CONTRACT_ADDRESS, tokenDecimals } =
    useWeb3()

  const [amount, setAmount] = useState("")
  const [packageId, setPackageId] = useState("0")
  const [autoStake, setAutoStake] = useState(false)
  const [rewardPool, setRewardPool] = useState("0")
  const [totalStaked, setTotalStaked] = useState("0")
  const [userStakes, setUserStakes] = useState<StakeInfo[]>([])
  const [txStatus, setTxStatus] = useState<"loading" | "success" | "error" | null>(null)
  const [txHash, setTxHash] = useState("")
  const [txMessage, setTxMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPoolData, setIsLoadingPoolData] = useState(false)
  const [stakingPackages, setStakingPackages] = useState([
    { id: "0", name: "30 Days", apy: "5%", lockPeriod: "30" },
    { id: "1", name: "90 Days", apy: "10%", lockPeriod: "90" },
    { id: "2", name: "180 Days", apy: "15%", lockPeriod: "180" },
  ])
  const { toast } = useToast()

  useEffect(() => {
    if (isConnected && account) {
      console.log("Staking page: Connected with account", account)
      console.log("Staking contract exists:", stakingContractExists)
      console.log("Staking contract address:", STAKING_CONTRACT_ADDRESS)

      // Check if staking contract exists
      const checkStakingContract = async () => {
        try {
          const exists = await contractService.contractExists(CONTRACT_ADDRESSES.STAKING)
          console.log("Staking contract exists (checked from page):", exists)

          if (exists) {
            loadStakingData()
            loadUserStakes()
            loadStakingPackages()
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

      checkStakingContract()

      // Set up auto-refresh interval
      const intervalId = setInterval(() => {
        loadStakingData()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(intervalId)
    }
  }, [isConnected, stakingContractExists, account])

  const loadStakingData = async () => {
    try {
      setIsLoadingPoolData(true)
      console.log("Loading staking pool data...")

      // Use contractService directly to get the staking contract
      const stakingContract = await contractService.getStakingContract()
      console.log("Staking contract instance created successfully")

      // Get reward pool balance and total staked amount using the new methods
      try {
        // Use the new getRewardPoolBalance method
        const poolBalance = await stakingContract.getRewardPoolBalance()
        const formattedPoolBalance = contractService.formatTokenAmount(poolBalance)
        console.log("Reward pool balance:", formattedPoolBalance)
        setRewardPool(Number.parseFloat(formattedPoolBalance).toFixed(4))
      } catch (error) {
        console.error("Error getting reward pool balance:", error)

        // Fallback to the old method if the new one fails
        try {
          const poolBalance = await stakingContract.rewardPoolBalance()
          const formattedPoolBalance = contractService.formatTokenAmount(poolBalance)
          console.log("Reward pool balance (fallback):", formattedPoolBalance)
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

  const loadUserStakes = async () => {
    try {
      if (account) {
        console.log("Loading user stakes for account:", account)

        // Use contractService to get the staking contract
        const stakingContract = await contractService.getStakingContract()

        // Get active stakes for the current account
        const stakes = await stakingContract.getActiveStakes(account)
        console.log("User stakes loaded:", stakes)

        setUserStakes(stakes)
      }
    } catch (error) {
      console.error("Error loading user stakes:", error)
      toast({
        title: "Error loading stakes",
        description: "Failed to load your staking information. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadStakingPackages = async () => {
    try {
      console.log("Loading staking packages...")

      // Use contractService to get the staking contract
      const stakingContract = await contractService.getStakingContract()

      // Load APY rates and lock periods from contract
      const packages = await Promise.all(
        stakingPackages.map(async (pkg, index) => {
          try {
            // Get APY rates and lock periods for each package
            const [apy, lockPeriod] = await Promise.all([
              stakingContract.apyRates(index),
              stakingContract
                .getLockPeriod(index)
                .catch(() => stakingContract.lockPeriods(index)), // Try new method first, fall back to old
            ])

            // Format APY from basis points to percentage (500 basis points = 5%)
            const apyFormatted = (Number(apy) / 100).toFixed(1)

            // Convert lock period from seconds to days
            const lockPeriodDays = (Number(lockPeriod) / 86400).toString()

            console.log(`Package ${index}: APY=${apyFormatted}%, Lock Period=${lockPeriodDays} days`)

            return {
              ...pkg,
              apy: `${apyFormatted}%`,
              lockPeriod: lockPeriodDays,
            }
          } catch (error) {
            console.error(`Error loading package ${index}:`, error)
            return pkg // Return default if error
          }
        }),
      )

      setStakingPackages(packages)
    } catch (error) {
      console.error("Error loading staking packages:", error)
    }
  }

  const stakeTokens = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to stake tokens",
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

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to stake",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(amount) > Number.parseFloat(balance)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough tokens to stake",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage(`Staking ${amount} ${tokenSymbol} tokens...`)

      // Get the staking contract using contractService
      // Corrected: Pass STAKING_CONTRACT_ADDRESS as the first argument
      const stakingContract = await contractService.getStakingContract(STAKING_CONTRACT_ADDRESS, true)

      // Check allowance first using contractService
      const tokenContract = await contractService.getTokenContract(CONTRACT_ADDRESSES.CAFI_TOKEN, true)
      const allowance = await tokenContract.allowance(account, STAKING_CONTRACT_ADDRESS)
      const amountInWei = contractService.parseTokenAmount(amount)

      if (allowance < amountInWei) {
        setTxMessage("Approving tokens for staking...")
        console.log(`Approving ${amount} tokens for staking contract: ${STAKING_CONTRACT_ADDRESS}`)

        const approveTx = await tokenContract.approve(STAKING_CONTRACT_ADDRESS, amountInWei)
        setTxHash(approveTx.hash)
        await approveTx.wait()

        setTxMessage("Approval confirmed. Now staking tokens...")
      }

      // Stake tokens
      console.log(`Staking ${amount} tokens with package ID ${packageId} and autoStake=${autoStake}`)
      const tx = await stakingContract.stake(amountInWei, Number.parseInt(packageId), autoStake)
      setTxHash(tx.hash)
      await tx.wait()

      setTxStatus("success")
      setTxMessage(`Successfully staked ${amount} ${tokenSymbol} tokens!`)

      // Refresh data
      await Promise.all([loadStakingData(), loadUserStakes()])

      toast({
        title: "Tokens staked",
        description: `You have successfully staked ${amount} ${tokenSymbol} tokens`,
      })

      // Reset form
      setAmount("")
    } catch (error: any) {
      console.error("Error staking tokens:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to stake tokens")

      toast({
        title: "Failed to stake tokens",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const claimReward = async (stakeIndex: number) => {
    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage("Claiming rewards...")

      // Get the staking contract using contractService
      // Corrected: Pass STAKING_CONTRACT_ADDRESS as the first argument
      const stakingContract = await contractService.getStakingContract(STAKING_CONTRACT_ADDRESS, true)

      console.log(`Claiming reward for stake index ${stakeIndex}`)
      const tx = await stakingContract.claimReward(stakeIndex)
      setTxHash(tx.hash)
      await tx.wait()

      setTxStatus("success")
      setTxMessage("Successfully claimed rewards!")

      await Promise.all([loadStakingData(), loadUserStakes()])

      toast({
        title: "Rewards claimed",
        description: "Your rewards have been claimed successfully",
      })
    } catch (error: any) {
      console.error("Error claiming rewards:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to claim rewards")

      toast({
        title: "Failed to claim rewards",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const compoundReward = async (stakeIndex: number) => {
    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage("Compounding rewards...")

      // Get the staking contract using contractService
      // Corrected: Pass STAKING_CONTRACT_ADDRESS as the first argument
      const stakingContract = await contractService.getStakingContract(STAKING_CONTRACT_ADDRESS, true)

      console.log(`Compounding reward for stake index ${stakeIndex}`)
      const tx = await stakingContract.compoundReward(stakeIndex)
      setTxHash(tx.hash)
      await tx.wait()

      setTxStatus("success")
      setTxMessage("Successfully compounded rewards!")

      await Promise.all([loadStakingData(), loadUserStakes()])

      toast({
        title: "Rewards compounded",
        description: "Your rewards have been compounded successfully",
      })
    } catch (error: any) {
      console.error("Error compounding rewards:", error)
      setTxStatus("error")
      setTxMessage(error.message || "Failed to compound rewards")

      toast({
        title: "Failed to compound rewards",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const isStakeUnlocked = (unlockTime: bigint) => {
    return Date.now() / 1000 > Number(unlockTime)
  }

  const handleRefreshData = () => {
    loadStakingData()
    loadUserStakes()
    loadStakingPackages()

    toast({
      title: "Data refreshed",
      description: "Staking information has been updated",
    })
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-50">Token Staking</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshData}
          disabled={isLoadingPoolData || isLoading}
          className="flex items-center gap-1 bg-gray-800 border-gray-700 text-gray-50 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <TransactionStatus status={txStatus} hash={txHash} message={txMessage} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Staking Form */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-950 text-gray-50 border-emerald-800 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-900 rounded-lg">
                  <Landmark className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-gray-50">Stake {tokenSymbol} Tokens</CardTitle>
              </div>
              <CardDescription className="text-gray-300">Stake your tokens to earn rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount" className="text-gray-300">
                    Amount to Stake ({tokenSymbol})
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 focus:border-emerald-500"
                  />
                  <p className="text-sm text-gray-400">
                    Available: {balance} {tokenSymbol}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label className="text-gray-300">Staking Package</Label>
                  <RadioGroup value={packageId} onValueChange={setPackageId}>
                    {stakingPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center space-x-2 p-3 border rounded-lg border-gray-700 bg-gray-800"
                      >
                        <RadioGroupItem value={pkg.id} id={`package-${pkg.id}`} className="text-emerald-500" />
                        <Label
                          htmlFor={`package-${pkg.id}`}
                          className="flex justify-between w-full cursor-pointer text-gray-50"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{pkg.name}</span>
                            <span className="text-sm text-gray-400">{pkg.lockPeriod} days lock period</span>
                          </div>
                          <Badge variant="secondary" className="bg-emerald-900 text-emerald-200">
                            {pkg.apy} APY
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-stake"
                    checked={autoStake}
                    onCheckedChange={setAutoStake}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-700"
                  />
                  <Label htmlFor="auto-stake" className="text-gray-300">
                    Enable Auto-Staking
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={stakeTokens}
                disabled={
                  !isConnected ||
                  !amount ||
                  Number.parseFloat(amount) <= 0 ||
                  Number.parseFloat(amount) > Number.parseFloat(balance) ||
                  isLoading
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isLoading ? "Processing..." : `Stake ${tokenSymbol} Tokens`}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Staking Information */}
        <div className="space-y-6">
          <Card className="bg-gray-950 text-gray-50 border-emerald-800 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-900 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-gray-50">Pool Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="text-sm font-medium text-gray-400 mb-1">Reward Pool</div>
                  <div className="text-xl md:text-2xl font-bold text-gray-50">
                    {isLoadingPoolData ? (
                      <div className="animate-pulse h-6 md:h-8 w-20 md:w-24 bg-gray-700 rounded"></div>
                    ) : (
                      `${rewardPool} ${tokenSymbol}`
                    )}
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="text-sm font-medium text-gray-400 mb-1">Total Staked</div>
                  <div className="text-xl md:text-2xl font-bold text-gray-50">
                    {isLoadingPoolData ? (
                      <div className="animate-pulse h-6 md:h-8 w-20 md:w-24 bg-gray-700 rounded"></div>
                    ) : (
                      `${totalStaked} ${tokenSymbol}`
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-950 text-gray-50 border-gray-800 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <Settings className="h-5 w-5 text-gray-400" />
                </div>
                <CardTitle className="text-gray-50">Contract Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Staking Contract:</span>
                  <div className="flex items-center space-x-1">
                    {stakingContractExists ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="font-mono text-xs text-gray-400">
                      {STAKING_CONTRACT_ADDRESS.substring(0, 10)}...
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Stakes */}
      {userStakes.length > 0 && (
        <Card className="bg-gray-950 text-gray-50 border-gray-800 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-50">Your Stakes</CardTitle>
            <CardDescription className="text-gray-300">Manage your active stakes and claim rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userStakes.map((stake, index) => (
                <Card key={index} className="bg-gray-900 border-gray-700 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-50">Stake #{index + 1}</CardTitle>
                      <Badge
                        variant={isStakeUnlocked(stake.unlockTime) ? "default" : "secondary"}
                        className={
                          isStakeUnlocked(stake.unlockTime) ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300"
                        }
                      >
                        {isStakeUnlocked(stake.unlockTime) ? "Unlocked" : "Locked"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Amount:</span>
                      <span className="font-medium">
                        {Number.parseFloat(contractService.formatTokenAmount(stake.amount, tokenDecimals)).toFixed(4)}{" "}
                        {tokenSymbol}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Staked:</span>
                      <span className="font-medium">{formatTimestamp(stake.stakeTime)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Unlock:</span>
                      <span className="font-medium">{formatTimestamp(stake.unlockTime)}</span>
                    </div>

                    {stake.autoStaking && (
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-400">Auto-staking enabled</span>
                      </div>
                    )}

                    {stake.compoundedAmount > 0n && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Compounded:</span>
                        <span className="font-medium text-emerald-400">
                          {Number.parseFloat(
                            contractService.formatTokenAmount(stake.compoundedAmount, tokenDecimals),
                          ).toFixed(4)}{" "}
                          {tokenSymbol}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                      {isStakeUnlocked(stake.unlockTime) && !stake.claimed && (
                        <Button
                          size="sm"
                          onClick={() => claimReward(index)}
                          disabled={isLoading}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Coins className="h-4 w-4 mr-1" />
                          Claim
                        </Button>
                      )}

                      {!isStakeUnlocked(stake.unlockTime) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => compoundReward(index)}
                          disabled={isLoading}
                          className="flex-1 bg-gray-800 border-gray-700 text-gray-50 hover:bg-gray-700"
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Compound
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <style jsx global>{`
        /* Remove old gradient styles if they conflict */
        .gradient-card {
          background: none !important;
        }
        .dark .gradient-card {
          background: none !important;
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
        .btn-emerald {
          background-color: #10b981;
          color: white;
        }
        .btn-emerald:hover {
          background-color: #059669;
        }
        .dark .btn-emerald {
          background-color: #059669;
        }
        .dark .btn-emerald:hover {
          background-color: #047857;
        }
      `}</style>
    </div>
  )
}
