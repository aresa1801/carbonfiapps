"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { isMobile as isMobileDevice, isInAppBrowser, getInAppBrowserType } from "@/lib/wallet-utils"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WalletDetectionResult {
  hasMetaMask: boolean
  hasOtherWallets: boolean
  detectedWallets: string[]
  isInjected: boolean
  canConnect: boolean
}

export default function MetaMaskDetector() {
  const [detection, setDetection] = useState<WalletDetectionResult>({
    hasMetaMask: false,
    hasOtherWallets: false,
    detectedWallets: [],
    isInjected: false,
    canConnect: false,
  })
  const [isChecking, setIsChecking] = useState(true)
  const [checkAttempts, setCheckAttempts] = useState(0)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [inAppBrowser, setInAppBrowser] = useState(false)
  const [inAppBrowserType, setInAppBrowserType] = useState("Unknown")

  // Enhanced wallet detection
  const detectWallets = useCallback((): WalletDetectionResult => {
    const result: WalletDetectionResult = {
      hasMetaMask: false,
      hasOtherWallets: false,
      detectedWallets: [],
      isInjected: false,
      canConnect: false,
    }

    try {
      if (typeof window === "undefined") {
        return result
      }

      const ethereum = window.ethereum
      result.isInjected = !!ethereum

      if (ethereum) {
        // Check for MetaMask specifically
        if (ethereum.isMetaMask) {
          result.hasMetaMask = true
          result.detectedWallets.push("MetaMask")
        }

        // Check for multiple providers
        if (ethereum.providers && Array.isArray(ethereum.providers)) {
          ethereum.providers.forEach((provider: any) => {
            if (provider.isMetaMask) {
              result.hasMetaMask = true
              if (!result.detectedWallets.includes("MetaMask")) {
                result.detectedWallets.push("MetaMask")
              }
            }
            if (provider.isCoinbaseWallet) {
              result.hasOtherWallets = true
              if (!result.detectedWallets.includes("Coinbase Wallet")) {
                result.detectedWallets.push("Coinbase Wallet")
              }
            }
            if (provider.isRabby) {
              result.hasOtherWallets = true
              if (!result.detectedWallets.includes("Rabby")) {
                result.detectedWallets.push("Rabby")
              }
            }
            if (provider.isTrust) {
              result.hasOtherWallets = true
              if (!result.detectedWallets.includes("Trust Wallet")) {
                result.detectedWallets.push("Trust Wallet")
              }
            }
          })
        }

        // Additional checks for other wallet types
        if (ethereum.isCoinbaseWallet && !result.detectedWallets.includes("Coinbase Wallet")) {
          result.hasOtherWallets = true
          result.detectedWallets.push("Coinbase Wallet")
        }

        if (ethereum.isRabby && !result.detectedWallets.includes("Rabby")) {
          result.hasOtherWallets = true
          result.detectedWallets.push("Rabby")
        }

        if (ethereum.isTrust && !result.detectedWallets.includes("Trust Wallet")) {
          result.hasOtherWallets = true
          result.detectedWallets.push("Trust Wallet")
        }

        // Check for MetaMask via _metamask property
        if (ethereum._metamask && !result.hasMetaMask) {
          result.hasMetaMask = true
          if (!result.detectedWallets.includes("MetaMask")) {
            result.detectedWallets.push("MetaMask")
          }
        }

        // Can connect if we have any wallet
        result.canConnect = result.hasMetaMask || result.hasOtherWallets
      }

      // Additional global checks
      if ((window as any).MetaMask && !result.hasMetaMask) {
        result.hasMetaMask = true
        if (!result.detectedWallets.includes("MetaMask")) {
          result.detectedWallets.push("MetaMask")
        }
        result.canConnect = true
      }

      // Check for web3 with MetaMask
      if ((window as any).web3?.currentProvider?.isMetaMask && !result.hasMetaMask) {
        result.hasMetaMask = true
        if (!result.detectedWallets.includes("MetaMask")) {
          result.detectedWallets.push("MetaMask")
        }
        result.canConnect = true
      }

      console.log("Wallet Detection Result:", result)
      return result
    } catch (error) {
      console.warn("Error during wallet detection:", error)
      return result
    }
  }, [])

  // Check if we're in preview mode
  const checkPreviewMode = useCallback(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      const isPreview =
        hostname.includes("vercel.app") ||
        hostname.includes("v0.dev") ||
        hostname.includes("localhost") ||
        hostname === "127.0.0.1" ||
        hostname.includes("preview") ||
        hostname.includes("staging")
      return isPreview
    }
    return false
  }, [])

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const preview = checkPreviewMode()
      setIsPreviewMode(preview)

      const performDetection = () => {
        const result = detectWallets()
        setDetection(result)
        setIsChecking(false)
        setHasMetaMask(result.hasMetaMask)
        setIsMobile(isMobileDevice())
        setInAppBrowser(isInAppBrowser())
        setInAppBrowserType(getInAppBrowserType())
        return result
      }

      // Initial detection
      const initialResult = performDetection()

      // If no wallets found and not in preview mode, retry with delays
      if (!initialResult.canConnect && !preview && checkAttempts < 5) {
        const retryDelays = [500, 1000, 2000, 3000, 5000]
        const delay = retryDelays[checkAttempts] || 5000

        const retryTimeout = setTimeout(() => {
          setCheckAttempts((prev) => prev + 1)
          const retryResult = performDetection()

          if (!retryResult.canConnect && checkAttempts < 4) {
            // Continue retrying
            return
          }
        }, delay)

        return () => clearTimeout(retryTimeout)
      }

      // Listen for ethereum object changes
      const handleEthereumChange = () => {
        console.log("Ethereum object changed, rechecking...")
        performDetection()
      }

      // Set up listeners for dynamic injection
      if (!initialResult.canConnect && !preview) {
        window.addEventListener("ethereum#initialized", handleEthereumChange)

        // Listen for custom wallet events
        window.addEventListener("eip6963:announceProvider", handleEthereumChange)

        return () => {
          window.removeEventListener("ethereum#initialized", handleEthereumChange)
          window.removeEventListener("eip6963:announceProvider", handleEthereumChange)
        }
      }
    }
  }, [checkAttempts, detectWallets, checkPreviewMode])

  useEffect(() => {
    setIsClient(true)
    if (isClient) {
      const checkMetaMask = () => {
        if (!window.ethereum || !window.ethereum.isMetaMask) {
          // Only show if not in a known in-app browser that might handle wallets differently
          if (!isInAppBrowser()) {
            setIsOpen(true)
          }
        } else {
          setIsOpen(false)
        }
      }

      // Check on mount
      checkMetaMask()

      // Optional: Re-check if window.ethereum becomes available later (e.g., after a slight delay)
      const timer = setTimeout(checkMetaMask, 1000)

      return () => clearTimeout(timer)
    }
  }, [isClient])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleInstallClick = () => {
    if (isMobile && !inAppBrowser) {
      // Deep link for mobile if not in an in-app browser
      window.open("https://metamask.app.link/dapp/your-dapp-url.com", "_blank") // Replace with your DApp URL
    } else {
      // Direct to MetaMask download page for desktop or in-app browsers
      window.open("https://metamask.io/download/", "_blank")
    }
  }

  // Don't show anything while checking or in preview mode
  if (isChecking || isPreviewMode) {
    return null
  }

  if (hasMetaMask) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MetaMask Detected</CardTitle>
          <CardDescription>Your browser has MetaMask installed. You can now connect your wallet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.ethereum?.request({ method: "eth_requestAccounts" })}>Connect MetaMask</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>MetaMask Not Detected</CardTitle>
        <CardDescription>
          {isMobile
            ? inAppBrowser
              ? `You are using a ${inAppBrowserType}. Please open this DApp in a DApp browser like MetaMask Mobile or Trust Wallet, or use a desktop browser.`
              : "It looks like you're on a mobile device. Please install MetaMask Mobile or open this DApp in a DApp browser."
            : "MetaMask is not installed in your browser. Please install it to connect your wallet."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Image
          src="/placeholder.svg?height=100&width=100&text=MetaMask"
          alt="MetaMask logo"
          width={100}
          height={100}
          className="rounded-lg"
        />
        <Button onClick={handleInstallClick} className="w-full">
          <ExternalLink className="mr-2 h-4 w-4" />
          {isMobile && !inAppBrowser ? "Open in MetaMask App" : "Install MetaMask"}
        </Button>
        {isMobile && inAppBrowser && (
          <p className="text-sm text-muted-foreground text-center">
            If you already have MetaMask Mobile, try opening this page directly in its in-app browser.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
