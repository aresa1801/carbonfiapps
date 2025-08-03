"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { Settings, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function TokenConfig() {
  const { CAFI_TOKEN_ADDRESS, cafiTokenExists } = useWeb3()
  const [tokenAddress, setTokenAddress] = useState(CAFI_TOKEN_ADDRESS)
  const { toast } = useToast()

  const handleSave = () => {
    // In a real implementation, you would save this to localStorage or a config file
    toast({
      title: "Configuration saved",
      description: "CAFI token address has been updated. Please refresh the page.",
    })
  }

  return (
    <Card className="gradient-card border-slate-200 dark:border-slate-700">
      <CardHeader>
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <CardTitle className="text-slate-900 dark:text-slate-50">Token Configuration</CardTitle>
        </div>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Configure the CAFI token contract address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="tokenAddress" className="text-slate-700 dark:text-slate-300">
            CAFI Token Contract Address
          </Label>
          <Input
            id="tokenAddress"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            className="border-slate-200 dark:border-slate-700 focus:border-slate-500 dark:focus:border-slate-400"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter the contract address of the CAFI token on your current network
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Current Status</div>
          <div
            className={`text-sm ${cafiTokenExists ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}
          >
            {cafiTokenExists ? "✓ Token contract found and accessible" : "⚠ Token contract not found - using mock data"}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full" variant="outline">
          <Save className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  )
}
