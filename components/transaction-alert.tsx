"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

interface TransactionAlertProps {
  status: "success" | "error" | "none"
  message?: string
}

export function TransactionAlert({ status, message }: TransactionAlertProps) {
  if (status === "none") return null

  if (status === "success") {
    return (
      <Alert className="border-emerald-800 bg-emerald-900/50">
        <CheckCircle className="h-4 w-4 text-emerald-500" />
        <AlertDescription className="text-emerald-400">{message || "Transaction successful"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-red-800 bg-red-900/50">
      <AlertCircle className="h-4 w-4 text-red-500" />
      <AlertDescription className="text-red-400">{message || "Failed to claim CAFI tokens"}</AlertDescription>
    </Alert>
  )
}
