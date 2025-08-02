"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Copy, Check, ExternalLink, Settings } from "lucide-react"
import { CONTRACT_ADDRESSES } from "@/lib/constants"
import { contractService } from "@/services/contract-service"
import { useToast } from "@/hooks/use-toast"

export function ContractAddressesDisplay() {
  const [copiedAddress, setCopiedAddress] = useState<string>("")
  const [contractsStatus, setContractsStatus] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    checkContractsStatus()
  }, [])

  const checkContractsStatus = async () => {
    setIsLoading(true)
    const status: Record<string, boolean> = {}

    try {
      for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
        if (name !== "ADMIN") {
          status[name] = await contractService.contractExists(address)
        }
      }
      setContractsStatus(status)
    } catch (error) {
      console.error("Error checking contracts status:", error)
      toast({
        title: "Error",
        description: "Failed to check contract deployment status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (address: string, name: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      toast({
        title: "Copied!",
        description: `${name} address copied to clipboard`,
      })
      setTimeout(() => setCopiedAddress(""), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      })
    }
  }

  const openInExplorer = (address: string) => {
    // Default to Sepolia testnet explorer
    const explorerUrl = `https://sepolia.etherscan.io/address/${address}`
    window.open(explorerUrl, "_blank")
  }

  const formatContractName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  const getStatusColor = (isDeployed: boolean) => {
    return isDeployed ? "default" : "destructive"
  }

  const getStatusText = (isDeployed: boolean) => {
    return isDeployed ? "Deployed" : "Not Found"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Contract Addresses</span>
            </CardTitle>
            <CardDescription>Smart contract addresses for the CarbonFi ecosystem</CardDescription>
          </div>
          <Button onClick={checkContractsStatus} disabled={isLoading} variant="outline" size="sm">
            {isLoading ? "Checking..." : "Refresh Status"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(CONTRACT_ADDRESSES).map(([name, address]) => {
          if (name === "ADMIN") return null

          const isDeployed = contractsStatus[name]
          const isCopied = copiedAddress === address

          return (
            <div key={name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{formatContractName(name)}</Label>
                <Badge variant={getStatusColor(isDeployed)}>{getStatusText(isDeployed)}</Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Input value={address} readOnly className="font-mono text-sm" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(address, formatContractName(name))}
                  className="shrink-0"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openInExplorer(address)} className="shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {name !==
                Object.keys(CONTRACT_ADDRESSES)
                  .filter((k) => k !== "ADMIN")
                  .pop() && <Separator className="mt-4" />}
            </div>
          )
        })}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Network Information</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• These addresses are configured for the current network</p>
            <p>• Use the network selector to switch between different testnets</p>
            <p>• Contract deployment status is checked in real-time</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
