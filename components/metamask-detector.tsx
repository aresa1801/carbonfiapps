"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { isMobileDevice, isInAppBrowser, getInAppBrowserType } from "@/lib/wallet-utils"

export function MetamaskDetector() {
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

  const handleInstallMetaMask = () => {
    window.open("https://metamask.io/download/", "_blank")
  }

  const handleOpenInMetaMaskBrowser = () => {
    const currentUrl = window.location.href
    window.open(`https://metamask.app.link/dapp/${currentUrl.replace(/https?:\/\//, "")}`, "_blank")
  }

  if (hasMetaMask) {
    return null // MetaMask is detected, no need to show the detector
  }

  if (isMobile && !inAppBrowser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Open in DApp Browser</CardTitle>
            <CardDescription>
              It looks like you're on a mobile device. For the best experience, please open this page in a Web3 browser
              like MetaMask's built-in browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleOpenInMetaMaskBrowser} className="w-full">
              Open in MetaMask Browser
            </Button>
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Don't have MetaMask?</AlertTitle>
              <AlertDescription>You'll need the MetaMask app installed to use its browser.</AlertDescription>
            </Alert>
            <Button onClick={handleInstallMetaMask} variant="outline" className="w-full bg-transparent">
              Install MetaMask
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (inAppBrowser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Web3 Browser Detected</CardTitle>
            <CardDescription>
              You are currently viewing this page in a {inAppBrowserType}. You can connect your wallet directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Ready to Connect</AlertTitle>
              <AlertDescription>Proceed to connect your wallet using the button in the header.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Desktop without MetaMask
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>MetaMask Not Detected</CardTitle>
          <CardDescription>You need MetaMask to interact with this DApp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Installation Required</AlertTitle>
            <AlertDescription>Please install the MetaMask browser extension to continue.</AlertDescription>
          </Alert>
          <Button onClick={handleInstallMetaMask} className="w-full">
            Install MetaMask
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
