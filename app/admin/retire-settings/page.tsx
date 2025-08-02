"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useWeb3 } from "@/components/web3-provider"
import { TransactionStatus } from "@/components/transaction-status"
import { useToast } from "@/hooks/use-toast"
import { Settings, Recycle, Clock, Leaf, Save, DollarSign, Shield, Users, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCarbonRetireContract } from "@/lib/contract-utils"

export default function RetireSettingsPage() {
  const { contract, isConnected, account, signer } = useWeb3()
  const [txStatus, setTxStatus] = useState(null)
  const [txHash, setTxHash] = useState("")
  const [txMessage, setTxMessage] = useState("")
  const { toast } = useToast()

  // Contract state
  const [contractData, setContractData] = useState({
    isRetireEnabled: true,
    minRetireAmount: "1",
    maxRetireAmount: "1000",
    retireFee: "0.5",
    cooldownPeriod: "7",
    totalRetired: "0",
    totalUsers: "0",
    contractBalance: "0",
  })

  // Form states
  const [minRetireAmount, setMinRetireAmount] = useState("1")
  const [maxRetireAmount, setMaxRetireAmount] = useState("1000")
  const [retireFee, setRetireFee] = useState("0.5")
  const [cooldownPeriod, setCooldownPeriod] = useState("7")
  const [isRetireEnabled, setIsRetireEnabled] = useState(true)
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("")
  const [emergencyPause, setEmergencyPause] = useState(false)

  // Load contract data
  useEffect(() => {
    if (isConnected && signer) {
      loadContractData()
    }
  }, [isConnected, signer])

  const loadContractData = async () => {
    try {
      const carbonRetireContract = getCarbonRetireContract(signer)

      // Load current settings from contract
      // In a real implementation, these would be actual contract calls
      const mockData = {
        isRetireEnabled: true,
        minRetireAmount: "1",
        maxRetireAmount: "1000",
        retireFee: "0.5",
        cooldownPeriod: "7",
        totalRetired: "1250.5",
        totalUsers: "89",
        contractBalance: "500.25",
      }

      setContractData(mockData)
      setMinRetireAmount(mockData.minRetireAmount)
      setMaxRetireAmount(mockData.maxRetireAmount)
      setRetireFee(mockData.retireFee)
      setCooldownPeriod(mockData.cooldownPeriod)
      setIsRetireEnabled(mockData.isRetireEnabled)
    } catch (error) {
      console.error("Error loading contract data:", error)
      toast({
        title: "Failed to load contract data",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const updateRetireSettings = async (settingType) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to update settings",
        variant: "destructive",
      })
      return
    }

    try {
      setTxStatus("loading")
      setTxMessage(`Updating ${settingType} settings...`)

      const carbonRetireContract = getCarbonRetireContract(signer)
      let tx

      switch (settingType) {
        case "limits":
          // tx = await carbonRetireContract.setRetireLimits(
          //   ethers.utils.parseEther(minRetireAmount),
          //   ethers.utils.parseEther(maxRetireAmount)
          // )
          break
        case "fees":
          // tx = await carbonRetireContract.setRetireFee(
          //   Math.floor(parseFloat(retireFee) * 100) // Convert to basis points
          // )
          break
        case "timing":
          // tx = await carbonRetireContract.setCooldownPeriod(
          //   parseInt(cooldownPeriod) * 24 * 60 * 60 // Convert days to seconds
          // )
          break
        case "beneficiary":
          // tx = await carbonRetireContract.setBeneficiary(beneficiaryAddress)
          break
      }

      // Simulate transaction for demo
      await new Promise((resolve) => setTimeout(resolve, 3000))
      const mockTxHash = "0x" + Math.random().toString(16).substr(2, 64)

      setTxHash(mockTxHash)
      setTxStatus("success")
      setTxMessage(`Successfully updated ${settingType} settings!`)

      // Reload contract data
      await loadContractData()

      toast({
        title: "Settings updated",
        description: `${settingType} settings have been successfully updated`,
      })
    } catch (error) {
      console.error(`Error updating ${settingType} settings:`, error)
      setTxStatus("error")
      setTxMessage(error.message)

      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const toggleRetireStatus = async () => {
    try {
      setTxStatus("loading")
      setTxMessage(`${isRetireEnabled ? "Disabling" : "Enabling"} retire functionality...`)

      const carbonRetireContract = getCarbonRetireContract(signer)
      // const tx = await carbonRetireContract.setRetireEnabled(!isRetireEnabled)

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 3000))
      const mockTxHash = "0x" + Math.random().toString(16).substr(2, 64)

      setTxHash(mockTxHash)
      setIsRetireEnabled(!isRetireEnabled)
      setTxStatus("success")
      setTxMessage(`Successfully ${isRetireEnabled ? "disabled" : "enabled"} retire functionality!`)

      toast({
        title: "Status updated",
        description: `Retire functionality is now ${!isRetireEnabled ? "enabled" : "disabled"}`,
      })
    } catch (error) {
      console.error("Error toggling retire status:", error)
      setTxStatus("error")
      setTxMessage(error.message)

      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const emergencyPauseContract = async () => {
    try {
      setTxStatus("loading")
      setTxMessage("Executing emergency pause...")

      const carbonRetireContract = getCarbonRetireContract(signer)
      // const tx = await carbonRetireContract.emergencyPause()

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const mockTxHash = "0x" + Math.random().toString(16).substr(2, 64)

      setTxHash(mockTxHash)
      setEmergencyPause(true)
      setTxStatus("success")
      setTxMessage("Emergency pause activated successfully!")

      toast({
        title: "Emergency pause activated",
        description: "All retire functions have been paused",
        variant: "destructive",
      })
    } catch (error) {
      console.error("Error executing emergency pause:", error)
      setTxStatus("error")
      setTxMessage(error.message)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6">
      {/* Header Section with Better Colors */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Retire Settings</h1>
          <p className="text-gray-400 mt-1">Configure and manage carbon credit retirement settings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge
            variant={isRetireEnabled ? "default" : "destructive"}
            className={`px-3 py-1 ${isRetireEnabled ? "bg-emerald-900/50 text-emerald-400 border-emerald-700/50" : "bg-red-900/50 text-red-400 border-red-700/50"}`}
          >
            <Recycle className="h-4 w-4 mr-1" />
            {isRetireEnabled ? "Retire Enabled" : "Retire Disabled"}
          </Badge>
          {emergencyPause && (
            <Badge variant="destructive" className="px-3 py-1 bg-red-900/50 text-red-400 border-red-700/50">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Emergency Pause
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-sm font-medium">Total Retired</p>
                <p className="text-2xl font-bold text-white">{contractData.totalRetired}</p>
                <p className="text-emerald-300 text-xs">tons CO₂</p>
              </div>
              <Leaf className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold text-white">{contractData.totalUsers}</p>
                <p className="text-blue-300 text-xs">participants</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Contract Balance</p>
                <p className="text-2xl font-bold text-white">{contractData.contractBalance}</p>
                <p className="text-purple-300 text-xs">CAFI tokens</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <TransactionStatus status={txStatus} hash={txHash} message={txMessage} />

      {/* Emergency Controls */}
      {!emergencyPause && (
        <Alert className="border-red-700 bg-red-900/20 text-red-300">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            <div className="flex items-center justify-between">
              <span>Emergency controls: Pause all retire functions immediately if needed</span>
              <Button
                onClick={emergencyPauseContract}
                variant="destructive"
                size="sm"
                disabled={!isConnected}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Shield className="mr-2 h-4 w-4" />
                Emergency Pause
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8 bg-gray-800 border border-gray-700">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 hover:text-white"
          >
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="limits"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 hover:text-white"
          >
            <Leaf className="mr-2 h-4 w-4" />
            Limits
          </TabsTrigger>
          <TabsTrigger
            value="fees"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 hover:text-white"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Fees
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 hover:text-white"
          >
            <Shield className="mr-2 h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                    <Settings className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Retire Status</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Enable or disable the retire functionality globally
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="retire-status" className="text-gray-300">
                    Retire Functionality
                  </Label>
                  <Switch
                    id="retire-status"
                    checked={isRetireEnabled}
                    onCheckedChange={setIsRetireEnabled}
                    disabled={emergencyPause}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  When disabled, users will not be able to retire carbon credits
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={toggleRetireStatus}
                  disabled={!isConnected || emergencyPause}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Status
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Beneficiary Settings</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Configure default beneficiary for retirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Label htmlFor="beneficiary" className="text-gray-300">
                    Default Beneficiary Address
                  </Label>
                  <Input
                    id="beneficiary"
                    placeholder="0x..."
                    value={beneficiaryAddress}
                    onChange={(e) => setBeneficiaryAddress(e.target.value)}
                    className="bg-gray-800 text-white border-gray-700 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-400">Address that will receive retired carbon credits by default</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => updateRetireSettings("beneficiary")}
                  disabled={!isConnected || !beneficiaryAddress}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Beneficiary
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="limits">
          <Card className="bg-gray-900 border border-gray-700">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-900/20 rounded-lg">
                  <Leaf className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-white">Retirement Limits</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Configure minimum and maximum retirement amounts per transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="min-retire" className="text-gray-300">
                    Minimum Retirement Amount (tons)
                  </Label>
                  <Input
                    id="min-retire"
                    type="number"
                    value={minRetireAmount}
                    onChange={(e) => setMinRetireAmount(e.target.value)}
                    className="bg-gray-800 text-white border-gray-700 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-400">
                    Minimum amount of carbon credits that can be retired in a single transaction
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="max-retire" className="text-gray-300">
                    Maximum Retirement Amount (tons)
                  </Label>
                  <Input
                    id="max-retire"
                    type="number"
                    value={maxRetireAmount}
                    onChange={(e) => setMaxRetireAmount(e.target.value)}
                    className="bg-gray-800 text-white border-gray-700 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-400">
                    Maximum amount of carbon credits that can be retired in a single transaction
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => updateRetireSettings("limits")}
                disabled={!isConnected}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Limit Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Retirement Fee</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Configure the fee charged for carbon credit retirement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Label htmlFor="retire-fee" className="text-gray-300">
                    Retirement Fee (%)
                  </Label>
                  <Input
                    id="retire-fee"
                    type="number"
                    step="0.1"
                    value={retireFee}
                    onChange={(e) => setRetireFee(e.target.value)}
                    className="bg-gray-800 text-white border-gray-700 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-400">Percentage fee charged for each retirement transaction</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => updateRetireSettings("fees")}
                  disabled={!isConnected}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Fee Settings
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                    <Clock className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Cooldown Period</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Configure the waiting period between retirement transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Label htmlFor="cooldown" className="text-gray-300">
                    Cooldown Period (days)
                  </Label>
                  <Input
                    id="cooldown"
                    type="number"
                    value={cooldownPeriod}
                    onChange={(e) => setCooldownPeriod(e.target.value)}
                    className="bg-gray-800 text-white border-gray-700 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-400">
                    Number of days users must wait between retirement transactions
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => updateRetireSettings("timing")}
                  disabled={!isConnected}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Timing Settings
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-6">
            <Alert className="border-yellow-700 bg-yellow-900/20 text-yellow-300">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                Advanced settings can significantly impact the contract behavior. Use with caution.
              </AlertDescription>
            </Alert>

            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-red-900/20 rounded-lg">
                    <Shield className="h-5 w-5 text-red-400" />
                  </div>
                  <CardTitle className="text-white">Emergency Controls</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Emergency functions for contract security and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-700 rounded-lg bg-red-900/20">
                    <div>
                      <h4 className="font-medium text-red-100">Emergency Pause</h4>
                      <p className="text-sm text-red-300">Immediately pause all contract functions</p>
                    </div>
                    <Button
                      onClick={emergencyPauseContract}
                      variant="destructive"
                      disabled={!isConnected || emergencyPause}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      {emergencyPause ? "Paused" : "Emergency Pause"}
                    </Button>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="grid gap-4">
                    <h4 className="font-medium text-white">Contract Information</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Contract Address:</span>
                        <span className="font-mono text-white">0x...{account?.substring(38)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Admin Address:</span>
                        <span className="font-mono text-white">
                          {account?.substring(0, 6)}...{account?.substring(38)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Contract Status:</span>
                        <Badge
                          variant={emergencyPause ? "destructive" : "default"}
                          className={`${emergencyPause ? "bg-red-900/50 text-red-400 border-red-700/50" : "bg-emerald-900/50 text-emerald-400 border-emerald-700/50"}`}
                        >
                          {emergencyPause ? "Paused" : "Active"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
