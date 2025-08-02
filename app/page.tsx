"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWeb3 } from "@/components/web3-provider"
import { formatBigIntToEther } from "@/lib/wallet-utils"
import { MetamaskDetector } from "@/components/metamask-detector"
import { DashboardHeader } from "@/components/dashboard-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useIsMobile } from "@/hooks/use-mobile"
import { TransactionStatus } from "@/components/transaction-status"

export default function Home() {
  const { isConnected, address, nativeBalance, cafiBalance, isLoading } = useWeb3()
  const isMobile = useIsMobile()

  if (!isConnected) {
    return <MetamaskDetector />
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">Welcome to CarbonFi DApps</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Your decentralized platform for carbon offsetting and sustainable finance.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Your Wallet</CardTitle>
                <CardDescription>Connected Address</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold break-all">{address}</p>
                <div className="mt-4 flex justify-between">
                  <span>Native Balance:</span>
                  <span>
                    {formatBigIntToEther(nativeBalance)} {process.env.NEXT_PUBLIC_NETWORK_CURRENCY_SYMBOL || "ETH"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CAFI Balance:</span>
                  <span>{cafiBalance} CAFI</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Explore DApps</CardTitle>
                <CardDescription>Dive into CarbonFi features</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/user/faucet" passHref>
                  <Button variant="outline" className="w-full bg-transparent">
                    Get CAFI from Faucet
                  </Button>
                </Link>
                <Link href="/user/retire" passHref>
                  <Button variant="outline" className="w-full bg-transparent">
                    Retire Carbon
                  </Button>
                </Link>
                <Link href="/user/staking" passHref>
                  <Button variant="outline" className="w-full bg-transparent">
                    Stake CAFI
                  </Button>
                </Link>
                <Link href="/user/marketplace" passHref>
                  <Button variant="outline" className="w-full bg-transparent">
                    NFT Marketplace
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Panel</CardTitle>
                <CardDescription>Manage contract settings (Admin Only)</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin" passHref>
                  <Button className="w-full">Go to Admin Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <h2 className="text-3xl font-bold tracking-tight">About CarbonFi</h2>
            <p className="mt-4 text-muted-foreground">
              CarbonFi is a pioneering decentralized application (DApp) built on blockchain technology, designed to
              revolutionize carbon offsetting and promote sustainable finance. Our platform provides transparent,
              immutable, and efficient solutions for individuals and organizations to manage their carbon footprint and
              participate in a green economy.
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <Link href="#" passHref>
                <Button variant="link">Learn More</Button>
              </Link>
              <Link href="#" passHref>
                <Button variant="link">Documentation</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      {isMobile && <MobileBottomNav />}
      <TransactionStatus />
    </div>
  )
}
