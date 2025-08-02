"use client"

import { useWeb3 } from "@/components/web3-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useEffect } from "react"

export function TransactionStatus() {
  const { transactionStatus, setTransactionStatus, chainId } = useWeb3()

  const getBlockExplorerUrl = (hash: string | null, chainId: number | null) => {
    if (!hash || !chainId) return null

    let baseUrl = ""
    switch (chainId) {
      case 11155111: // Sepolia
        baseUrl = "https://sepolia.etherscan.io/tx/"
        break
      case 97: // BSC Testnet
        baseUrl = "https://testnet.bscscan.com/tx/"
        break
      case 296: // Hedera Testnet
        baseUrl = "https://hashscan.io/testnet/transaction/"
        break
      case 4202: // Lisk Sepolia
        baseUrl = "https://sepolia-blockscout.lisk.com/tx/"
        break
      case 84532: // Base Sepolia
        baseUrl = "https://sepolia.basescan.org/tx/"
        break
      case 44787: // Celo Alfajores
        baseUrl = "https://alfajores.celoscan.io/tx/"
        break
      default:
        return null
    }
    return `${baseUrl}${hash}`
  }

  const txUrl = getBlockExplorerUrl(transactionStatus.hash, chainId)

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
                  href={txUrl} // TODO: Make this dynamic based on chainId
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
