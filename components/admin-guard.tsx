"use client"

import type React from "react"

import { useWeb3 } from "@/components/web3-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isConnected, isAdmin, isLoading, connectWallet } = useWeb3()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Wallet Not Connected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Connection Required</AlertTitle>
              <AlertDescription>Please connect your wallet to access the admin dashboard.</AlertDescription>
            </Alert>
            <Button onClick={connectWallet}>Connect Wallet</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Unauthorized Access</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Permission Denied</AlertTitle>
              <AlertDescription>You do not have admin privileges to access this page.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
