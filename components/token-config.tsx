"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { formatEther, parseEther } from "ethers"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export function TokenConfig() {
  const { cafiTokenContract, signer, address, isConnected, refreshBalances } = useWeb3()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [totalSupply, setTotalSupply] = useState("0")
  const [mintAmount, setMintAmount] = useState("")
  const [burnAmount, setBurnAmount] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferRecipient, setTransferRecipient] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (cafiTokenContract) {
        try {
          const tokenName = await cafiTokenContract.name()
          const tokenSymbol = await cafiTokenContract.symbol()
          const tokenTotalSupply = await cafiTokenContract.totalSupply()

          setName(tokenName)
          setSymbol(tokenSymbol)
          setTotalSupply(formatEther(tokenTotalSupply))
        } catch (err: any) {
          console.error("Error fetching token details:", err)
          setError(`Failed to fetch token details: ${err.message}`)
        }
      }
    }
    fetchTokenDetails()
  }, [cafiTokenContract])

  const handleMint = async () => {
    if (!cafiTokenContract || !signer || !mintAmount || !address) {
      toast({
        title: "Error",
        description: "Wallet not connected or mint amount invalid.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const amount = parseEther(mintAmount)
      const tx = await cafiTokenContract.mint(address, amount)
      await tx.wait()
      toast({
        title: "Mint Successful",
        description: `${mintAmount} tokens minted to your address.`,
      })
      setMintAmount("")
      refreshBalances()
    } catch (err: any) {
      console.error("Minting error:", err)
      setError(`Minting failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Mint Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBurn = async () => {
    if (!cafiTokenContract || !signer || !burnAmount) {
      toast({
        title: "Error",
        description: "Wallet not connected or burn amount invalid.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const amount = parseEther(burnAmount)
      const tx = await cafiTokenContract.burn(amount)
      await tx.wait()
      toast({
        title: "Burn Successful",
        description: `${burnAmount} tokens burned from your address.`,
      })
      setBurnAmount("")
      refreshBalances()
    } catch (err: any) {
      console.error("Burning error:", err)
      setError(`Burning failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Burn Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async () => {
    if (!cafiTokenContract || !signer || !transferAmount || !transferRecipient) {
      toast({
        title: "Error",
        description: "Wallet not connected, transfer amount or recipient invalid.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const amount = parseEther(transferAmount)
      const tx = await cafiTokenContract.transfer(transferRecipient, amount)
      await tx.wait()
      toast({
        title: "Transfer Successful",
        description: `${transferAmount} tokens transferred to ${transferRecipient.substring(0, 6)}...${transferRecipient.slice(-4)}.`,
      })
      setTransferAmount("")
      setTransferRecipient("")
      refreshBalances()
    } catch (err: any) {
      console.error("Transfer error:", err)
      setError(`Transfer failed: ${err.message || err.reason || "Unknown error"}`)
      toast({
        title: "Transfer Failed",
        description: `Error: ${err.message?.substring(0, 100) || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to view and manage token configurations.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CAFI Token Configuration</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label>Token Name</Label>
          <Input value={name} readOnly />
        </div>
        <div className="grid gap-2">
          <Label>Token Symbol</Label>
          <Input value={symbol} readOnly />
        </div>
        <div className="grid gap-2">
          <Label>Total Supply</Label>
          <Input value={totalSupply} readOnly />
        </div>

        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">Mint Tokens</h3>
          <div className="grid gap-2">
            <Label htmlFor="mint-amount">Amount to Mint</Label>
            <Input
              id="mint-amount"
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="e.g., 1000"
              disabled={loading}
            />
          </div>
          <Button onClick={handleMint} disabled={loading}>
            {loading ? "Minting..." : "Mint to My Address"}
          </Button>
        </div>

        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">Burn Tokens</h3>
          <div className="grid gap-2">
            <Label htmlFor="burn-amount">Amount to Burn</Label>
            <Input
              id="burn-amount"
              type="number"
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
              placeholder="e.g., 500"
              disabled={loading}
            />
          </div>
          <Button onClick={handleBurn} disabled={loading}>
            {loading ? "Burning..." : "Burn from My Address"}
          </Button>
        </div>

        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">Transfer Tokens</h3>
          <div className="grid gap-2">
            <Label htmlFor="transfer-recipient">Recipient Address</Label>
            <Input
              id="transfer-recipient"
              type="text"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
              placeholder="0x..."
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transfer-amount">Amount to Transfer</Label>
            <Input
              id="transfer-amount"
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="e.g., 100"
              disabled={loading}
            />
          </div>
          <Button onClick={handleTransfer} disabled={loading}>
            {loading ? "Transferring..." : "Transfer Tokens"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
