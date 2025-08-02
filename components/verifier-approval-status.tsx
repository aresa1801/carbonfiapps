"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { CheckCircle2, XCircle } from "lucide-react"

export function VerifierApprovalStatus() {
  const { nftContract, isAdmin, isRefreshing, refreshBalances } = useWeb3()
  const [verifierIndex, setVerifierIndex] = useState("")
  const [verifierInfo, setVerifierInfo] = useState<{ name: string; wallet: string; isActive: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingVerifier, setIsAddingVerifier] = useState(false)
  const [newVerifierName, setNewVerifierName] = useState("")
  const [newVerifierWallet, setNewVerifierWallet] = useState("")

  const fetchVerifier = async () => {
    if (!nftContract || !verifierIndex) return

    setIsLoading(true)
    try {
      const index = Number.parseInt(verifierIndex)
      if (isNaN(index)) {
        toast({
          title: "Invalid Input",
          description: "Please enter a valid number for Verifier Index.",
          variant: "destructive",
        })
        return
      }
      const info = await nftContract.verifiers(index)
      setVerifierInfo({
        name: info.name,
        wallet: info.wallet,
        isActive: info.isActive,
      })
    } catch (error) {
      console.error("Error fetching verifier info:", error)
      setVerifierInfo(null)
      toast({
        title: "Error",
        description: "Failed to fetch verifier info. It might not exist.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddVerifier = async () => {
    if (!nftContract || !isAdmin || !newVerifierName || !newVerifierWallet) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and ensure you are an admin.",
        variant: "destructive",
      })
      return
    }

    setIsAddingVerifier(true)
    try {
      const tx = await nftContract.setVerifier(0, newVerifierName, newVerifierWallet) // Assuming index 0 for simplicity, or find next available
      await tx.wait()
      toast({
        title: "Verifier Added/Updated",
        description: `Verifier ${newVerifierName} (${newVerifierWallet}) has been set.`,
      })
      setNewVerifierName("")
      setNewVerifierWallet("")
      refreshBalances() // Refresh any related data
    } catch (error: any) {
      console.error("Error adding verifier:", error)
      toast({
        title: "Add Verifier Failed",
        description: error.message || "Failed to add verifier.",
        variant: "destructive",
      })
    } finally {
      setIsAddingVerifier(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Verifier Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">You do not have admin privileges to view this section.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Check Verifier Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="verifier-index">Verifier Index</Label>
            <Input
              id="verifier-index"
              type="number"
              placeholder="e.g., 0"
              value={verifierIndex}
              onChange={(e) => setVerifierIndex(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={fetchVerifier} disabled={isLoading || !verifierIndex}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Check Status
          </Button>
          {verifierInfo && (
            <div className="mt-4 space-y-2 text-sm">
              <p>
                Name: <span className="font-semibold">{verifierInfo.name}</span>
              </p>
              <p className="break-all">
                Wallet: <span className="font-semibold">{verifierInfo.wallet}</span>
              </p>
              <p className="flex items-center gap-2">
                Status:{" "}
                {verifierInfo.isActive ? (
                  <span className="flex items-center text-green-500">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Active
                  </span>
                ) : (
                  <span className="flex items-center text-red-500">
                    <XCircle className="h-4 w-4 mr-1" /> Inactive
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Add/Update Verifier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-verifier-name">Verifier Name</Label>
            <Input
              id="new-verifier-name"
              placeholder="e.g., Carbon Auditor Inc."
              value={newVerifierName}
              onChange={(e) => setNewVerifierName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="new-verifier-wallet">Verifier Wallet Address</Label>
            <Input
              id="new-verifier-wallet"
              placeholder="0x..."
              value={newVerifierWallet}
              onChange={(e) => setNewVerifierWallet(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={handleAddVerifier} disabled={isAddingVerifier || !newVerifierName || !newVerifierWallet}>
            {isAddingVerifier && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set Verifier
          </Button>
          <p className="text-sm text-muted-foreground">Setting a verifier at an existing index will update it.</p>
        </CardContent>
      </Card>
    </div>
  )
}
