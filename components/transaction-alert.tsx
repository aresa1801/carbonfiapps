"use client"

import { useWeb3 } from "@/components/web3-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect } from "react"

export function TransactionAlert() {
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
      }, 10000) // Clear after 10 seconds
      return () => clearTimeout(timer)
    }
  }, [transactionStatus, setTransactionStatus])

  if (!transactionStatus.status) {
    return null
  }

  const variant =
    transactionStatus.status === "success"
      ? "default"
      : transactionStatus.status === "failed"
        ? "destructive"
        : "default" // Pending uses default

  const Icon =
    transactionStatus.status === "success" ? CheckCircle2 : transactionStatus.status === "failed" ? XCircle : Loader2

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
      <Alert variant={variant}>
        <Icon className="h-4 w-4" />
        <AlertTitle>
          {transactionStatus.status === "pending" && "Transaction Pending"}
          {transactionStatus.status === "success" && "Transaction Successful!"}
          {transactionStatus.status === "failed" && "Transaction Failed!"}
        </AlertTitle>
        <AlertDescription>
          {transactionStatus.message || "Please check your wallet for details."}
          {transactionStatus.hash && (
            <div className="mt-2 text-xs break-all">
              Hash: {transactionStatus.hash.substring(0, 6)}...{transactionStatus.hash.substring(60)}
            </div>
          )}
          {txUrl && (
            <div className="mt-2">
              <Link href={txUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="link" className="h-auto p-0 text-sm">
                  View on Block Explorer
                </Button>
              </Link>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
