"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { formatEther, parseEther } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function TokenConfig() {
  const { cafiTokenContract, signer, address, isConnected, refreshBalances } = useWeb3()
  const [cafiTokenName, setCafiTokenName] = useState("")
  const [cafiTokenSymbol, setCafiTokenSymbol] = useState("")
  const [cafiTokenTotalSupply, setCafiTokenTotalSupply] = useState("0")
  const [mintAmount, setMintAmount] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferRecipient, setTransferRecipient] = useState("")
  const [isMinting, setIsMinting] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)

  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (cafiTokenContract) {
        try {
          const name = await cafiTokenContract.name()
          const symbol = await cafiTokenContract.symbol()
          const totalSupply = await cafiTokenContract.totalSupply()
          setCafiTokenName(name)
          setCafiTokenSymbol(symbol)
          setCafiTokenTotalSupply(formatEther(totalSupply))
        } catch (error) {
          console.error("Error fetching token details:", error)
          toast({
            title: "Error",
            description: "Failed to fetch CAFI token details.",
            variant: "destructive",
          })
        }
      }
    }
    fetchTokenDetails()
  }, [cafiTokenContract])

  const handleMint = async () => {
    if (!cafiTokenContract || !signer || !address || !mintAmount) {
      toast({
        title: "Error",
        description: "Please connect wallet and enter mint amount.",
        variant: "destructive",
      })
      return
    }

    setIsMinting(true)
    try {
      const amount = parseEther(mintAmount)
      const tx = await cafiTokenContract.mint(address, amount)
      await tx.wait()
      toast({
        title: "Mint Successful",
        description: `${mintAmount} CAFI tokens minted to your address.`,
      })
      setMintAmount("")
      refreshBalances()
    } catch (error: any) {
      console.error("Error minting tokens:", error)
      toast({
        title: "Mint Failed",
        description: `Failed to mint tokens: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  const handleTransfer = async () => {
    if (!cafiTokenContract || !signer || !transferAmount || !transferRecipient) {
      toast({
        title: "Error",
        description: "Please connect wallet, enter amount and recipient.",
        variant: "destructive",
      })
      return
    }

    setIsTransferring(true)
    try {
      const amount = parseEther(transferAmount)
      const tx = await cafiTokenContract.transfer(transferRecipient, amount)
      await tx.wait()
      toast({
        title: "Transfer Successful",
        description: `${transferAmount} CAFI tokens transferred to ${transferRecipient}.`,
      })
      setTransferAmount("")
      setTransferRecipient("")
      refreshBalances()
    } catch (error: any) {
      console.error("Error transferring tokens:", error)
      toast({
        title: "Transfer Failed",
        description: `Failed to transfer tokens: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CAFI Token Configuration</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="token-name">Token Name</Label>
            <Input id="token-name" value={cafiTokenName} readOnly />
          </div>
          <div>
            <Label htmlFor="token-symbol">Token Symbol</Label>
            <Input id="token-symbol" value={cafiTokenSymbol} readOnly />
          </div>
        </div>
        <div>
          <Label htmlFor="total-supply">Total Supply</Label>
          <Input id="total-supply" value={cafiTokenTotalSupply} readOnly />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Mint Tokens</h3>
          <div className="flex gap-2">
            <Input
              id="mint-amount"
              type="number"
              placeholder="Amount to mint"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              disabled={!isConnected || isMinting}
            />
            <Button onClick={handleMint} disabled={!isConnected || isMinting}>
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Minting
                </>
              ) : (
                "Mint"
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Transfer Tokens</h3>
          <div className="grid gap-2">
            <Input
              id="transfer-recipient"
              placeholder="Recipient Address"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
              disabled={!isConnected || isTransferring}
            />
            <div className="flex gap-2">
              <Input
                id="transfer-amount"
                type="number"
                placeholder="Amount to transfer"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                disabled={!isConnected || isTransferring}
              />
              <Button onClick={handleTransfer} disabled={!isConnected || isTransferring}>
                {isTransferring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transferring
                  </>
                ) : (
                  "Transfer"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
