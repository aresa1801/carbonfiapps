"use client"

import type React from "react"

import { useWeb3 } from "@/components/web3-provider"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, isConnected, address } = useWeb3()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isConnected || !address) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to access the admin dashboard.",
          variant: "destructive",
        })
        router.push("/")
      } else if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges to access this page.",
          variant: "destructive",
        })
        router.push("/user") // Redirect to user dashboard or home
      }
    }
  }, [isAdmin, isLoading, isConnected, address, router, toast])

  if (isLoading || !isConnected || !address || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <Card className="w-full max-w-md bg-gray-900 text-white">
          <CardHeader>
            <CardTitle className="text-blue-400">Loading Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="text-lg text-gray-300">Checking admin privileges...</p>
            <p className="text-sm text-gray-400 text-center">
              Please ensure your wallet is connected and you have the necessary permissions.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
