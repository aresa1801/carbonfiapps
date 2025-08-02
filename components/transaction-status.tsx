"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOrigin } from "@/hooks/use-origin"

interface TransactionStatusProps {
  status?: "loading" | "success" | "error" | null
  hash?: string
  message?: string
  onClose?: () => void
}

export function TransactionStatus({ status, hash, message, onClose }: TransactionStatusProps) {
  const origin = useOrigin()
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null)

  useEffect(() => {
    if (hash) {
      // Assuming Sepolia testnet for now, but this could be made dynamic
      setExplorerUrl(`https://sepolia.etherscan.io/tx/${hash}`)
    }
  }, [hash])

  if (!status) return null

  return (
    <Alert
      className={`mb-6 ${
        status === "success"
          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
          : status === "error"
            ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
            : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20"
      }`}
    >
      <div className="flex items-start">
        <div className="mr-2 mt-0.5">
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          ) : status === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <AlertDescription
            className={`text-sm ${
              status === "success"
                ? "text-green-800 dark:text-green-300"
                : status === "error"
                  ? "text-red-800 dark:text-red-300"
                  : "text-blue-800 dark:text-blue-300"
            }`}
          >
            {message ||
              (status === "loading"
                ? "Processing transaction..."
                : status === "success"
                  ? "Transaction successful!"
                  : "Transaction failed.")}
          </AlertDescription>

          {hash && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
                {hash.substring(0, 10)}...{hash.substring(hash.length - 8)}
              </span>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View on Etherscan
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 rounded-full">
            &times;
          </Button>
        )}
      </div>
    </Alert>
  )
}

export { TransactionStatus as default }
