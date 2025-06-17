"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { TransactionStatus } from "@/components/transaction-status"
import { useToast } from "@/components/ui/use-toast"
import { Coins, TrendingUp } from "lucide-react"
import { contractService } from "@/lib/contract-utils"

export default function FaucetManagementPage() {
  const {
    isConnected,
    isAdmin,
    account,
    tokenSymbol,
    faucetContractExists,
    FAUCET_CONTRACT_ADDRESS,
    approveTokens,
    checkAllowance,
  } = useWeb3()

  const [amount, setAmount] = useState("")
  const [remainingQuota, setRemainingQuota] = useState("9960000.0")
  const [dailyLimit, setDailyLimit] = useState("10000.0")
  const [todayTotal, setTodayTotal] = useState("20000.0")
  const [txStatus, setTxStatus] = useState(null)
  const [txHash, setTxHash] = useState("")
  const [txMessage, setTxMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isAdmin && faucetContractExists) {
      loadFaucetData()
    }
  }, [isAdmin, faucetContractExists])

  const loadFaucetData = async () => {
    try {
      if (!faucetContractExists) return

      const faucetContract = await contractService.getFaucetContract()

      const [quota, limit, total] = await Promise.all([
        faucetContract.getRemainingDailyQuota?.() || faucetContract.remainingDailyQuota?.() || "0",
        faucetContract.DAILY_LIMIT?.() || faucetContract.dailyLimit?.() || "0",
        faucetContract.todayTotal?.() || "0",
      ])

      setRemainingQuota(contractService.formatTokenAmount(quota))
      setDailyLimit(contractService.formatTokenAmount(limit))
      setTodayTotal(contractService.formatTokenAmount(total))

      console.log("Admin faucet data loaded:", { quota, limit, total })
    } catch (error) {
      console.error("Error loading faucet data:", error)
    }
  }

  const refillFaucet = async () => {
    if (!isConnected || !isAdmin) {
      toast({
        title: "Access denied",
        description: "Only admin wallets can refill the faucet",
        variant: "destructive",
      })
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to refill",
        variant: "destructive",
      })
      return
    }

    if (!FAUCET_CONTRACT_ADDRESS) {
      toast({
        title: "Contract error",
        description: "Faucet contract address not found",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setTxStatus("loading")
      setTxMessage("Refilling faucet...")

      // Check allowance first
      const allowance = await checkAllowance(account, FAUCET_CONTRACT_ADDRESS)
      const amountNum = Number.parseFloat(amount)
      const allowanceNum = Number.parseFloat(allowance)

      if (allowanceNum < amountNum) {
        setTxMessage("Approving tokens for faucet...")
        const approveTx = await approveTokens(FAUCET_CONTRACT_ADDRESS, amount)
        setTxHash(approveTx.hash)
        await approveTx.wait()
        setTxMessage("Tokens approved, now refilling faucet...")
      }

      // Get faucet contract with signer
      const faucetContract = await contractService.getFaucetContract(true)
      const amountInWei = contractService.parseTokenAmount(amount)

      // Try different method names for refilling
      let tx
      if (faucetContract.refillFaucet) {
        tx = await faucetContract.refillFaucet(amountInWei)
      } else if (faucetContract.addFunds) {
        tx = await faucetContract.addFunds(amountInWei)
      } else if (faucetContract.deposit) {
        tx = await faucetContract.deposit(amountInWei)
      } else {
        throw new Error("Refill method not found in faucet contract")
      }

      setTxHash(tx.hash)
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setTxStatus("success")
        setTxMessage("Successfully refilled faucet!")
        await loadFaucetData()
        toast({
          title: "Faucet refilled",
          description: `You have successfully added ${amount} ${tokenSymbol} tokens to the faucet`,
        })
        setAmount("")
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Error refilling faucet:", error)
      setTxStatus("error")
      let errorMessage = "Failed to refill faucet"
      if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient tokens or ETH for gas fees"
      } else if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user"
      } else if (error.message?.includes("Refill method not found")) {
        errorMessage = "Faucet contract does not support refill operation"
      }
      setTxMessage(errorMessage)
      toast({
        title: "Failed to refill faucet",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const withdrawExcess = async () => {
    if (!isConnected || !isAdmin) {
      toast({
        title: "Access denied",
        description: "Only admin wallets can withdraw excess funds",
        variant: "destructive",
      })
      return
    }

    try {
      setIsWithdrawing(true)
      setTxStatus("loading")
      setTxMessage("Withdrawing excess funds...")

      const faucetContract = await contractService.getFaucetContract(true)

      // Try different method names for withdrawal
      let tx
      if (faucetContract.withdrawExcess) {
        tx = await faucetContract.withdrawExcess()
      } else if (faucetContract.withdraw) {
        tx = await faucetContract.withdraw()
      } else if (faucetContract.emergencyWithdraw) {
        tx = await faucetContract.emergencyWithdraw()
      } else {
        throw new Error("Withdraw method not found in faucet contract")
      }

      setTxHash(tx.hash)
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setTxStatus("success")
        setTxMessage("Successfully withdrew excess funds!")
        await loadFaucetData()
        toast({
          title: "Excess withdrawn",
          description: "You have successfully withdrawn excess funds from the faucet",
        })
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Error withdrawing excess:", error)
      setTxStatus("error")
      let errorMessage = "Failed to withdraw excess funds"
      if (error.message?.includes("No excess")) {
        errorMessage = "No excess funds available to withdraw"
      } else if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user"
      } else if (error.message?.includes("Withdraw method not found")) {
        errorMessage = "Faucet contract does not support withdraw operation"
      }
      setTxMessage(errorMessage)
      toast({
        title: "Failed to withdraw excess",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const remainingPercentage = ((Number.parseFloat(remainingQuota) / Number.parseFloat(dailyLimit)) * 100).toFixed(1)
  const claimedPercentage = ((Number.parseFloat(todayTotal) / Number.parseFloat(dailyLimit)) * 100).toFixed(1)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">CarbonFi Faucet Management</h1>
        <div className="bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-700">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-sm font-medium text-emerald-300">
              Admin Access: {account ? `${account.substring(0, 6)}...${account.substring(38)}` : "Not Connected"}
            </span>
          </div>
        </div>
      </div>

      <TransactionStatus status={txStatus} hash={txHash} message={txMessage} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Refill Faucet Card */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-900/50 rounded-lg">
                  <Coins className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-slate-100">Refill Faucet</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Add CAFI tokens to the faucet for users to claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount" className="text-slate-300">
                    Amount to Add (CAFI)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">Enter the amount of CAFI tokens to add to the faucet</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={refillFaucet}
                    disabled={
                      !isConnected ||
                      !isAdmin ||
                      !amount ||
                      Number.parseFloat(amount) <= 0 ||
                      isLoading ||
                      !FAUCET_CONTRACT_ADDRESS
                    }
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isLoading ? "Refilling..." : "Refill Faucet"}
                  </Button>
                  <Button
                    onClick={withdrawExcess}
                    disabled={!isConnected || !isAdmin || isWithdrawing}
                    variant="outline"
                    className="border-orange-600 text-orange-400 hover:bg-orange-900/20"
                  >
                    {isWithdrawing ? "Withdrawing..." : "Withdraw Excess"}
                  </Button>
                </div>
                {!FAUCET_CONTRACT_ADDRESS && (
                  <div className="text-xs text-red-400 mt-2">⚠️ Faucet contract address not configured</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Faucet Statistics */}
        <div>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-900/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-slate-100">Faucet Statistics</CardTitle>
              </div>
              <CardDescription className="text-slate-400">Current faucet status and daily metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-medium text-slate-400 mb-2">Daily Limit</div>
                  <div className="text-2xl font-bold text-slate-100">{dailyLimit} CAFI</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-400 mb-2">Remaining Today</div>
                  <div className="text-2xl font-bold text-slate-100">{remainingQuota} CAFI</div>
                  <div className="text-xs text-slate-500 mt-1">{remainingPercentage}% remaining</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-400 mb-2">Claimed Today</div>
                  <div className="text-2xl font-bold text-slate-100">{todayTotal} CAFI</div>
                  <div className="text-xs text-slate-500 mt-1">{claimedPercentage}% of daily limit</div>
                </div>

                <div className="text-xs text-slate-500 mt-4">
                  <div>Faucet Address:</div>
                  <div className="font-mono text-slate-400 break-all">
                    {FAUCET_CONTRACT_ADDRESS || "Not configured"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
