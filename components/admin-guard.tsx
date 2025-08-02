"use client"

import type React from "react"

import { useWeb3 } from "@/components/web3-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, isLoading, isConnected } = useWeb3()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isConnected) {
        toast({
          title: "Access Denied",
          description: "Please connect your wallet to access this page.",
          variant: "destructive",
        })
        router.push("/") // Redirect to home or login if not connected
      } else if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You do not have administrative privileges.",
          variant: "destructive",
        })
        router.push("/user") // Redirect to user dashboard if not admin
      }
    }
  }, [isAdmin, isLoading, isConnected, router])

  if (isLoading || !isConnected || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">Loading or redirecting...</p>
      </div>
    )
  }

  return <>{children}</>
}
