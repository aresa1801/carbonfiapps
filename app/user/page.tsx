"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TransactionStatus } from "@/components/transaction-status"
import { useToast } from "@/hooks/use-toast"
import { contractService } from "@/lib/contract-utils"
import {
  Wallet,
  Coins,
  Droplets,
  TrendingUp,
  Leaf,
  Recycle,
  ShoppingCart,
  PlusCircle,
  Target,
  Award,
  RefreshCw,
} from "lucide-react"

export default function UserDashboard() {
  const {
    account,
    isConnected,
    balance,
    ethBalance,
    tokenSymbol,
    refreshBalances,
    faucetContractExists,
    stakingContractExists,
    farmingContractExists,
    nftContractExists,
    marketplaceContractExists,
  } = useWeb3()

  const { toast } = useToast()

  const [faucetStats, setFaucetStats] = useState({
    totalSupply: "0",
    remainingQuota: "0",
    dailyLimit: "0",
    hasClaimedToday: false,
  })

  const [stakingStats, setStakingStats] = useState({
    totalStaked: "0",
    rewardPool: "0",
    userStakes: 0,
  })

  const [farmingStats, setFarmingStats] = useState({
    totalFarms: 0,
    userFarms: 0,
    totalRewards: "0",
  })

  const [nftStats, setNftStats] = useState({
    totalMinted: 0,
    userNFTs: 0,
    totalRetired: 0,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [txStatus, setTxStatus] = useState<{
    hash: string
    status: "pending" | "success" | "error"
    message: string
  } | null>(null)

  // Load dashboard data
  useEffect(() => {
    if (isConnected && account) {
      loadDashboardData()
    }
  }, [isConnected, account])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([loadFaucetStats(), loadStakingStats(), loadFarmingStats(), loadNFTStats()])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const loadFaucetStats = async () => {
    if (!faucetContractExists) return

    try {
      const faucetContract = await contractService.getFaucetContract()
      const [totalSupply, remainingQuota, dailyLimit, hasClaimedToday] = await Promise.all([
        faucetContract.totalSupply().catch(() => "0"),
        faucetContract.getRemainingQuota().catch(() => "0"),
        faucetContract.DAILY_LIMIT().catch(() => "0"),
        account ? faucetContract.hasClaimedToday(account).catch(() => false) : false,
      ])

      setFaucetStats({
        totalSupply: contractService.formatTokenAmount(totalSupply),
        remainingQuota: contractService.formatTokenAmount(remainingQuota),
        dailyLimit: contractService.formatTokenAmount(dailyLimit),
        hasClaimedToday,
      })
    } catch (error) {
      console.error("Error loading faucet stats:", error)
    }
  }

  const loadStakingStats = async () => {
    if (!stakingContractExists) return

    try {
      const stakingContract = await contractService.getStakingContract()
      const [totalStaked, rewardPool] = await Promise.all([
        stakingContract.totalStaked().catch(() => "0"),
        stakingContract.getRewardPoolBalance().catch(() => stakingContract.rewardPoolBalance().catch(() => "0")),
      ])

      let userStakes = 0
      if (account) {
        try {
          const stakes = await stakingContract.getActiveStakes(account)
          userStakes = stakes.length
        } catch (error) {
          console.log("Could not get user stakes")
        }
      }

      setStakingStats({
        totalStaked: contractService.formatTokenAmount(totalStaked),
        rewardPool: contractService.formatTokenAmount(rewardPool),
        userStakes,
      })
    } catch (error) {
      console.error("Error loading staking stats:", error)
    }
  }

  const loadFarmingStats = async () => {
    if (!farmingContractExists) return

    try {
      const farmingContract = await contractService.getFarmingContract()
      let userFarms = 0

      if (account) {
        try {
          const stakes = await farmingContract.getUserStakes(account)
          userFarms = stakes.length
        } catch (error) {
          console.log("Could not get user farms")
        }
      }

      setFarmingStats({
        totalFarms: 3, // Default number of farm packages
        userFarms,
        totalRewards: "0",
      })
    } catch (error) {
      console.error("Error loading farming stats:", error)
    }
  }

  const loadNFTStats = async () => {
    if (!nftContractExists) return

    try {
      const nftContract = await contractService.getNftContract()
      let totalMinted = 0
      let userNFTs = 0

      try {
        totalMinted = await nftContract.getCurrentTokenId()
      } catch (error) {
        console.log("Could not get total minted")
      }

      if (account) {
        try {
          // Check user's NFT balance for existing tokens
          for (let tokenId = 1; tokenId <= Math.min(totalMinted, 50); tokenId++) {
            try {
              const balance = await nftContract.balanceOf(account, tokenId)
              if (balance > 0) {
                userNFTs++
              }
            } catch (error) {
              continue
            }
          }
        } catch (error) {
          console.log("Could not get user NFTs")
        }
      }

      setNftStats({
        totalMinted,
        userNFTs,
        totalRetired: 0, // This would need to be tracked separately
      })
    } catch (error) {
      console.error("Error loading NFT stats:", error)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    Promise.all([refreshBalances(), loadDashboardData()])
  }

  const quickActions = [
    {
      title: "Claim Tokens",
      description: "Get free CAFI tokens",
      icon: Droplets,
      href: "/user/faucet",
      color: "blue",
      available: faucetContractExists,
    },
    {
      title: "Stake Tokens",
      description: "Earn rewards by staking",
      icon: TrendingUp,
      href: "/user/staking",
      color: "green",
      available: stakingContractExists,
    },
    {
      title: "Yield Farming",
      description: "Farm tokens for rewards",
      icon: Leaf,
      href: "/user/farming",
      color: "emerald",
      available: farmingContractExists,
    },
    {
      title: "Mint NFT",
      description: "Create carbon credit NFTs",
      icon: PlusCircle,
      href: "/user/mint-nft",
      color: "purple",
      available: nftContractExists,
    },
    {
      title: "Marketplace",
      description: "Buy and sell NFTs",
      icon: ShoppingCart,
      href: "/user/marketplace",
      color: "orange",
      available: marketplaceContractExists,
    },
    {
      title: "Retire Credits",
      description: "Offset your carbon footprint",
      icon: Recycle,
      href: "/user/retire",
      color: "red",
      available: nftContractExists,
    },
  ]

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <Card className="group overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 hover:scale-[1.02]">
          <CardContent className="flex flex-col items-center justify-center py-12 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Wallet className="h-12 w-12 text-blue-400 mb-4 group-hover:text-blue-300 group-hover:scale-110 transition-all duration-300" />
            <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-blue-300 transition-colors duration-300">
              Connect Your Wallet
            </h3>
            <p className="text-gray-400 text-center group-hover:text-gray-300 transition-colors duration-300">
              Please connect your wallet to access the CarbonFi dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome to CarbonFi - Your Carbon Credit Platform</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="group overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 border-blue-700 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 hover:scale-[1.02]">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative z-10">
              <div className="text-sm font-medium text-blue-300 group-hover:text-blue-200 transition-colors duration-300">
                ETH Balance
              </div>
              <Wallet className="h-5 w-5 text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all duration-300" />
            </div>
            <div className="mt-2 flex items-center">
              <div className="text-2xl font-bold text-white group-hover:text-blue-100 transition-colors duration-300">
                {ethBalance} ETH
              </div>
            </div>
            <div className="mt-1 text-xs text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
              Network currency
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 border-emerald-700 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 hover:scale-[1.02]">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative z-10">
              <div className="text-sm font-medium text-emerald-300 group-hover:text-emerald-200 transition-colors duration-300">
                CAFI Balance
              </div>
              <Coins className="h-5 w-5 text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 transition-all duration-300" />
            </div>
            <div className="mt-2 flex items-center">
              <div className="text-2xl font-bold text-white group-hover:text-emerald-100 transition-colors duration-300">
                {balance} {tokenSymbol}
              </div>
            </div>
            <div className="mt-1 text-xs text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">
              Platform token
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 border-purple-700 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2 hover:scale-[1.02]">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-purple-300 group-hover:text-purple-200 transition-colors duration-300">
                  Total Staked
                </p>
                <p className="text-2xl font-bold text-white group-hover:text-purple-100 transition-colors duration-300">
                  {stakingStats.totalStaked}
                </p>
                <p className="text-xs text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                  {tokenSymbol} tokens
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-all duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden bg-gradient-to-br from-orange-900 via-orange-800 to-orange-900 border-orange-700 hover:border-orange-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2 hover:scale-[1.02]">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-orange-300 group-hover:text-orange-200 transition-colors duration-300">
                  Your NFTs
                </p>
                <p className="text-2xl font-bold text-white group-hover:text-orange-100 transition-colors duration-300">
                  {nftStats.userNFTs}
                </p>
                <p className="text-xs text-orange-400 group-hover:text-orange-300 transition-colors duration-300">
                  Carbon credits
                </p>
              </div>
              <Award className="h-8 w-8 text-orange-400 group-hover:text-orange-300 group-hover:scale-110 transition-all duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 border-green-700 hover:border-green-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-2 hover:scale-[1.02]">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-green-300 group-hover:text-green-200 transition-colors duration-300">
                  Active Farms
                </p>
                <p className="text-2xl font-bold text-white group-hover:text-green-100 transition-colors duration-300">
                  {farmingStats.userFarms}
                </p>
                <p className="text-xs text-green-400 group-hover:text-green-300 transition-colors duration-300">
                  Farming positions
                </p>
              </div>
              <Leaf className="h-8 w-8 text-green-400 group-hover:text-green-300 group-hover:scale-110 transition-all duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-900 border-red-700 hover:border-red-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20 hover:-translate-y-2 hover:scale-[1.02]">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-red-300 group-hover:text-red-200 transition-colors duration-300">
                  Your Stakes
                </p>
                <p className="text-2xl font-bold text-white group-hover:text-red-100 transition-colors duration-300">
                  {stakingStats.userStakes}
                </p>
                <p className="text-xs text-red-400 group-hover:text-red-300 transition-colors duration-300">
                  Active positions
                </p>
              </div>
              <Target className="h-8 w-8 text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-all duration-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="group overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 hover:border-gray-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-500/20 hover:-translate-y-1 hover:scale-[1.01]">
        <CardHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-gray-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardTitle className="text-white group-hover:text-gray-200 transition-colors duration-300 relative z-10">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 relative z-10">
            Access key features of the CarbonFi platform
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              const colorClasses = {
                blue: "from-blue-900 to-blue-800 border-blue-700 hover:border-blue-500/50 hover:shadow-blue-500/20",
                green:
                  "from-green-900 to-green-800 border-green-700 hover:border-green-500/50 hover:shadow-green-500/20",
                emerald:
                  "from-emerald-900 to-emerald-800 border-emerald-700 hover:border-emerald-500/50 hover:shadow-emerald-500/20",
                purple:
                  "from-purple-900 to-purple-800 border-purple-700 hover:border-purple-500/50 hover:shadow-purple-500/20",
                orange:
                  "from-orange-900 to-orange-800 border-orange-700 hover:border-orange-500/50 hover:shadow-orange-500/20",
                red: "from-red-900 to-red-800 border-red-700 hover:border-red-500/50 hover:shadow-red-500/20",
              }

              return (
                <Card
                  key={index}
                  className={`group/action overflow-hidden bg-gradient-to-br ${colorClasses[action.color as keyof typeof colorClasses]} transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] cursor-pointer ${
                    !action.available ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => action.available && (window.location.href = action.href)}
                >
                  <CardContent className="p-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 opacity-0 group-hover/action:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center space-x-3 relative z-10">
                      <div className="p-2 rounded-lg bg-white/10 group-hover/action:bg-white/20 transition-colors duration-300">
                        <Icon className="h-5 w-5 text-white group-hover/action:scale-110 transition-transform duration-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover/action:text-gray-100 transition-colors duration-300">
                          {action.title}
                        </h3>
                        <p className="text-xs text-gray-300 group-hover/action:text-gray-200 transition-colors duration-300">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    {!action.available && (
                      <Badge variant="secondary" className="absolute top-2 right-2 bg-gray-700 text-gray-300 text-xs">
                        Unavailable
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Status */}
      {txStatus && (
        <TransactionStatus
          hash={txStatus.hash}
          status={txStatus.status}
          message={txStatus.message}
          onClose={() => setTxStatus(null)}
        />
      )}
    </div>
  )
}
