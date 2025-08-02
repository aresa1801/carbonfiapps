"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { useWeb3 } from "@/components/web3-provider"
import { Loader2 } from "lucide-react"

export default function LandingPage() {
  const { isConnected, isLoading } = useWeb3()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="#" className="flex items-center justify-center">
          <Image src="/public/images/carbonfi-logo.png" alt="CarbonFi Logo" width={120} height={30} priority />
          <span className="sr-only">CarbonFi</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            Features
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            Pricing
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            About
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            Contact
          </Link>
        </nav>
        <div className="ml-4">
          <ConnectWalletButton />
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full pt-12 md:pt-24 lg:pt-32 border-y">
          <div className="px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:grid-cols-2 md:gap-16">
              <div>
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                  Decentralized Carbon Credit Management
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Trade, retire, and manage carbon credits on the blockchain. Transparent, secure, and efficient.
                </p>
                <div className="space-x-4 mt-6">
                  {isLoading ? (
                    <Button disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </Button>
                  ) : isConnected ? (
                    <Link href="/user" passHref>
                      <Button>Go to Dashboard</Button>
                    </Link>
                  ) : (
                    <ConnectWalletButton />
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start space-y-4">
                <Image
                  src="/public/images/carbonfi-header.jpeg"
                  width="550"
                  height="550"
                  alt="Hero"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2024 CarbonFi. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
