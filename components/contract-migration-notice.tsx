"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function ContractMigrationNotice() {
  const [showNotice, setShowNotice] = useState(true)

  if (!showNotice) {
    return null
  }

  return (
    <Alert className="mb-6">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Contract Migration in Progress</AlertTitle>
      <AlertDescription>
        We are currently migrating to new contract versions. Some functionalities may be temporarily unavailable or
        require re-approvals. Please bear with us.
        <Button variant="link" className="p-0 h-auto ml-2 text-sm" onClick={() => setShowNotice(false)}>
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  )
}
