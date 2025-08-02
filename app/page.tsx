"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { ContractAddressesDisplay } from "@/components/contract-addresses-display"
import { NetworkSelector } from "@/components/network-selector"
import { ThemeToggle } from "@/components/theme-toggle"
import { CONTRACT_ADDRESSES } from "@/lib/constants"
import { contractService } from "@/services/contract-service"
import { Shield, Coins, Leaf, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string>("")
  const [contractsStatus, setContractsStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    checkWalletConnection()
    checkContractsStatus()
  }, [])

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setIsConnected(true)
          setAccount(accounts[0])
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const checkContractsStatus = async () => {
    const status: Record<string, boolean> = {}

    try {
      for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
        if (name !== "ADMIN") {
          status[name] = await contractService.contractExists(address)
        }
      }
      setContractsStatus(status)
    } catch (error) {
      console.error("Error checking contracts status:", error)
    }
  }

  const features = [
    {
      icon: Coins,
      title: "CAFI Token Faucet",
      description: "Get test CAFI tokens for development and testing",
      href: "/user",
      color: "text-blue-500",
    },
    {
      icon: TrendingUp,
      title: "Staking Platform",
      description: "Stake CAFI tokens and earn rewards with flexible lock periods",
      href: "/user/staking",
      color: "text-green-500",
    },
    {
      icon: Leaf,
      title: "Carbon NFT Marketplace",
      description: "Mint, trade, and retire carbon credit NFTs",
      href: "/user/marketplace",
      color: "text-emerald-500",
    },
    {
      icon: Users,
      title: "Farming Pools",
      description: "Participate in yield farming with various token pairs",
      href: "/user/farming",
      color: "text-purple-500",
    },
    {
      icon: Shield,
      title: "Admin Dashboard",
      description: "Manage contracts, verifiers, and system settings",
      href: "/admin",
      color: "text-red-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative h-10 w-10">
                <Image src="/images/carbonfi-logo.png" alt="CarbonFi Logo" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CarbonFi DApps</h1>
                <p className="text-sm text-muted-foreground">Smart Contract Testing Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NetworkSelector />
              <ThemeToggle />
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">Test CarbonFi Smart Contracts</h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              A comprehensive testing platform for CarbonFi's ecosystem of smart contracts including token faucets,
              staking, NFT marketplace, and carbon retirement systems.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isConnected ? (
                <Link href="/user">
                  <Button size="lg" className="text-lg px-8 py-3">
                    Launch App
                  </Button>
                </Link>
              ) : (
                <ConnectWalletButton />
              )}
              <Link href="/admin">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold">Platform Features</h3>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore all the smart contract functionalities available for testing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">{feature.description}</CardDescription>
                  <Link href={feature.href}>
                    <Button variant="outline" className="w-full bg-transparent">
                      Explore
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contract Status */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold">Contract Status</h3>
            <p className="mt-4 text-lg text-muted-foreground">Real-time status of deployed smart contracts</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Smart Contract Deployment Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(CONTRACT_ADDRESSES).map(([name, address]) => {
                    if (name === "ADMIN") return null
                    const isDeployed = contractsStatus[name]
                    return (
                      <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{name.replace(/_/g, " ")}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {address.slice(0, 10)}...{address.slice(-8)}
                          </p>
                        </div>
                        <Badge variant={isDeployed ? "default" : "destructive"}>
                          {isDeployed ? "Deployed" : "Not Found"}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <ContractAddressesDisplay />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="relative h-8 w-8">
                <Image src="/images/carbonfi-logo.png" alt="CarbonFi Logo" fill className="object-contain" />
              </div>
              <span className="text-lg font-semibold">CarbonFi DApps</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>Smart Contract Testing Platform</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Built with Next.js & ethers.js</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
