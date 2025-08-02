"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWeb3 } from "@/components/web3-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { isMobileDevice, isInAppBrowser, getInAppBrowserType } from "@/lib/wallet-utils"

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connectWallet, isConnected, isLoading, error } = useWeb3()
  const [hasMetaMask, setHasMetaMask] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [inAppBrowser, setInAppBrowser] = useState(false)
  const [inAppBrowserType, setInAppBrowserType] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasMetaMask(window.ethereum?.isMetaMask || false)
      setIsMobile(isMobileDevice())
      setInAppBrowser(isInAppBrowser())
      setInAppBrowserType(getInAppBrowserType())
    }
  }, [])

  useEffect(() => {
    if (isConnected && isOpen) {
      onClose() // Close modal automatically on successful connection
    }
  }, [isConnected, isOpen, onClose])

  const handleConnect = async () => {
    await connectWallet()
  }

  const handleInstallMetaMask = () => {
    window.open("https://metamask.io/download/", "_blank")
  }

  const handleOpenInMetaMaskBrowser = () => {
    const currentUrl = window.location.href
    window.open(`https://metamask.app.link/dapp/${currentUrl.replace(/https?:\/\//, "")}`, "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>Choose your preferred wallet to connect to CarbonFi DApps.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {isMobile && !inAppBrowser && (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Mobile Browser Detected</AlertTitle>
              <AlertDescription>
                For the best experience, please open this DApp in a Web3 browser like MetaMask's built-in browser.
              </AlertDescription>
            </Alert>
          )}

          {isMobile && !inAppBrowser && (
            <Button onClick={handleOpenInMetaMaskBrowser} disabled={isLoading}>
              Open in MetaMask Browser
            </Button>
          )}

          {!hasMetaMask && !isMobile && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>MetaMask Not Found</AlertTitle>
              <AlertDescription>Please install the MetaMask browser extension to connect.</AlertDescription>
            </Alert>
          )}

          {!hasMetaMask && !isMobile && (
            <Button onClick={handleInstallMetaMask} disabled={isLoading}>
              Install MetaMask
            </Button>
          )}

          {(hasMetaMask || inAppBrowser) && (
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect MetaMask"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
