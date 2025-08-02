"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Copy, ChevronDown, ExternalLink, Check } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { NEW_CONTRACT_ADDRESSES, getNetworkByChainId } from "@/lib/constants"
import { toast } from "@/hooks/use-toast"

export function ContractAddressesDisplay() {
  const { chainId, currentNetworkContracts, supportedNetwork } = useWeb3()
  const [isOpen, setIsOpen] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const currentNetwork = chainId ? getNetworkByChainId(chainId) : null
  const isUsingNewContracts = currentNetworkContracts === NEW_CONTRACT_ADDRESSES

  const copyToClipboard = async (address: string, contractName: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)

      toast({
        title: "Address Copied",
        description: `${contractName} address copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      })
    }
  }

  const openInExplorer = (address: string) => {
    if (currentNetwork) {
      window.open(`${currentNetwork.blockExplorer}/address/${address}`, "_blank")
    }
  }

  const contractEntries = Object.entries(currentNetworkContracts).filter(([key]) => key !== "ADMIN")

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Smart Contract Addresses</CardTitle>
                <CardDescription>
                  {currentNetwork ? `${currentNetwork.name} - ` : ""}
                  {isUsingNewContracts ? "New Multi-Network Contracts" : "Original Contracts"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {supportedNetwork && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Supported
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {contractEntries.map(([contractName, address]) => (
                <div key={contractName} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {contractName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono break-all">{address}</div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(address, contractName)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedAddress === address ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>

                    {currentNetwork && (
                      <Button variant="ghost" size="sm" onClick={() => openInExplorer(address)} className="h-8 w-8 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {chainId && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Network Information</div>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <div>Chain ID: {chainId}</div>
                  <div>Network: {currentNetwork?.name || "Unknown"}</div>
                  <div>Contract Set: {isUsingNewContracts ? "New Multi-Network" : "Original Sepolia"}</div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
