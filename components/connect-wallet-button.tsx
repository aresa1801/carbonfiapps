"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { Wallet, LogOut, RefreshCw, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface ConnectWalletButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  showAddress?: boolean
  showBalance?: boolean
  showNetwork?: boolean
  className?: string
}

export function ConnectWalletButton({
  variant = "default",
  size = "default",
  showAddress = true,
  showBalance = false,
  showNetwork = false,
  className = "",
}: ConnectWalletButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    account,
    balance,
    tokenSymbol,
    networkName,
    refreshBalances,
    isRefreshing,
    reinitializeMetaMask,
  } = useWeb3()

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setIsOpen(false)
  }

  const handleRefresh = async () => {
    try {
      await refreshBalances()
      toast({
        title: "Wallet Refreshed",
        description: "Your wallet data has been refreshed",
      })
    } catch (error: any) {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh wallet data",
        variant: "destructive",
      })
    }
  }

  const handleReinitialize = async () => {
    try {
      await reinitializeMetaMask()
    } catch (error: any) {
      toast({
        title: "Reinitialization Failed",
        description: error.message || "Failed to reinitialize wallet connection",
        variant: "destructive",
      })
    }
  }

  if (!isConnected) {
    return (
      <Button variant={variant} size={size} onClick={handleConnect} disabled={isConnecting} className={className}>
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Wallet className="mr-2 h-4 w-4" />
          {showAddress && account
            ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
            : "Connected"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showAddress && account && (
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(account)
              toast({
                title: "Address Copied",
                description: "Wallet address copied to clipboard",
              })
            }}
            className="cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">Address</span>
              <span className="text-xs text-gray-500 truncate">
                {account.substring(0, 10)}...{account.substring(account.length - 8)}
              </span>
            </div>
          </DropdownMenuItem>
        )}
        {showBalance && (
          <DropdownMenuItem className="cursor-default">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Balance</span>
              <span className="text-xs text-gray-500">
                {balance} {tokenSymbol}
              </span>
            </div>
          </DropdownMenuItem>
        )}
        {showNetwork && networkName && (
          <DropdownMenuItem className="cursor-default">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Network</span>
              <span className="text-xs text-gray-500">{networkName}</span>
            </div>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleRefresh} className="cursor-pointer">
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Refresh Wallet</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleReinitialize} className="cursor-pointer">
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Reinitialize Connection</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ConnectWalletButton
