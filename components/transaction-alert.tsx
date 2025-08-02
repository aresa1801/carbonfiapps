"use client"

import { useWeb3 } from "@/components/web3-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { getNetworkByChainId } from "@/lib/constants"

export function TransactionAlert() {
  const { transactionStatus, setTransactionStatus, chainId } = useWeb3()

  useEffect(() => {
    if (transactionStatus.status === "success" || transactionStatus.status === "failed") {
      const timer = setTimeout(() => {
        setTransactionStatus({ hash: null, status: null, message: null })
      }, 5000) // Clear after 5 seconds
      return () => clearTimeout(timer)
    }
  }, [transactionStatus, setTransactionStatus])

  if (!transactionStatus.status) {
    return null
  }

  const getIcon = () => {
    switch (transactionStatus.status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Terminal className="h-4 w-4" />
    }
  }

  const getTitle = () => {
    switch (transactionStatus.status) {
      case "pending":
        return "Transaction Pending"
      case "success":
        return "Transaction Successful"
      case "failed":
        return "Transaction Failed"
      default:
        return "Transaction Status"
    }
  }

  const network = chainId ? getNetworkByChainId(chainId) : null
  const blockExplorerUrl = network?.blockExplorer || "https://etherscan.io" // Fallback

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
      <Alert
        variant={transactionStatus.status === "failed" ? "destructive" : "default"}
        className="flex items-start space-x-3"
      >
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>
        <div className="flex-grow">
          <AlertTitle>{getTitle()}</AlertTitle>
          <AlertDescription>
            {transactionStatus.message}
            {transactionStatus.hash && (
              <p className="mt-1 text-xs text-muted-foreground">
                Hash:{" "}
                <a
                  href={`${blockExplorerUrl}/tx/${transactionStatus.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {transactionStatus.hash.substring(0, 6)}...{transactionStatus.hash.slice(-4)}
                </a>
              </p>
            )}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  )
}
