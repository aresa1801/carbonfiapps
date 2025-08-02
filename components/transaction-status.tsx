"use client"

import { useWeb3 } from "@/components/web3-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, CheckCircle2, XCircle } from "lucide-react"
import { useEffect } from "react"

export function TransactionStatus() {
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

  const getBlockExplorerUrl = (hash: string) => {
    // This should ideally come from your network configuration in constants.ts
    // For now, a simple switch based on chainId
    switch (chainId) {
      case 11155111: // Sepolia
        return `https://sepolia.etherscan.io/tx/${hash}`
      case 97: // BSC Testnet
        return `https://testnet.bscscan.com/tx/${hash}`
      case 296: // Hedera Testnet
        return `https://hashscan.io/testnet/transaction/${hash}`
      case 4202: // Lisk Sepolia
        return `https://sepolia-blockscout.lisk.com/tx/${hash}`
      case 84532: // Base Sepolia
        return `https://sepolia.basescan.org/tx/${hash}`
      case 44787: // Celo Alfajores
        return `https://alfajores.celoscan.io/tx/${hash}`
      default:
        return `https://etherscan.io/tx/${hash}` // Fallback
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
      <Alert
        variant={
          transactionStatus.status === "success"
            ? "default"
            : transactionStatus.status === "failed"
              ? "destructive"
              : "default"
        }
      >
        {transactionStatus.status === "pending" && <Terminal className="h-4 w-4" />}
        {transactionStatus.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        {transactionStatus.status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
        <AlertTitle>
          {transactionStatus.status === "pending" && "Transaction Pending"}
          {transactionStatus.status === "success" && "Transaction Successful!"}
          {transactionStatus.status === "failed" && "Transaction Failed!"}
        </AlertTitle>
        <AlertDescription>
          {transactionStatus.message}
          {transactionStatus.hash && (
            <a
              href={getBlockExplorerUrl(transactionStatus.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 underline"
            >
              View on Explorer
            </a>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
