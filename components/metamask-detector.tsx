"use client"

import { useEffect, useState, useCallback } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Download, ExternalLink, RefreshCw, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Link from "next/link"
import { isMobile as isMobileDevice, isIOS, isAndroid, isInAppBrowser } from "@/lib/wallet-utils"

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

  const isMobile = isClient ? isMobileDevice() : false

  // Don't show anything while checking or in preview mode
  if (isChecking || isPreviewMode) {
    return null
  }

  // If we have MetaMask, don't show anything
  if (detection.hasMetaMask) {
    return null
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>MetaMask Not Detected</DialogTitle>
            <DialogDescription>
              {isMobile
                ? "It looks like you're on a mobile device and MetaMask is not detected. Please open this page in the MetaMask app's browser or install MetaMask Mobile."
                : "It looks like MetaMask is not installed in your browser. Please install MetaMask to connect your wallet."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isMobile ? (
              <>
                <Button asChild>
                  <Link href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                    Get MetaMask Mobile
                  </Link>
                </Button>
                <Button onClick={handleClose} variant="outline">
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                    Install MetaMask Extension
                  </Link>
                </Button>
                <Button onClick={handleClose} variant="outline">
                  Close
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Alert variant={detection.hasOtherWallets ? "default" : "destructive"} className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{detection.hasOtherWallets ? "MetaMask Recommended" : "MetaMask Not Detected"}</AlertTitle>
        <AlertDescription className="mt-2">
          {detection.hasOtherWallets ? (
            <div>
              <p className="mb-2">
                We detected other wallets ({detection.detectedWallets.join(", ")}), but MetaMask is recommended for the
                best experience with CarbonFi.
              </p>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm text-green-700 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span>You can still connect with your existing wallet</span>
              </div>
            </div>
          ) : (
            <p className="mb-2">
              To interact with the CarbonFi platform, you need to have MetaMask or another Ethereum wallet installed.
            </p>
          )}

          {isMobile ? (
            <div className="mt-3">
              <p className="mb-2">You're on a mobile device. Please use a wallet mobile app:</p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                {isIOS() && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-transparent"
                    onClick={() =>
                      window.open("https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202", "_blank")
                    }
                  >
                    <Download className="h-4 w-4" />
                    MetaMask for iOS
                  </Button>
                )}
                {isAndroid() && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-transparent"
                    onClick={() => window.open("https://play.google.com/store/apps/details?id=io.metamask", "_blank")}
                  >
                    <Download className="h-4 w-4" />
                    MetaMask for Android
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={() => window.open("https://metamask.io/download/", "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit MetaMask
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <p className="mb-2">Please install MetaMask extension for your browser:</p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={() => window.open("https://metamask.io/download/", "_blank")}
                >
                  <Download className="h-4 w-4" />
                  Install MetaMask
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={() => setIsChecking(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Check Again
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
              </div>
            </div>
          )}

          <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">Troubleshooting:</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="text-xs h-6"
              >
                {showDebugInfo ? "Hide" : "Show"} Debug Info
              </Button>
            </div>

            <ul className="list-disc list-inside space-y-1">
              <li>Make sure MetaMask extension is enabled in your browser</li>
              <li>Try refreshing the page after installing</li>
              <li>Check if other wallet extensions are conflicting</li>
              <li>Disable ad blockers that might block wallet detection</li>
              <li>Try opening in an incognito/private window</li>
            </ul>

            {showDebugInfo && (
              <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                <p className="font-medium mb-1">Debug Information:</p>
                <ul className="space-y-1">
                  <li>Ethereum Injected: {detection.isInjected ? "✅" : "❌"}</li>
                  <li>MetaMask Detected: {detection.hasMetaMask ? "✅" : "❌"}</li>
                  <li>Other Wallets: {detection.hasOtherWallets ? "✅" : "❌"}</li>
                  <li>Detected Wallets: {detection.detectedWallets.join(", ") || "None"}</li>
                  <li>Can Connect: {detection.canConnect ? "✅" : "❌"}</li>
                  <li>Check Attempts: {checkAttempts}</li>
                  <li>User Agent: {navigator.userAgent.substring(0, 50)}...</li>
                </ul>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </>
  )
}
