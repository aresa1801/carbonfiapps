"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { useWeb3 } from "@/components/web3-provider"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { isConnected, isAdmin, isLoading, address } = useWeb3()
  const router = useRouter()
  const [showRedirectMessage, setShowRedirectMessage] = useState(false)

  useEffect(() => {
    if (!isLoading && isConnected && address) {
      setShowRedirectMessage(true)
      const timer = setTimeout(() => {
        if (isAdmin) {
          router.push("/admin")
        } else {
          router.push("/user")
        }
      }, 2000) // Redirect after 2 seconds
      return () => clearTimeout(timer)
    }
  }, [isConnected, isAdmin, isLoading, address, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 text-gray-50 dark:bg-gray-950 dark:text-gray-50">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/images/carbonfi-logo.png"
            alt="CarbonFi Logo"
            width={72} // 1.5x of 48
            height={72} // 1.5x of 48
            className="rounded-full"
          />
          <h1 className="text-5xl font-bold tracking-tight text-white">CarbonFi</h1>
          <p className="text-lg text-gray-400">Decentralized Carbon Credit Management</p>
        </div>

        {isLoading ? (
          <Card className="w-full bg-gray-900 text-white">
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-lg text-gray-300">Loading Web3 Provider...</p>
              <p className="text-sm text-gray-400 text-center">
                Please ensure your MetaMask is unlocked and connected.
              </p>
            </CardContent>
          </Card>
        ) : showRedirectMessage ? (
          <Card className="w-full bg-gray-900 text-white">
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-green-500" />
              <p className="text-lg font-semibold text-green-400">Wallet Connected!</p>
              <p className="text-sm text-gray-300">Redirecting to {isAdmin ? "Admin" : "User"} Dashboard...</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full bg-gray-900 text-white">
            <CardHeader>
              <CardTitle className="text-blue-400">Connect Your Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">Connect your MetaMask wallet to access the CarbonFi DApp.</p>
              <ConnectWalletButton />
              <div className="flex justify-center space-x-4">
                <Link href="/user" passHref>
                  <Button variant="link" className="text-gray-400 hover:text-gray-50">
                    Continue as Guest (View Only)
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
