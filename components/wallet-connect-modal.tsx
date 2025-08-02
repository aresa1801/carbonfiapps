"use client"

import { CardContent } from "@/components/ui/card"

import { CardDescription } from "@/components/ui/card"

import { CardTitle } from "@/components/ui/card"

import { CardHeader } from "@/components/ui/card"

import { Card } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MetaMaskDetector } from "@/components/metamask-detector"
import { useWeb3 } from "@/components/web3-provider"
import { isMobileDevice, isInAppBrowser } from "@/lib/wallet-utils"
import { ExternalLink } from "lucide-react"

export function WalletConnectModal() {
  const { isConnected, connectWallet } = useWeb3()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [inAppBrowser, setInAppBrowser] = useState(false)

  useEffect(() => {
    setIsMobile(isMobileDevice())
    setInAppBrowser(isInAppBrowser())
  }, [])

  useEffect(() => {
    if (!isConnected) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [isConnected])

  const handleConnectMetaMask = async () => {
    if (window.ethereum) {
      await connectWallet()
    } else {
      // This case should ideally be handled by MetaMaskDetector,
      // but as a fallback, direct to install.
      window.open("https://metamask.io/download/", "_blank")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>Connect your MetaMask wallet to access the CarbonFi DApp.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isMobile && !inAppBrowser && (
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Open in MetaMask Mobile</CardTitle>
                <CardDescription>
                  It looks like you're on a mobile device. For the best experience, please open this DApp directly in
                  the MetaMask Mobile browser.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => window.open(`https://metamask.app.link/dapp/${window.location.host}`, "_blank")}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in MetaMask App
                </Button>
              </CardContent>
            </Card>
          )}

          {(!isMobile || inAppBrowser) && <MetaMaskDetector />}

          <div className="text-center text-sm text-muted-foreground">Or if you prefer, you can manually connect:</div>
          <Button onClick={handleConnectMetaMask} disabled={isConnected}>
            {isConnected ? "Wallet Connected" : "Connect MetaMask"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Don't have MetaMask?{" "}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Install it here
            </a>
            .
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
