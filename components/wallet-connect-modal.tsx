"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import { isIOS, isAndroid, isMetaMaskInstalled } from "@/lib/wallet-utils"
import { useWeb3 } from "@/components/web3-provider"

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connect } = useWeb3()
  const ios = isIOS()
  const android = isAndroid()

  const handleConnect = () => {
    connect()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect your wallet to interact with the CarbonFi platform.
          </p>

          <div className="grid gap-2">
            <Button onClick={handleConnect} className="w-full">
              MetaMask
            </Button>

            {!isMetaMaskInstalled() && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">No wallet detected</p>
                <div className="flex flex-col gap-2">
                  {ios && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center justify-start bg-transparent"
                      onClick={() =>
                        window.open("https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202", "_blank")
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download MetaMask for iOS
                    </Button>
                  )}
                  {android && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center justify-start bg-transparent"
                      onClick={() => window.open("https://play.google.com/store/apps/details?id=io.metamask", "_blank")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download MetaMask for Android
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-start bg-transparent"
                    onClick={() => window.open("https://metamask.io/download/", "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit MetaMask Website
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
