"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from 'lucide-react'

interface TransactionAlertProps {
  message: string
  type: "info" | "success" | "error"
}

export function TransactionAlert({ message, type }: TransactionAlertProps) {
  let variant: "default" | "destructive" = "default"
  let icon = <Terminal className="h-4 w-4" />

  if (type === "error") {
    variant = "destructive"
  } else if (type === "success") {
    icon = <Terminal className="h-4 w-4 text-green-500" /> // Placeholder for a success icon
  }

  return (
    <Alert variant={variant}>
      {icon}
      <AlertTitle>{type.charAt(0).toUpperCase() + type.slice(1)}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
